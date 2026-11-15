const express = require("express");
const multer = require("multer");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const os = require("os");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const Material = require("../models/Material");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Keep stored text well under MongoDB's 16 MB document limit.
const MAX_TEXT_CHARS = 5_000_000;

const UNSUPPORTED_MESSAGES = {
  ".doc":
    "Old .doc files are not supported. Please save the file as .docx and upload again.",
};

const MEDIA_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".mp4", ".mov", ".webm"]);

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";

// The transcription API accepts files up to 25 MB, so audio is shrunk first.
const MAX_TRANSCRIBE_BYTES = 24 * 1024 * 1024;

// A transcription still "processing" after this long is treated as stuck.
const PROCESSING_TIMEOUT_MS = 30 * 60 * 1000;

function userError(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}

// Turns any audio/video file into small mono 16 kHz MP3 (about 14 MB per hour).
function compressToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(
      ffmpegPath,
      ["-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "32k", outputPath],
      { timeout: 15 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 },
      (error) => {
        if (error) {
          console.error("ffmpeg error:", error.message);
          return reject(
            userError(
              "Could not read the audio from this file. It may be corrupted or have no audio track."
            )
          );
        }
        resolve();
      }
    );
  });
}

async function transcribeMedia(filePath) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw userError(
      "Transcription is not set up on the server yet (missing OPENAI_API_KEY)."
    );
  }

  const tempPath = path.join(
    os.tmpdir(),
    `transcribe-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp3`
  );

  try {
    await compressToMp3(filePath, tempPath);

    const stats = fs.statSync(tempPath);

    if (stats.size > MAX_TRANSCRIBE_BYTES) {
      throw userError(
        "This recording is too long to transcribe (the limit is roughly 90 minutes). Please upload a shorter file."
      );
    }

    const form = new FormData();
    form.append("file", new Blob([fs.readFileSync(tempPath)]), "audio.mp3");
    form.append("model", TRANSCRIBE_MODEL);
    form.append("response_format", "text");

    let response;

    try {
      response = await fetch(`${OPENAI_BASE_URL}/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(10 * 60 * 1000),
      });
    } catch (error) {
      console.error("Transcription request error:", error.message);
      throw userError("Could not reach the transcription service. Please try again later.");
    }

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error("Transcription API error:", response.status, details.slice(0, 500));

      if (response.status === 401) {
        throw userError("The transcription API key is invalid. Please check OPENAI_API_KEY on the server.");
      }
      if (response.status === 429) {
        throw userError("The transcription service is out of quota or rate limited. Please try again later.");
      }
      throw userError("The transcription service could not process this file.");
    }

    return (await response.text()).trim();
  } finally {
    fs.rm(tempPath, { force: true }, () => {});
  }
}

// Runs in the background after the upload response has been sent.
async function processMedia(materialId, filePath) {
  try {
    const text = await transcribeMedia(filePath);

    await Material.findByIdAndUpdate(materialId, {
      text: text.slice(0, MAX_TEXT_CHARS),
      textStatus: "ready",
      textError: "",
    });
  } catch (error) {
    console.error("Media processing error:", error.message);

    await Material.findByIdAndUpdate(materialId, {
      textStatus: "failed",
      textError: error.userMessage || "Transcription failed. Please try again.",
    }).catch(() => {});
  }
}

// Returns { status, text }. status is "ready", "unsupported" or "failed".
async function extractText(filePath, originalName) {
  const extension = path.extname(originalName).toLowerCase();

  try {
    let text = "";

    if (extension === ".txt") {
      text = fs.readFileSync(filePath, "utf8");
    } else if (extension === ".pdf") {
      const parser = new PDFParse({ data: fs.readFileSync(filePath) });
      try {
        const parsed = await parser.getText();
        text = parsed.text || "";
      } finally {
        await parser.destroy();
      }
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value || "";
    } else {
      return { status: "unsupported", text: "" };
    }

    return { status: "ready", text: text.slice(0, MAX_TEXT_CHARS) };
  } catch (error) {
    console.error("Text extraction error:", error.message);
    return { status: "failed", text: "" };
  }
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    callback(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "File must be 200 MB or smaller."
            : "File upload failed.",
      });
    }

    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a file.",
      });
    }

    const existingMaterial = await Material.findOne({
  originalName: req.file.originalname,
  fileSize: req.file.size,
});

if (existingMaterial) {
  fs.unlink(req.file.path, () => {});

  return res.status(409).json({
    message: "This file is already saved in your library.",
  });
}

const isMedia = MEDIA_EXTENSIONS.has(
  path.extname(req.file.originalname).toLowerCase()
);

// Audio/video is transcribed in the background; everything else right now.
const extracted = isMedia
  ? { status: "processing", text: "" }
  : await extractText(req.file.path, req.file.originalname);

const material = await Material.create({
  originalName: req.file.originalname,
  fileName: req.file.filename,
  fileType: req.file.mimetype,
  fileSize: req.file.size,
  filePath: `/uploads/${req.file.filename}`,
  text: extracted.text,
  textStatus: extracted.status,
});

if (isMedia) {
  processMedia(material._id, req.file.path);
}

    return res.status(201).json({
      message: "File uploaded and saved successfully.",
      material: { ...material.toObject(), text: undefined },
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    return res.status(500).json({
      message: "Could not save the material.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const materials = await Material.find().select("-text").sort({
      createdAt: -1,
    });

    res.json(materials);
  } catch (error) {
    res.status(500).json({
      message: "Could not load materials.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found.",
      });
    }

    const filePath = path.join(
      __dirname,
      "..",
      material.filePath.replace(/^\/uploads\//, "uploads/")
    );

    await Material.findByIdAndDelete(req.params.id);

    fs.unlink(filePath, (error) => {
      if (error && error.code !== "ENOENT") {
        console.error("Could not delete uploaded file:", error.message);
      }
    });

    res.json({ message: "Material deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete material.",
    });
  }
});

router.get("/:id/text", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        message: "Material not found.",
      });
    }

    // Normal case: text was saved in the database at upload time.
    if (material.textStatus === "ready") {
      return res.json({
        materialId: material._id,
        fileName: material.originalName,
        text: material.text,
      });
    }

    const extension = path.extname(material.originalName).toLowerCase();
    const mediaFilePath = path.join(uploadDir, material.fileName);

    if (material.textStatus === "processing") {
      const stuck =
        Date.now() - new Date(material.createdAt).getTime() > PROCESSING_TIMEOUT_MS ||
        !fs.existsSync(mediaFilePath);

      if (stuck) {
        material.textStatus = "failed";
        material.textError =
          "Transcription was interrupted. Please delete this file and upload it again.";
        await material.save();

        return res.status(500).json({ message: material.textError });
      }

      return res.status(409).json({
        message:
          "This file is still being transcribed. Please try again in a minute or two.",
      });
    }

    if (material.textStatus === "failed" && MEDIA_EXTENSIONS.has(extension)) {
      return res.status(500).json({
        message:
          material.textError ||
          "Transcription failed. Please delete this file and upload it again.",
      });
    }

    if (material.textStatus === "unsupported") {
      return res.status(400).json({
        message:
          UNSUPPORTED_MESSAGES[extension] ||
          "This file type is not supported for text extraction.",
      });
    }

    // Older uploads or failed extractions: retry from the file if it still exists.
    const filePath = path.join(uploadDir, material.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message:
          "The original file is no longer on the server. Please delete it and upload it again.",
      });
    }

    const extracted = await extractText(filePath, material.originalName);

    if (extracted.status === "ready") {
      material.text = extracted.text;
      material.textStatus = "ready";
      await material.save();

      return res.json({
        materialId: material._id,
        fileName: material.originalName,
        text: material.text,
      });
    }

    if (extracted.status === "unsupported") {
      material.textStatus = "unsupported";
      await material.save();

      return res.status(400).json({
        message:
          UNSUPPORTED_MESSAGES[extension] ||
          "This file type is not supported for text extraction.",
      });
    }

    return res.status(500).json({
      message: "Could not extract text from this file.",
    });
  } catch (error) {
    console.error("Text route error:", error);

    res.status(500).json({
      message: "Could not extract text from this file.",
    });
  }
});

module.exports = router;
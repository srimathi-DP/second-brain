const express = require("express");
const multer = require("multer");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
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
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "File must be 50 MB or smaller."
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

const extracted = await extractText(req.file.path, req.file.originalname);

const material = await Material.create({
  originalName: req.file.originalname,
  fileName: req.file.filename,
  fileType: req.file.mimetype,
  fileSize: req.file.size,
  filePath: `/uploads/${req.file.filename}`,
  text: extracted.text,
  textStatus: extracted.status,
});

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

    if (material.textStatus === "unsupported") {
      return res.status(400).json({
        message:
          UNSUPPORTED_MESSAGES[extension] ||
          "Text extraction currently supports TXT, PDF and DOCX files only.",
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
          "Text extraction currently supports TXT, PDF and DOCX files only.",
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
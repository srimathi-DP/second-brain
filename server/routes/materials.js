const express = require("express");
const multer = require("multer");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const Material = require("../models/Material");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

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

const material = await Material.create({
  originalName: req.file.originalname,
  fileName: req.file.filename,
  fileType: req.file.mimetype,
  fileSize: req.file.size,
  filePath: `/uploads/${req.file.filename}`,
});

    return res.status(201).json({
      message: "File uploaded and saved successfully.",
      material,
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
    const materials = await Material.find().sort({
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

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      material.fileName
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "The uploaded file could not be found.",
      });
    }

    const extension = path.extname(material.originalName).toLowerCase();
    let extractedText = "";

    if (extension === ".txt") {
      extractedText = fs.readFileSync(filePath, "utf8");
    } else if (extension === ".pdf") {
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });

      try {
        const parsed = await parser.getText();
        extractedText = parsed.text || "";
      } finally {
        await parser.destroy();
      }
    } else {
      return res.status(400).json({
        message: "Text extraction currently supports TXT and PDF files only.",
      });
    }

    res.json({
      materialId: material._id,
      fileName: material.originalName,
      text: extractedText,
    });
  } catch (error) {
    console.error("Text extraction error:", error);

    res.status(500).json({
      message: "Could not extract text from this file.",
    });
  }
});

module.exports = router;
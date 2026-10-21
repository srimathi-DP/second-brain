
const express = require("express");
const jwt = require("jsonwebtoken");
const Summary = require("../models/Summary");

const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please sign in to access your summaries.",
    });
  }

  try {
    const decoded = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET
    );

    if (!decoded.userId) {
      return res.status(401).json({ message: "Invalid login token." });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Your session is invalid or expired. Please sign in again.",
    });
  }
}

router.get("/", authenticateToken, async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ summaries });
  } catch (error) {
    console.error("Load summaries error:", error);
    return res.status(500).json({ message: "Failed to load summaries." });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, summary, materialId } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof summary !== "string" ||
      !summary.trim()
    ) {
      return res.status(400).json({
        message: "A title and summary are required.",
      });
    }

    const savedSummary = await Summary.create({
      userId: req.userId,
      title: title.trim(),
      summary: summary.trim(),
      materialId:
        typeof materialId === "string" ? materialId : null,
    });

    return res.status(201).json({
      message: "Summary saved successfully.",
      summary: savedSummary,
    });
  } catch (error) {
    console.error("Save summary error:", error);
    return res.status(500).json({ message: "Failed to save summary." });
  }
});

module.exports = router;

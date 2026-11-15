
const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    // Text extracted at upload time. Stored in MongoDB so summaries and
    // quizzes keep working even after the server's disk is wiped on redeploy.
    text: {
      type: String,
      default: "",
    },
    // "ready"       -> text was extracted and saved
    // "unsupported" -> file type has no text extraction (audio, video, .doc)
    // "failed"      -> extraction was attempted but errored
    textStatus: {
      type: String,
      enum: ["ready", "unsupported", "failed"],
      default: "failed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);

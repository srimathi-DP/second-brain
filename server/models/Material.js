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
    // "processing"  -> audio/video is being transcribed in the background
    // "ready"       -> text was extracted and saved
    // "unsupported" -> file type has no text extraction (.doc, etc.)
    // "failed"      -> extraction/transcription was attempted but errored
    textStatus: {
      type: String,
      enum: ["processing", "ready", "unsupported", "failed"],
      default: "failed",
    },
    // Short, user-friendly reason shown when textStatus is "failed".
    textError: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);
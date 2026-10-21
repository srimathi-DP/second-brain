
import { useEffect, useRef, useState } from "react";
import "../Materials.css";

const API_URL = "http://localhost:5000/api/materials";
const SERVER_URL = "http://localhost:5000";

function Materials() {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [extractedText, setExtractedText] = useState("");
  const [extractingId, setExtractingId] = useState("");
  const [savedMaterials, setSavedMaterials] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const allowedExtensions = [
    "pdf", "doc", "docx", "txt", "mp3",
    "wav", "m4a", "mp4", "mov", "webm",
  ];

  useEffect(() => {
    loadSavedMaterials();
  }, []);

  async function loadSavedMaterials() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Could not load saved materials.");
      }

      const data = await response.json();
      setSavedMaterials(Array.isArray(data) ? data : []);
    } catch {
      setMessage(
        "Could not load saved materials. Check that the backend is running."
      );
    }
  }

  async function deleteMaterial(material) {
    const confirmed = window.confirm(
      `Delete "${material.originalName}" permanently?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/${material._id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Delete failed.");
      }

      setSavedMaterials((previous) =>
        previous.filter((item) => item._id !== material._id)
      );

      if (extractingId === material._id) {
        setExtractingId("");
      }

      setMessage(`${material.originalName} deleted successfully.`);
    } catch (error) {
      setMessage(error.message || "Could not delete the file.");
    }
  }

  function isAlreadySaved(file, savedList = savedMaterials) {
    return savedList.some(
      (material) =>
        material.originalName.toLowerCase() === file.name.toLowerCase() &&
        material.fileSize === file.size
    );
  }

  function handleFiles(event) {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = [];
    const invalidFiles = [];
    const duplicateFiles = [];

    selectedFiles.forEach((file) => {
      const extension = file.name.split(".").pop().toLowerCase();

      if (!allowedExtensions.includes(extension)) {
        invalidFiles.push(file.name);
      } else if (file.size > 50 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (over 50 MB)`);
      } else if (isAlreadySaved(file)) {
        duplicateFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    setFiles((previous) => {
      const combined = [...previous];

      validFiles.forEach((file) => {
        const exists = combined.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        );

        if (!exists) combined.push(file);
      });

      return combined;
    });

    const messages = [];

    if (validFiles.length) {
      messages.push(`${validFiles.length} file(s) selected.`);
    }

    if (duplicateFiles.length) {
      messages.push(
        `Already saved, skipped: ${duplicateFiles.join(", ")}`
      );
    }

    if (invalidFiles.length) {
      messages.push(
        `Unsupported or oversized files: ${invalidFiles.join(", ")}`
      );
    }

    setMessage(messages.join(" "));

    if (event.target) event.target.value = "";
  }

  function removeFile(index) {
    setFiles((previous) => previous.filter((_, i) => i !== index));
    setMessage("");
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileType(name) {
    const extension = name.split(".").pop().toLowerCase();

    if (extension === "pdf") return "PDF DOCUMENT";
    if (["doc", "docx"].includes(extension)) return "DOCUMENT";
    if (["mp3", "wav", "m4a"].includes(extension)) return "AUDIO";
    if (["mp4", "mov", "webm"].includes(extension)) return "VIDEO";

    return "TEXT FILE";
  }

  async function handleUpload() {
    if (uploading) return;

    if (files.length === 0) {
      setMessage("Choose at least one file first.");
      return;
    }

    setUploading(true);
    setMessage("");

    let successfulCount = 0;
    let skippedCount = 0;
    const failedFiles = [];

    try {
      let currentSavedMaterials = [...savedMaterials];

      for (const file of files) {
        if (isAlreadySaved(file, currentSavedMaterials)) {
          skippedCount++;
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Upload failed.");
          }

          successfulCount++;

          if (result.material) {
            currentSavedMaterials = [
              result.material,
              ...currentSavedMaterials,
            ];
          }
        } catch (error) {
          failedFiles.push(`${file.name}: ${error.message}`);
        }
      }

      await loadSavedMaterials();

      const failedNames = new Set(
        failedFiles.map((item) => item.slice(0, item.indexOf(":")))
      );

      setFiles((previous) =>
        previous.filter((file) => failedNames.has(file.name))
      );

      const messages = [];

      if (successfulCount) {
        messages.push(`${successfulCount} file(s) uploaded successfully.`);
      }

      if (skippedCount) {
        messages.push(`${skippedCount} duplicate file(s) skipped.`);
      }

      if (failedFiles.length) {
        messages.push(`Failed: ${failedFiles.join("; ")}`);
      }

      setMessage(messages.join(" ") || "No new files to upload.");
    } finally {
      setUploading(false);
    }
  }

  async function extractText(material) {
    setExtractingId(material._id);
    setExtractedText("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/${material._id}/text`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Text extraction failed.");
      }

      setExtractedText(
        `FILE: ${result.fileName}\n\n${
          result.text || "(No text was found in this file.)"
        }`
      );
    } catch (error) {
      setMessage(error.message || "Could not extract file text.");
    } finally {
      setExtractingId("");
    }
  }

  return (
    <div className="materials-page">
      <div className="materials-background-curves" aria-hidden="true">
        <svg viewBox="0 0 1200 900" preserveAspectRatio="none">
          <path
            d="M-80 650 C150 520 180 760 350 600 S480 350 650 450 S850 700 1000 520 S1150 400 1300 300"
            fill="none"
            stroke="#f04438"
            strokeWidth="70"
          />
          <path
            d="M-80 180 C100 80 230 300 400 180 S650 80 760 220 S1000 350 1300 130"
            fill="none"
            stroke="#f04438"
            strokeWidth="70"
          />
        </svg>
      </div>

      <main className="materials-content">
        <header className="materials-header">
          <div>
            <span className="materials-overline">YOUR WORKSPACE</span>
            <p className="materials-breadcrumb">
              Second Brain / Materials
            </p>
          </div>

          <span className="materials-status">
            <span className="materials-status-dot" />
            PERSONAL LIBRARY
          </span>
        </header>

        <section className="materials-intro">
          <span className="materials-eyebrow">
            <span />
            KNOWLEDGE STARTS HERE
          </span>

          <h1>
            Your materials.
            <br />
            <span>Your knowledge.</span>
          </h1>

          <p>
            Bring your lectures, documents, recordings, and notes
            together in one organized learning space.
          </p>
        </section>

        <section className="materials-upload-section">
          <div className="materials-section-heading">
            <div>
              <span className="materials-label">01 / ADD CONTENT</span>
              <h2>Build your library.</h2>
              <p>Select study files from your computer to get started.</p>
            </div>

            <span className="materials-number">01</span>
          </div>

          <div
            className="materials-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFiles({
                target: { files: event.dataTransfer.files },
              });
            }}
          >
            <div className="materials-upload-icon">↑</div>
            <h3>Bring your learning materials</h3>
            <p>Choose PDF, Word, text, audio, or video files</p>

            <button
              type="button"
              className="materials-primary-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              CHOOSE FILES <span>↗</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.m4a,.mp4,.mov,.webm"
              onChange={handleFiles}
              hidden
            />

            <small>PDF · DOCX · TXT · AUDIO · VIDEO</small>
          </div>

          {message && (
            <p className="materials-message" role="status">
              {message}
            </p>
          )}
        </section>

        <section className="materials-library-section">
          <div className="materials-section-heading">
            <div>
              <span className="materials-label">02 / YOUR COLLECTION</span>
              <h2>Selected materials.</h2>
              <p>
                {files.length === 0
                  ? "Your selected files will appear here."
                  : `${files.length} file(s) ready to upload.`}
              </p>
            </div>

            <span className="materials-count">
              {String(files.length).padStart(2, "0")} FILES
            </span>
          </div>

          {files.length === 0 ? (
            <div className="materials-empty">
              <span className="materials-empty-symbol">＋</span>
              <strong>Your library is waiting.</strong>
              <p>Choose a file above to begin building your collection.</p>
            </div>
          ) : (
            <div className="materials-file-list">
              {files.map((file, index) => (
                <article
                  className="materials-file-card"
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                >
                  <div className="materials-file-icon">
                    {file.name.split(".").pop().toUpperCase().slice(0, 4)}
                  </div>

                  <div className="materials-file-info">
                    <strong>{file.name}</strong>
                    <span>
                      {getFileType(file.name)} · {formatSize(file.size)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="materials-remove-button"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    aria-label={`Remove ${file.name}`}
                  >
                    REMOVE
                  </button>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            className="materials-upload-button"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "UPLOADING FILES..." : "CONTINUE WITH MATERIALS"}
            {!uploading && <span>↗</span>}
          </button>
        </section>

        <section className="materials-library-section">
          <div className="materials-section-heading">
            <div>
              <span className="materials-label">03 / SAVED LIBRARY</span>
              <h2>Your saved materials.</h2>
              <p>Files already stored by your backend.</p>
            </div>

            <span className="materials-count">
              {String(savedMaterials.length).padStart(2, "0")} SAVED
            </span>
          </div>

          {savedMaterials.length === 0 ? (
            <div className="materials-empty">
              <span className="materials-empty-symbol">＋</span>
              <strong>No saved materials yet.</strong>
              <p>Uploaded files will appear here.</p>
            </div>
          ) : (
            <div className="materials-file-list">
              {savedMaterials.map((material) => (
                <article className="materials-file-card" key={material._id}>
                  <div className="materials-file-icon">
                    {material.originalName
                      .split(".")
                      .pop()
                      .toUpperCase()
                      .slice(0, 4)}
                  </div>

                  <div className="materials-file-info">
                    <strong>{material.originalName}</strong>
                    <span>
                      {getFileType(material.originalName)} ·{" "}
                      {formatSize(material.fileSize)}
                    </span>
                  </div>

                  <div className="materials-file-actions">
                    <a
                      className="materials-remove-button"
                      href={`${SERVER_URL}${material.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      OPEN
                    </a>

                    <button
                      type="button"
                      className="materials-remove-button"
                      onClick={() => deleteMaterial(material)}
                    >
                      DELETE
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {extractedText && (
          <section className="materials-library-section">
            <div className="materials-section-heading">
              <div>
                <span className="materials-label">
                  04 / EXTRACTED CONTENT
                </span>
                <h2>Inside your material.</h2>
              </div>

              <div>
                <button
                  type="button"
                  className="materials-primary-button"
                  onClick={openStudyPack}
                >
                  OPEN STUDY PACK ↗
                </button>

                <button
                  type="button"
                  className="materials-remove-button"
                  onClick={() => setExtractedText("")}
                >
                  CLOSE
                </button>
              </div>
            </div>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                padding: "20px",
                border: "1px solid rgba(240, 68, 56, 0.3)",
                borderRadius: "8px",
                lineHeight: 1.7,
                fontFamily: "inherit",
              }}
            >
              {extractedText}
            </pre>
          </section>
        )}

        {extractedText && (
          <section id="study-pack" className="materials-library-section">
            <StudyPack
              text={extractedText}
              title="Your Study Pack"
            />
          </section>
        )}

        <footer className="materials-footer">
          <span>SECOND BRAIN</span>
          <span>LEARN · UNDERSTAND · REMEMBER</span>
          <span>© 2026</span>
        </footer>
      </main>
    </div>
  );
}

export default Materials;

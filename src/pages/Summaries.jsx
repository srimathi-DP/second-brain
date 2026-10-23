import { useEffect, useState } from "react";

const MATERIALS_API = "https://second-brain-pl1v.onrender.com/api/materials";
const SUMMARIES_KEY = "second-brain-summaries";

const STOP_WORDS = new Set(
  "a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me might more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours".split(
    " "
  )
);

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function readSavedSummaries() {
  try {
    const value = JSON.parse(localStorage.getItem(SUMMARIES_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getSentences(text) {
  const cleaned = String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  let sentences = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 5);

  if (!sentences.length && cleaned) {
    const words = cleaned.split(/\s+/);
    sentences = [];

    for (let index = 0; index < words.length; index += 32) {
      const chunk = words.slice(index, index + 32).join(" ").trim();
      if (chunk) sentences.push(chunk);
    }
  }

  return sentences;
}

function createOverview(text) {
  const sentences = getSentences(text);
  if (!sentences.length) return null;

  const frequencies = new Map();
  const allWords = String(text).toLowerCase().match(/[a-z][a-z'-]{2,}/g) || [];

  for (const word of allWords) {
    if (!STOP_WORDS.has(word)) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
  }

  const ranked = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || [];
    const meaningfulWords = words.filter((word) => !STOP_WORDS.has(word));
    const score =
      meaningfulWords.reduce(
        (total, word) => total + (frequencies.get(word) || 0),
        0
      ) / Math.sqrt(Math.max(meaningfulWords.length, 1));

    return { sentence, index, score };
  });

  // Pick important sentences from across the document, not only its beginning.
  const sectionCount = Math.min(6, sentences.length);
  const selected = [];

  for (let section = 0; section < sectionCount; section += 1) {
    const start = Math.floor((section * sentences.length) / sectionCount);
    const end = Math.floor(((section + 1) * sentences.length) / sectionCount);
    const best = ranked.slice(start, end).sort((a, b) => b.score - a.score)[0];

    if (best) selected.push(best);
  }

  const targetCount = Math.min(8, sentences.length);

  for (const item of [...ranked].sort((a, b) => b.score - a.score)) {
    if (selected.length >= targetCount) break;
    if (!selected.some((chosen) => chosen.index === item.index)) {
      selected.push(item);
    }
  }

  const keyPoints = selected
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  const mainTopics = [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);

  return {
    overview: keyPoints.join(" "),
    keyPoints,
    mainTopics,
    wordCount: allWords.length,
  };
}

function normalizeSavedSummary(item, index) {
  return {
    id: item.id || `saved-summary-${index}`,
    title: item.title || "Saved summary",
    source: item.source || "Study material",
    overview: item.overview || item.content || "",
    keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints : [],
    mainTopics: Array.isArray(item.mainTopics) ? item.mainTopics : [],
    date: item.date || "Previously saved",
  };
}

export default function Summaries() {
  const [materials, setMaterials] = useState([]);
  const [materialId, setMaterialId] = useState("");
  const [summaries, setSummaries] = useState(readSavedSummaries);
  const [generated, setGenerated] = useState(null);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      try {
        const response = await fetch(MATERIALS_API);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data.message || "Could not load saved materials.");
        }

        if (!cancelled) {
          setMaterials(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || "Could not connect to the backend.");
        }
      } finally {
        if (!cancelled) setLoadingMaterials(false);
      }
    }

    loadMaterials();

    return () => {
      cancelled = true;
    };
  }, []);

  async function generateSummary(event) {
    event.preventDefault();

    const material = materials.find(
      (item) => String(item._id) === materialId
    );

    if (!material) {
      setMessage("Choose a study material first.");
      return;
    }

    setGenerating(true);
    setGenerated(null);
    setMessage("");

    try {
      const response = await fetch(
        `${MATERIALS_API}/${encodeURIComponent(material._id)}/text`
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not read this material.");
      }

      const overview = createOverview(data.text || "");

      if (!overview) {
        throw new Error(
          "No readable text was found. Summaries currently need a TXT or text-based PDF."
        );
      }

      setGenerated({
        id: makeId(),
        title: material.originalName.replace(/\.[^.]+$/, ""),
        source: material.originalName,
        ...overview,
        date: new Date().toLocaleDateString(),
      });

      setMessage("Overview generated from across the material.");
    } catch (error) {
      setMessage(error.message || "Could not generate the overview.");
    } finally {
      setGenerating(false);
    }
  }

  function saveSummary() {
    if (!generated) return;

    const updated = [generated, ...summaries];
    setSummaries(updated);
    localStorage.setItem(SUMMARIES_KEY, JSON.stringify(updated));
    setMessage("Overview saved to your library.");
  }

  function deleteSummary(id) {
    const updated = summaries.filter((item) => item.id !== id);
    setSummaries(updated);
    localStorage.setItem(SUMMARIES_KEY, JSON.stringify(updated));
  }

  return (
    <div className="summaries-page">
      <style>{`
        .summaries-page {
          position: relative;
          z-index: 1;
          min-width: 0;
          padding: 36px clamp(20px, 5vw, 64px);
          color: #f5f0e8;
        }

        .summaries-header { margin-bottom: 28px; }

        .summaries-eyebrow {
          color: #f04438;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .summaries-header h1 {
          margin: 14px 0;
          color: #f4f4f4;
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(38px, 5vw, 62px);
          line-height: 1.05;
          letter-spacing: -2px;
        }

        .summaries-header h1 span { color: #f04438; }

        .summaries-header p,
        .summaries-muted {
          color: #b7aea5;
          line-height: 1.7;
        }

        .summaries-panel,
        .summary-card {
          margin-bottom: 22px;
          padding: 24px;
          border: 1px solid #393939;
          background: rgba(28, 28, 28, .94);
        }

        .summaries-panel h2,
        .summary-card h2 {
          margin: 0 0 14px;
          font-family: "Space Grotesk", sans-serif;
        }

        .summaries-form {
          display: grid;
          gap: 12px;
        }

        .summaries-form label {
          color: #c7bdb3;
          font-size: 10px;
          letter-spacing: 1.5px;
        }

        .summaries-form select {
          box-sizing: border-box;
          width: 100%;
          min-height: 48px;
          padding: 12px;
          color: #f5f0e8;
          background: #141414;
          border: 1px solid #48413b;
          font: inherit;
        }

        .summaries-button {
          justify-self: start;
          min-height: 44px;
          padding: 12px 16px;
          border: 1px solid #f04438;
          background: #f04438;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .summaries-button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .summaries-button.secondary {
          color: #f5f0e8;
          background: transparent;
          border-color: #514841;
        }

        .summaries-message {
          margin-top: 14px;
          color: #f5b2a9;
          line-height: 1.6;
        }

        .summary-topline {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
          color: #aaa097;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .summary-overview {
          color: #ded6ce;
          font-size: 15px;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .summary-topics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 18px 0;
        }

        .summary-topic {
          padding: 7px 10px;
          border: 1px solid #51413b;
          color: #e7d9d1;
          font-size: 11px;
        }

        .summary-points {
          display: grid;
          gap: 10px;
          padding-left: 20px;
          color: #d8d0c8;
          line-height: 1.65;
        }

        .summary-points li::marker { color: #f04438; }

        .summary-library {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .summary-library .summary-card {
          min-width: 0;
          border-top: 2px solid #f04438;
        }

        .summary-library .summary-overview {
          display: -webkit-box;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 7;
        }

        @media (max-width: 700px) {
          .summaries-page { padding: 24px 16px; }
          .summaries-panel, .summary-card { padding: 18px; }
          .summary-library { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="summaries-header">
        <span className="summaries-eyebrow">04 / UNDERSTAND</span>
        <h1>
          See the whole <span>picture.</span>
        </h1>
        <p>
          Generate an overview with key ideas drawn from across your study
          material.
        </p>
      </header>

      <section className="summaries-panel">
        <h2>Generate a material overview</h2>
        <p className="summaries-muted">
          Select an uploaded TXT or text-based PDF. The page reads its extracted
          text and chooses important sentences from across the document.
        </p>

        <form className="summaries-form" onSubmit={generateSummary}>
          <label htmlFor="summary-material">STUDY MATERIAL</label>
          <select
            id="summary-material"
            value={materialId}
            onChange={(event) => {
              setMaterialId(event.target.value);
              setGenerated(null);
              setMessage("");
            }}
            disabled={loadingMaterials}
          >
            <option value="">
              {loadingMaterials
                ? "Loading materials…"
                : "Choose a material"}
            </option>
            {materials.map((material) => (
              <option key={material._id} value={material._id}>
                {material.originalName}
              </option>
            ))}
          </select>

          <button
            className="summaries-button"
            type="submit"
            disabled={generating || loadingMaterials}
          >
            {generating ? "READING MATERIAL…" : "GENERATE OVERVIEW ↗"}
          </button>
        </form>

        {materials.length === 0 && !loadingMaterials && (
          <p className="summaries-message">
            No saved materials found. Upload a TXT or PDF file in Materials
            first.
          </p>
        )}

        {message && (
          <p className="summaries-message" role="status">
            {message}
          </p>
        )}
      </section>

      {generated && (
        <section className="summary-card">
          <div className="summary-topline">
            <span>{generated.source}</span>
            <span>{generated.wordCount.toLocaleString()} WORDS READ</span>
          </div>

          <h2>{generated.title}: Overview</h2>
          <p className="summary-overview">{generated.overview}</p>

          {generated.mainTopics.length > 0 && (
            <>
              <h3 style={{ marginTop: 22 }}>Main topics</h3>
              <div className="summary-topics">
                {generated.mainTopics.map((topic) => (
                  <span className="summary-topic" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            </>
          )}

          <h3 style={{ margin: "20px 0 12px" }}>Key points</h3>
          <ul className="summary-points">
            {generated.keyPoints.map((point, index) => (
              <li key={`${index}-${point}`}>{point}</li>
            ))}
          </ul>

          <div style={{ marginTop: 20 }}>
            <button
              className="summaries-button"
              type="button"
              onClick={saveSummary}
            >
              SAVE OVERVIEW
            </button>
          </div>
        </section>
      )}

      <section className="summaries-panel">
        <div className="summary-topline">
          <div>
            <span className="summaries-eyebrow">YOUR LIBRARY</span>
            <h2 style={{ marginTop: 8 }}>Saved overviews</h2>
          </div>
          <span>{summaries.length} SAVED</span>
        </div>

        {summaries.length === 0 ? (
          <p className="summaries-muted">
            Your saved overviews will appear here.
          </p>
        ) : (
          <div className="summary-library">
            {summaries.map((rawItem, index) => {
              const item = normalizeSavedSummary(rawItem, index);

              return (
                <article className="summary-card" key={item.id}>
                  <div className="summary-topline">
                    <span>{item.source}</span>
                    <span>SAVED {item.date}</span>
                  </div>

                  <h2>{item.title}</h2>
                  <p className="summary-overview">{item.overview}</p>

                  {item.mainTopics.length > 0 && (
                    <div className="summary-topics">
                      {item.mainTopics.map((topic) => (
                        <span className="summary-topic" key={topic}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    className="summaries-button secondary"
                    type="button"
                    onClick={() => deleteSummary(rawItem.id)}
                  >
                    DELETE
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
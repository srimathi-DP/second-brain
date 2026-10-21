import { useEffect, useState } from "react";

const MATERIALS_API = "http://localhost:5000/api/materials";
const FLOWCHARTS_KEY = "second-brain-flowcharts";
const OLD_DIAGRAMS_KEY = "second-brain-diagrams";

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function cleanText(value) {
  return String(value || "")
    .replace(/^[\s•*#\d.)-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenPoint(value) {
  const text = cleanText(value)
    .replace(
      /^(in this process|it is important to note that|this means that|in conclusion)\s+/i,
      ""
    )
    .replace(/[.!?]+$/, "");

  const words = text.split(/\s+/).filter(Boolean);

  if (words.length <= 9) return text;
  return `${words.slice(0, 9).join(" ")}…`;
}

function normalizeFlowchart(item, index = 0) {
  const oldConcepts = Array.isArray(item?.concepts) ? item.concepts : [];
  const oldSteps = Array.isArray(item?.steps) ? item.steps : [];

  let sourceNodes = Array.isArray(item?.nodes) ? item.nodes : null;

  if (!sourceNodes && oldConcepts.length) {
    sourceNodes = oldConcepts.map((concept) => ({
      type: "step",
      text: [concept?.label, concept?.detail].filter(Boolean).join(": "),
    }));
  }

  if (!sourceNodes && oldSteps.length) {
    sourceNodes = oldSteps.map((step) => ({
      type: "step",
      text: typeof step === "string" ? step : step?.text,
    }));
  }

  const nodes = (sourceNodes || [])
    .map((node, nodeIndex) => {
      if (node?.type === "branch") {
        const options = Array.isArray(node.options)
          ? node.options.map((option) => shortenPoint(option)).filter(Boolean)
          : [];

        return {
          id: node.id || `${item?.id || "saved"}-branch-${nodeIndex}`,
          type: "branch",
          label: shortenPoint(node.label || "Types"),
          options: options.slice(0, 6),
        };
      }

      const text = shortenPoint(
        node?.text || node?.label || node?.detail || node
      );

      return {
        id: node?.id || `${item?.id || "saved"}-step-${nodeIndex}`,
        type: "step",
        text,
      };
    })
    .filter((node) =>
      node.type === "branch" ? node.options.length >= 2 : Boolean(node.text)
    );

  return {
    ...item,
    id: item?.id || `${Date.now()}-${index}`,
    title: cleanText(item?.title) || "Study flowchart",
    source: cleanText(item?.source) || "Study material",
    nodes,
    date: item?.date || new Date().toLocaleDateString(),
  };
}

function readSavedFlowcharts() {
  try {
    const current = JSON.parse(localStorage.getItem(FLOWCHARTS_KEY) || "[]");

    if (Array.isArray(current) && current.length) {
      return current.map((item, index) => normalizeFlowchart(item, index));
    }

    const older = JSON.parse(localStorage.getItem(OLD_DIAGRAMS_KEY) || "[]");

    if (Array.isArray(older)) {
      return older.map((item, index) => normalizeFlowchart(item, index));
    }

    return [];
  } catch {
    return [];
  }
}

function splitTypeOptions(value) {
  return String(value)
    .replace(/[.!?]+$/, "")
    .replace(/^[:\s]+/, "")
    .replace(/\b(such as|for example|including)\b/i, "")
    .split(/,\s*|\s+(?:and|or)\s+/i)
    .map((option) => shortenPoint(option))
    .filter(Boolean)
    .slice(0, 6);
}

function parseTypeSentence(sentence) {
  const match = sentence.match(
    /\b(?:types?|kinds?|categories)\s+of\s+(.+?)\s*(?::|\b(?:include|includes|are|is|can be|consist of|consists of)\b)\s*(.+)$/i
  );

  if (!match) return null;

  const topic = shortenPoint(match[1]);
  const options = splitTypeOptions(match[2]);

  if (!topic || options.length < 2) return null;

  return {
    id: makeId(),
    type: "branch",
    label: `Types of ${topic}`,
    options,
  };
}

function buildFlowNodes(text) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const nodes = [];
  let branchHeading = "";

  for (const line of lines) {
    const isBullet = /^[•*+-]\s+|^\d+[.)]\s+/.test(line);

    if (isBullet && branchHeading) {
      const lastNode = nodes[nodes.length - 1];

      if (lastNode?.type === "branch" && lastNode.label === branchHeading) {
        lastNode.options.push(shortenPoint(line));
      }
      continue;
    }

    if (
      !isBullet &&
      /\b(types?|kinds?|categories)\b/i.test(line) &&
      line.endsWith(":")
    ) {
      branchHeading = shortenPoint(line.replace(/:$/, ""));
      nodes.push({
        id: makeId(),
        type: "branch",
        label: branchHeading,
        options: [],
      });
      continue;
    }

    branchHeading = "";

    const pieces = isBullet
      ? [cleanText(line)]
      : line
          .split(/(?<=[.!?])\s+/)
          .map(cleanText)
          .filter(Boolean);

    for (const piece of pieces) {
      const branch = parseTypeSentence(piece);

      if (branch) {
        nodes.push(branch);
      } else if (piece.split(/\s+/).length >= 3) {
        nodes.push({
          id: makeId(),
          type: "step",
          text: shortenPoint(piece),
        });
      }
    }
  }

  return nodes
    .filter((node) =>
      node.type === "branch" ? node.options.length >= 2 : Boolean(node.text)
    )
    .slice(0, 10);
}

function renderNode(node, index) {
  if (node.type === "branch") {
    return (
      <div className="flow-branch-block">
        <div className="flow-node flow-decision">{node.label}</div>
        <div className="flow-arrow" />

        <div
          className="flow-branches"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              node.options.length,
              3
            )}, minmax(140px, 1fr))`,
          }}
        >
          {node.options.map((option, optionIndex) => (
            <div
              className="flow-branch"
              key={`${node.id}-${optionIndex}`}
            >
              <span className="flow-branch-label">
                TYPE {String(optionIndex + 1).padStart(2, "0")}
              </span>
              <div className="flow-node flow-type">
                {shortenPoint(option)}
              </div>
            </div>
          ))}
        </div>

        <div className="flow-arrow" />
      </div>
    );
  }

  return (
    <div className="flow-node flow-step">
      <span className="flow-step-label">
        POINT {String(index + 1).padStart(2, "0")}
      </span>
      {shortenPoint(node.text)}
    </div>
  );
}

export default function Diagrams() {
  const [materials, setMaterials] = useState([]);
  const [materialId, setMaterialId] = useState("");
  const [title, setTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [flowchart, setFlowchart] = useState(null);
  const [savedFlowcharts, setSavedFlowcharts] = useState(readSavedFlowcharts);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [loadingText, setLoadingText] = useState(false);
  const [message, setMessage] = useState("");

  // Convert old in-memory data too, such as data preserved during hot reload.
  const flowchartNodes = Array.isArray(flowchart?.nodes)
    ? flowchart.nodes
    : normalizeFlowchart(flowchart || {}).nodes;

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

  async function chooseMaterial(id) {
    setMaterialId(id);
    setFlowchart(null);
    setMessage("");

    if (!id) return;

    const material = materials.find((item) => String(item._id) === id);
    if (!material) return;

    setTitle(material.originalName.replace(/\.[^.]+$/, ""));
    setLoadingText(true);

    try {
      const response = await fetch(
        `${MATERIALS_API}/${encodeURIComponent(material._id)}/text`
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not read this material.");
      }

      setSourceText(data.text || "");
      setMessage(
        data.text
          ? `Loaded text from ${material.originalName}.`
          : "This file has no readable text."
      );
    } catch (error) {
      setSourceText("");
      setMessage(error.message || "Could not extract text from this file.");
    } finally {
      setLoadingText(false);
    }
  }

  function generateFlowchart(event) {
    event.preventDefault();

    const nodes = buildFlowNodes(sourceText);

    if (!nodes.length) {
      setFlowchart(null);
      setMessage(
        "Add readable text with a few points. For branches, add a heading like “Types of rocks:” and list each type with a bullet."
      );
      return;
    }

    const material = materials.find(
      (item) => String(item._id) === materialId
    );

    setFlowchart({
      id: makeId(),
      title: title.trim() || "Study flowchart",
      source: material?.originalName || "Pasted text",
      nodes,
      date: new Date().toLocaleDateString(),
    });

    setMessage("Flowchart created.");
  }

  function saveFlowchart() {
    if (!flowchart) return;

    const normalized = normalizeFlowchart({
      ...flowchart,
      nodes: flowchartNodes,
    });

    const updated = [normalized, ...savedFlowcharts];
    setSavedFlowcharts(updated);
    localStorage.setItem(FLOWCHARTS_KEY, JSON.stringify(updated));
    setMessage("Flowchart saved to your library.");
  }

  function openFlowchart(item) {
    const normalized = normalizeFlowchart(item);
    setFlowchart(normalized);
    setTitle(normalized.title);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteFlowchart(id) {
    const updated = savedFlowcharts.filter((item) => item.id !== id);
    setSavedFlowcharts(updated);
    localStorage.setItem(FLOWCHARTS_KEY, JSON.stringify(updated));

    if (flowchart?.id === id) setFlowchart(null);
  }

  return (
    <div className="flowcharts-page">
      <style>{`
        .flowcharts-page {
          position: relative;
          z-index: 1;
          min-width: 0;
          padding: 36px clamp(20px, 5vw, 64px);
          color: #f5f0e8;
        }

        .flowcharts-header { margin-bottom: 28px; }

        .flowcharts-eyebrow {
          color: #f04438;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .flowcharts-header h1 {
          margin: 14px 0;
          color: #f4f4f4;
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(38px, 5vw, 62px);
          line-height: 1.05;
          letter-spacing: -2px;
        }

        .flowcharts-header h1 span { color: #f04438; }

        .flowcharts-header p,
        .flowcharts-muted {
          color: #b7aea5;
          line-height: 1.7;
        }

        .flowcharts-panel,
        .flowchart-card {
          margin-bottom: 24px;
          padding: 24px;
          border: 1px solid #393939;
          background: rgba(28, 28, 28, .94);
        }

        .flowcharts-panel h2,
        .flowchart-card h2 {
          margin: 0 0 14px;
          font-family: "Space Grotesk", sans-serif;
        }

        .flowcharts-form { display: grid; gap: 12px; }

        .flowcharts-form label {
          color: #c7bdb3;
          font-size: 10px;
          letter-spacing: 1.5px;
        }

        .flowcharts-form input,
        .flowcharts-form select,
        .flowcharts-form textarea {
          box-sizing: border-box;
          width: 100%;
          padding: 13px;
          color: #f5f0e8;
          background: #141414;
          border: 1px solid #48413b;
          font: inherit;
        }

        .flowcharts-form textarea {
          min-height: 175px;
          resize: vertical;
          line-height: 1.6;
        }

        .flowcharts-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .flowcharts-button {
          min-height: 44px;
          padding: 12px 16px;
          border: 1px solid #f04438;
          background: #f04438;
          color: white;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .flowcharts-button.secondary {
          color: #f5f0e8;
          background: transparent;
          border-color: #514841;
        }

        .flowcharts-message {
          margin-top: 14px;
          color: #f5b2a9;
          line-height: 1.6;
        }

        .flowchart-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 22px;
          padding: 26px 16px;
          overflow-x: auto;
          border: 1px solid #393939;
          background:
            radial-gradient(ellipse at center, rgba(240, 68, 56, .07), transparent 65%),
            #191919;
        }

        .flow-node-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .flow-node {
          box-sizing: border-box;
          width: min(100%, 520px);
          padding: 13px 18px;
          color: #f5f0e8;
          background: #202020;
          border: 1px solid #8e443b;
          text-align: center;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .flow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .flow-step-label,
        .flow-branch-label {
          color: #ff766b;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .flowchart-start,
        .flowchart-end {
          width: min(100%, 240px);
          padding: 13px;
          border: 2px solid #f04438;
          border-radius: 28px;
          background: rgba(240, 68, 56, .16);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .flow-arrow {
          position: relative;
          width: 2px;
          height: 26px;
          flex: 0 0 26px;
          background: #a94336;
        }

        .flow-arrow::after {
          position: absolute;
          bottom: 0;
          left: -5px;
          width: 0;
          height: 0;
          border-top: 8px solid #f04438;
          border-right: 6px solid transparent;
          border-left: 6px solid transparent;
          content: "";
        }

        .flow-branch-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .flow-decision {
          width: min(100%, 420px);
          border-color: #f04438;
          background: rgba(240, 68, 56, .12);
          font-weight: 700;
        }

        .flow-branches {
          position: relative;
          display: grid;
          width: min(100%, 860px);
          gap: 12px;
          align-items: start;
          padding-top: 16px;
        }

        .flow-branches::before {
          position: absolute;
          top: 0;
          right: 8%;
          left: 8%;
          border-top: 1px solid #a94336;
          content: "";
        }

        .flow-branch {
          position: relative;
          display: grid;
          justify-items: center;
          gap: 8px;
          min-width: 0;
        }

        .flow-branch::before {
          position: absolute;
          top: -16px;
          left: 50%;
          height: 16px;
          border-left: 1px solid #a94336;
          content: "";
        }

        .flow-type {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 58px;
        }

        .flowcharts-library {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .flowchart-saved {
          min-width: 0;
          padding: 18px;
          border: 1px solid #393939;
          border-top: 2px solid #f04438;
          background: rgba(20, 20, 20, .7);
        }

        .flowchart-saved h3 {
          margin: 8px 0;
          font-family: "Space Grotesk", sans-serif;
          overflow-wrap: anywhere;
        }

        .flowchart-saved p {
          margin-bottom: 14px;
          color: #aaa097;
          font-size: 12px;
          line-height: 1.5;
        }

        @media (max-width: 700px) {
          .flowcharts-page { padding: 24px 16px; }
          .flowcharts-panel, .flowchart-card { padding: 18px; }
          .flowcharts-library { grid-template-columns: 1fr; }
          .flow-branches { grid-template-columns: 1fr !important; }
          .flow-type { max-width: 420px; }
        }
      `}</style>

      <header className="flowcharts-header">
        <span className="flowcharts-eyebrow">05 / VISUAL LEARNING</span>
        <h1>
          Follow the steps. <span>See the flow.</span>
        </h1>
        <p>
          Turn study content into quick points, with separate branches for
          listed types.
        </p>
      </header>

      <section className="flowcharts-panel">
        <h2>Create a flowchart</h2>
        <p className="flowcharts-muted">
          Use one idea per line, or choose a saved TXT/PDF material. For type
          branches, add a heading such as “Types of rocks:” followed by bullets.
        </p>

        <form className="flowcharts-form" onSubmit={generateFlowchart}>
          <label htmlFor="flowchart-material">SAVED MATERIAL</label>
          <select
            id="flowchart-material"
            value={materialId}
            onChange={(event) => chooseMaterial(event.target.value)}
            disabled={loadingMaterials || loadingText}
          >
            <option value="">
              {loadingMaterials
                ? "Loading materials…"
                : "Choose a material (optional)"}
            </option>
            {materials.map((material) => (
              <option key={material._id} value={material._id}>
                {material.originalName}
              </option>
            ))}
          </select>

          <label htmlFor="flowchart-title">FLOWCHART TITLE</label>
          <input
            id="flowchart-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="For example: Water cycle"
          />

          <label htmlFor="flowchart-text">POINTS OR STUDY TEXT</label>
          <textarea
            id="flowchart-text"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder={
              "Water evaporates from lakes and oceans.\nWater vapor cools and forms clouds.\nRain returns water to the ground.\n\nTypes of rocks:\n- Igneous\n- Sedimentary\n- Metamorphic"
            }
          />

          <div className="flowcharts-actions">
            <button
              className="flowcharts-button"
              type="submit"
              disabled={loadingText}
            >
              {loadingText ? "LOADING TEXT…" : "CREATE FLOWCHART ↗"}
            </button>
          </div>
        </form>

        {message && (
          <p className="flowcharts-message" role="status">
            {message}
          </p>
        )}

        {flowchart && (
          <article className="flowchart-card">
            <span className="flowcharts-eyebrow">{flowchart.source}</span>
            <h2>{flowchart.title}</h2>

            <div className="flowchart-preview">
              <div className="flow-node flowchart-start">START</div>
              <div className="flow-arrow" />

              {flowchartNodes.map((node, index) => (
                <div className="flow-node-wrap" key={node.id || index}>
                  {renderNode(node, index)}
                  {index < flowchartNodes.length - 1 && (
                    <div className="flow-arrow" />
                  )}
                </div>
              ))}

              <div className="flow-arrow" />
              <div className="flow-node flowchart-end">END</div>
            </div>

            <div className="flowcharts-actions">
              <button
                className="flowcharts-button"
                type="button"
                onClick={saveFlowchart}
              >
                SAVE FLOWCHART
              </button>
            </div>
          </article>
        )}
      </section>

      <section className="flowcharts-panel">
        <span className="flowcharts-eyebrow">YOUR LIBRARY</span>
        <h2>Saved flowcharts</h2>

        {savedFlowcharts.length === 0 ? (
          <p className="flowcharts-muted">
            Your saved flowcharts will appear here.
          </p>
        ) : (
          <div className="flowcharts-library">
            {savedFlowcharts.map((rawItem, index) => {
              const item = normalizeFlowchart(rawItem, index);

              return (
                <article className="flowchart-saved" key={item.id}>
                  <span className="flowcharts-eyebrow">{item.source}</span>
                  <h3>{item.title}</h3>
                  <p>
                    {item.nodes.length} points · Saved {item.date}
                  </p>

                  <div className="flowcharts-actions">
                    <button
                      className="flowcharts-button secondary"
                      type="button"
                      onClick={() => openFlowchart(item)}
                    >
                      OPEN
                    </button>
                    <button
                      className="flowcharts-button secondary"
                      type="button"
                      onClick={() => deleteFlowchart(item.id)}
                    >
                      DELETE
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
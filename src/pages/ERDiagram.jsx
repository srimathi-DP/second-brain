import { useState } from "react";

const entities = [
  {
    id: "account",
    name: "Account",
    storage: "users.json",
    x: 35,
    y: 35,
    fields: [
      ["id", "KEY"],
      ["name", "TEXT"],
      ["email", "UNIQUE"],
      ["passwordHash", "HASHED"],
    ],
  },
  {
    id: "notes",
    name: "Note",
    storage: "Browser storage",
    x: 35,
    y: 235,
    fields: [
      ["id", "KEY"],
      ["title", "TEXT"],
      ["content", "TEXT"],
      ["updatedAt", "DATE"],
    ],
  },
  {
    id: "materials",
    name: "Material",
    storage: "MongoDB",
    x: 355,
    y: 145,
    fields: [
      ["_id", "KEY"],
      ["originalName", "TEXT"],
      ["fileName", "TEXT"],
      ["fileType", "TEXT"],
      ["fileSize", "NUMBER"],
      ["filePath", "TEXT"],
    ],
  },
  {
    id: "summaries",
    name: "Summary",
    storage: "Browser storage",
    x: 710,
    y: 25,
    fields: [
      ["id", "KEY"],
      ["title", "TEXT"],
      ["content", "TEXT"],
      ["source", "OPTIONAL"],
      ["date", "DATE"],
    ],
  },
  {
    id: "diagrams",
    name: "Concept Diagram",
    storage: "Browser storage",
    x: 710,
    y: 205,
    fields: [
      ["id", "KEY"],
      ["title", "TEXT"],
      ["concepts", "LIST"],
      ["source", "OPTIONAL"],
    ],
  },
  {
    id: "quizzes",
    name: "Quiz",
    storage: "Browser storage",
    x: 710,
    y: 385,
    fields: [
      ["id", "KEY"],
      ["title", "TEXT"],
      ["questions", "LIST"],
      ["source", "OPTIONAL"],
    ],
  },
];

const links = [
  {
    id: "summary-link",
    path: "M625 225 C665 225 665 105 710 105",
    label: "source material",
    x: 635,
    y: 152,
  },
  {
    id: "diagram-link",
    path: "M625 255 C665 255 665 285 710 285",
    label: "source material",
    x: 634,
    y: 267,
  },
  {
    id: "quiz-link",
    path: "M625 285 C665 285 665 465 710 465",
    label: "source material",
    x: 635,
    y: 381,
  },
];

export default function ERDiagram() {
  const [selectedEntity, setSelectedEntity] = useState("materials");

  const selected = entities.find((entity) => entity.id === selectedEntity);

  return (
    <div className="er-page">
      <style>{`
        .er-page {
          position: relative;
          z-index: 1;
          min-width: 0;
          padding: 36px clamp(20px, 5vw, 64px);
          color: #f5f0e8;
        }

        .er-header {
          margin-bottom: 26px;
        }

        .er-eyebrow {
          color: #f04438;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .er-header h1 {
          margin: 14px 0;
          color: #f4f4f4;
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(36px, 5vw, 60px);
          line-height: 1.05;
          letter-spacing: -2px;
        }

        .er-header h1 span {
          color: #f04438;
        }

        .er-header p,
        .er-description {
          color: #b7aea5;
          line-height: 1.7;
        }

        .er-panel {
          margin-bottom: 22px;
          padding: 22px;
          border: 1px solid #393939;
          background: rgba(28, 28, 28, .94);
        }

        .er-panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
        }

        .er-panel-heading h2,
        .er-details h2 {
          margin: 0 0 8px;
          font-family: "Space Grotesk", sans-serif;
          font-size: 21px;
        }

        .er-scroll {
          overflow-x: auto;
          padding-bottom: 10px;
        }

        .er-canvas {
          position: relative;
          width: 1000px;
          height: 570px;
          border: 1px solid #34302d;
          background:
            radial-gradient(ellipse at 50% 50%, rgba(240, 68, 56, .07), transparent 62%),
            #191919;
        }

        .er-connectors {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .er-connectors path {
          fill: none;
          stroke: #a94336;
          stroke-width: 2;
          stroke-dasharray: 7 6;
          opacity: .85;
        }

        .er-connectors text {
          fill: #c7bdb3;
          font: 10px "DM Sans", sans-serif;
          letter-spacing: .4px;
        }

        .er-entity {
          position: absolute;
          width: 270px;
          overflow: hidden;
          border: 1px solid #51413b;
          background: rgba(30, 30, 30, .98);
          box-shadow: 0 10px 30px rgba(0, 0, 0, .18);
          cursor: pointer;
          transition: border-color .18s ease, transform .18s ease;
        }

        .er-entity:hover {
          transform: translateY(-2px);
          border-color: #f04438;
        }

        .er-entity.is-selected {
          border-color: #f04438;
          box-shadow: 0 0 0 1px rgba(240, 68, 56, .2);
        }

        .er-entity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(240, 68, 56, .12);
          border-bottom: 1px solid #51413b;
        }

        .er-entity-header strong {
          color: #ff766b;
          font-family: "Space Grotesk", sans-serif;
          font-size: 15px;
        }

        .er-storage {
          color: #b7aea5;
          font-size: 9px;
          letter-spacing: .8px;
          text-transform: uppercase;
          text-align: right;
        }

        .er-fields {
          padding: 7px 14px 11px;
        }

        .er-field {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(255, 255, 255, .06);
          color: #e4ddd5;
          font-size: 11px;
        }

        .er-field:last-child {
          border-bottom: 0;
        }

        .er-field-type {
          color: #91877e;
          font-size: 9px;
          letter-spacing: .7px;
        }

        .er-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 14px;
          color: #b7aea5;
          font-size: 11px;
        }

        .er-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .er-legend-line {
          width: 26px;
          border-top: 2px dashed #a94336;
        }

        .er-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }

        .er-details p {
          margin: 0;
          color: #b7aea5;
          line-height: 1.6;
        }

        .er-details-tag {
          flex: 0 0 auto;
          color: #ff766b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        @media (max-width: 640px) {
          .er-page {
            padding: 24px 16px;
          }

          .er-panel {
            padding: 16px;
          }

          .er-details {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <header className="er-header">
        <span className="er-eyebrow">07 / SYSTEM MAP</span>
        <h1>
          How your ideas <span>fit together.</span>
        </h1>
        <p>
          Explore the data entities behind your Second Brain workspace.
          Select an entity to inspect its fields.
        </p>
      </header>

      <section className="er-panel">
        <div className="er-panel-heading">
          <div>
            <h2>Second Brain data map</h2>
            <p className="er-description">
              Materials can be used as the source for generated summaries,
              concept diagrams, and quizzes.
            </p>
          </div>
        </div>

        <div className="er-scroll">
          <div className="er-canvas">
            <svg
              className="er-connectors"
              viewBox="0 0 1000 570"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="er-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L7,3 z" fill="#a94336" />
                </marker>
              </defs>

              {links.map((link) => (
                <g key={link.id}>
                  <path d={link.path} markerEnd="url(#er-arrow)" />
                  <text x={link.x} y={link.y}>
                    {link.label}
                  </text>
                </g>
              ))}
            </svg>

            {entities.map((entity) => (
              <button
                className={`er-entity ${
                  selectedEntity === entity.id ? "is-selected" : ""
                }`}
                key={entity.id}
                type="button"
                onClick={() => setSelectedEntity(entity.id)}
                style={{ left: entity.x, top: entity.y }}
                aria-pressed={selectedEntity === entity.id}
              >
                <span className="er-entity-header">
                  <strong>{entity.name}</strong>
                  <span className="er-storage">{entity.storage}</span>
                </span>

                <span className="er-fields">
                  {entity.fields.map(([field, type]) => (
                    <span className="er-field" key={field}>
                      <span>{field}</span>
                      <span className="er-field-type">{type}</span>
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="er-legend">
          <span className="er-legend-item">
            <span className="er-legend-line" />
            Optional source association
          </span>
          <span>Scroll sideways to view the full diagram on a narrow screen.</span>
        </div>
      </section>

      {selected && (
        <section className="er-panel er-details">
          <div>
            <span className="er-eyebrow">SELECTED ENTITY</span>
            <h2>{selected.name}</h2>
            <p>
              Stored in {selected.storage}. Click another entity in the diagram
              to inspect its fields.
            </p>
          </div>
          <span className="er-details-tag">
            {selected.fields.length} fields
          </span>
        </section>
      )}
    </div>
  );
}
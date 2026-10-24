import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const MATERIALS_API = "https://second-brain-pl1v.onrender.com/api/materials";
function readList(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function readUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null") || {}; }
  catch { return {}; }
}
function describe(item, kind) {
  if (kind === "materials") return item.originalName || "Uploaded material";
  if (kind === "notes") return item.title || "Untitled note";
  if (kind === "summaries") return item.title || item.source || "Saved summary";
  if (kind === "diagrams") return item.title || item.source || "Saved diagram";
  return item.title || item.source || "Saved quiz";
}
const sections = [
  { key: "materials", label: "Materials", page: "Materials" },
  { key: "notes", label: "Notes", page: "Notes" },
  { key: "summaries", label: "Summaries", page: "Summaries" },
  { key: "diagrams", label: "Diagrams", page: "Diagrams" },
  { key: "quizzes", label: "Quizzes", page: "Quiz" },
];

export default function Profile({ onNavigate }) {
  const [user, setUser] = useState(readUser);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [lists] = useState(() => ({
    notes: readList("second-brain-notes"),
    summaries: readList("second-brain-summaries"),
    diagrams: readList("second-brain-flowcharts").length ? readList("second-brain-flowcharts") : readList("second-brain-diagrams"),
    quizzes: readList("second-brain-quizzes"),
  }));

  useEffect(() => onAuthStateChanged(auth, (firebaseUser) => {
    const saved = readUser();
    setUser({
      name: firebaseUser?.displayName || saved.name || "Second Brain user",
      email: firebaseUser?.email || saved.email || "No email available",
    });
  }), []);

  useEffect(() => {
    let active = true;
    fetch(MATERIALS_API)
      .then((response) => { if (!response.ok) throw new Error("Could not load materials."); return response.json(); })
      .then((data) => { if (active) setMaterials(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setMaterials([]); })
      .finally(() => { if (active) setLoadingMaterials(false); });
    return () => { active = false; };
  }, []);

  function openSection(page) {
    if (onNavigate) onNavigate(page);
    else window.location.assign(`/${page.toLowerCase()}`);
  }
  const collections = { ...lists, materials };

  return (
    <main style={{ padding: "36px clamp(20px, 5vw, 64px)", color: "#f5f0e8" }}>
      <header style={{ marginBottom: 28 }}>
        <span style={{ color: "#f04438", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>08 / YOUR ACCOUNT</span>
        <h1 style={{ fontSize: "clamp(38px, 5vw, 62px)", lineHeight: 1.05 }}>Your profile. <span style={{ color: "#f04438" }}>Your workspace.</span></h1>
        <p style={{ color: "#b7aea5", lineHeight: 1.7 }}>Your account details and everything you have saved.</p>
      </header>
      <section style={panelStyle}>
        <h2>Account details</h2>
        <p style={{ marginBottom: 6 }}><strong>{user.name || "Second Brain user"}</strong></p>
        <p style={{ margin: 0, color: "#b7aea5", overflowWrap: "anywhere" }}>{user.email || "No email available"}</p>
      </section>
      <section style={panelStyle}>
        <h2>Your saved work</h2>
        <div style={{ display: "grid", gap: 18 }}>
          {sections.map((section) => {
            const items = collections[section.key] || [];
            return (
              <div key={section.key}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>{section.label} <span style={{ color: "#ff766b" }}>({section.key === "materials" && loadingMaterials ? "…" : items.length})</span></h3>
                  <button type="button" onClick={() => openSection(section.page)} style={buttonStyle}>OPEN ↗</button>
                </div>
                {items.length === 0 ? (
                  <p style={{ color: "#8f8780", margin: "8px 0 0" }}>{section.key === "materials" && loadingMaterials ? "Loading saved materials…" : `No saved ${section.label.toLowerCase()} yet.`}</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 20, color: "#d8d0c8", lineHeight: 1.8 }}>
                    {items.map((item, index) => <li key={item._id || item.id || `${section.key}-${index}`}>{describe(item, section.key)}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

const panelStyle = { marginBottom: 20, padding: 24, border: "1px solid #393939", background: "rgba(28,28,28,.94)" };
const buttonStyle = { padding: "8px 12px", border: "1px solid #514841", background: "transparent", color: "#f5f0e8", cursor: "pointer", fontSize: 10, fontWeight: 700 };
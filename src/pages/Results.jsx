import { useState } from "react";

const RESULTS_KEY = "second-brain-quiz-results";
function loadResults() {
  try {
    const value = JSON.parse(localStorage.getItem(RESULTS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export default function Results({ onGoToQuiz }) {
  const [results] = useState(loadResults);
  const latest = results[0];
  const openQuiz = () => onGoToQuiz ? onGoToQuiz() : window.location.assign("/quiz");
  return (
    <main style={{ padding: "36px clamp(20px, 5vw, 64px)", color: "#f5f0e8" }}>
      <header style={{ marginBottom: 28 }}>
        <span style={{ color: "#f04438", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>07 / LEARNING PROGRESS</span>
        <h1 style={{ fontSize: "clamp(38px, 5vw, 62px)", lineHeight: 1.05 }}>Your quiz <span style={{ color: "#f04438" }}>results.</span></h1>
        <p style={{ color: "#b7aea5", lineHeight: 1.7 }}>Scores from quizzes generated using your uploaded study materials.</p>
      </header>
      {!latest ? (
        <section style={panelStyle}>
          <h2>No results yet</h2>
          <p style={{ color: "#b7aea5", lineHeight: 1.7 }}>Choose a saved material in Quiz, generate questions, and check your answers. Your score will appear here.</p>
          <button type="button" onClick={openQuiz} style={buttonStyle}>OPEN QUIZ ↗</button>
        </section>
      ) : (
        <>
          <section style={panelStyle}>
            <span style={{ color: "#aaa097", fontSize: 11 }}>{latest.source}</span>
            <h2 style={{ marginBottom: 8 }}>{latest.title}</h2>
            <strong style={{ color: "#f04438", fontSize: 30 }}>{latest.percent}%</strong>
            <p style={{ color: "#b7aea5" }}>{latest.correct} correct out of {latest.total} · {latest.date}</p>
            <button type="button" onClick={openQuiz} style={buttonStyle}>TAKE ANOTHER QUIZ ↗</button>
          </section>
          <section style={panelStyle}>
            <h2>Previous attempts</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {results.map((result) => (
                <article key={result.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: 16, border: "1px solid #393939", background: "#141414" }}>
                  <div><strong>{result.title}</strong><p style={{ margin: "6px 0 0", color: "#aaa097" }}>{result.source} · {result.correct}/{result.total} correct · {result.date}</p></div>
                  <strong style={{ color: "#ff766b" }}>{result.percent}%</strong>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

const panelStyle = { marginBottom: 22, padding: 24, border: "1px solid #393939", background: "rgba(28,28,28,.94)" };
const buttonStyle = { marginTop: 12, minHeight: 44, padding: "12px 16px", border: "1px solid #f04438", background: "#f04438", color: "white", fontWeight: 700, letterSpacing: 1, cursor: "pointer" };
import { useEffect, useState } from "react";

const MATERIALS_API = "https://second-brain-pl1v.onrender.com/api/materials";
const QUIZZES_KEY = "second-brain-quizzes";

const STOP_WORDS = new Set(
  "about after again against all also am an and any are as at be because been before being between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourselves".split(
    " "
  )
);

function readSavedQuizzes() {
  try {
    const value = JSON.parse(localStorage.getItem(QUIZZES_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createQuestions(text, limit = 10) {
  const sentences = String(text)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 6);

  const frequency = new Map();

  for (const word of text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []) {
    if (!STOP_WORDS.has(word)) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  }

  const distractorPool = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  const usedAnswers = new Set();
  const questions = [];

  for (const sentence of sentences) {
    const words = [
      ...new Set(sentence.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []),
    ]
      .filter((word) => !STOP_WORDS.has(word) && !usedAnswers.has(word))
      .sort((a, b) => (frequency.get(b) || 0) - (frequency.get(a) || 0));

    const answer = words[0];
    if (!answer) continue;

    const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const questionText = sentence.replace(
      new RegExp(`\\b${escaped}\\b`, "i"),
      "_____"
    );

    const wrongAnswers = distractorPool
      .filter((word) => word !== answer && !words.includes(word))
      .slice(0, 3);

    if (wrongAnswers.length < 3) continue;

    usedAnswers.add(answer);
    questions.push({
      id: makeId(),
      prompt: `Complete the sentence: ${questionText}`,
      answer,
      choices: shuffle([answer, ...wrongAnswers]),
    });

    if (questions.length >= limit) break;
  }

  return questions;
}

export default function Quiz() {
  const [materials, setMaterials] = useState([]);
  const [materialId, setMaterialId] = useState("");
  const [savedQuizzes, setSavedQuizzes] = useState(readSavedQuizzes);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      try {
        const response = await fetch(MATERIALS_API);
        const result = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(result.message || "Could not load saved materials.");
        }

        if (!cancelled) {
          setMaterials(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error.message || "Could not connect to the materials server."
          );
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

  async function generateQuiz(event) {
    event.preventDefault();

    const material = materials.find(
      (item) => String(item._id) === materialId
    );

    if (!material) {
      setMessage("Choose a saved material first.");
      return;
    }

    setGenerating(true);
    setMessage("");
    setCurrentQuiz(null);
    setAnswers({});
    setSubmitted(false);

    try {
      const response = await fetch(
        `${MATERIALS_API}/${encodeURIComponent(material._id)}/text`
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Could not read this material.");
      }

      const questions = createQuestions(result.text || "");

      if (questions.length === 0) {
        throw new Error(
          "There is not enough readable text to make a quiz. Try a TXT or text-based PDF file."
        );
      }

      setCurrentQuiz({
        id: makeId(),
        title: material.originalName.replace(/\.[^.]+$/, ""),
        source: material.originalName,
        questions,
        date: new Date().toLocaleDateString(),
      });
      setMessage(`${questions.length} questions generated.`);
    } catch (error) {
      setMessage(error.message || "Could not generate the quiz.");
    } finally {
      setGenerating(false);
    }
  }

  function saveQuiz() {
    if (!currentQuiz) return;

    const updated = [currentQuiz, ...savedQuizzes];
    setSavedQuizzes(updated);
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(updated));
    setMessage("Quiz saved to your library.");
  }

  function openQuiz(quiz) {
    setCurrentQuiz(quiz);
    setAnswers({});
    setSubmitted(false);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteQuiz(id) {
    const updated = savedQuizzes.filter((quiz) => quiz.id !== id);
    setSavedQuizzes(updated);
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(updated));

    if (currentQuiz?.id === id) {
      setCurrentQuiz(null);
      setAnswers({});
      setSubmitted(false);
    }
  }

  const score = currentQuiz
    ? currentQuiz.questions.reduce(
        (total, question) =>
          total + (answers[question.id] === question.answer ? 1 : 0),
        0
      )
    : 0;

  return (
    <div className="quiz-page">
      <style>{`
        .quiz-page {
          position: relative;
          z-index: 1;
          color: #f5f0e8;
          padding: 36px clamp(22px, 5vw, 64px);
        }
        .quiz-header { margin: 0 0 28px; }
        .quiz-eyebrow {
          color: #f04438;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .quiz-header h1 {
          margin: 14px 0;
          color: #f4f4f4;
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(38px, 5vw, 62px);
          line-height: 1.05;
          letter-spacing: -2px;
        }
        .quiz-header h1 span { color: #f04438; }
        .quiz-header p, .quiz-muted {
          color: #b7aea5;
          line-height: 1.7;
        }
        .quiz-panel, .quiz-card {
          margin: 0 0 24px;
          padding: 24px;
          background: rgba(28, 28, 28, .94);
          border: 1px solid #393939;
        }
        .quiz-panel h2, .quiz-card h2 {
          margin: 0 0 16px;
          font-family: "Space Grotesk", sans-serif;
        }
        .quiz-form { display: grid; gap: 12px; }
        .quiz-form label {
          color: #c7bdb3;
          font-size: 10px;
          letter-spacing: 1.5px;
        }
        .quiz-form select {
          width: 100%;
          min-height: 52px;
          padding: 12px 14px;
          color: #f5f0e8;
          background: #141414;
          border: 1px solid #514a43;
          font: inherit;
        }
        .quiz-button, .quiz-secondary, .quiz-delete {
          min-height: 44px;
          padding: 11px 16px;
          color: #fff;
          background: #f04438;
          border: 1px solid #f04438;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
        }
        .quiz-button:disabled { opacity: .55; cursor: wait; }
        .quiz-secondary {
          color: #f5f0e8;
          background: transparent;
          border-color: #514a43;
        }
        .quiz-delete {
          min-height: 36px;
          padding: 8px 12px;
          color: #f04438;
          background: transparent;
          border-color: #514a43;
        }
        .quiz-message {
          margin-top: 16px;
          color: #f5b2a9;
          line-height: 1.6;
        }
        .quiz-question {
          margin: 18px 0;
          padding: 18px;
          border: 1px solid #393939;
          background: rgba(20, 20, 20, .7);
        }
        .quiz-question legend {
          padding: 0 6px;
          color: #f5f0e8;
          line-height: 1.6;
        }
        .quiz-choice {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin: 12px 0;
          color: #c7bdb3;
          line-height: 1.5;
          cursor: pointer;
        }
        .quiz-choice input { accent-color: #f04438; margin-top: 4px; }
        .quiz-correct { color: #9bd6a3; }
        .quiz-wrong { color: #ff8177; }
        .quiz-score {
          margin: 16px 0;
          color: #f04438;
          font-family: "Space Grotesk", sans-serif;
          font-size: 24px;
          font-weight: 700;
        }
        .quiz-library-list { display: grid; gap: 12px; }
        .quiz-saved-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 1px solid #393939;
          background: rgba(20, 20, 20, .7);
        }
        .quiz-saved-item p {
          margin-top: 6px;
          color: #b7aea5;
          font-size: 13px;
        }
        .quiz-saved-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .quiz-page { padding: 24px 16px; }
          .quiz-panel, .quiz-card { padding: 18px; }
          .quiz-saved-item { align-items: flex-start; flex-direction: column; }
        }
      `}</style>

      <header className="quiz-header">
        <span className="quiz-eyebrow">06 / ACTIVE RECALL</span>
        <h1>
          Learn it. <span>Recall it.</span>
        </h1>
        <p>Turn your study materials into a quiz and check what you remember.</p>
      </header>

      <section className="quiz-panel">
        <h2>Generate a quiz</h2>
        <p className="quiz-muted">
          Choose a saved TXT or text-based PDF material. Questions are generated
          from its readable sentences.
        </p>

        <form className="quiz-form" onSubmit={generateQuiz}>
          <label htmlFor="quiz-material">STUDY MATERIAL</label>
          <select
            id="quiz-material"
            value={materialId}
            onChange={(event) => setMaterialId(event.target.value)}
            disabled={loadingMaterials || materials.length === 0}
          >
            <option value="">
              {loadingMaterials ? "Loading materials…" : "Choose a material"}
            </option>
            {materials.map((material) => (
              <option key={material._id} value={material._id}>
                {material.originalName}
              </option>
            ))}
          </select>

          <button className="quiz-button" type="submit" disabled={generating}>
            {generating ? "GENERATING…" : "GENERATE QUIZ ↗"}
          </button>
        </form>

        {materials.length === 0 && !loadingMaterials && (
          <p className="quiz-message">
            No saved materials found. Upload a TXT or PDF file in Materials
            first.
          </p>
        )}

        {message && <p className="quiz-message" role="status">{message}</p>}
      </section>

      {currentQuiz && (
        <section className="quiz-panel">
          <span className="quiz-eyebrow">{currentQuiz.source}</span>
          <h2>{currentQuiz.title}</h2>

          {submitted && (
            <p className="quiz-score">
              Score: {score} / {currentQuiz.questions.length}
            </p>
          )}

          {currentQuiz.questions.map((question, index) => (
            <fieldset className="quiz-question" key={question.id}>
              <legend>
                {String(index + 1).padStart(2, "0")} / {question.prompt}
              </legend>

              {question.choices.map((choice) => {
                const isCorrect = submitted && choice === question.answer;
                const isWrong =
                  submitted &&
                  answers[question.id] === choice &&
                  choice !== question.answer;

                return (
                  <label
                    className={`quiz-choice${isCorrect ? " quiz-correct" : ""}${
                      isWrong ? " quiz-wrong" : ""
                    }`}
                    key={choice}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={choice}
                      checked={answers[question.id] === choice}
                      disabled={submitted}
                      onChange={() =>
                        setAnswers((previous) => ({
                          ...previous,
                          [question.id]: choice,
                        }))
                      }
                    />
                    <span>{choice}</span>
                  </label>
                );
              })}
            </fieldset>
          ))}

          {!submitted ? (
            <button
              className="quiz-button"
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length !== currentQuiz.questions.length}
            >
              CHECK ANSWERS
            </button>
          ) : (
            <button
              className="quiz-secondary"
              type="button"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              TRY AGAIN
            </button>
          )}

          <button
            className="quiz-secondary"
            type="button"
            onClick={saveQuiz}
            style={{ marginLeft: 10 }}
          >
            SAVE QUIZ
          </button>
        </section>
      )}

      <section className="quiz-panel">
        <span className="quiz-eyebrow">YOUR LIBRARY</span>
        <h2>Saved quizzes</h2>

        {savedQuizzes.length === 0 ? (
          <p className="quiz-muted">Your saved quizzes will appear here.</p>
        ) : (
          <div className="quiz-library-list">
            {savedQuizzes.map((quiz) => (
              <article className="quiz-saved-item" key={quiz.id}>
                <div>
                  <strong>{quiz.title}</strong>
                  <p>
                    {quiz.source} · {quiz.questions.length} questions · Saved{" "}
                    {quiz.date}
                  </p>
                </div>
                <div className="quiz-saved-actions">
                  <button
                    className="quiz-secondary"
                    type="button"
                    onClick={() => openQuiz(quiz)}
                  >
                    OPEN
                  </button>
                  <button
                    className="quiz-delete"
                    type="button"
                    onClick={() => deleteQuiz(quiz.id)}
                  >
                    DELETE
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
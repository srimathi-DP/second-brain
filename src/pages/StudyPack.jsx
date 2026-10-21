import { useMemo, useState } from "react";

function StudyPack({ text = "", title = "Study Pack" }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const content = useMemo(
    () => String(text || "").replace(/^FILE:.*\n+/i, "").trim(),
    [text]
  );

  const sentences = useMemo(
    () =>
      content
        .split(/(?<=[.!?])\s+|\n+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 20),
    [content]
  );

  const summary = sentences.slice(0, 5).join(" ");

  const keyPoints = sentences.slice(0, 8);

  const questions = useMemo(
    () =>
      sentences.slice(0, 5).map((sentence, index) => {
        const words = sentence.match(/\b[\w-]+\b/g) || [];
        const answer = words.find((word) => word.length > 5);

        if (!answer) return null;

        const maskedSentence = sentence.replace(
          new RegExp("\\b" + answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i"),
          "________"
        );

        const options = [
          answer,
          words[0],
          words[words.length - 1],
          "Not mentioned",
        ];

        return {
          id: index + 1,
          question: "Complete the statement: " + maskedSentence,
          answer,
          options: [...new Set(options)],
        };
      }).filter(Boolean),
    [sentences]
  );

  const score = questions.filter(
    (question) => answers[question.id] === question.answer
  ).length;

  const percentage = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  function resetQuiz() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <main className="study-pack-page">
      <style>{`
        .study-pack-page {
          width: min(100% - 32px, 1000px);
          margin: 40px auto;
          color: #f7f2e9;
          font-family: inherit;
        }
        .study-pack-page .sp-heading {
          font-size: clamp(30px, 5vw, 48px);
          margin: 10px 0;
        }
        .study-pack-page .sp-muted {
          color: #b8b1aa;
          line-height: 1.7;
        }
        .study-pack-page .sp-panel {
          background: #191919;
          border: 1px solid #393331;
          border-radius: 16px;
          padding: clamp(18px, 4vw, 28px);
          margin: 22px 0;
        }
        .study-pack-page .sp-label {
          color: #f16a52;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .study-pack-page .sp-button {
          border: 0;
          border-radius: 8px;
          padding: 12px 18px;
          background: #e4513b;
          color: white;
          font-weight: 700;
          cursor: pointer;
          margin: 10px 8px 0 0;
        }
        .study-pack-page .sp-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }
        .study-pack-page .sp-option {
          display: flex;
          gap: 10px;
          align-items: center;
          border: 1px solid #45403d;
          border-radius: 8px;
          padding: 12px;
          margin: 8px 0;
          cursor: pointer;
        }
        .study-pack-page .sp-option:has(input:checked) {
          border-color: #e4513b;
        }
        .study-pack-page .sp-answer {
          color: #f2b9ad;
          font-size: 14px;
        }
        .study-pack-page li {
          margin: 12px 0;
          line-height: 1.7;
        }
        .study-pack-page .sp-score {
          font-size: 30px;
          color: #f16a52;
          font-weight: 800;
        }
      `}</style>

      <header>
        <span className="sp-label">SECOND BRAIN / STUDY MODE</span>
        <h1 className="sp-heading">{title}</h1>
        <p className="sp-muted">
          Turn your learning material into clear notes and practice questions.
        </p>
      </header>

      {!content ? (
        <section className="sp-panel">
          <h2>No study material yet</h2>
          <p className="sp-muted">
            Upload a readable TXT or PDF file, or enter your lecture text on
            the Materials page. Then open Study Pack with that text.
          </p>
        </section>
      ) : (
        <>
          <section className="sp-panel">
            <span className="sp-label">01 / SUMMARY</span>
            <h2>Understand the big picture</h2>
            <p className="sp-muted">
              {summary || "Not enough readable text to generate a summary."}
            </p>
          </section>

          <section className="sp-panel">
            <span className="sp-label">02 / KEY POINTS</span>
            <h2>What to remember</h2>
            {keyPoints.length ? (
              <ul>
                {keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            ) : (
              <p className="sp-muted">
                No readable key points were found in this material.
              </p>
            )}
          </section>

          <section className="sp-panel">
            <span className="sp-label">03 / STRUCTURED NOTES</span>
            <h2>Your notes</h2>
            <p className="sp-muted" style={{ whiteSpace: "pre-wrap" }}>
              {content}
            </p>
          </section>

          <section className="sp-panel">
            <span className="sp-label">04 / PRACTICE</span>
            <h2>Check your understanding</h2>
            <p className="sp-muted">
              Choose one answer for each question. Submit to calculate your
              score out of 100.
            </p>

            {!questions.length ? (
              <p className="sp-muted">
                Add more readable lecture text to generate practice questions.
              </p>
            ) : (
              questions.map((question) => (
                <div key={question.id} style={{ marginTop: 24 }}>
                  <p>
                    <strong>
                      {question.id}. {question.question}
                    </strong>
                  </p>

                  {question.options.map((option) => (
                    <label className="sp-option" key={option}>
                      <input
                        type="radio"
                        name={"question-" + question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        disabled={submitted}
                        onChange={() =>
                          setAnswers((previous) => ({
                            ...previous,
                            [question.id]: option,
                          }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}

                  {submitted && (
                    <p className="sp-answer">
                      Answer from your material: {question.answer}
                    </p>
                  )}
                </div>
              ))
            )}

            {questions.length > 0 && !submitted && (
              <button
                className="sp-button"
                type="button"
                onClick={() => setSubmitted(true)}
              >
                Submit quiz
              </button>
            )}

            {submitted && (
              <div style={{ marginTop: 24 }}>
                <p className="sp-score">
                  {percentage}/100
                </p>
                <p className="sp-muted">
                  {score} of {questions.length} answers correct.
                </p>
                <button
                  className="sp-button"
                  type="button"
                  onClick={resetQuiz}
                >
                  Try again
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default StudyPack;
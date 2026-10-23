
import { useState } from "react";
import "./App.css";
import SignIn from "./SignIn";
import Materials from "./pages/Materials";

const sections = [
  "Dashboard",
  "Materials",
  "Notes",
  "Summaries",
  "Diagrams",
  "Quiz",
  "Results",
  "ER Diagram",
  "Profile",
];

function App() {
  const [page, setPage] = useState(() =>
    new URLSearchParams(window.location.search).get("auth") === "signin"
      ? "signin"
      : "register"
  );

  if (page === "signin") {
    return (
      <SignIn
        onRegister={() => setPage("register")}
        onLogin={() => window.location.assign("/dashboard")}
      />
    );
  }

  if (page === "workspace") {
    return <Workspace />;
  }

  return <RegisterPage onSignIn={() => setPage("signin")} />;
}

function RegisterPage({ onSignIn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://second-brain-pl1v.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      setMessage("Account created successfully! Please sign in.");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(onSignIn, 1200);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the server. Check your backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="curve-background" aria-hidden="true">
        <svg
          className="scrambled-lines"
          viewBox="0 0 1600 1800"
          preserveAspectRatio="none"
        >
          <path
            className="line-one"
            d="M-100 1450 C100 1320 190 1500 340 1360 C480 1230 430 1050 570 1000 C700 950 790 1080 710 1190 C630 1300 720 1400 850 1280 C980 1160 940 970 1080 900 C1220 830 1320 950 1240 1070 C1160 1190 1270 1300 1410 1190"
          />
          <path
            className="line-two"
            d="M-120 500 C80 400 180 560 330 500 C470 440 500 300 620 320 C760 340 800 470 920 500 C1050 530 1090 420 1200 440 C1330 460 1410 580 1530 530"
          />
        </svg>
      </div>

      <header className="header">
        <a className="brand" href="/">
          <img
            src="/second-brain-logo.png"
            alt="Second Brain"
            className="brand-logo"
          />
        </a>

        <div className="signin-area">
          <span>Already have an account?</span>
          <button
            className="signin-button"
            type="button"
            onClick={onSignIn}
          >
            Sign in
          </button>
        </div>
      </header>

      <main className="main">
        <section className="intro">
          <div className="eyebrow">
            <span className="red-dot" />
            YOUR PERSONAL LEARNING SPACE
          </div>

          <h1>
            Learn.
            <br />
            <span>Understand.</span>
            <br />
            Remember.
          </h1>

          <p className="intro-text">
            Second Brain transforms your lectures and study materials
            into structured knowledge, clear explanations and quizzes.
          </p>

          <div className="features">
            <div className="feature">
              <div className="feature-content">01 / ORGANIZE YOUR MATERIALS</div>
            </div>
            <div className="feature">
              <div className="feature-content">02 / UNDERSTAND CONCEPTS</div>
            </div>
            <div className="feature">
              <div className="feature-content">03 / TEST YOUR KNOWLEDGE</div>
            </div>
          </div>
        </section>

        <section className="register-card">
          <div className="red-edge" />

          <div className="card-heading">
            <div className="card-title-area">
              <img
                src="/second-brain-icon.png"
                alt="Second Brain"
                className="card-logo"
              />
              <div>
                <span className="card-label">CREATE ACCOUNT</span>
                <h2>
                  Start your
                  <br />
                  Second Brain.
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegister}>
            <div className="field">
              <label htmlFor="register-name">FULL NAME</label>
              <input
                id="register-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="register-email">EMAIL ADDRESS</label>
              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="register-password">PASSWORD</label>
              <div className="password-wrapper">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="register-confirm-password">
                CONFIRM PASSWORD
              </label>
              <div className="password-wrapper">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <label className="terms">
              <input type="checkbox" required />
              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            <button
              type="submit"
              className="create-button"
              disabled={loading}
            >
              <span>
                {loading ? "Creating account..." : "Create account"}
              </span>
              <strong>→</strong>
            </button>

            {message && <p className="form-message">{message}</p>}

            <div className="divider">
              <span />
              <small>YOUR LEARNING JOURNEY</small>
              <span />
            </div>
          </form>

          <p className="card-note">
            Your personal learning space starts here.
          </p>
        </section>
      </main>

      <footer className="footer">
        <span>SECOND BRAIN</span>
        <span>LEARN · UNDERSTAND · REMEMBER</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}

function Workspace() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("second-brain-notes") || "[]");
    } catch {
      return [];
    }
  });
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  function saveNotes(updatedNotes) {
    setNotes(updatedNotes);
    localStorage.setItem("second-brain-notes", JSON.stringify(updatedNotes));
  }

  function saveNote(event) {
    event.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const updatedNotes =
      editingNote !== null
        ? notes.map((note) =>
            note.id === editingNote
              ? {
                  ...note,
                  title: noteTitle.trim(),
                  content: noteContent.trim(),
                }
              : note
          )
        : [
            {
              id: Date.now(),
              title: noteTitle.trim(),
              content: noteContent.trim(),
              date: new Date().toLocaleDateString(),
            },
            ...notes,
          ];

    saveNotes(updatedNotes);
    setNoteTitle("");
    setNoteContent("");
    setEditingNote(null);
  }

  function finishQuiz() {
    const score = quizAnswer === "B" ? 100 : 0;
    setQuizScore(score);
    setQuizFinished(true);
    localStorage.setItem("second-brain-last-score", String(score));
  }

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return (
          <>
            <PageHeader
              eyebrow="YOUR WORKSPACE"
              title="Your learning."
              accent="Your progress."
              description="Everything you need to learn, understand, and remember."
            />
            <div className="sb-stats">
              <Stat title="Saved notes" value={notes.length} />
              <Stat title="Study materials" value="—" />
              <Stat
                title="Last quiz score"
                value={
                  localStorage.getItem("second-brain-last-score") !== null
                    ? `${localStorage.getItem("second-brain-last-score")}%`
                    : "—"
                }
              />
            </div>
            <Panel title="Continue learning">
              <p>Choose a section from the sidebar to continue.</p>
              <div className="sb-actions">
                <button onClick={() => setActivePage("Materials")}>
                  OPEN MATERIALS ↗
                </button>
                <button onClick={() => setActivePage("Notes")}>
                  WRITE A NOTE ↗
                </button>
                <button onClick={() => setActivePage("Quiz")}>
                  PRACTICE QUIZ ↗
                </button>
              </div>
            </Panel>
          </>
        );

      case "Materials":
        return <Materials />;

      case "Notes":
        return (
          <>
            <PageHeader
              eyebrow="03 / PERSONAL KNOWLEDGE"
              title="Capture ideas."
              accent="Keep them close."
              description="Write, edit, and revisit your study notes."
            />
            <Panel title={editingNote !== null ? "Edit note" : "Create a note"}>
              <form className="sb-form" onSubmit={saveNote}>
                <label htmlFor="sb-note-title">NOTE TITLE</label>
                <input
                  id="sb-note-title"
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                  placeholder="Enter a title"
                  required
                />
                <label htmlFor="sb-note-content">NOTE CONTENT</label>
                <textarea
                  id="sb-note-content"
                  value={noteContent}
                  onChange={(event) => setNoteContent(event.target.value)}
                  placeholder="Write your notes here..."
                  rows={7}
                  required
                />
                <div className="sb-actions">
                  <button type="submit">
                    {editingNote !== null ? "UPDATE NOTE ↗" : "SAVE NOTE ↗"}
                  </button>
                  {editingNote !== null && (
                    <button
                      type="button"
                      className="sb-secondary"
                      onClick={() => {
                        setEditingNote(null);
                        setNoteTitle("");
                        setNoteContent("");
                      }}
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </form>
            </Panel>
            <Panel title={`Your notes · ${notes.length}`}>
              {notes.length === 0 ? (
                <p>Your saved notes will appear here.</p>
              ) : (
                notes.map((note) => (
                  <article className="sb-note" key={note.id}>
                    <small>{note.date}</small>
                    <h3>{note.title}</h3>
                    <p className="sb-note-content">{note.content}</p>
                    <div className="sb-actions">
                      <button
                        onClick={() => {
                          setEditingNote(note.id);
                          setNoteTitle(note.title);
                          setNoteContent(note.content);
                        }}
                      >
                        EDIT
                      </button>
                      <button
                        className="sb-secondary"
                        onClick={() =>
                          saveNotes(notes.filter((item) => item.id !== note.id))
                        }
                      >
                        DELETE
                      </button>
                    </div>
                  </article>
                ))
              )}
            </Panel>
          </>
        );

      case "Summaries":
        return (
          <>
            <PageHeader
              eyebrow="04 / UNDERSTAND"
              title="Less noise."
              accent="More meaning."
              description="Review your study summaries."
            />
            <Panel title="Your summaries">
              <p>
                Upload a material in Materials to begin working with its
                content. Your existing Summaries page can be connected here.
              </p>
              <button onClick={() => setActivePage("Materials")}>
                GO TO MATERIALS ↗
              </button>
            </Panel>
          </>
        );

      case "Diagrams":
        return (
          <>
            <PageHeader
              eyebrow="05 / VISUAL LEARNING"
              title="See the ideas."
              accent="Connect the dots."
              description="Understand how concepts relate to each other."
            />
            <Panel title="Concept map">
              <div className="sb-concept-map">
                <div className="sb-concept-node sb-concept-main">
                  LEARNING
                </div>
                <div className="sb-concept-branches">
                  <div className="sb-concept-node">Understand</div>
                  <div className="sb-concept-node">Practice</div>
                  <div className="sb-concept-node">Remember</div>
                </div>
              </div>
              <p>Example concept map.</p>
            </Panel>
          </>
        );

      case "Quiz":
        return (
          <>
            <PageHeader
              eyebrow="06 / TEST YOURSELF"
              title="Practice makes."
              accent="Progress."
              description="Answer the question and check your score."
            />
            <Panel title="Quick practice · Question 1 of 1">
              <p>
                <strong>
                  Which data structure follows the FIFO principle?
                </strong>
              </p>
              {[
                ["A", "Stack"],
                ["B", "Queue"],
                ["C", "Tree"],
                ["D", "Graph"],
              ].map(([value, label]) => (
                <label className="sb-option" key={value}>
                  <input
                    type="radio"
                    name="sb-quiz"
                    value={value}
                    checked={quizAnswer === value}
                    onChange={() => setQuizAnswer(value)}
                    disabled={quizFinished}
                  />
                  <span>
                    {value}. {label}
                  </span>
                </label>
              ))}
              {!quizFinished ? (
                <button disabled={!quizAnswer} onClick={finishQuiz}>
                  SUBMIT ANSWER ↗
                </button>
              ) : (
                <>
                  <p className={quizScore === 100 ? "sb-correct" : "sb-error"}>
                    {quizScore === 100
                      ? "Correct! Your score is 100/100."
                      : "The correct answer is Queue. Your score is 0/100."}
                  </p>
                  <button
                    onClick={() => {
                      setQuizAnswer("");
                      setQuizFinished(false);
                      setQuizScore(null);
                    }}
                  >
                    TRY AGAIN ↗
                  </button>
                </>
              )}
            </Panel>
          </>
        );

      case "Results":
        return (
          <>
            <PageHeader
              eyebrow="07 / LEARNING PROGRESS"
              title="See how far."
              accent="You have come."
              description="Review your latest quiz result."
            />
            <Panel title="Latest result">
              <div className="sb-result-score">
                {localStorage.getItem("second-brain-last-score") ?? "—"}
                <span>
                  {localStorage.getItem("second-brain-last-score") !== null
                    ? "/100"
                    : "No quiz yet"}
                </span>
              </div>
              <button onClick={() => setActivePage("Quiz")}>
                TAKE A QUIZ ↗
              </button>
            </Panel>
          </>
        );

      case "ER Diagram":
        return (
          <>
            <PageHeader
              eyebrow="08 / DATABASE DESIGN"
              title="The structure."
              accent="Behind the system."
              description="A conceptual view of the main data entities."
            />
            <Panel title="Entity relationship overview">
              <div className="sb-er-grid">
                <Entity title="USER" fields={["userId (PK)", "name", "email"]} />
                <Entity
                  title="MATERIAL"
                  fields={["materialId (PK)", "userId (FK)", "fileName"]}
                />
                <Entity
                  title="NOTE"
                  fields={["noteId (PK)", "userId (FK)", "title", "content"]}
                />
                <Entity
                  title="QUIZ RESULT"
                  fields={["resultId (PK)", "userId (FK)", "score"]}
                />
              </div>
            </Panel>
          </>
        );

      case "Profile":
        return (
          <>
            <PageHeader
              eyebrow="09 / YOUR ACCOUNT"
              title="Your profile."
              accent="Your workspace."
              description="Your account and learning preferences."
            />
            <Panel title="Account">
              <p>
                Your account information is managed by the existing
                authentication system.
              </p>
            </Panel>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <div
      className="second-brain-app"
      style={{ position: "relative", isolation: "isolate" }}
    >
      <div
        className="sb-background-curves"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.28,
        }}
      >
        <svg
          viewBox="0 0 1200 900"
          preserveAspectRatio="none"
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <path d="M0 180 C100 80 230 300 400 180 S650 80 760 220 S1000 350 1200 130" />
          <path d="M0 650 C150 520 180 760 350 600 S480 350 650 450 S850 700 1000 520 S1150 400 1200 300" />
        </svg>
      </div>

      <aside
        className="sb-sidebar"
        style={{ background: "rgba(32, 32, 32, 0.72)" }}
      >
        <div className="sb-logo">
          <span className="sb-logo-mark">SB</span>
          <span>SECOND BRAIN</span>
        </div>
        <p className="sb-sidebar-label">WORKSPACE</p>
        <nav className="sb-nav">
          {sections.map((section, index) => (
            <button
              key={section}
              className={`sb-nav-item ${
                activePage === section ? "active" : ""
              }`}
              onClick={() => setActivePage(section)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {section}
            </button>
          ))}
        </nav>
        <div className="sb-sidebar-bottom">
          <button
            className="sb-logout"
            onClick={() => {
              if (window.confirm("Return to the sign-in page?")) {
                window.location.reload();
              }
            }}
          >
            LOG OUT <span>⟶</span>
          </button>
          <small>SECOND BRAIN · © 2026</small>
        </div>
      </aside>

      <main className="sb-main" style={{ position: "relative", zIndex: 1 }}>
        <div className="sb-page-content">{renderPage()}</div>
      </main>
    </div>
  );
}

function PageHeader({ eyebrow, title, accent, description }) {
  return (
    <header className="sb-page-header">
      <span>{eyebrow}</span>
      <h1>
        {title}
        <br />
        <strong>{accent}</strong>
      </h1>
      <p>{description}</p>
    </header>
  );
}

function Panel({ title, children }) {
  return (
    <section className="sb-panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Stat({ title, value }) {
  return (
    <div className="sb-stat">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Entity({ title, fields }) {
  return (
    <div className="sb-entity">
      <h3>{title}</h3>
      {fields.map((field) => (
        <p key={field}>{field}</p>
      ))}
    </div>
  );
}

export default App;


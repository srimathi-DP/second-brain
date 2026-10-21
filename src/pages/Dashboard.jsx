import "../Dashboard.css";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const sections = [
    {
      number: "01",
      title: "Study materials",
      description: "Manage your uploaded lectures and files.",
      path: "/materials",
      action: "VIEW MATERIALS",
    },
    {
      number: "02",
      title: "Structured notes",
      description: "Keep your learning notes organized.",
      path: "/notes",
      action: "OPEN NOTES",
    },
    {
      number: "03",
      title: "Summaries",
      description: "Review the important ideas from your lessons.",
      path: "/summaries",
      action: "VIEW SUMMARIES",
    },
    {
      number: "04",
      title: "Visual diagrams",
      description: "Explore concepts through visual explanations.",
      path: "/diagrams",
      action: "VIEW DIAGRAMS",
    },
    {
      number: "05",
      title: "Practice quiz",
      description: "Test your understanding with questions.",
      path: "/quiz",
      action: "START QUIZ",
    },
    {
      number: "06",
      title: "Learning results",
      description: "Review your quiz scores and progress.",
      path: "/results",
      action: "VIEW RESULTS",
    },
  ];

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-overline">YOUR WORKSPACE</span>
            <p className="dashboard-breadcrumb">Second Brain / Dashboard</p>
          </div>

          <div className="dashboard-user">
            <span className="dashboard-user-dot" />
            <div>
              <span className="dashboard-welcome-label">WELCOME BACK</span>
              <strong>{user?.name || "Student"}</strong>
            </div>
          </div>
        </header>

        <section className="dashboard-hero">
          <div className="dashboard-eyebrow">
            <span />
            YOUR PERSONAL LEARNING SPACE
          </div>

          <h1>
            Build your
            <br />
            <span>Second Brain.</span>
          </h1>

          <p>
            One place for your study materials, organized notes,
            visual explanations, and quizzes.
          </p>

          <button
            className="dashboard-primary-button"
            onClick={() => navigate("/materials")}
          >
            EXPLORE MATERIALS <span>↗</span>
          </button>
        </section>

        <section className="dashboard-upload">
          <div className="dashboard-upload-heading">
            <div>
              <span className="dashboard-section-label">GET STARTED</span>
              <h2>Add study material</h2>
              <p>Start with a lecture, document, or your own notes.</p>
            </div>
            <span className="dashboard-section-number">01</span>
          </div>

          <button
            className="dashboard-upload-action"
            onClick={() => navigate("/materials")}
          >
            <span className="dashboard-upload-plus">+</span>
            <span className="dashboard-upload-copy">
              <strong>Open your materials library</strong>
              <small>PDF · Documents · Audio · Video · Text</small>
            </span>
            <span className="dashboard-upload-arrow">↗</span>
          </button>

          <p className="dashboard-muted-note">
            Your files and generated learning content will be managed in the
            Materials section.
          </p>
        </section>

        <section className="dashboard-library">
          <div className="dashboard-library-heading">
            <div>
              <span className="dashboard-section-label">YOUR LEARNING TOOLS</span>
              <h2>Everything, organized.</h2>
            </div>
            <span className="dashboard-library-count">06 SECTIONS</span>
          </div>

          <div className="dashboard-card-grid">
            {sections.map((section) => (
              <button
                className="dashboard-tool-card"
                key={section.path}
                onClick={() => navigate(section.path)}
              >
                <span className="dashboard-tool-number">{section.number}</span>
                <span className="dashboard-tool-arrow">↗</span>
                <strong>{section.title}</strong>
                <p>{section.description}</p>
                <span className="dashboard-tool-action">{section.action}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-workflow">
          <span className="dashboard-section-label">THE LEARNING PROCESS</span>
          <h2>From information to understanding.</h2>

          <div className="dashboard-workflow-steps">
            <div><span>01</span><strong>Collect</strong><small>Materials</small></div>
            <span className="dashboard-workflow-arrow">→</span>
            <div><span>02</span><strong>Organize</strong><small>Notes & summaries</small></div>
            <span className="dashboard-workflow-arrow">→</span>
            <div><span>03</span><strong>Understand</strong><small>Visual diagrams</small></div>
            <span className="dashboard-workflow-arrow">→</span>
            <div><span>04</span><strong>Practice</strong><small>Quizzes & results</small></div>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>SECOND BRAIN</span>
          <span>LEARN · UNDERSTAND · REMEMBER</span>
          <span>© 2026</span>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;

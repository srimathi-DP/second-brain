import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const MATERIALS_API = "https://second-brain-pl1v.onrender.com/api/materials";

function readUser() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user && typeof user === "object" ? user : {};
  } catch {
    return {};
  }
}

function readCount(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value.length;
    if (Array.isArray(value?.items)) return value.items.length;
    return 0;
  } catch {
    return 0;
  }
}

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "SB";

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function Profile() {
  const [user, setUser] = useState(readUser);
  const [nameInput, setNameInput] = useState(() => readUser().name || "");
  const [materialsCount, setMaterialsCount] = useState(0);
  const [message, setMessage] = useState("");

  const notesCount = readCount("second-brain-notes");
  const summariesCount = readCount("second-brain-summaries");
  const quizzesCount = readCount("second-brain-quizzes");
  const flowchartsCount = Math.max(
    readCount("second-brain-flowcharts"),
    readCount("second-brain-diagrams")
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMaterialsCount() {
      try {
        const response = await fetch(MATERIALS_API);
        if (!response.ok) return;

        const data = await response.json();
        if (!cancelled && Array.isArray(data)) {
          setMaterialsCount(data.length);
        }
      } catch {
        // Keep the profile usable if the materials server is offline.
      }
    }

    loadMaterialsCount();

    return () => {
      cancelled = true;
    };
  }, []);

  function saveProfile(event) {
    event.preventDefault();

    const name = nameInput.trim();

    if (!name) {
      setMessage("Enter a name before saving.");
      return;
    }

    const updatedUser = { ...user, name };

    try {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setNameInput(name);
      setMessage("Profile name saved.");
    } catch {
      setMessage("Could not save your profile in this browser.");
    }
  }

  const stats = [
    { label: "Materials", value: materialsCount, path: "/materials" },
    { label: "Notes", value: notesCount, path: "/notes" },
    { label: "Summaries", value: summariesCount, path: "/summaries" },
    { label: "Quizzes", value: quizzesCount, path: "/quiz" },
    { label: "Flowcharts", value: flowchartsCount, path: "/diagrams" },
  ];

  return (
    <div className="profile-page">
      <style>{`
        .profile-page {
          position: relative;
          z-index: 1;
          min-width: 0;
          padding: 36px clamp(20px, 5vw, 64px);
          color: #f5f0e8;
        }

        .profile-header { margin-bottom: 28px; }

        .profile-eyebrow {
          color: #f04438;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .profile-header h1 {
          margin: 14px 0;
          color: #f4f4f4;
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(38px, 5vw, 62px);
          line-height: 1.05;
          letter-spacing: -2px;
        }

        .profile-header h1 span { color: #f04438; }

        .profile-header p,
        .profile-muted {
          color: #b7aea5;
          line-height: 1.7;
        }

        .profile-card {
          margin-bottom: 22px;
          padding: 24px;
          border: 1px solid #393939;
          background: rgba(28, 28, 28, .94);
        }

        .profile-person {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 24px;
          padding-bottom: 22px;
          border-bottom: 1px solid #393939;
        }

        .profile-avatar {
  display: flex;
  flex: 0 0 96px;
  width: 96px;
  height: 96px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #ff766b;
  border-radius: 50%;
  background: #141414;
}

.profile-avatar img {
  display: block;
  width: 82px;
  height: 82px;
  object-fit: contain;
}

        .profile-person h2 {
          margin: 0 0 5px;
          font-family: "Space Grotesk", sans-serif;
          overflow-wrap: anywhere;
        }

        .profile-person p {
          color: #aaa097;
          overflow-wrap: anywhere;
        }

        .profile-form {
          display: grid;
          gap: 12px;
          max-width: 620px;
        }

        .profile-form label {
          color: #c7bdb3;
          font-size: 10px;
          letter-spacing: 1.5px;
        }

        .profile-form input {
          box-sizing: border-box;
          width: 100%;
          min-height: 48px;
          padding: 12px;
          color: #f5f0e8;
          background: #141414;
          border: 1px solid #48413b;
          font: inherit;
        }

        .profile-form input[readonly] {
          color: #aaa097;
          cursor: not-allowed;
        }

        .profile-button {
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

        .profile-message {
          margin-top: 14px;
          color: #f5b2a9;
          line-height: 1.6;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .profile-stat {
          display: block;
          min-width: 0;
          padding: 18px;
          border: 1px solid #393939;
          background: rgba(20, 20, 20, .7);
          color: inherit;
          text-decoration: none;
          transition: border-color .18s ease, transform .18s ease;
        }

        .profile-stat:hover,
        .profile-stat:focus-visible {
          transform: translateY(-2px);
          border-color: #f04438;
          outline: none;
        }

        .profile-stat strong {
          display: block;
          margin-bottom: 8px;
          color: #ff766b;
          font-family: "Space Grotesk", sans-serif;
          font-size: 28px;
        }

        .profile-stat span {
          color: #b7aea5;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .profile-stat-hint {
          display: block;
          margin-top: 9px;
          color: #80776f;
          font-size: 10px;
        }

        @media (max-width: 800px) {
          .profile-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 600px) {
          .profile-page { padding: 24px 16px; }
          .profile-card { padding: 18px; }
          .profile-person { align-items: flex-start; }
        }
      `}</style>

      <header className="profile-header">
        <span className="profile-eyebrow">07 / YOUR ACCOUNT</span>
        <h1>
          Your space. <span>Your progress.</span>
        </h1>
        <p>Manage your profile and open your saved work.</p>
      </header>

      <section className="profile-card">
        <div className="profile-person">
          <div className="profile-avatar">
<img src="/second-brain-icon.png" alt="Second Brain icon" /></div>

          <div>
            <h2>{user.name || "Second Brain user"}</h2>
            <p>{user.email || "No email available"}</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={saveProfile}>
          <label htmlFor="profile-name">DISPLAY NAME</label>
          <input
            id="profile-name"
            type="text"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            maxLength={60}
            placeholder="Enter your name"
          />

          <label htmlFor="profile-email">EMAIL ADDRESS</label>
          <input
            id="profile-email"
            type="email"
            value={user.email || ""}
            readOnly
            placeholder="Email address"
          />

          <button className="profile-button" type="submit">
            SAVE PROFILE
          </button>
        </form>

        {message && (
          <p className="profile-message" role="status">
            {message}
          </p>
        )}
      </section>

      <section className="profile-card">
        <span className="profile-eyebrow">YOUR WORKSPACE</span>
        <h2
          style={{
            margin: "10px 0 8px",
            fontFamily: '"Space Grotesk", sans-serif',
          }}
        >
          Your saved work
        </h2>
        <p className="profile-muted" style={{ marginBottom: 18 }}>
          Select a category to open its saved items.
        </p>

        <div className="profile-stats">
          {stats.map((stat) => (
            <Link
              className="profile-stat"
              key={stat.label}
              to={stat.path}
              aria-label={`Open saved ${stat.label.toLowerCase()}: ${stat.value}`}
            >
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <small className="profile-stat-hint">OPEN SAVED ITEMS ↗</small>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
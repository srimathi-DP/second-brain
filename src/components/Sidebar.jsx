import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const menuItems = [
    { number: "01", name: "Dashboard", path: "/dashboard" },
    { number: "02", name: "Materials", path: "/materials" },
    { number: "03", name: "Notes", path: "/notes" },
    { number: "04", name: "Summaries", path: "/summaries" },
    { number: "05", name: "Diagrams", path: "/diagrams" },
    { number: "06", name: "Quiz", path: "/quiz" },
    { number: "07", name: "Results", path: "/results" },
    { number: "08", name: "Profile", path: "/profile" },
  ];

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/?auth=signin");
  }

  return (
    <aside className="sidebar">
      <button
        className="sidebar-logo"
        type="button"
        onClick={handleLogout}
        aria-label="Log out and return to sign in"
        title="Log out"
        style={{
          background: "transparent",
          borderTop: 0,
          borderRight: 0,
          borderLeft: 0,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <img src="/second-brain-logo.png" alt="Second Brain — log out" />
      </button>

      <nav className="sidebar-navigation">
        <div className="sidebar-section-label">WORKSPACE</div>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-number">{item.number}</span>
            <span className="sidebar-name">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-line" />

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>LOG OUT</span>
          <strong>→</strong>
        </button>

        <div className="sidebar-footer">
          <span>SECOND BRAIN</span>
          <span>© 2026</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import Notes from "./pages/Notes";
import Summaries from "./pages/Summaries";
import Diagrams from "./pages/Diagrams";
import Quiz from "./pages/Quiz";
import ERDiagram from "./pages/ERDiagram";
import Profile from "./pages/Profile";

function AppRouter() {
  return (
    <BrowserRouter>
      <div className="second-brain-app">
        <div className="sb-global-curves" aria-hidden="true">
          <svg viewBox="0 0 1200 900" preserveAspectRatio="none">
            <path d="M0 190 C140 110 200 320 340 270 S540 100 680 150 S830 340 970 320 S1100 190 1200 240" />
            <path d="M0 530 C130 520 180 680 300 600 C430 540 480 470 590 490 C720 510 760 640 850 680 C960 725 1040 645 1200 590" />
          </svg>
        </div>

        <Sidebar />

        <main className="second-brain-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/summaries" element={<Summaries />} />
            <Route path="/diagrams" element={<Diagrams />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route
              path="/results"
              element={<Navigate to="/quiz" replace />}
            />
            <Route path="/er-diagram" element={<ERDiagram />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default AppRouter;
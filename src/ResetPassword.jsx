import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://second-brain-pl1v.onrender.com";

export default function ResetPassword({ onDone }) {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      setMessage(data.message || "Password reset failed.");
      if (response.ok) {
        window.history.replaceState({}, "", "/?auth=signin");
        setTimeout(onDone, 1200);
      }
    } catch {
      setMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1>Choose a new password</h1>
      {!token ? (
        <p>This reset link is missing its token. Request a new one.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save new password"}
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </main>
  );
}
import { useState } from "react";
import "./App.css";

export default function SignIn({ onRegister, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignIn(event) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://second-brain-pl1v.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.message || "Sign in failed. Check your details.");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setMessage(`Welcome back${data.user?.name ? `, ${data.user.name}` : ""}!`);

      window.setTimeout(() => {
        if (onLogin) {
          onLogin();
        } else {
          window.location.assign("/dashboard");
        }
      }, 500);
    } catch {
      setMessage("Cannot connect to the server. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessage("Enter your email address first.");
      document.getElementById("signin-email")?.focus();
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch(
"https://second-brain-pl1v.onrender.com/api/auth/forgot-password",        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(
          data.message ||
            "Password reset is not available. The backend reset endpoint may not be set up."
        );
        return;
      }

      setMessage(
        data.message ||
          "If an account exists for that email, password reset instructions have been sent."
      );
    } catch {
      setMessage(
        "Cannot connect to the server. Check that the backend is running."
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="sb-login-page">
      <style>{`
        .sb-login-page {
          box-sizing: border-box;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #f5f0e8;
          background: #242424;
          font-family: "DM Sans", sans-serif;
        }

        .sb-login-page *,
        .sb-login-page *::before,
        .sb-login-page *::after {
          box-sizing: border-box;
        }

        .sb-login-header {
          width: 100%;
          min-height: 100px;
          padding: 18px clamp(20px, 5vw, 64px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, .08);
        }

        .sb-login-brand {
          display: block;
          width: 220px;
          max-width: 48vw;
          height: auto;
          object-fit: contain;
        }

        .sb-login-create {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          color: #aaa097;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .sb-login-page button {
          font: inherit;
          cursor: pointer;
        }

        .sb-login-create button {
          min-height: 40px;
          padding: 0 16px;
          color: #f5f0e8;
          background: transparent;
          border: 1px solid #514841;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .sb-login-create button:hover {
          color: #ff766b;
          border-color: #f04438;
        }

        .sb-login-main {
          flex: 1;
          width: 100%;
          padding: 34px 20px;
          display: grid;
          place-items: center;
        }

        .sb-login-card {
          position: relative;
          width: min(100%, 520px);
          padding: clamp(22px, 5vw, 38px);
          background: #202020;
          border: 1px solid #363636;
          box-shadow: 0 20px 60px rgba(0, 0, 0, .25);
        }

        .sb-login-card::before {
          position: absolute;
          top: 38px;
          bottom: 38px;
          left: -1px;
          width: 4px;
          background: #f04438;
          content: "";
        }

        .sb-login-title {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-bottom: 24px;
          border-bottom: 1px solid #363636;
        }

        .sb-login-icon {
          flex: 0 0 120px;
          width: 120px;
          height: 120px;
          object-fit: contain;
          background: #141414;
        }

        .sb-login-eyebrow {
          margin: 0 0 10px;
          color: #f04438;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .sb-login-title h1 {
          margin: 0;
          color: #f4f4f4;
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(27px, 4vw, 36px);
          line-height: 1.08;
          letter-spacing: -1px;
        }

        .sb-login-form {
          display: grid;
          gap: 18px;
          padding-top: 24px;
        }

        .sb-login-field label {
          display: block;
          margin-bottom: 8px;
          color: #f4f4f4;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .sb-login-field input {
          width: 100%;
          height: 48px;
          padding: 0 14px;
          color: #fff;
          background: #181818;
          border: 1px solid #3a3a3a;
          outline: none;
          font: inherit;
        }

        .sb-login-field input:focus {
          border-color: #f04438;
        }

        .sb-login-password {
          position: relative;
        }

        .sb-login-password input {
          padding-right: 74px;
        }

        .sb-login-show {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          padding: 6px;
          color: #aaa097;
          background: transparent;
          border: 0;
          font-size: 9px !important;
          font-weight: 700 !important;
          letter-spacing: 1px;
        }

        .sb-login-forgot {
          justify-self: end;
          margin-top: -10px;
          padding: 0;
          color: #aaa097;
          background: transparent;
          border: 0;
          font-size: 11px !important;
        }

        .sb-login-forgot:hover {
          color: #ff766b;
        }

        .sb-login-forgot:disabled {
          opacity: .65;
          cursor: wait;
        }

        .sb-login-submit {
          min-height: 50px;
          padding: 12px 16px;
          color: #fff;
          background: #f04438;
          border: 1px solid #f04438;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 1.5px;
        }

        .sb-login-submit:hover:not(:disabled) {
          background: #d9362c;
        }

        .sb-login-submit:disabled {
          opacity: .65;
          cursor: wait;
        }

        .sb-login-message {
          margin: 0;
          color: #f5b2a9;
          font-size: 13px;
          line-height: 1.5;
        }

        .sb-login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #80776f;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .sb-login-divider::before,
        .sb-login-divider::after {
          flex: 1;
          height: 1px;
          background: #363636;
          content: "";
        }

        .sb-login-google {
          min-height: 46px;
          color: #f4f4f4;
          background: #181818;
          border: 1px solid #3a3a3a;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 1px;
        }

        .sb-login-google:hover {
          border-color: #f04438;
        }

        .sb-login-register {
          margin: 2px 0 0;
          color: #aaa097;
          text-align: center;
          font-size: 12px;
        }

        .sb-login-register button {
          padding: 0;
          color: #ff766b;
          background: transparent;
          border: 0;
          font-size: inherit !important;
        }

        .sb-login-footer {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 18px clamp(20px, 5vw, 64px);
          border-top: 1px solid rgba(255, 255, 255, .08);
          color: #77716b;
          font-size: 8px;
          letter-spacing: 1px;
        }

        @media (max-width: 520px) {
          .sb-login-header {
            min-height: 82px;
            padding: 14px 16px;
          }

          .sb-login-brand {
            width: 170px;
          }

          .sb-login-create {
            gap: 8px;
            font-size: 8px;
          }

          .sb-login-create button {
            min-height: 36px;
            padding: 0 9px;
            font-size: 8px;
          }

          .sb-login-title {
            align-items: flex-start;
            gap: 14px;
          }

          .sb-login-icon {
            flex-basis: 82px;
            width: 82px;
            height: 82px;
          }

          .sb-login-footer span:nth-child(2) {
            display: none;
          }
        }
      `}</style>

      <header className="sb-login-header">
        <img
          src="/second-brain-logo.png"
          alt="Second Brain"
          className="sb-login-brand"
        />

        <div className="sb-login-create">
          <span>NEW TO SECOND BRAIN?</span>
          <button type="button" onClick={onRegister}>
            CREATE ACCOUNT
          </button>
        </div>
      </header>

      <main className="sb-login-main">
        <section className="sb-login-card">
          <div className="sb-login-title">
            <img
              src="/second-brain-icon.png"
              alt="Second Brain icon"
              className="sb-login-icon"
            />
            <div>
              <p className="sb-login-eyebrow">WELCOME BACK</p>
              <h1>
                Sign in to
                <br />
                your Second Brain.
              </h1>
            </div>
          </div>

          <form className="sb-login-form" onSubmit={handleSignIn}>
            <div className="sb-login-field">
              <label htmlFor="signin-email">EMAIL</label>
              <input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="sb-login-field">
              <label htmlFor="signin-password">PASSWORD</label>
              <div className="sb-login-password">
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="sb-login-show"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              className="sb-login-forgot"
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? "Sending reset link…" : "Forgot password?"}
            </button>

            <button
              className="sb-login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "SIGNING IN…" : "SIGN IN"}
            </button>

            {message && (
              <p className="sb-login-message" role="status">
                {message}
              </p>
            )}

            <div className="sb-login-divider">OR</div>

            <button
              className="sb-login-google"
              type="button"
              onClick={() => setMessage("Google sign-in is not connected yet.")}
            >
              CONTINUE WITH GOOGLE
            </button>

            <p className="sb-login-register">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={onRegister}>
                Create account
              </button>
            </p>
          </form>
        </section>
      </main>

      <footer className="sb-login-footer">
        <span>SECOND BRAIN</span>
        <span>LEARN · UNDERSTAND · REMEMBER</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}
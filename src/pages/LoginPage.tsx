import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset password modal
  const [showReset, setShowReset] = useState(false);
  const [resetForm, setResetForm] = useState({
    username: "",
    resetKey: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  function openReset() {
    setResetForm({ username: "", resetKey: "", newPassword: "", confirmPassword: "" });
    setResetError(null);
    setResetSuccess(null);
    setShowReset(true);
  }

  async function onResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await api.post("/auth/reset-admin", {
        username: resetForm.username,
        resetKey: resetForm.resetKey,
        newPassword: resetForm.newPassword,
      });
      setResetSuccess(res.data.message ?? "Password reset successfully.");
    } catch (err: any) {
      setResetError(err?.response?.data?.message ?? "Reset failed.");
    } finally {
      setResetLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Login | Conglomerate";
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(form);
      navigate("/");
    } catch {
      setError("Login failed. Check username/password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>Conglomerate Access</h1>
        <p>Members only. Sign in with your assigned username and password.</p>
        <label>
          Username
          <input
            required
            value={form.username}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, username: e.target.value }))
            }
          />
        </label>
        <label>
          Password
          <div className="password-input-wrap">
            <input
              required
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading && <span className="activity-spinner" aria-hidden="true" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button
          type="button"
          className="ghost-btn"
          style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}
          onClick={openReset}
        >
          Forgot / reset admin password
        </button>
      </form>

      {showReset && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReset(false); }}
        >
          <form
            className="card"
            style={{
              minWidth: 320,
              maxWidth: 420,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
            onSubmit={onResetSubmit}
          >
            <h2>Reset Admin Password</h2>
            <p style={{ fontSize: "0.85rem" }}>
              Enter your admin username and the admin reset key to set a new password.
            </p>
            <label>
              Admin Username
              <input
                required
                autoComplete="username"
                value={resetForm.username}
                disabled={resetLoading || !!resetSuccess}
                onChange={(e) => setResetForm((p) => ({ ...p, username: e.target.value }))}
              />
            </label>
            <label>
              Reset Key
              <input
                required
                type="password"
                autoComplete="off"
                value={resetForm.resetKey}
                disabled={resetLoading || !!resetSuccess}
                onChange={(e) => setResetForm((p) => ({ ...p, resetKey: e.target.value }))}
              />
            </label>
            <label>
              New Password
              <div className="password-input-wrap">
                <input
                  required
                  type={showResetPassword ? "text" : "password"}
                  minLength={8}
                  autoComplete="new-password"
                  value={resetForm.newPassword}
                  disabled={resetLoading || !!resetSuccess}
                  onChange={(e) => setResetForm((p) => ({ ...p, newPassword: e.target.value }))}
                />
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setShowResetPassword((v) => !v)}
                >
                  {showResetPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <label>
              Confirm New Password
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={resetForm.confirmPassword}
                disabled={resetLoading || !!resetSuccess}
                onChange={(e) => setResetForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            </label>
            {resetError && <p className="error-text">{resetError}</p>}
            {resetSuccess && <p style={{ color: "var(--accent)" }}>{resetSuccess}</p>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {!resetSuccess && (
                <button type="submit" className="primary-btn" disabled={resetLoading} style={{ flex: 1 }}>
                  {resetLoading && <span className="activity-spinner" aria-hidden="true" />}
                  {resetLoading ? "Resetting…" : "Reset Password"}
                </button>
              )}
              <button
                type="button"
                className="ghost-btn"
                style={{ flex: 1 }}
                onClick={() => setShowReset(false)}
              >
                {resetSuccess ? "Close" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

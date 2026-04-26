import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function AccountPage() {
  const { user, updateUser } = useAuth();
  const [usernameForm, setUsernameForm] = useState({
    newUsername: user?.username ?? "",
    currentPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showUsernameCurrentPassword, setShowUsernameCurrentPassword] =
    useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function submitUsername(event: React.FormEvent) {
    event.preventDefault();
    setUsernameError(null);
    setUsernameMessage(null);

    try {
      const response = await api.patch("/auth/me/username", usernameForm);
      updateUser(response.data);
      setUsernameMessage("Username updated successfully.");
      setUsernameForm((prev) => ({ ...prev, currentPassword: "" }));
    } catch (error: any) {
      setUsernameError(
        error?.response?.data?.message ?? "Could not update username.",
      );
    }
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    try {
      const response = await api.patch("/auth/me/password", passwordForm);
      setPasswordMessage(response.data.message ?? "Password updated.");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (error: any) {
      setPasswordError(
        error?.response?.data?.message ?? "Could not update password.",
      );
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h2>Account Settings</h2>
        <p>Update your username and password here.</p>
      </section>

      <form className="card grid-form" onSubmit={submitUsername}>
        <h2>Change Username</h2>
        <label>
          New Username
          <small className="help-text">
            Choose a unique username for login.
          </small>
          <input
            required
            value={usernameForm.newUsername}
            onChange={(e) =>
              setUsernameForm((prev) => ({
                ...prev,
                newUsername: e.target.value,
              }))
            }
          />
        </label>
        <label>
          Current Password
          <small className="help-text">Required to confirm this change.</small>
          <div className="password-input-wrap">
            <input
              type={showUsernameCurrentPassword ? "text" : "password"}
              required
              value={usernameForm.currentPassword}
              onChange={(e) =>
                setUsernameForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
            />
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowUsernameCurrentPassword((value) => !value)}
            >
              {showUsernameCurrentPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <button className="primary-btn">Update Username</button>
        {usernameError ? <p className="error-text">{usernameError}</p> : null}
        {usernameMessage ? <p>{usernameMessage}</p> : null}
      </form>

      <form className="card grid-form" onSubmit={submitPassword}>
        <h2>Change Password</h2>
        <label>
          Current Password
          <small className="help-text">
            Enter your existing password first.
          </small>
          <div className="password-input-wrap">
            <input
              type={showCurrentPassword ? "text" : "password"}
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
            />
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowCurrentPassword((value) => !value)}
            >
              {showCurrentPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label>
          New Password
          <small className="help-text">Minimum 8 characters.</small>
          <div className="password-input-wrap">
            <input
              type={showNewPassword ? "text" : "password"}
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
            />
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowNewPassword((value) => !value)}
            >
              {showNewPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <button className="primary-btn">Update Password</button>
        {passwordError ? <p className="error-text">{passwordError}</p> : null}
        {passwordMessage ? <p>{passwordMessage}</p> : null}
      </form>
    </div>
  );
}

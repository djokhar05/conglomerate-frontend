import { useEffect, useState } from "react";
import { TablePagination } from "../components/TablePagination";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import type { Member } from "../types";

export function MembersPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const isAdmin = user?.role === "admin";
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    role: "member" as "admin" | "member",
    slots: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingFullName, setEditingFullName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isResettingMemberId, setIsResettingMemberId] = useState<string | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editError, setEditError] = useState<string | null>(null);

  function loadMembers() {
    api.get("/members").then((response) => setMembers(response.data));
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function addMember(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post("/members", form);
      setForm({ username: "", fullName: "", role: "member", slots: 1 });
      await loadMembers();
      const credentials = response.data.credentials;
      showSuccess(
        `Member created. Username: ${credentials.username}, temp password: ${credentials.temporaryPassword}`,
      );
      setIsCreateOpen(false);
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.message ?? "Unable to create member.";
      setError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(member: Member) {
    setEditingMemberId(member._id);
    setEditingFullName(member.fullName);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingMemberId(null);
    setEditingFullName("");
    setEditError(null);
  }

  async function saveFullName(memberId: string) {
    setIsSavingEdit(true);
    setEditError(null);

    try {
      await api.patch(`/members/${memberId}`, { fullName: editingFullName });
      await loadMembers();
      cancelEdit();
      showSuccess("Member name updated.");
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.message ?? "Unable to update full name.";
      setEditError(message);
      showError(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function resetMemberPassword(member: Member) {
    setIsResettingMemberId(member._id);
    try {
      const response = await api.post(`/members/${member._id}/reset-password`);
      const credentials = response.data?.credentials;
      showSuccess(
        `Password reset for ${member.fullName}. Temp password: ${credentials?.temporaryPassword}`,
      );
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.message ?? "Unable to reset password.";
      showError(message);
    } finally {
      setIsResettingMemberId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(members.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedMembers = members.slice(startIndex, startIndex + pageSize);

  return (
    <div className="stack">
      {isAdmin ? (
        isCreateOpen ? (
          <form
            className="card grid-form member-create-form"
            onSubmit={addMember}
          >
            <h2>Add Member</h2>
            <label>
              Username
              <small className="help-text">
                This is used for login. Use letters/numbers only.
              </small>
              <input
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                required
              />
            </label>
            <label>
              Full Name
              <small className="help-text">
                Person's real name for reports and payment records.
              </small>
              <input
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                required
              />
            </label>
            <label>
              Role
              <small className="help-text">
                Admin can manage data. Member has limited access.
              </small>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value as "admin" | "member",
                  }))
                }
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Slots
              <small className="help-text">
                Used for proportional year-end profit sharing.
              </small>
              <input
                type="number"
                min={1}
                max={10}
                value={form.slots}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    slots: Number(e.target.value),
                  }))
                }
                required
              />
            </label>
            <div className="member-create-actions">
              <button className="primary-btn btn-fit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Member"}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setIsCreateOpen(false);
                  setError(null);
                }}
              >
                Close
              </button>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
          </form>
        ) : (
          <section className="card">
            <h2>Member Management</h2>
            <p style={{ marginBottom: "10px" }}>
              Click below to add a new member.
            </p>
            <button
              type="button"
              className="primary-btn btn-fit"
              onClick={() => {
                setIsCreateOpen(true);
                setError(null);
              }}
            >
              Add Member
            </button>
          </section>
        )
      ) : (
        <section className="card">
          <h2>Member Management</h2>
          <p>Only admins can create or update members.</p>
        </section>
      )}

      <section className="card">
        <h2>Members and Slots</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Slots</th>
                <th>Status</th>
                {isAdmin ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((member) => (
                <tr key={member._id}>
                  <td>{member.username}</td>
                  <td>
                    {editingMemberId === member._id ? (
                      <input
                        value={editingFullName}
                        onChange={(e) => setEditingFullName(e.target.value)}
                        minLength={2}
                        maxLength={150}
                      />
                    ) : (
                      member.fullName
                    )}
                  </td>
                  <td>{member.role}</td>
                  <td>{member.slots}</td>
                  <td>{member.active ? "Active" : "Inactive"}</td>
                  {isAdmin ? (
                    <td>
                      {editingMemberId === member._id ? (
                        <>
                          <button
                            className="primary-btn"
                            type="button"
                            disabled={
                              isSavingEdit || editingFullName.trim().length < 2
                            }
                            onClick={() => saveFullName(member._id)}
                          >
                            {isSavingEdit ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="ghost-btn"
                            type="button"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <div className="table-action-row">
                          <button
                            className="ghost-btn"
                            type="button"
                            onClick={() => startEdit(member)}
                          >
                            Edit Name
                          </button>
                          <button
                            className="ghost-btn"
                            type="button"
                            onClick={() => resetMemberPassword(member)}
                            disabled={isResettingMemberId === member._id}
                          >
                            {isResettingMemberId === member._id
                              ? "Resetting..."
                              : "Reset Password"}
                          </button>
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={members.length}
          pageSize={pageSize}
          onPageChange={(nextPage) =>
            setPage(Math.min(Math.max(1, nextPage), totalPages))
          }
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
        {editError ? <p className="error-text">{editError}</p> : null}
      </section>
    </div>
  );
}

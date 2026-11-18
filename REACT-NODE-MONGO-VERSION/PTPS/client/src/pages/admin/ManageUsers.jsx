import { useState, useEffect, useCallback } from "react";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { useAuth } from "../../hooks/useAuth.js";

// Manage Users page - admin can view and activate/deactivate users
export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  // useCallback for reusable fetch function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users?role=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle user status (activate or deactivate)
  async function toggleStatus(userId, newStatus) {
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`User ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
        fetchUsers();
      } else {
        setMessage(data.message || "Failed to update status");
      }
    } catch (err) {
      setMessage("Server error");
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">User Management</p>
          <h1>Manage Users</h1>
          <p>Activate accounts and keep municipal access up to date.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>All Users</button>
        <button className={filter === "citizen" ? "selected" : ""} onClick={() => setFilter("citizen")}>Citizens</button>
        <button className={filter === "officer" ? "selected" : ""} onClick={() => setFilter("officer")}>Officers</button>
        <button className={filter === "admin" ? "selected" : ""} onClick={() => setFilter("admin")}>Admins</button>
      </div>

      {message && <div className="notice success" style={{ marginBottom: "16px" }}>{message}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td><b>{u.name}</b></td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>
                    {/* Admin cannot deactivate their own account */}
                    {u._id === currentUser.id ? (
                      <span className="muted">This is you</span>
                    ) : u.status === "active" ? (
                      <button className="small-button danger" onClick={() => toggleStatus(u._id, "inactive")}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="small-button primary" onClick={() => toggleStatus(u._id, "active")}>
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

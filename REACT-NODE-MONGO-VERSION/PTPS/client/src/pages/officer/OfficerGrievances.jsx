import { useState, useEffect, useCallback } from "react";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Check, FileText } from "lucide-react";

// Officer Grievances page - officer updates status and resolution of assigned grievances
export default function OfficerGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [resolution, setResolution] = useState("");

  // useCallback for reusable fetch function
  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/officer/grievances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGrievances(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  // Update grievance status and resolution
  async function handleUpdate(id, newStatus, resolutionText) {
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const body = { status: newStatus };
      if (resolutionText !== undefined) body.resolution = resolutionText;
      const res = await fetch(`/api/officer/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Grievance updated successfully!");
        setEditingId(null);
        setResolution("");
        fetchGrievances();
      } else {
        setMessage(data.message || "Failed to update grievance");
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
          <p className="eyebrow">Griance Management</p>
          <h1>Assigned Grievances</h1>
          <p>Resolve citizen requests assigned to your ward.</p>
        </div>
      </div>

      {message && <div className="notice success" style={{ marginBottom: "16px" }}>{message}</div>}

      <Panel title="Grievance Cases" eyebrow={`${grievances.length} assigned`}>
        {grievances.length === 0 ? (
          <div className="empty-state">
            <p>No grievances assigned to you.</p>
          </div>
        ) : (
          <div className="grievance-list">
            {grievances.map((g) => (
              <div key={g._id} style={{ border: "1px solid var(--line)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <span className="case-icon"><FileText size={18} /></span>
                  <div style={{ flex: 1 }}>
                    <b>{g.subject}</b>
                    <small style={{ display: "block" }}>
                      Citizen: {g.citizenName} | Property: {g.tenementNumber} | Filed: {new Date(g.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: "8px 0" }}>{g.description}</p>
                {g.resolution && (
                  <p style={{ fontSize: "13px", color: "var(--green)", margin: "8px 0" }}>
                    <b>Resolution:</b> {g.resolution}
                  </p>
                )}

                {/* Show update controls for unresolved grievances */}
                {g.status !== "resolved" && (
                  <div style={{ marginTop: "12px" }}>
                    {editingId === g._id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Add a resolution note..."
                          rows="3"
                          style={{ padding: "10px", border: "1.5px solid var(--line)", borderRadius: "10px", fontFamily: "inherit", fontSize: "13.5px" }}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="small-button primary" onClick={() => handleUpdate(g._id, "in_progress", resolution)}>
                            Mark In Progress
                          </button>
                          <button className="small-button primary" onClick={() => handleUpdate(g._id, "resolved", resolution)}>
                            Mark Resolved
                          </button>
                          <button className="small-button" onClick={() => { setEditingId(null); setResolution(""); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="small-button" onClick={() => { setEditingId(g._id); setResolution(g.resolution || ""); }}>
                        Update Grievance
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

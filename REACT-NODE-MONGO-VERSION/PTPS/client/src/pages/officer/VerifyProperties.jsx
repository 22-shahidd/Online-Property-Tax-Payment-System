import { useState, useEffect, useCallback } from "react";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Check, X } from "lucide-react";

// Verify Properties page - officer reviews and verifies/rejects pending properties
export default function VerifyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // useCallback for reusable fetch function
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/officer/properties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Verify a property
  async function handleVerify(id) {
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/officer/properties/${id}/verify`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Property verified successfully!");
        fetchProperties();
      } else {
        setMessage(data.message || "Failed to verify property");
      }
    } catch (err) {
      setMessage("Server error");
    }
  }

  // Reject a property
  async function handleReject(id) {
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/officer/properties/${id}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Property rejected.");
        fetchProperties();
      } else {
        setMessage(data.message || "Failed to reject property");
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
          <p className="eyebrow">Property Verification</p>
          <h1>Verify Properties</h1>
          <p>Review pending property applications assigned to your ward.</p>
        </div>
      </div>

      {message && <div className="notice success" style={{ marginBottom: "16px" }}>{message}</div>}

      <Panel title="Pending Applications" eyebrow={`${properties.length} records`}>
        {properties.length === 0 ? (
          <div className="empty-state">
            <p>No pending properties to verify. All caught up!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tenement Number</th>
                  <th>Owner</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Area</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p._id}>
                    <td><b>{p.tenementNumber}</b></td>
                    <td>{p.ownerName}</td>
                    <td>{p.address}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.propertyType}</td>
                    <td>{p.area.toLocaleString()} sq ft</td>
                    <td>{p.constructionYear}</td>
                    <td>
                      <div className="row-actions">
                        <button className="small-button primary" onClick={() => handleVerify(p._id)}>
                          <Check size={14} /> Verify
                        </button>
                        <button className="small-button danger" onClick={() => handleReject(p._id)}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

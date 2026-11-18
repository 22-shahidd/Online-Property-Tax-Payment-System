import { useState, useEffect, useReducer } from "react";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Check, ArrowRight, FileText } from "lucide-react";

// Grievances page - citizen submits and tracks grievances
// Uses useReducer for the grievance form state (syllabus requirement)
function grievanceReducer(state, action) {
  if (action.type === "SET_FIELD") {
    return { ...state, [action.field]: action.value };
  }
  if (action.type === "RESET") {
    return { propertyId: "", subject: "", description: "" };
  }
  return state;
}

export default function Grievances() {
  const [grievances, setGrievances] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // useReducer for the grievance form
  const [form, dispatch] = useReducer(grievanceReducer, {
    propertyId: "",
    subject: "",
    description: "",
  });

  // Load grievances and properties on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const [grievRes, propRes] = await Promise.all([
          fetch("/api/citizen/grievances", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/citizen/properties", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setGrievances(await grievRes.json());
        setProperties(await propRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleFieldChange(e) {
    dispatch({ type: "SET_FIELD", field: e.target.name, value: e.target.value });
  }

  // Submit a new grievance
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/citizen/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Grievance submitted successfully!");
        dispatch({ type: "RESET" });
        // Refresh grievances
        const grievRes = await fetch("/api/citizen/grievances", { headers: { Authorization: `Bearer ${token}` } });
        setGrievances(await grievRes.json());
      } else {
        setMessage(data.message || "Failed to submit grievance");
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
          <p className="eyebrow">Citizen Support</p>
          <h1>My Grievances</h1>
          <p>Raise a service request and track its resolution.</p>
        </div>
      </div>

      <div className="content-grid wide-left">
        {/* Grievance list */}
        <Panel title="Submitted Grievances" eyebrow="Case register">
          {grievances.length === 0 ? (
            <div className="empty-state">
              <p>No grievances submitted yet.</p>
            </div>
          ) : (
            <div className="grievance-list">
              {grievances.map((g) => (
                <div className="grievance" key={g._id}>
                  <span className="case-icon"><FileText size={18} /></span>
                  <div>
                    <b>{g.subject}</b>
                    <small>
                      {g.propertyId ? g.propertyId.tenementNumber : "N/A"} | Filed: {new Date(g.createdAt).toLocaleDateString()}
                    </small>
                    {g.resolution && <small style={{ display: "block" }}>Resolution: {g.resolution}</small>}
                  </div>
                  <StatusBadge status={g.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Submit form */}
        <Panel title="Submit a Grievance" eyebrow="New request">
          <form className="simple-form" onSubmit={handleSubmit}>
            <label className="form-label">
              Property
              <select name="propertyId" value={form.propertyId} onChange={handleFieldChange} required>
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>{p.tenementNumber} - {p.address}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Subject
              <input name="subject" value={form.subject} onChange={handleFieldChange} placeholder="Briefly describe your issue" required />
            </label>
            <label className="form-label">
              Description
              <textarea name="description" value={form.description} onChange={handleFieldChange} placeholder="Add details that can help the officer resolve this request" rows="4" required />
            </label>
            {message && <div className="notice success"><Check size={16} /> {message}</div>}
            <button className="primary-button" type="submit">
              Submit Grievance <ArrowRight size={16} />
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}

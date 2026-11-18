import { useState, useEffect } from "react";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { Check } from "lucide-react";

// Add Officer page - admin creates new officer accounts and assigns them to wards
export default function AddOfficer() {
  const [wards, setWards] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", wardId: "" });
  const [message, setMessage] = useState("");

  // Load wards and existing officers on mount
  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token");
      const [wardRes, officerRes] = await Promise.all([
        fetch("/api/admin/wards", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/officers", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const wardData = await wardRes.json();
      const officerData = await officerRes.json();
      setWards(wardData);
      setOfficers(officerData);
    }
    fetchData();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Create a new officer
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Officer created successfully!");
        setForm({ name: "", email: "", phone: "", password: "", wardId: "" });
        // Refresh officer list
        const officerRes = await fetch("/api/admin/officers", { headers: { Authorization: `Bearer ${token}` } });
        setOfficers(await officerRes.json());
      } else {
        setMessage(data.message || "Failed to create officer");
      }
    } catch (err) {
      setMessage("Server error");
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Team Management</p>
          <h1>Add Officer</h1>
          <p>Create a ward officer account and assign their area of responsibility.</p>
        </div>
      </div>

      <Panel title="Officer Details" eyebrow="New team member">
        <form className="simple-form two-col" onSubmit={handleSubmit}>
          <label className="form-label">
            Full Name
            <input name="name" value={form.name} onChange={handleChange} placeholder="Officer full name" required />
          </label>
          <label className="form-label">
            Email Address
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="officer@nagarpalika.gov" required />
          </label>
          <label className="form-label">
            Phone Number
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit phone number" required />
          </label>
          <label className="form-label">
            Assigned Ward
            <select name="wardId" value={form.wardId} onChange={handleChange} required>
              <option value="">Select ward</option>
              {wards.map((w) => (
                <option key={w._id} value={w._id}>Ward {w.wardNumber} - {w.zone}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Create temporary password" required />
          </label>
          <div className="form-end">
            <button className="primary-button" type="submit">Create Officer</button>
          </div>
        </form>
        {message && <div className="notice success" style={{ marginTop: "14px" }}><Check size={16} /> {message}</div>}
      </Panel>

      {/* Existing officers table */}
      <Panel title="Existing Officers" eyebrow={`${officers.length} officers`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Assigned Ward</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>No officers yet</td></tr>
              ) : (
                officers.map((o) => (
                  <tr key={o._id}>
                    <td><b>{o.name}</b></td>
                    <td>{o.email}</td>
                    <td>{o.phone}</td>
                    <td>{o.ward}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

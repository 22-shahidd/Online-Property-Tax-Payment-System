import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Panel from "../../components/Panel.jsx";
import { Check, ArrowRight } from "lucide-react";

// Add Property page - citizen registers a new property
export default function AddProperty() {
  const navigate = useNavigate();
  const [wards, setWards] = useState([]);
  const [form, setForm] = useState({
    tenementNumber: "",
    wardId: "",
    address: "",
    area: "",
    propertyType: "",
    constructionYear: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load wards for the dropdown
  useEffect(() => {
    async function fetchWards() {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/citizen/wards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWards(await res.json());
    }
    fetchWards();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Frontend validation
    const currentYear = new Date().getFullYear();
    if (!form.tenementNumber || !form.wardId || !form.address || !form.area || !form.propertyType || !form.constructionYear) {
      setError("All fields are required");
      return;
    }
    if (parseFloat(form.area) <= 0) {
      setError("Area must be greater than zero");
      return;
    }
    if (parseInt(form.constructionYear) > currentYear) {
      setError("Construction year cannot be in the future");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/citizen/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          area: parseFloat(form.area),
          constructionYear: parseInt(form.constructionYear),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Property registered successfully! Status: Pending verification.");
        setForm({ tenementNumber: "", wardId: "", address: "", area: "", propertyType: "", constructionYear: "" });
        setTimeout(() => navigate("/citizen/dashboard"), 2000);
      } else {
        setError(data.message || "Failed to register property");
      }
    } catch (err) {
      setError("Server error");
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Property Registration</p>
          <h1>Add Property</h1>
          <p>Register a new property for tax assessment.</p>
        </div>
      </div>

      <Panel title="Property Details" eyebrow="New property">
        <form className="simple-form two-col" onSubmit={handleSubmit}>
          <label className="form-label">
            Tenement Number
            <input name="tenementNumber" value={form.tenementNumber} onChange={handleChange} placeholder="e.g. NPM/04/1234" required />
          </label>
          <label className="form-label">
            Ward
            <select name="wardId" value={form.wardId} onChange={handleChange} required>
              <option value="">Select ward</option>
              {wards.map((w) => (
                <option key={w._id} value={w._id}>Ward {w.wardNumber} - {w.zone}</option>
              ))}
            </select>
          </label>
          <label className="form-label" style={{ gridColumn: "1 / -1" }}>
            Address
            <input name="address" value={form.address} onChange={handleChange} placeholder="Full property address" required />
          </label>
          <label className="form-label">
            Area (square feet)
            <input type="number" name="area" value={form.area} onChange={handleChange} placeholder="e.g. 1200" required />
          </label>
          <label className="form-label">
            Property Type
            <select name="propertyType" value={form.propertyType} onChange={handleChange} required>
              <option value="">Select type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </label>
          <label className="form-label">
            Construction Year
            <input type="number" name="constructionYear" value={form.constructionYear} onChange={handleChange} placeholder="e.g. 2015" required />
          </label>
          <div className="form-end">
            <button className="primary-button" type="submit">
              Register Property <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {error && <div className="notice error" style={{ marginTop: "14px" }}>{error}</div>}
        {success && <div className="notice success" style={{ marginTop: "14px" }}><Check size={16} /> {success}</div>}
      </Panel>
    </>
  );
}

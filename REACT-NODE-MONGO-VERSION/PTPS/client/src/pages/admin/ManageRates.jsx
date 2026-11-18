import { useState, useEffect } from "react";
import Panel from "../../components/Panel.jsx";
import HelpPanel from "../../components/HelpPanel.jsx";
import { Check } from "lucide-react";

// Manage Tax Rates page - admin can edit the tax calculation rates
export default function ManageRates() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Load current rates on mount
  useEffect(() => {
    async function fetchRates() {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/rates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRates(data);
      setLoading(false);
    }
    fetchRates();
  }, []);

  // Handle input changes
  function handleChange(e) {
    setRates({ ...rates, [e.target.name]: parseFloat(e.target.value) });
  }

  // Save the updated rates
  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/rates", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(rates),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Rates updated successfully!");
      setRates(data.rates);
    } else {
      setMessage(data.message || "Failed to update rates");
    }
  }

  if (loading) return <p>Loading rates...</p>;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1>Manage Tax Rates</h1>
          <p>Edit the rates used for property tax calculations.</p>
        </div>
      </div>

      <div className="content-grid">
        <Panel title="Current Rate Configuration" eyebrow="Effective from 01 Apr 2025">
          <form className="rates-form" onSubmit={handleSave}>
            <label className="form-label">
              Base Rate (per sq ft)
              <input type="number" step="0.01" name="baseRate" value={rates.baseRate} onChange={handleChange} />
            </label>
            <label className="form-label">
              Residential Factor
              <input type="number" step="0.01" name="residentialFactor" value={rates.residentialFactor} onChange={handleChange} />
            </label>
            <label className="form-label">
              Commercial Factor
              <input type="number" step="0.01" name="commercialFactor" value={rates.commercialFactor} onChange={handleChange} />
            </label>
            <label className="form-label">
              Industrial Factor
              <input type="number" step="0.01" name="industrialFactor" value={rates.industrialFactor} onChange={handleChange} />
            </label>
            <label className="form-label">
              Rebate Percentage (%)
              <input type="number" step="0.01" name="rebatePercent" value={rates.rebatePercent} onChange={handleChange} />
            </label>
            <label className="form-label">
              Penalty Percentage (%)
              <input type="number" step="0.01" name="penaltyPercent" value={rates.penaltyPercent} onChange={handleChange} />
            </label>
            <label className="form-label">
              Penalty Cap (Rs)
              <input type="number" step="0.01" name="penaltyCap" value={rates.penaltyCap} onChange={handleChange} />
            </label>
            <button className="primary-button" type="submit">
              <Check size={16} /> Save Rate Changes
            </button>
          </form>
          {message && <div className="notice success" style={{ marginTop: "14px" }}><Check size={16} /> {message}</div>}
        </Panel>

        <HelpPanel />
      </div>
    </>
  );
}

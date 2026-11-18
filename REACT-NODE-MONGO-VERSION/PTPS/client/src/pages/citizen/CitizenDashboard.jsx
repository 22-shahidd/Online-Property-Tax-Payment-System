import { useState, useEffect, useCallback } from "react";
import StatsCard from "../../components/StatsCard.jsx";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Building2, ShieldCheck, CircleDollarSign, FileText } from "lucide-react";

// Citizen Dashboard - shows the citizen's own statistics and properties
export default function CitizenDashboard() {
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // useCallback for reusable fetch function
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [statsRes, propRes] = await Promise.all([
        fetch("/api/citizen/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/citizen/properties", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(await statsRes.json());
      setProperties(await propRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <LoadingState />;
  if (!stats) return <p>Failed to load dashboard.</p>;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">My Dashboard</p>
          <h1>Welcome back</h1>
          <p>Keep your property records and payments up to date.</p>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="stats-grid">
        <StatsCard label="My Properties" value={stats.myProperties} detail="Registered properties" icon={Building2} tone="blue" />
        <StatsCard label="Verified Properties" value={stats.verifiedProperties} detail="Ready for assessment" icon={ShieldCheck} tone="green" />
        <StatsCard label="Total Tax Due" value={`Rs ${stats.totalDue.toLocaleString()}`} detail="Unpaid taxes" icon={CircleDollarSign} tone="amber" />
        <StatsCard label="Open Grievances" value={stats.openGrievances} detail="Awaiting resolution" icon={FileText} tone="red" />
      </div>

      {/* Property table */}
      <Panel title="My Properties" eyebrow="Property overview">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tenement Number</th>
                <th>Address</th>
                <th>Ward</th>
                <th>Type</th>
                <th>Area</th>
                <th>Construction Year</th>
                <th>Status</th>
                <th>Tax Due</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: "center", color: "#64748b" }}>No properties registered yet</td></tr>
              ) : (
                properties.map((p) => (
                  <tr key={p._id}>
                    <td><b>{p.tenementNumber}</b></td>
                    <td>{p.address}</td>
                    <td>{p.ward}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.propertyType}</td>
                    <td>{p.area.toLocaleString()} sq ft</td>
                    <td>{p.constructionYear}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>{p.status === "verified" ? <strong>Rs {p.taxDue.toLocaleString()}</strong> : <span className="muted">N/A</span>}</td>
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

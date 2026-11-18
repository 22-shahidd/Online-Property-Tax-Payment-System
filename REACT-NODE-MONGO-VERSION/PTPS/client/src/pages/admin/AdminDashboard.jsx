import { useEffect, useState, useCallback } from "react";
import StatsCard from "../../components/StatsCard.jsx";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Users, Building2, CircleDollarSign, WalletCards, FileText, Receipt, ShieldCheck } from "lucide-react";

// Admin Dashboard - shows statistics and recent payments
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // useCallback for reusable fetch function
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect to load data on mount
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <LoadingState />;
  if (!data) return <p>Failed to load dashboard.</p>;

  return (
    <>
      <div className="page-heading">
        <div>
          {/* <p className="eyebrow">Tuesday, 18 June 2025 - Last synced 8:42 AM</p> */}
          <h1>Welcome, Admin</h1>
          <p>Here is what is happening across your municipality today.</p>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="stats-grid">
        <StatsCard label="Total Citizens" value={data.totalCitizens} detail="Registered accounts" icon={Users} tone="blue" />
        <StatsCard label="Total Properties" value={data.totalProperties} detail={`${data.pendingProperties} pending`} icon={Building2} tone="teal" />
        <StatsCard label="Total Collected" value={`Rs ${data.totalCollected.toLocaleString()}`} detail="All payments" icon={CircleDollarSign} tone="green" />
        <StatsCard label="Outstanding" value={`Rs ${data.outstanding.toLocaleString()}`} detail="Unpaid taxes" icon={WalletCards} tone="amber" />
        <StatsCard label="Verified Properties" value={data.verifiedProperties} detail="Ready for tax" icon={ShieldCheck} tone="green" />
        <StatsCard label="Pending Properties" value={data.pendingProperties} detail="Awaiting review" icon={Building2} tone="amber" />
        <StatsCard label="Open Grievances" value={data.openGrievances} detail="Need attention" icon={FileText} tone="red" />
        <StatsCard label="Total Payments" value={data.totalPayments} detail="All time" icon={Receipt} tone="blue" />
      </div>

      {/* Recent payments table */}
      <Panel title="Recent Payments" eyebrow="Latest transactions">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Tenement Number</th>
                <th>Owner Name</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>
                    No payments yet
                  </td>
                </tr>
              ) : (
                data.recentPayments.map((p) => (
                  <tr key={p.receiptNumber}>
                    <td><b>{p.receiptNumber}</b></td>
                    <td>{p.tenementNumber}</td>
                    <td>{p.ownerName}</td>
                    <td><strong>Rs {p.amount.toLocaleString()}</strong></td>
                    <td><StatusBadge status={p.mode} /></td>
                    <td>{new Date(p.paidDate).toLocaleDateString()}</td>
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

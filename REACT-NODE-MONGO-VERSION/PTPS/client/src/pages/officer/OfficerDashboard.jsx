import { useState, useEffect, useCallback } from "react";
import StatsCard from "../../components/StatsCard.jsx";
import Panel from "../../components/Panel.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { ClipboardList, ShieldCheck, FileText, WalletCards } from "lucide-react";

// Officer Dashboard - shows statistics for the officer's assigned ward
export default function OfficerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/officer/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(await res.json());
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
  if (!data) return <p>Failed to load dashboard.</p>;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Officer Dashboard</p>
          <h1>Welcome, Officer</h1>
          <p>Review ward activity and keep citizen requests moving.</p>
        </div>
      </div>

      {/* Ward info banner */}
      {data.wardInfo && (
        <div className="notice" style={{ background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe", marginBottom: "20px" }}>
          <strong>Assigned Ward: {data.wardInfo}</strong>
        </div>
      )}

      {/* Statistics cards */}
      <div className="stats-grid">
        <StatsCard label="Pending Properties" value={data.pendingProperties} detail="Awaiting verification" icon={ClipboardList} tone="amber" />
        <StatsCard label="Verified Properties" value={data.verifiedProperties} detail="Approved by you" icon={ShieldCheck} tone="green" />
        <StatsCard label="Open Grievances" value={data.openGrievances} detail="Need attention" icon={FileText} tone="red" />
        <StatsCard label="Offline Payments" value={data.offlinePayments} detail={data.offlineTotal ? `Rs ${data.offlineTotal.toLocaleString()} collected` : "No payments"} icon={WalletCards} tone="blue" />
      </div>

      {/* Quick actions */}
      <Panel title="Ward Activity" eyebrow="Quick actions">
        <div className="queue-list">
          <div className="queue-item">
            <span className="mini-icon amber"><ClipboardList size={17} /></span>
            <div><b>Properties to verify</b><small>{data.pendingProperties} pending applications</small></div>
          </div>
          <div className="queue-item">
            <span className="mini-icon red"><FileText size={17} /></span>
            <div><b>Grievances assigned</b><small>{data.openGrievances} open cases</small></div>
          </div>
          <div className="queue-item">
            <span className="mini-icon green"><WalletCards size={17} /></span>
            <div><b>Collection this month</b><small>Rs {data.offlineTotal ? data.offlineTotal.toLocaleString() : 0} received</small></div>
          </div>
        </div>
      </Panel>
    </>
  );
}

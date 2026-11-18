import { useState, useEffect, useCallback } from "react";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Download } from "lucide-react";

// Payment Reports page - admin can filter, sort, and download payment records
export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("all");
  const [sort, setSort] = useState("newest");
  const [limit, setLimit] = useState(20);

  // useCallback for reusable fetch function
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/admin/reports?mode=${mode}&sort=${sort}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [mode, sort, limit]);

  // useEffect to load data when filters change
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Download a summary as a CSV file
  function downloadCSV() {
    if (!data || !data.payments) return;
    const headers = ["Receipt Number", "Property", "Owner", "Property Type", "Amount", "Mode", "Collected By", "Paid Date"];
    const rows = data.payments.map((p) => [
      p.receiptNumber,
      p.tenementNumber,
      p.ownerName,
      p.propertyType,
      p.amount,
      p.mode,
      p.collectedByName,
      new Date(p.paidDate).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payment_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Payment Reports</h1>
          <p>Filter, review, and download collection records across all wards.</p>
        </div>
        <button className="primary-button" onClick={downloadCSV}>
          <Download size={16} /> Download Summary
        </button>
      </div>

      <Panel title="Collection Register" eyebrow={`${data ? data.shownCount : 0} payments shown`}>
        {/* Filters */}
        <div className="toolbar">
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="all">All Payment Modes</option>
            <option value="online">Online Payments</option>
            <option value="offline">Offline Payments</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_high">Amount High to Low</option>
            <option value="amount_low">Amount Low to High</option>
          </select>
          <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}>
            <option value="20">20 Rows</option>
            <option value="50">50 Rows</option>
            <option value="100">100 Rows</option>
            <option value="200">200 Rows</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Property</th>
                <th>Owner</th>
                <th>Property Type</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Collected By</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: "center", color: "#64748b" }}>No payments found</td></tr>
              ) : (
                data.payments.map((p) => (
                  <tr key={p.receiptNumber}>
                    <td><b>{p.receiptNumber}</b></td>
                    <td>{p.tenementNumber}</td>
                    <td>{p.ownerName}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.propertyType}</td>
                    <td><strong>Rs {p.amount.toLocaleString()}</strong></td>
                    <td><StatusBadge status={p.mode} /></td>
                    <td>{p.collectedByName}</td>
                    <td>{new Date(p.paidDate).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ display: "flex", gap: "24px", marginTop: "16px", fontSize: "14px" }}>
          <span><b>Total Shown:</b> {data.shownCount}</span>
          <span><b>Grand Total:</b> Rs {data.grandTotal.toLocaleString()}</span>
          <span><b>Total Records:</b> {data.totalCount}</span>
        </div>
      </Panel>
    </>
  );
}

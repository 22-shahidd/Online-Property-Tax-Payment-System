import { useState, useEffect, useCallback } from "react";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Check, Search } from "lucide-react";

// Offline Payment page - officer finds unpaid taxes and records offline payments
export default function OfflinePayment() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [paying, setPaying] = useState(null);

  // useCallback for reusable fetch function
  const fetchUnpaid = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/officer/unpaid-taxes?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTaxes(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnpaid();
  }, [fetchUnpaid]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => fetchUnpaid(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchUnpaid]);

  // Record an offline payment
  async function handlePay(taxId) {
    setPaying(taxId);
    setReceipt(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/officer/pay/${taxId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReceipt(data);
        fetchUnpaid(query);
      } else {
        alert(data.message || "Payment failed");
      }
    } catch (err) {
      alert("Server error");
    } finally {
      setPaying(null);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Offline Collection</p>
          <h1>Offline Payment</h1>
          <p>Find an unpaid tax record and record a counter collection.</p>
        </div>
      </div>

      {/* Payment receipt */}
      {receipt && (
        <div className="notice success" style={{ marginBottom: "20px" }}>
          <Check size={18} />
          <div>
            <b>Offline payment recorded successfully!</b>
            <span>Receipt: {receipt.receiptNumber} | Amount: Rs {receipt.amount.toLocaleString()} | Date: {new Date(receipt.paidDate).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      <Panel title="Unpaid Tax Records" eyebrow="Search and collect">
        <div className="search-box" style={{ maxWidth: "500px", marginBottom: "16px" }}>
          <Search size={17} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by tenement number or owner name..."
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : taxes.length === 0 ? (
          <div className="empty-state">
            <p>No unpaid tax records found.</p>
          </div>
        ) : (
          <div className="tax-list">
            {taxes.map((t) => (
              <div className="tax-row" key={t.taxId}>
                <div className="property-avatar">{t.propertyType.charAt(0).toUpperCase()}</div>
                <div className="tax-property">
                  <b>{t.tenementNumber}</b>
                  <small>{t.address} | {t.propertyType} | {t.area.toLocaleString()} sq ft | Owner: {t.ownerName}</small>
                  <small>Assessment Year: {t.assessmentYear} | Due Date: {new Date(t.dueDate).toLocaleDateString()}</small>
                </div>
                <div className="tax-amount">
                  <small>Base Tax</small>
                  <strong>Rs {t.baseTax.toLocaleString()}</strong>
                  <small style={{ marginTop: "4px" }}>Total Due: Rs {t.totalDue.toLocaleString()}</small>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <StatusBadge status={t.status || "unpaid"} />
                  <button
                    className="small-button primary"
                    onClick={() => handlePay(t.taxId)}
                    disabled={paying === t.taxId}
                  >
                    {paying === t.taxId ? "Processing..." : "Collect Payment"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

import { useState, useEffect, useMemo } from "react";
import Panel from "../../components/Panel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { Check, X } from "lucide-react";

// Pay Tax page - citizen views verified properties and pays tax online (simulated)
export default function PayTax() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [cardModal, setCardModal] = useState(null); // { taxId, amount }
  const [cardType, setCardType] = useState("credit");
  const [cardNumber, setCardNumber] = useState("");

  // Load tax records on mount
  useEffect(() => {
    async function fetchTaxes() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/citizen/taxes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTaxes(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTaxes();
  }, []);

  // useMemo to calculate the total due across all properties
  const totalDue = useMemo(() => {
    return taxes.filter((t) => t.status === "unpaid").reduce((sum, t) => sum + t.totalDue, 0);
  }, [taxes]);

  // Pay online for a specific tax
  async function handlePay(taxId) {
    setPaying(taxId);
    setReceipt(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/citizen/pay/${taxId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReceipt(data);
        setCardModal(null);
        // Refresh tax list
        const taxRes = await fetch("/api/citizen/taxes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTaxes(await taxRes.json());
      } else {
        alert(data.message || "Payment failed");
      }
    } catch (err) {
      alert("Server error");
    } finally {
      setPaying(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tax Payment</p>
          <h1>Pay Property Tax</h1>
          <p>View current assessments and complete a secure simulated payment.</p>
        </div>
      </div>

      {/* Total due summary */}
      {totalDue > 0 && (
        <div className="notice" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", marginBottom: "20px" }}>
          <strong>Total Tax Due: Rs {totalDue.toLocaleString()}</strong>
        </div>
      )}

      {/* Payment success receipt */}
      {receipt && (
        <div className="notice success" style={{ marginBottom: "20px" }}>
          <Check size={18} />
          <div>
            <b>Payment successful!</b>
            <span>Receipt: {receipt.receiptNumber} | Amount: Rs {receipt.amount.toLocaleString()} | Date: {new Date(receipt.paidDate).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      <Panel title="Current Assessments" eyebrow="Assessment year 2025-26">
        {taxes.length === 0 ? (
          <div className="empty-state">
            <p>No verified properties found. Your properties need to be verified by an officer before tax payment.</p>
          </div>
        ) : (
          <div className="tax-list">
            {taxes.map((t) => (
              <div className="tax-row" key={t.taxId}>
                <div className="property-avatar">{t.propertyType.charAt(0).toUpperCase()}</div>
                <div className="tax-property">
                  <b>{t.tenementNumber}</b>
                  <small>{t.address} | {t.propertyType} | {t.area.toLocaleString()} sq ft | {t.ward}</small>
                </div>
                <div className="tax-amount">
                  <small>Base Tax</small>
                  <strong>Rs {t.baseTax.toLocaleString()}</strong>
                  <small style={{ marginTop: "4px" }}>
                    {t.rebate > 0 && `Rebate: -Rs ${t.rebate.toLocaleString()}`}
                    {t.penalty > 0 && `Penalty: +Rs ${t.penalty.toLocaleString()}`}
                    {t.rebate === 0 && t.penalty === 0 && "No rebate or penalty"}
                  </small>
                  <small style={{ marginTop: "4px" }}>Total Due: Rs {t.totalDue.toLocaleString()}</small>
                  <small>Due Date: {new Date(t.dueDate).toLocaleDateString()}</small>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <StatusBadge status={t.status} />
                  {t.status === "unpaid" && (
                    <button
                      className="small-button primary"
                      onClick={() => {
                        setCardModal({ taxId: t.taxId, amount: t.totalDue });
                        setCardType("credit");
                        setCardNumber("");
                      }}
                      disabled={paying === t.taxId}
                    >
                      {paying === t.taxId ? "Processing..." : "Pay Online"}
                    </button>
                  )}
                  {t.status === "paid" && (
                    <span className="muted" style={{ fontSize: "12px" }}>Payment complete</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Card detail modal */}
      {cardModal && (
        <div className="modal-overlay" onClick={() => setCardModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enter Card Details</h2>
              <button className="modal-close" onClick={() => setCardModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-amount">Amount to pay: <strong>Rs {cardModal.amount.toLocaleString()}</strong></p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (cardNumber.replace(/\s/g, "").length < 12) {
                  alert("Please enter a valid card number");
                  return;
                }
                handlePay(cardModal.taxId);
              }}
            >
              <div className="form-label">
                <label>Card Type</label>
                <select value={cardType} onChange={(e) => setCardType(e.target.value)}>
                  <option value="credit">Credit Card</option>
                  <option value="debit">Debit Card</option>
                </select>
              </div>
              <div className="form-label">
                <label>Card Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                    const grouped = digits.replace(/(.{4})/g, "$1 ").trim();
                    setCardNumber(grouped);
                  }}
                  required
                />
              </div>
              <button type="submit" className="primary-button wide" disabled={paying === cardModal.taxId}>
                {paying === cardModal.taxId ? "Processing..." : `Pay Rs ${cardModal.amount.toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

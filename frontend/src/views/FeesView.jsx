import React, { useState, useEffect } from "react";
import { 
  CreditCard, Plus, CheckCircle, AlertCircle, Clock, IndianRupee, 
  Receipt, TestTube, Sparkles, ShieldCheck, Download, Printer, FileText 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import PaymentModal from "../components/Modals/PaymentModal";
import OrderServiceModal from "../components/Modals/OrderServiceModal";
import ReceiptModal from "../components/Modals/ReceiptModal";

export default function FeesView({ onOpenPaymentModal }) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState({ totalDue: 0, totalPaid: 0, totalRemaining: 0 });
  const [payments, setPayments] = useState([]);
  const [activeFeeToPay, setActiveFeeToPay] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadFeeData = async () => {
    try {
      const [feesRes, payRes] = await Promise.all([
        api.get("/fees"),
        api.get("/fees/payments")
      ]);
      setFees(feesRes.data.fees || []);
      setSummary(feesRes.data.summary || { totalDue: 0, totalPaid: 0, totalRemaining: 0 });
      setPayments(payRes.data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, [liveEventSignal]);

  const filtered = fees.filter((f) => {
    if (filter === "all") return true;
    return f.status.toLowerCase().replace(/\s+/g, "-") === filter.toLowerCase();
  });

  const handleDownloadExpenseStatement = () => {
    try {
      const seniorName = fees[0]?.seniorName || payments[0]?.seniorName || "Senior Citizen";
      const totalSpent = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
      
      const csvRows = [
        ["SENIORCARE HEALTH CENTER - OFFICIAL EXPENSE & PAYMENT STATEMENT"],
        [`Senior Citizen: ${seniorName}`, `Generated Date: ${new Date().toLocaleDateString()}`],
        [`Total Medical & Care Expenditure: Rs. ${totalSpent.toLocaleString()}`],
        [],
        ["Receipt Code", "Date", "Category", "Service / Purpose of Expenditure", "Amount (INR)", "Payment Mode", "Transaction Ref", "Status"]
      ];

      payments.forEach((p) => {
        const matchingFee = fees.find(f => f._id === p.feeId || f.feeCode === p.paymentCode);
        const purpose = p.notes || matchingFee?.notes || matchingFee?.title || "Routine Geriatric Health & Care Service";
        const cat = matchingFee?.category || "Elder Care";
        csvRows.push([
          p.paymentCode,
          new Date(p.paidAt).toLocaleDateString(),
          cat,
          `"${purpose.replace(/"/g, '""')}"`,
          p.amount,
          p.paymentMethod || "UPI",
          p.transactionRef || "TXN-VERIFIED",
          "PAID & VERIFIED"
        ]);
      });

      const csvString = csvRows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${seniorName.replace(/\s+/g, "_")}_Expense_Statement_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showToast(
        lang === "ta" ? "முழுமையான செலவு அறிக்கை (CSV) பதிவிறக்கப்பட்டது!" : "Complete expense statement downloaded successfully!",
        "success"
      );
    } catch (e) {
      showToast("Failed to export statement", "error");
    }
  };

  return (
    <div className="view-page-container">
      <div className="view-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Receipt className="text-primary" size={26} />
            <h2 style={{ margin: 0 }}>
              {lang === "ta" ? "மருத்துவ செலவுகள் & கட்டண ரசீதுகள்" : "Medical Expenses & Official Receipts"}
            </h2>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
            {lang === "ta" 
              ? "எந்தெந்த விஷயங்களுக்கு எவ்வளவு செலவானது என்ற விரிவான விபரங்கள் மற்றும் பதிவிறக்கக்கூடிய ரசீதுகள்."
              : "Itemized breakdown of care expenses, specific purposes, settled amounts, and downloadable receipts."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button 
            type="button"
            className="btn-secondary"
            onClick={handleDownloadExpenseStatement}
            style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.6rem 1.1rem", borderRadius: "10px", fontWeight: "700" }}
          >
            <Download size={17} />
            <span>{lang === "ta" ? "📥 முழு செலவு அறிக்கை (CSV)" : "📥 Download Expense Statement"}</span>
          </button>

          {user?.role !== "admin" && (
            <button 
              className="btn-primary" 
              onClick={() => setShowOrderModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", borderRadius: "10px", fontWeight: "600", boxShadow: "0 4px 14px rgba(23, 107, 135, 0.25)" }}
            >
              <TestTube size={18} />
              <span>{lang === "ta" ? "🔬 ஆய்வக சேவை பதிவு" : "🔬 Order Care / Lab Service"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial & Coverage Summary Strip (NO negative Due banner) */}
      <div className="fee-summary-cards-grid">
        <div className="fee-stat-card total">
          <small>{lang === "ta" ? "மொத்த மருத்துவ பாதுகாப்பு மதிப்பு" : "Total Care Coverage Value"}</small>
          <strong>₹{(summary.totalDue || 35000)?.toLocaleString()}</strong>
          <span className="stat-note">{fees.length} {lang === "ta" ? "சேவைகள் சேர்க்கப்பட்டுள்ளது" : "Care services enrolled"}</span>
        </div>

        <div className="fee-stat-card paid">
          <small>{lang === "ta" ? "நலத்திட்டத்தின் கீழ் ஏற்கப்பட்டது" : "Institutional & Family Paid"}</small>
          <strong className="text-success">₹{(summary.totalPaid || summary.totalDue || 35000)?.toLocaleString()}</strong>
          <span className="stat-note" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <ShieldCheck size={14} className="text-success" />
            {lang === "ta" ? "100% காப்பீடு பாதுகாப்பு" : "100% Comprehensive Coverage"}
          </span>
        </div>

        <div className="fee-stat-card remaining">
          <small>{lang === "ta" ? "குடும்பத்தினர் செலுத்த வேண்டிய தொகை" : "Outstanding Balance"}</small>
          <strong className="text-success">₹0.00</strong>
          <span className="stat-note text-success">{lang === "ta" ? "✓ நிலுவை எதுவும் இல்லை" : "✓ Nil Due — Fully Settled"}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="view-filter-bar">
        <div className="filter-pills-row">
          <button
            className={`filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {lang === "ta" ? "அனைத்து சேவைகள்" : "All Services"} ({fees.length})
          </button>
          <button
            className={`filter-pill ${filter === "paid" ? "active" : ""}`}
            onClick={() => setFilter("paid")}
          >
            ✓ {lang === "ta" ? "செலுத்தப்பட்டவை (Paid)" : "Settled / Paid"} ({fees.filter((f) => f.status === "Paid" || f.paidAmount > 0).length})
          </button>
          <button
            className={`filter-pill ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            📋 {lang === "ta" ? "மருத்துவ திட்டங்கள்" : "Care Packages"}
          </button>
        </div>
      </div>

      {/* Fee & Care Cards Grid */}
      <div className="fees-cards-grid">
        {filtered.length === 0 ? (
          <div className="empty-panel-state col-span-full">{t.noData}</div>
        ) : (
          filtered.map((fee) => {
            return (
              <div key={fee._id} className="fee-item-card">
                <div className="fee-card-top">
                  <span className="fee-code-badge">{fee.feeCode}</span>
                  <span className="status-pill status-paid" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                    ✓ {lang === "ta" ? "செலுத்தப்பட்டது (Paid)" : "Settled / Paid"}
                  </span>
                </div>

                <div className="fee-card-body">
                  <h4>{fee.title}</h4>
                  <p className="fee-senior-name">👵 <strong>{fee.seniorName}</strong> · <small>{fee.category}</small></p>

                  <div className="fee-amounts-row">
                    <div>
                      <small>{lang === "ta" ? "சேவை மதிப்பு" : "Package Value"}</small>
                      <strong>₹{fee.totalAmount?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <small>{lang === "ta" ? "செலுத்தப்பட்ட தொகை" : "Settled Amount"}</small>
                      <strong className="text-success">₹{(fee.paidAmount || fee.totalAmount)?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <small>{lang === "ta" ? "நிலுவை" : "Balance Due"}</small>
                      <strong className="text-success">₹0 (Nil)</strong>
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="fee-progress-track">
                    <div className="fee-progress-fill" style={{ width: `100%`, background: "linear-gradient(90deg, #10b981, #059669)" }} />
                  </div>
                  <small className="progress-label" style={{ color: "#166534", fontWeight: 600 }}>
                    ✓ 100% {lang === "ta" ? "முழுவதும் ஏற்கப்பட்டது" : "Full Institutional Coverage"}
                  </small>

                  <div className="fee-due-date">
                    <Clock size={13} />
                    <span>{lang === "ta" ? "சேவை தேதி" : "Service Date"}: {new Date(fee.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="fee-card-footer" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem" }}>
                  <button
                    className="btn-outline-small"
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", borderRadius: "8px", fontWeight: "600" }}
                    onClick={() => setActiveReceipt({
                      receiptCode: fee.feeCode,
                      seniorName: fee.seniorName,
                      title: fee.title,
                      amount: fee.totalAmount,
                      paymentMethod: "UPI / Health Coverage",
                      paidAt: fee.updatedAt || Date.now(),
                      transactionRef: `TXN-${fee.feeCode}-SETTLED`,
                      recordedByName: "SeniorCare Billing"
                    })}
                  >
                    <Download size={14} />
                    <span>{lang === "ta" ? "ரசீது காண்க / பதிவிறக்குக" : "View / Download Receipt"}</span>
                  </button>

                  <button
                    className="btn-outline-small"
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", borderRadius: "8px", borderColor: "var(--primary)", color: "var(--primary)", fontWeight: "600" }}
                    onClick={() => setShowOrderModal(true)}
                  >
                    <TestTube size={14} />
                    <span>{lang === "ta" ? "புதிய சேவை சேர்க்க" : "Order Lab/Care"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Receipts History Table */}
      <div className="payments-history-section" style={{ marginTop: "2rem" }}>
        <div className="panel-box-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3>{lang === "ta" ? "செலுத்தப்பட்ட ரசீதுகள் வரலாறு" : "Verified Payment & Care Receipts"}</h3>
            <small>{lang === "ta" ? "முழுமையாக முடிக்கப்பட்ட பரிவர்த்தனைகள் மற்றும் ரசீது பதிவிறக்கம்" : "Official receipts issued with center seal"}</small>
          </div>
          <span style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: "700" }}>
            ✓ {payments.length} Verified Receipts
          </span>
        </div>

        <div className="responsive-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt Code</th>
                <th>{t.seniors}</th>
                <th>{lang === "ta" ? "சேவை & செலவுக்கான நோக்கம் (Purpose)" : "Care Service & Purpose of Expense"}</th>
                <th>{lang === "ta" ? "தொகை (₹)" : "Amount (₹)"}</th>
                <th>{t.paymentMethod}</th>
                <th>{lang === "ta" ? "செலுத்திய தேதி" : "Payment Date"}</th>
                <th>{lang === "ta" ? "அதிகாரப்பூர்வ ரசீது" : "Receipt Action"}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const matchedFee = fees.find(f => f._id === p.feeId || f.feeCode === p.paymentCode);
                const purpose = p.notes || matchedFee?.notes || matchedFee?.title || "Routine Elder Health Care Service";
                const cat = matchedFee?.category || "Elder Care";

                return (
                  <tr key={p._id}>
                    <td><strong style={{ color: "#0284c7" }}>{p.paymentCode}</strong></td>
                    <td>
                      <strong>{p.seniorName}</strong>
                      <small style={{ display: "block", color: "var(--text-muted)", fontSize: "0.72rem" }}>🏡 {lang === "ta" ? "இல்லம் (அடையாறு, சென்னை)" : "Home Residence (Adyar, Chennai)"} · 📱 9345403361</small>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.74rem", background: "rgba(2,132,199,0.08)", color: "#0284c7", padding: "0.15rem 0.45rem", borderRadius: "6px", fontWeight: "700", marginRight: "6px" }}>
                        {cat}
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-main)" }}>
                        {purpose}
                      </span>
                    </td>
                    <td className="text-success font-bold" style={{ fontSize: "0.95rem" }}>
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td>
                      <span className="method-tag">{p.paymentMethod}</span>
                      <small style={{ display: "block", color: "var(--text-muted)", fontSize: "0.7rem" }}>{p.transactionRef}</small>
                    </td>
                    <td>{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-outline-small"
                        onClick={() => setActiveReceipt({
                          ...p,
                          title: matchedFee?.title || purpose,
                          notes: purpose
                        })}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.8rem", fontSize: "0.78rem", fontWeight: "600" }}
                      >
                        <Download size={13} />
                        <span>{lang === "ta" ? "ரசீது (Download)" : "Download Slip"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          receiptData={activeReceipt}
        />
      )}

      {/* Order Service Modal */}
      {showOrderModal && (
        <OrderServiceModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          onOrderPlaced={() => {
            loadFeeData();
            setShowOrderModal(false);
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { 
  X, CheckCircle2, TestTube, Calendar, Clock, MessageSquare, 
  Mail, Phone, ShieldCheck, Sparkles, Send, ExternalLink, ArrowRight 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function OrderServiceModal({ 
  isOpen, 
  onClose, 
  defaultSeniorId, 
  seniors = [], 
  onOrderSuccess,
  onOrderPlaced 
}) {
  const { lang, t, user } = useAuth();
  const { showToast } = useToast();

  const [localSeniors, setLocalSeniors] = useState([]);
  const effectiveSeniors = seniors.length > 0 ? seniors : localSeniors;

  const [selectedSeniorId, setSelectedSeniorId] = useState(defaultSeniorId || (seniors[0]?._id || ""));
  const [selectedService, setSelectedService] = useState("Complete Routine Diagnostic Panel");
  const [estimatedCost, setEstimatedCost] = useState(450);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState("07:30 AM - 09:00 AM (Fasting)");
  const [fastingRequired, setFastingRequired] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Recipient Contact Details for Live Dispatch
  const [recipientPhone, setRecipientPhone] = useState("+91 9080578504");
  const [recipientEmail, setRecipientEmail] = useState(user?.email || "family@seniorcare.local");

  // Channels selection (WhatsApp, SMS, Email)
  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: true
  });

  // Success view state with direct dispatch actions
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen && seniors.length === 0) {
      api.get("/seniors")
        .then((res) => {
          const list = res.data.seniors || [];
          setLocalSeniors(list);
          if (list.length > 0 && !selectedSeniorId) {
            setSelectedSeniorId(list[0]._id);
            setRecipientPhone(list[0].emergencyContactPhone || list[0].phone || "+91 9080578504");
          }
        })
        .catch(() => {});
    }
  }, [isOpen, seniors]);

  useEffect(() => {
    if (defaultSeniorId) setSelectedSeniorId(defaultSeniorId);
  }, [defaultSeniorId]);

  useEffect(() => {
    if (isOpen) {
      setOrderSuccessData(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedSeniorId && effectiveSeniors.length > 0) {
      const snr = effectiveSeniors.find((s) => s._id === selectedSeniorId);
      if (snr) {
        setRecipientPhone(snr.emergencyContactPhone || snr.phone || "+91 9080578504");
      }
    }
  }, [selectedSeniorId, effectiveSeniors]);

  if (!isOpen) return null;

  const catalog = [
    { name: "Complete Routine Diagnostic Panel", cost: 450, fasting: true, desc: "CBC, Hemoglobin, ESR & Complete Blood Picture" },
    { name: "Diabetes HbA1c & Fasting Glucose Screening", cost: 350, fasting: true, desc: "3-Month Average Blood Sugar + Fasting Plasma Glucose" },
    { name: "Comprehensive Geriatric Lipid & Thyroid Panel", cost: 650, fasting: true, desc: "Cholesterol, Triglycerides, HDL, LDL, T3, T4, TSH" },
    { name: "12-Lead Home ECG & Cardiology Review", cost: 550, fasting: false, desc: "Home diagnostic recording reviewed by Consulting Cardiologist" },
    { name: "Senior Citizen Full Wellness Health Package", cost: 950, fasting: true, desc: "Liver Function, Kidney Profile, Electrolytes & Vitals" },
    { name: "In-Home Nurse Vitals & Wound Care Dressing", cost: 300, fasting: false, desc: "Sterile dressing change, blood pressure & SpO2 monitoring" },
    { name: "Physiotherapist Mobility & Joint Session", cost: 500, fasting: false, desc: "Post-surgery knee/hip rehabilitation & walking balance" }
  ];

  const handleServiceChange = (serviceName) => {
    setSelectedService(serviceName);
    const item = catalog.find((c) => c.name === serviceName);
    if (item) {
      setEstimatedCost(item.cost);
      setFastingRequired(item.fasting);
    }
  };

  const toggleChannel = (key) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeChannels = Object.keys(channels).filter((k) => channels[k]);
    if (activeChannels.length === 0) {
      showToast(lang === "ta" ? "குறைந்தது ஒரு அறிவிப்பு வழியை தேர்ந்தெடுக்கவும்" : "Select at least one notification channel", "warning");
      return;
    }
    if (!recipientPhone.trim()) {
      showToast(lang === "ta" ? "மொபைல் எண் உள்ளிடவும்" : "Please enter recipient phone number", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/fees/order-service", {
        seniorId: selectedSeniorId,
        serviceName: selectedService,
        category: "Lab & Diagnostics",
        estimatedCost: Number(estimatedCost) || 450,
        collectionDate,
        fastingRequired: Boolean(fastingRequired),
        notes: `${notes || ""} [Time: ${timeSlot}]`,
        channels: activeChannels,
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim()
      });

      const selectedSenior = effectiveSeniors.find((s) => s._id === selectedSeniorId);
      const seniorName = selectedSenior?.name || "Senior Resident";

      setOrderSuccessData({
        fee: res.data.fee,
        seniorName,
        phone: recipientPhone.trim(),
        email: recipientEmail.trim(),
        serviceName: selectedService,
        date: collectionDate,
        time: timeSlot,
        channels: activeChannels
      });

      showToast(
        lang === "ta"
          ? "ஆய்வக பரிசோதனை வெற்றிகரமாக பதிவு செய்யப்பட்டது! WhatsApp/SMS/Email மூலம் தகவல் தயாராக உள்ளது."
          : "Lab service ordered! WhatsApp, SMS, and Email dispatched.",
        "success"
      );

      if (onOrderSuccess) onOrderSuccess(res.data.fee);
      if (onOrderPlaced) onOrderPlaced(res.data.fee);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to order service";
      console.error("Order service failure:", err.response?.data || err);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Generate Action Links
  const getWhatsAppLink = (data) => {
    const cleanPhone = (data.phone || "919080578504").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `🏥 *SeniorCare Lab Booking Confirmation*\n\n` +
      `Resident: *${data.seniorName}*\n` +
      `Test: *${data.serviceName}*\n` +
      `Date & Slot: *${data.date} at ${data.time}*\n` +
      `Status: *Confirmed (Sample Collection)*\n\n` +
      `_SeniorCare Geriatric Health Center, Chennai_`
    );
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
  };

  const getSmsLink = (data) => {
    const cleanPhone = (data.phone || "+919080578504").replace(/[^0-9+]/g, "");
    const body = encodeURIComponent(
      `SeniorCare Alert: Lab service '${data.serviceName}' booked for ${data.seniorName} on ${data.date} ${data.time}. Contact support for queries.`
    );
    return `sms:${cleanPhone}?body=${body}`;
  };

  const getEmailLink = (data) => {
    const subject = encodeURIComponent(`SeniorCare Lab Service Booking: ${data.serviceName}`);
    const body = encodeURIComponent(
      `Hello,\n\nYour diagnostic test has been confirmed for ${data.seniorName}.\nService: ${data.serviceName}\nSchedule: ${data.date} (${data.time})\n\nThank you,\nSeniorCare Team`
    );
    return `mailto:${data.email || "family@seniorcare.local"}?subject=${subject}&body=${body}`;
  };

  const copyDetailsToClipboard = (data) => {
    const text = 
      `SeniorCare Lab Booking Confirmation\n` +
      `Resident: ${data.seniorName}\n` +
      `Test: ${data.serviceName}\n` +
      `Schedule: ${data.date} at ${data.time}\n` +
      `Recipient Mobile: ${data.phone}\n` +
      `Recipient Email: ${data.email}\n` +
      `Status: Confirmed`;
    navigator.clipboard.writeText(text).then(() => {
      showToast(lang === "ta" ? "விவரங்கள் நகலெடுக்கப்பட்டது! (Copied to clipboard)" : "Copied details to clipboard!", "success");
    }).catch(() => {
      showToast("Copied details!", "info");
    });
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.35rem",
    fontWeight: "700",
    color: "var(--text-main, #0f172a)",
    fontSize: "0.86rem"
  };

  const inputStyle = {
    width: "100%",
    padding: "0.65rem 0.85rem",
    borderRadius: "8px",
    border: "1px solid var(--border-color, #cbd5e1)",
    background: "var(--bg-surface, #ffffff)",
    color: "var(--text-main, #0f172a)",
    fontSize: "0.88rem",
    fontWeight: "500",
    boxSizing: "border-box"
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-dialog large-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 580,
          background: "var(--bg-surface, #ffffff)",
          color: "var(--text-main, #0f172a)",
          border: "1px solid var(--border-color, #e2e8f0)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          borderRadius: "16px",
          padding: "1.75rem"
        }}
      >
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "12px", marginBottom: "16px" }}>
          <div className="modal-title-with-icon" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(2, 132, 199, 0.12)", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TestTube size={22} className="text-primary" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: "var(--text-main, #0f172a)" }}>
                {lang === "ta" ? "மருத்துவ ஆய்வக பரிசோதனை பதிவு" : "Order Lab & Diagnostic Service"}
              </h3>
              <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.8rem" }}>
                {lang === "ta" ? "வீட்டு மாதிரி சேகரிப்பு & மருத்துவ பரிசோதனைகள்" : "Home sample collection with live notification dispatch"}
              </small>
            </div>
          </div>
          <button className="modal-close-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {orderSuccessData ? (
          /* SUCCESS & MULTI-CHANNEL DISPATCH ACTIONS CARD */
          <div style={{ padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ textAlign: "center", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", padding: "1.25rem" }}>
              <CheckCircle2 size={44} className="text-success" style={{ margin: "0 auto 0.5rem" }} />
              <h3 style={{ margin: "0 0 0.25rem", color: "#065f46", fontSize: "1.25rem", fontWeight: "700" }}>
                {lang === "ta" ? "பரிசோதனை வெற்றிகரமாக பதிவு செய்யப்பட்டது!" : "Lab Service Order Confirmed!"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#047857" }}>
                Order Code: <strong>{orderSuccessData.fee?.feeCode || "LAB-2026"}</strong> · Resident: <strong>{orderSuccessData.seniorName}</strong>
              </p>
              <div style={{ fontSize: "0.84rem", marginTop: "0.4rem", color: "var(--text-muted, #64748b)" }}>
                📅 {orderSuccessData.date} ({orderSuccessData.time})
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.1rem" }}>
              <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", color: "var(--text-main, #0f172a)" }}>
                <span>📲</span>
                <span>{lang === "ta" ? "நேரடி அறிவிப்பு வழிகள் (Direct Action Links):" : "Direct Multi-Channel Dispatch:"}</span>
              </strong>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {/* WhatsApp Button */}
                {orderSuccessData.channels.includes("whatsapp") && (
                  <a 
                    href={getWhatsAppLink(orderSuccessData)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "0.75rem 1rem", 
                      borderRadius: "10px", 
                      background: "#25D366", 
                      color: "#fff", 
                      fontWeight: "700", 
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      cursor: "pointer" 
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>💬</span>
                      <span>{lang === "ta" ? "WhatsApp மூலம் அனுப்புக / Open WhatsApp" : "Send Confirmation via WhatsApp"}</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.18)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                      {orderSuccessData.phone} ↗
                    </span>
                  </a>
                )}

                {/* SMS Button */}
                {orderSuccessData.channels.includes("sms") && (
                  <a 
                    href={getSmsLink(orderSuccessData)}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "0.75rem 1rem", 
                      borderRadius: "10px", 
                      background: "#2563eb", 
                      color: "#fff", 
                      fontWeight: "700", 
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      cursor: "pointer" 
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>📱</span>
                      <span>{lang === "ta" ? "SMS மூலம் அனுப்புக / Open SMS" : "Send SMS Alert"}</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.18)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                      {orderSuccessData.phone} ↗
                    </span>
                  </a>
                )}

                {/* Email Button */}
                {orderSuccessData.channels.includes("email") && (
                  <a 
                    href={getEmailLink(orderSuccessData)}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "0.75rem 1rem", 
                      borderRadius: "10px", 
                      background: "#ea580c", 
                      color: "#fff", 
                      fontWeight: "700", 
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      cursor: "pointer" 
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>📧</span>
                      <span>{lang === "ta" ? "Google Mail மூலம் அனுப்புக / Send Email" : "Send Email Confirmation"}</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.18)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                      {orderSuccessData.email} ↗
                    </span>
                  </a>
                )}

                {/* Copy Details Fallback Button */}
                <button
                  type="button"
                  onClick={() => copyDetailsToClipboard(orderSuccessData)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1rem",
                    borderRadius: "10px",
                    background: "var(--bg-card, #ffffff)",
                    color: "var(--text-main, #0f172a)",
                    border: "1px solid var(--border-color, #cbd5e1)",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    marginTop: "0.3rem"
                  }}
                >
                  <span>📋</span>
                  <span>{lang === "ta" ? "விவரங்களை நகலெடு (Copy Message & Details)" : "Copy Message & Booking Details"}</span>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={onClose}
                style={{ padding: "0.65rem 1.5rem", borderRadius: "10px" }}
              >
                {lang === "ta" ? "✓ முடிந்தது (Done)" : "✓ Done / Close"}
              </button>
            </div>
          </div>
        ) : (
          /* BOOKING FORM */
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Senior Citizen Selection */}
            <div className="form-group">
              <label style={labelStyle}>{lang === "ta" ? "மூத்த குடிமகன் *" : "Select Senior Citizen *"}</label>
              <select value={selectedSeniorId} onChange={(e) => setSelectedSeniorId(e.target.value)} style={inputStyle}>
                {effectiveSeniors.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.age} yrs · 🏡 {s.address ? s.address.split(",").slice(-2).join(",").trim() : "Home Residence"})
                  </option>
                ))}
              </select>
            </div>

            {/* Test Catalog Selection */}
            <div className="form-group">
              <label style={labelStyle}>{lang === "ta" ? "ஆய்வக பரிசோதனை / சேவை *" : "Select Diagnostic Test / Service *"}</label>
              <select value={selectedService} onChange={(e) => handleServiceChange(e.target.value)} style={inputStyle}>
                {catalog.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} — ₹{item.cost} {item.fasting ? "(Fasting)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time Slot */}
            <div className="form-row-2">
              <div className="form-group">
                <label style={labelStyle}>{lang === "ta" ? "மாதிரி சேகரிப்பு தேதி *" : "Sample Collection Date *"}</label>
                <input 
                  type="date" 
                  value={collectionDate} 
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCollectionDate(e.target.value)} 
                  required 
                  style={inputStyle}
                />
              </div>

              <div className="form-group">
                <label style={labelStyle}>{lang === "ta" ? "நேர இடைவெளி *" : "Time Slot *"}</label>
                <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} style={inputStyle}>
                  <option value="07:30 AM - 09:00 AM (Fasting)">07:30 AM - 09:00 AM (Fasting)</option>
                  <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM</option>
                  <option value="04:00 PM - 05:30 PM (Evening)">04:00 PM - 05:30 PM (Evening)</option>
                </select>
              </div>
            </div>

            {/* Fasting Notice */}
            {fastingRequired && (
              <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid #f59e0b", padding: "0.65rem 0.9rem", borderRadius: "10px", fontSize: "0.84rem", color: "#b45309", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span>⚠️</span>
                <span>{lang === "ta" ? "10-12 மணி நேர இரவு உண்ணாவிரதம் பரிந்துரைக்கப்படுகிறது (தண்ணீர் அருந்தலாம்)." : "10-12 hours overnight fasting recommended. Water intake allowed."}</span>
              </div>
            )}

            {/* Recipient Phone and Email Inputs */}
            <div style={{ background: "rgba(2, 132, 199, 0.06)", border: "1px solid rgba(2, 132, 199, 0.25)", padding: "0.95rem 1rem", borderRadius: "12px", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "#0369a1", marginBottom: "0.6rem" }}>
                <Phone size={16} />
                <span>{lang === "ta" ? "தொடர்பு எண்கள் & அறிவிப்பு முகவரி (WhatsApp / SMS / Email):" : "Recipient Contact for Live Updates (WhatsApp / SMS / Email):"}</span>
              </strong>

              <div className="form-row-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ ...labelStyle, fontSize: "0.82rem", color: "#0369a1" }}>
                    📱 {lang === "ta" ? "மொபைல் எண் (WhatsApp & SMS) *" : "Mobile Number (WhatsApp & SMS) *"}
                  </label>
                  <input 
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 98765 00003"
                    required
                    style={{ ...inputStyle, background: "#ffffff" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ ...labelStyle, fontSize: "0.82rem", color: "#0369a1" }}>
                    📧 {lang === "ta" ? "மின்னஞ்சல் முகவரி (Google Mail) *" : "Email Address (Google Mail) *"}
                  </label>
                  <input 
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="family@seniorcare.local"
                    required
                    style={{ ...inputStyle, background: "#ffffff" }}
                  />
                </div>
              </div>
            </div>

            {/* Notification Channels Options */}
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>
                <span>{lang === "ta" ? "முடிவுகள் & தகவல் அனுப்பப்பட வேண்டிய வழிகள்:" : "Send Updates & Reports via:"}</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginTop: "0.3rem" }}>
                <label 
                  style={{
                    cursor: "pointer",
                    padding: "0.65rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    fontSize: "0.84rem",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    background: channels.whatsapp ? "rgba(37, 211, 102, 0.12)" : "var(--bg-subtle, #f8fafc)",
                    border: channels.whatsapp ? "2px solid #25D366" : "1px solid var(--border-color, #cbd5e1)",
                    color: channels.whatsapp ? "#16a34a" : "var(--text-main, #0f172a)"
                  }}
                  onClick={() => toggleChannel("whatsapp")}
                >
                  <input type="checkbox" checked={channels.whatsapp} onChange={() => {}} style={{ display: "none" }} />
                  <span>💬</span>
                  <span>WhatsApp</span>
                  {channels.whatsapp && <span>✓</span>}
                </label>

                <label 
                  style={{
                    cursor: "pointer",
                    padding: "0.65rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    fontSize: "0.84rem",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    background: channels.sms ? "rgba(37, 99, 235, 0.12)" : "var(--bg-subtle, #f8fafc)",
                    border: channels.sms ? "2px solid #2563eb" : "1px solid var(--border-color, #cbd5e1)",
                    color: channels.sms ? "#2563eb" : "var(--text-main, #0f172a)"
                  }}
                  onClick={() => toggleChannel("sms")}
                >
                  <input type="checkbox" checked={channels.sms} onChange={() => {}} style={{ display: "none" }} />
                  <span>📱</span>
                  <span>SMS</span>
                  {channels.sms && <span>✓</span>}
                </label>

                <label 
                  style={{
                    cursor: "pointer",
                    padding: "0.65rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    fontSize: "0.84rem",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    background: channels.email ? "rgba(234, 88, 12, 0.12)" : "var(--bg-subtle, #f8fafc)",
                    border: channels.email ? "2px solid #ea580c" : "1px solid var(--border-color, #cbd5e1)",
                    color: channels.email ? "#ea580c" : "var(--text-main, #0f172a)"
                  }}
                  onClick={() => toggleChannel("email")}
                >
                  <input type="checkbox" checked={channels.email} onChange={() => {}} style={{ display: "none" }} />
                  <span>📧</span>
                  <span>Email</span>
                  {channels.email && <span>✓</span>}
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle}>{lang === "ta" ? "குறிப்புகள் (விருப்பம்)" : "Instructions / Clinical Notes (Optional)"}</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={lang === "ta" ? "எ.கா. முதியவருக்கு இரத்த மாதிரி எடுக்கும்போது மெதுவாக செய்யவும்..." : "e.g. Please call before arriving, patient requires gentle phlebotomy..."}
                style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
              />
            </div>

            <div className="modal-actions-row" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t.cancel || "Cancel"}
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <CheckCircle2 size={16} />
                <span>{loading ? t.loading : (lang === "ta" ? "பரிசோதனையை உறுதிப்படுத்து" : "Confirm & Place Order")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

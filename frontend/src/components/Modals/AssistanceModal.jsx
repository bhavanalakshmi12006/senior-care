import React, { useState, useEffect } from "react";
import { 
  HandHeart, X, Pill, Utensils, ShoppingBag, Car, Home, 
  HelpCircle, ShieldAlert, Stethoscope, CheckCircle2, Phone, Mail, Send 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function AssistanceModal({ isOpen, onClose, onAssistanceCreated }) {
  const { t, lang, user } = useAuth();
  const { showToast } = useToast();
  const [seniors, setSeniors] = useState([]);
  const [formData, setFormData] = useState({
    seniorId: "",
    category: "Hospital Assistance",
    title: "",
    description: "",
    priority: "Normal"
  });
  const [loading, setLoading] = useState(false);

  // Recipient Contact Details for Live Multi-Channel Dispatch
  const [recipientPhone, setRecipientPhone] = useState("+91 9080578504");
  const [recipientEmail, setRecipientEmail] = useState(user?.email || "family@seniorcare.local");

  // Notification Channels Selection
  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: true
  });

  // Success view state with direct dispatch actions
  const [requestSuccessData, setRequestSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setRequestSuccessData(null);
      api.get("/seniors").then((res) => {
        const fetchedSeniors = res.data.seniors || [];
        setSeniors(fetchedSeniors);
        if (fetchedSeniors.length > 0) {
          const first = fetchedSeniors[0];
          setFormData((prev) => ({ ...prev, seniorId: prev.seniorId || first._id }));
          setRecipientPhone(first.emergencyContactPhone || first.phone || "+91 9080578504");
        }
      });
    }
  }, [isOpen]);

  const handleSeniorChange = (id) => {
    setFormData((prev) => ({ ...prev, seniorId: id }));
    const snr = seniors.find((s) => s._id === id);
    if (snr) {
      setRecipientPhone(snr.emergencyContactPhone || snr.phone || "+91 9080578504");
    }
  };

  const toggleChannel = (key) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  const categories = [
    { id: "Emergency Assistance", label: lang === "ta" ? "🚨 அவசர உதவி (Emergency)" : "🚨 Emergency Assistance", icon: ShieldAlert, isEmergency: true },
    { id: "Hospital Assistance", label: lang === "ta" ? "🏥 மருத்துவமனை உதவி" : "🏥 Hospital & Doctor Visit", icon: Stethoscope },
    { id: "Transportation", label: lang === "ta" ? "🚗 வாகன & பயண உதவி" : "🚗 Transportation Escort", icon: Car },
    { id: "Medicine Pickup", label: t.medicinePickup || "Medicine Refill", icon: Pill },
    { id: "Food Assistance", label: t.foodAssistance || "Food & Grocery", icon: Utensils },
    { id: "Home Assistance", label: t.homeAssistance || "Home Assistance", icon: Home }
  ];

  const selectedCategoryObj = categories.find((c) => c.id === formData.category) || categories[0];
  const isEmergencySelected = selectedCategoryObj.isEmergency;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If NOT emergency assistance, description is required
    if (!isEmergencySelected && !formData.description.trim()) {
      showToast(
        lang === "ta" 
          ? "மருத்துவமனை/வாகன உதவிக்கு விபரம் (Description) கட்டாயம் உள்ளிட வேண்டும்." 
          : "Please provide a description of what assistance is required (hospital/transportation details).", 
        "warning"
      );
      return;
    }

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
      const payload = {
        ...formData,
        title: formData.title || (isEmergencySelected ? "🚨 Immediate Emergency Assistance SOS" : `${formData.category} Request`),
        priority: isEmergencySelected ? "Urgent" : formData.priority,
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim(),
        channels: activeChannels
      };

      const res = await api.post("/assistance", payload);
      const selectedSenior = seniors.find((s) => s._id === formData.seniorId);
      const seniorName = selectedSenior?.name || "Senior Resident";

      setRequestSuccessData({
        request: res.data.request,
        seniorName,
        category: formData.category,
        title: payload.title,
        description: formData.description,
        phone: recipientPhone.trim(),
        email: recipientEmail.trim(),
        channels: activeChannels
      });

      showToast(
        isEmergencySelected
          ? (lang === "ta" ? "🚨 அவசர உதவி கோரிக்கை உடனடியாக அனுப்பப்பட்டது!" : "🚨 Emergency assistance alert dispatched immediately!")
          : (lang === "ta" ? "✓ உதவி கோரிக்கை சமர்ப்பிக்கப்பட்டது!" : "✓ Assistance request submitted successfully!"),
        isEmergencySelected ? "emergency" : "success"
      );

      if (onAssistanceCreated) onAssistanceCreated(res.data.request);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit request", "error");
    } finally {
      setLoading(false);
    }
  };

  // Generate Action Links
  const getWhatsAppLink = (data) => {
    const cleanPhone = (data.phone || "919080578504").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `🤝 *SeniorCare Assistance Alert*\n\n` +
      `Resident: *${data.seniorName}*\n` +
      `Category: *${data.category}*\n` +
      `Subject: *${data.title}*\n` +
      (data.description ? `Details: ${data.description}\n` : "") +
      `Status: *Requested / Dispatched*\n\n` +
      `_SeniorCare Geriatric Support System_`
    );
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
  };

  const getSmsLink = (data) => {
    const cleanPhone = (data.phone || "+919080578504").replace(/[^0-9+]/g, "");
    const body = encodeURIComponent(
      `SeniorCare Assistance Alert: ${data.category} requested for ${data.seniorName}. Details: ${data.title}. Support team on standby.`
    );
    return `sms:${cleanPhone}?body=${body}`;
  };

  const getEmailLink = (data) => {
    const subject = encodeURIComponent(`SeniorCare Assistance Notification: ${data.category} - ${data.seniorName}`);
    const body = encodeURIComponent(
      `Hello,\n\nAn assistance request has been recorded for ${data.seniorName}.\n\nCategory: ${data.category}\nDetails: ${data.title}\nRequirements: ${data.description || "N/A"}\n\nOur support coordinators will attend shortly.\n\nWarm regards,\nSeniorCare Team`
    );
    return `mailto:${data.email || "family@seniorcare.local"}?subject=${subject}&body=${body}`;
  };

  const copyDetailsToClipboard = (data) => {
    const text = 
      `SeniorCare Assistance Dispatch\n` +
      `Resident: ${data.seniorName}\n` +
      `Category: ${data.category}\n` +
      `Details: ${data.title}\n` +
      (data.description ? `Description: ${data.description}\n` : "") +
      `Recipient Phone: ${data.phone}\n` +
      `Recipient Email: ${data.email}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast(lang === "ta" ? "விவரங்கள் நகலெடுக்கப்பட்டது!" : "Copied details to clipboard!", "success");
    }).catch(() => {
      showToast("Copied details!", "info");
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 560,
          background: "var(--bg-surface, #ffffff)",
          color: "var(--text-main, #0f172a)",
          border: "1px solid var(--border-color, #e2e8f0)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          borderRadius: "16px",
          padding: "1.75rem"
        }}
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <HandHeart size={22} className="text-primary" />
            <h3>{t.requestAssistance}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {requestSuccessData ? (
          /* SUCCESS & MULTI-CHANNEL DISPATCH ACTIONS CARD */
          <div style={{ padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ textAlign: "center", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", padding: "1.25rem" }}>
              <CheckCircle2 size={44} className="text-success" style={{ margin: "0 auto 0.5rem" }} />
              <h3 style={{ margin: "0 0 0.25rem", color: "#065f46", fontSize: "1.25rem", fontWeight: "700" }}>
                {lang === "ta" ? "உதவி கோரிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது!" : "Assistance Request Dispatched!"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#047857" }}>
                Resident: <strong>{requestSuccessData.seniorName}</strong> · Service: <strong>{requestSuccessData.category}</strong>
              </p>
              <div style={{ fontSize: "0.84rem", marginTop: "0.4rem", color: "var(--text-muted, #64748b)" }}>
                Title: <strong>{requestSuccessData.title}</strong>
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.1rem" }}>
              <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", color: "var(--text-main, #0f172a)" }}>
                <span>📲</span>
                <span>{lang === "ta" ? "நேரடி அறிவிப்பு வழிகள் (Direct Action Links):" : "Direct Multi-Channel Dispatch:"}</span>
              </strong>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {/* WhatsApp Button */}
                {requestSuccessData.channels.includes("whatsapp") && (
                  <a 
                    href={getWhatsAppLink(requestSuccessData)}
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
                      <span>{lang === "ta" ? "WhatsApp மூலம் அனுப்புக / Open WhatsApp" : "Send Alert via WhatsApp"}</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.18)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                      {requestSuccessData.phone} ↗
                    </span>
                  </a>
                )}

                {/* SMS Button */}
                {requestSuccessData.channels.includes("sms") && (
                  <a 
                    href={getSmsLink(requestSuccessData)}
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
                      {requestSuccessData.phone} ↗
                    </span>
                  </a>
                )}

                {/* Email Button */}
                {requestSuccessData.channels.includes("email") && (
                  <a 
                    href={getEmailLink(requestSuccessData)}
                    target="_blank"
                    rel="noopener noreferrer"
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
                      <span>{lang === "ta" ? "Google Mail மூலம் அனுப்புக / Send Email" : "Send Email Dispatch"}</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.18)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                      {requestSuccessData.email} ↗
                    </span>
                  </a>
                )}

                {/* Copy Details Fallback Button */}
                <button
                  type="button"
                  onClick={() => copyDetailsToClipboard(requestSuccessData)}
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
                  <span>{lang === "ta" ? "விவரங்களை நகலெடு (Copy Message & Details)" : "Copy Message & Dispatch Details"}</span>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={onClose}
                style={{ padding: "0.6rem 1.5rem", borderRadius: "10px" }}
              >
                {lang === "ta" ? "✓ முடிந்தது (Done)" : "✓ Done / Close"}
              </button>
            </div>
          </div>
        ) : (
          /* ASSISTANCE REQUEST FORM */
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>{t.seniors}</label>
              <select
                value={formData.seniorId}
                onChange={(e) => handleSeniorChange(e.target.value)}
              >
                {seniors.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (🏡 {s.address ? s.address.split(",").slice(-2).join(",").trim() : "Home Residence"})
                  </option>
                ))}
              </select>
            </div>

            <label className="form-section-title">{t.category}</label>
            <div className="category-select-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {categories.map((c) => {
                const Icon = c.icon;
                const isActive = formData.category === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`category-chip ${isActive ? "active" : ""}`}
                    onClick={() => setFormData({ ...formData, category: c.id })}
                    style={{
                      background: c.isEmergency && isActive ? "#ef4444" : undefined,
                      color: c.isEmergency && isActive ? "#fff" : undefined,
                      borderColor: c.isEmergency ? "#ef4444" : undefined
                    }}
                  >
                    <Icon size={16} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Emergency Alert Notice Banner */}
            {isEmergencySelected ? (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "0.85rem", marginTop: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444", fontWeight: "700" }}>
                  <ShieldAlert size={18} />
                  <span>{lang === "ta" ? "அவசர உதவிக்கு எந்த கூடுதல் விபரமும் தேவையில்லை" : "Zero Form Details Required for Emergency"}</span>
                </div>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  {lang === "ta" 
                    ? "உடனே 'அவசர உதவி கோருக' பட்டனை அழுத்தவும். பராமரிப்பாளர், செவிலியர் மற்றும் குடும்பத்திற்கு WhatsApp, SMS மூலம் எச்சரிக்கை செல்லும்."
                    : "Click Submit to immediately broadcast high-priority SOS emergency dispatch without asking questions."}
                </p>
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label>{lang === "ta" ? "கோரிக்கை தலைப்பு *" : "Request Title *"}</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={
                      formData.category === "Transportation"
                        ? (lang === "ta" ? "எ.கா. அப்பல்லோ மருத்துவமனைக்கு செல்ல கார் உதவி" : "e.g. Need cab ride to Apollo Clinic at 10 AM")
                        : (lang === "ta" ? "எ.கா. மாதாந்திர இதய பரிசோதனைக்கு உடன் வர ஆள் தேவை" : "e.g. Hospital escort for cardiology check-up")
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    {lang === "ta" ? "விபரங்கள் (Description - கட்டாயம்) *" : "Detailed Requirements (Required) *"}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={
                      formData.category === "Transportation"
                        ? (lang === "ta" ? "பயணிக்க வேண்டிய இடம், நேரம் மற்றும் உதவி விபரங்களை குறிப்பிடவும்..." : "Please specify destination address, wheelchair need, and departure time...")
                        : (lang === "ta" ? "மருத்துவமனை பெயர், மருத்துவர் நேரம், உடன் வர வேண்டிய விபரங்களை குறிப்பிடவும்..." : "Please describe the clinic name, department, consultation slot, and escort needs...")
                    }
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-main)" }}
                  />
                </div>

                <div className="form-group">
                  <label>{t.priority}</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </>
            )}

            {/* Recipient Phone and Email Inputs (Prompting mobile number and email) */}
            <div style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.18)", padding: "0.85rem 1rem", borderRadius: "12px", margin: "0.85rem 0" }}>
              <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--primary)", marginBottom: "0.6rem" }}>
                <Phone size={15} />
                <span>{lang === "ta" ? "தொடர்பு எண்கள் & அறிவிப்பு முகவரி (WhatsApp / SMS / Email):" : "Recipient Contact for Live Updates (WhatsApp / SMS / Email):"}</span>
              </strong>

              <div className="form-row-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>
                    📱 {lang === "ta" ? "மொபைல் எண் (WhatsApp & SMS) *" : "Mobile Number (WhatsApp & SMS) *"}
                  </label>
                  <input 
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 98765 00003"
                    required
                    style={{ fontSize: "0.88rem" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>
                    📧 {lang === "ta" ? "மின்னஞ்சல் முகவரி (Google Mail) *" : "Email Address (Google Mail) *"}
                  </label>
                  <input 
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="family@seniorcare.local"
                    required
                    style={{ fontSize: "0.88rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Notification Channels Options - Prompted to User */}
            <div className="form-group" style={{ marginTop: "0.5rem" }}>
              <label style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>{lang === "ta" ? "தகவல் அனுப்பப்பட வேண்டிய வழிகள்:" : "Send Updates & Dispatch Alerts via:"}</span>
              </label>
              <div className="notification-channels-selector" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginTop: "0.3rem" }}>
                <label className={`channel-toggle-chip ${channels.whatsapp ? "active" : ""}`} onClick={() => toggleChannel("whatsapp")}>
                  <input type="checkbox" checked={channels.whatsapp} onChange={() => {}} style={{ display: "none" }} />
                  <span className="channel-icon">💬</span>
                  <span className="channel-title">WhatsApp</span>
                  {channels.whatsapp && <span className="channel-check">✓</span>}
                </label>

                <label className={`channel-toggle-chip ${channels.sms ? "active" : ""}`} onClick={() => toggleChannel("sms")}>
                  <input type="checkbox" checked={channels.sms} onChange={() => {}} style={{ display: "none" }} />
                  <span className="channel-icon">📱</span>
                  <span className="channel-title">SMS</span>
                  {channels.sms && <span className="channel-check">✓</span>}
                </label>

                <label className={`channel-toggle-chip ${channels.email ? "active" : ""}`} onClick={() => toggleChannel("email")}>
                  <input type="checkbox" checked={channels.email} onChange={() => {}} style={{ display: "none" }} />
                  <span className="channel-icon">📧</span>
                  <span className="channel-title">Email</span>
                  {channels.email && <span className="channel-check">✓</span>}
                </label>
              </div>
            </div>

            <div className="modal-actions-row" style={{ marginTop: "1.25rem" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                {t.cancel}
              </button>
              <button 
                type="submit" 
                className={isEmergencySelected ? "btn-emergency-danger" : "btn-primary"} 
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                {isEmergencySelected ? <ShieldAlert size={18} /> : <HandHeart size={18} />}
                <span>
                  {loading 
                    ? t.loading 
                    : (isEmergencySelected 
                        ? (lang === "ta" ? "🚨 உடனடி அவசர உதவி கோருக" : "🚨 Dispatch Instant Emergency") 
                        : (lang === "ta" ? "உதவி கோரிக்கை அனுப்புக" : t.requestAssistance))}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { 
  AlertOctagon, X, PhoneCall, ShieldAlert, Check, Zap, 
  Sparkles, CheckCircle2, MessageSquare, Copy, Send, Phone, Mail 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";
import { getGmailComposeUrl } from "../../utils/mailHelper";

export default function EmergencyModal({ isOpen, onClose, onEmergencyTriggered }) {
  const { t, lang, user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("Home / Bedside");
  const [notes, setNotes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Associated Contacts
  const [contacts, setContacts] = useState({
    caretaker: {
      name: "Anitha Krishnan (Caregiver)",
      phone: "+91 6382598599",
      email: "caretaker.test@seniorcare.local",
      role: "caretaker"
    },
    volunteer: {
      name: "Karthik Raman (Volunteer)",
      phone: "+91 9443324444",
      email: "volunteer.test@seniorcare.local",
      role: "volunteer"
    },
    familyMember: {
      name: "Ashmitha / Priya (Family)",
      phone: "+91 9080578504",
      email: "family.test@seniorcare.local",
      role: "family_member"
    }
  });

  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: true
  });

  // Success view state with direct dispatch action buttons
  const [emergencySuccessData, setEmergencySuccessData] = useState(null);
  const [activeContactKey, setActiveContactKey] = useState("caretaker");

  useEffect(() => {
    if (isOpen) {
      setEmergencySuccessData(null);
      setActiveContactKey("caretaker");
      api.get("/seniors/contacts/default")
        .then((res) => {
          if (res.data?.contacts) {
            setContacts(res.data.contacts);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleChannel = (key) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const triggerInstantSOS = async () => {
    setLoading(true);
    const activeChannels = Object.keys(channels).filter(k => channels[k]);
    try {
      const res = await api.post("/emergencies", {
        location: location || "Resident Bedside / Home",
        notes: notes || (lang === "ta" ? "🚨 உடனடி அவசர உதவி கோரப்பட்டது (Instant SOS Triggered)" : "🚨 Immediate emergency alert initiated by resident — immediate dispatch"),
        severity: "critical",
        channels: activeChannels
      });

      const em = res.data.emergency;
      showToast(
        lang === "ta"
          ? `🚨 உடனடி அவசர எச்சரிக்கை அனுப்பப்பட்டது (${em?.emergencyCode})! WhatsApp, SMS, மற்றும் Google Mail வழியாக தயார்.`
          : `🚨 Instant Emergency Alert dispatched (${em?.emergencyCode})! WhatsApp, SMS, and Email ready.`,
        "emergency",
        8000
      );

      if (onEmergencyTriggered) onEmergencyTriggered(em);

      // Show the multi-channel dispatch screen
      setEmergencySuccessData({
        emergency: em,
        contacts,
        location: location || "Resident Bedside / Home",
        notes: notes || "Immediate emergency alert initiated by resident"
      });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to trigger emergency", "error");
    } finally {
      setLoading(false);
    }
  };

  const getActiveContact = () => {
    return contacts[activeContactKey] || contacts.caretaker;
  };

  // Generate Direct Action Links for any contact
  const getWhatsAppLink = (em, contact) => {
    let cleanPhone = (contact?.phone || "916382598599").replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    const msg = encodeURIComponent(
      `🚨 *EMERGENCY SOS ALERT - SeniorCare*\n\n` +
      `Incident Code: *${em?.emergencyCode || "EMG-1024"}*\n` +
      `Resident: *${em?.seniorName || "Bhavana Lakshmi"}*\n` +
      `Location: *${em?.location || location}*\n` +
      `Severity: *CRITICAL (IMMEDIATE RESPONSE)*\n` +
      `To: *${contact?.name || "Care Team"} (${contact?.role || "Team"})*\n` +
      `Note: *${em?.notes || notes || "Urgent assistance requested"}*\n\n` +
      `_SeniorCare 24/7 Geriatric Emergency Response_`
    );
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
  };

  const getSmsLink = (em, contact) => {
    const cleanPhone = (contact?.phone || "+916382598599").replace(/[^0-9+]/g, "");
    const body = encodeURIComponent(
      `EMERGENCY ALERT: ${em?.emergencyCode} for ${em?.seniorName} at ${em?.location || location}. Immediate assistance required!`
    );
    return `sms:${cleanPhone}?body=${body}`;
  };

  const getEmailLink = (em, contact) => {
    const subject = `🚨 CRITICAL EMERGENCY ALERT: ${em?.seniorName || "Resident"} (${em?.emergencyCode || "EMG"})`;
    const body = 
      `Hello,\n\nAn emergency alert has been activated at SeniorCare.\n\nResident: ${em?.seniorName || "Resident"}\nIncident Code: ${em?.emergencyCode || "EMG"}\nLocation: ${em?.location || location}\nSeverity: CRITICAL\nRecipient: ${contact?.name || "Care Team"}\nNotes: ${em?.notes || notes || "Immediate response required"}\n\nPlease attend immediately.\n\nSeniorCare Medical Network`;
    return getGmailComposeUrl({
      to: contact?.email || "bhavanalakshmi12006@gmail.com",
      subject,
      body
    });
  };

  const copyDetailsToClipboard = (em, contact) => {
    const text = 
      `🚨 EMERGENCY SOS ALERT - SeniorCare\n` +
      `Incident: ${em?.emergencyCode}\n` +
      `Resident: ${em?.seniorName}\n` +
      `Location: ${em?.location || location}\n` +
      `Severity: CRITICAL\n` +
      `Contact: ${contact?.name} (${contact?.phone})\n` +
      `Status: Dispatched`;
    navigator.clipboard.writeText(text).then(() => {
      showToast(lang === "ta" ? "விவரங்கள் நகலெடுக்கப்பட்டது!" : "Copied emergency details to clipboard!", "success");
    }).catch(() => {
      showToast("Copied details!", "info");
    });
  };

  const currentContact = getActiveContact();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-dialog emergency-modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 560, borderRadius: "16px" }}
      >
        <div className="emergency-modal-header">
          <div className="emergency-icon-circle pulse-danger">
            <AlertOctagon size={36} />
          </div>
          <button className="modal-close-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {emergencySuccessData ? (
          /* SUCCESS SCREEN WITH DIRECT WHATSAPP / SMS / EMAIL TO CARETAKER, VOLUNTEER, FAMILY */
          <div className="modal-body text-center" style={{ padding: "0.5rem 0" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "14px", padding: "1.25rem", marginBottom: "1rem" }}>
              <CheckCircle2 size={42} className="text-danger" style={{ margin: "0 auto 0.4rem" }} />
              <h3 style={{ margin: "0 0 0.25rem", color: "#b91c1c", fontSize: "1.25rem", fontWeight: "800" }}>
                {lang === "ta" ? "🚨 அவசர எச்சரிக்கை அனுப்பப்பட்டது!" : "🚨 Emergency SOS Dispatched!"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#991b1b" }}>
                Incident: <strong>{emergencySuccessData.emergency?.emergencyCode || "EMG-1024"}</strong> · Resident: <strong>{emergencySuccessData.emergency?.seniorName || "Senior"}</strong>
              </p>
              <div style={{ fontSize: "0.82rem", marginTop: "0.3rem", color: "var(--text-muted, #64748b)" }}>
                📍 {emergencySuccessData.location}
              </div>
            </div>

            {/* INSTANT 1-CLICK ACTION CARDS FOR CARETAKER, VOLUNTEER, FAMILY */}
            <div style={{ textAlign: "left", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.84rem", fontWeight: "800", color: "var(--text-main, #0f172a)", margin: 0 }}>
                  ⚡ {lang === "ta" ? "உடனடி WhatsApp / SMS எச்சரிக்கை அனுப்புக (1-Click Dispatch):" : "1-Click Direct Notification to Emergency Contacts:"}
                </label>
                <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "700" }}>
                  ● Instant Links Ready
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {/* 1. CARETAKER */}
                <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "1rem" }}>👩‍⚕️</span>
                      <strong style={{ fontSize: "0.86rem", color: "var(--text-main, #0f172a)" }}>
                        {contacts.caretaker?.name || "Anitha Krishnan (Caregiver)"}
                      </strong>
                    </div>
                    <small style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", display: "block" }}>
                      Caretaker · {contacts.caretaker?.phone || "+91 6382598599"}
                    </small>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a
                      href={getWhatsAppLink(emergencySuccessData.emergency, contacts.caretaker)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.45rem 0.75rem",
                        borderRadius: "8px",
                        background: "#25D366",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        textDecoration: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(37,211,102,0.3)"
                      }}
                      title="Send WhatsApp Alert to Caretaker"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                    <a
                      href={getSmsLink(emergencySuccessData.emergency, contacts.caretaker)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.45rem 0.65rem",
                        borderRadius: "8px",
                        background: "#2563eb",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        textDecoration: "none",
                        cursor: "pointer"
                      }}
                      title="Send SMS to Caretaker"
                    >
                      <span>📱 SMS</span>
                    </a>
                  </div>
                </div>

                {/* 2. VOLUNTEER */}
                <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "1rem" }}>🤝</span>
                      <strong style={{ fontSize: "0.86rem", color: "var(--text-main, #0f172a)" }}>
                        {contacts.volunteer?.name || "Karthik Raman (Volunteer)"}
                      </strong>
                    </div>
                    <small style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", display: "block" }}>
                      Volunteer · {contacts.volunteer?.phone || "+91 9443324444"}
                    </small>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a
                      href={getWhatsAppLink(emergencySuccessData.emergency, contacts.volunteer)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.45rem 0.75rem",
                        borderRadius: "8px",
                        background: "#25D366",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        textDecoration: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(37,211,102,0.3)"
                      }}
                      title="Send WhatsApp Alert to Volunteer"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                    <a
                      href={getSmsLink(emergencySuccessData.emergency, contacts.volunteer)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.45rem 0.65rem",
                        borderRadius: "8px",
                        background: "#2563eb",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        textDecoration: "none",
                        cursor: "pointer"
                      }}
                      title="Send SMS to Volunteer"
                    >
                      <span>📱 SMS</span>
                    </a>
                  </div>
                </div>

                {/* 3. FAMILY MEMBER */}
                <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "1rem" }}>👨‍👩‍👧</span>
                      <strong style={{ fontSize: "0.86rem", color: "var(--text-main, #0f172a)" }}>
                        {contacts.familyMember?.name || "Ashmitha / Priya (Family)"}
                      </strong>
                    </div>
                    <small style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", display: "block" }}>
                      Family Member · {contacts.familyMember?.phone || "+91 9080578504"}
                    </small>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a
                      href={getWhatsAppLink(emergencySuccessData.emergency, contacts.familyMember)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.45rem 0.75rem",
                        borderRadius: "8px",
                        background: "#25D366",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        textDecoration: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(37,211,102,0.3)"
                      }}
                      title="Send WhatsApp Alert to Family Member"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                    <a
                      href={getSmsLink(emergencySuccessData.emergency, contacts.familyMember)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.45rem 0.65rem",
                        borderRadius: "8px",
                        background: "#2563eb",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        textDecoration: "none",
                        cursor: "pointer"
                      }}
                      title="Send SMS to Family Member"
                    >
                      <span>📱 SMS</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button
                type="button"
                onClick={() => copyDetailsToClipboard(emergencySuccessData.emergency, contacts.caretaker)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  background: "var(--bg-subtle, #f8fafc)",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  color: "var(--text-main, #334155)",
                  fontWeight: "600",
                  fontSize: "0.82rem",
                  cursor: "pointer"
                }}
              >
                <Copy size={14} />
                <span>{lang === "ta" ? "📋 விவரங்களை நகலெடு" : "📋 Copy Details"}</span>
              </button>

              <a
                href={getEmailLink(emergencySuccessData.emergency, contacts.caretaker)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  background: "rgba(234, 88, 12, 0.08)",
                  border: "1px solid rgba(234, 88, 12, 0.25)",
                  color: "#ea580c",
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  textDecoration: "none",
                  cursor: "pointer"
                }}
              >
                <Mail size={14} />
                <span>{lang === "ta" ? "📧 Google Mail" : "📧 Send Email"}</span>
              </a>
            </div>

            <button 
              type="button" 
              className="btn-primary" 
              onClick={onClose}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "10px" }}
            >
              {lang === "ta" ? "✓ முடிந்தது (Done / Close)" : "✓ Done / Close"}
            </button>
          </div>
        ) : (
          /* PRE-TRIGGER SOS SCREEN */
          <div className="modal-body text-center">
            <h2 className="modal-danger-title" style={{ fontSize: "1.4rem" }}>
              {lang === "ta" ? "🚨 அவசர உதவி மையம் (Emergency SOS)" : "🚨 Instant Emergency SOS"}
            </h2>
            <p className="modal-desc" style={{ fontSize: "0.92rem", marginBottom: "1.25rem" }}>
              {lang === "ta" 
                ? "எந்த படிவமும் நிரப்ப தேவையில்லை. கீழே உள்ள உடனடி SOS பட்டனை அழுத்தவும்." 
                : "No questions or forms required. Click the button below for immediate care dispatch."}
            </p>

            {/* GIANT INSTANT 1-CLICK SOS BUTTON */}
            <button
              type="button"
              className="btn-emergency-danger pulse-danger"
              onClick={triggerInstantSOS}
              disabled={loading}
              style={{ 
                width: "100%", 
                padding: "1.1rem", 
                fontSize: "1.15rem", 
                fontWeight: "800",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: "0.6rem", 
                borderRadius: "14px",
                boxShadow: "0 6px 24px rgba(239, 68, 68, 0.45)",
                marginBottom: "1.25rem",
                border: "none",
                cursor: "pointer"
              }}
            >
              <Zap size={24} />
              <span>
                {loading 
                  ? (lang === "ta" ? "அவசர உதவி அனுப்பப்படுகிறது..." : "Dispatching Emergency Teams...") 
                  : (lang === "ta" ? "⚡ உடனடி அவசர உதவி (INSTANT SOS)" : "⚡ TRIGGER INSTANT SOS NOW")}
              </span>
            </button>

            {/* Associated Contacts Who Will Receive the Alert */}
            <div style={{ textAlign: "left", background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "0.85rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "0.4rem", color: "var(--text-main, #0f172a)" }}>
                {lang === "ta" ? "அறிவிக்கப்படும் பொறுப்பாளர்கள் (Associated Contacts):" : "Associated Contacts to be Alerted:"}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>👩‍⚕️ <strong>Caretaker:</strong> {contacts.caretaker?.name}</span>
                  <span style={{ color: "#2563eb", fontWeight: "600" }}>{contacts.caretaker?.phone}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>🤝 <strong>Volunteer:</strong> {contacts.volunteer?.name}</span>
                  <span style={{ color: "#2563eb", fontWeight: "600" }}>{contacts.volunteer?.phone}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>👨‍👩‍👧 <strong>Family Member:</strong> {contacts.familyMember?.name}</span>
                  <span style={{ color: "#2563eb", fontWeight: "600" }}>{contacts.familyMember?.phone}</span>
                </div>
              </div>
            </div>

            {/* Channels Checklist */}
            <div className="emergency-notify-checklist" style={{ textAlign: "left", marginBottom: "1rem" }}>
              <div className="checklist-item" onClick={() => toggleChannel("whatsapp")} style={{ cursor: "pointer" }}>
                <Check size={16} className={channels.whatsapp ? "text-success" : "text-muted"} />
                <span>📱 <strong>WhatsApp</strong> {lang === "ta" ? "பராமரிப்பாளர் & குடும்பத்திற்கு நேரலை எச்சரிக்கை" : "Caregiver, Volunteer & Family Instant Alert"}</span>
              </div>
              <div className="checklist-item" onClick={() => toggleChannel("sms")} style={{ cursor: "pointer" }}>
                <Check size={16} className={channels.sms ? "text-success" : "text-muted"} />
                <span>💬 <strong>SMS Gateway</strong> {lang === "ta" ? "முன்னுரிமை அவசர தகவல் அனுப்பப்படும்" : "Priority Dispatch to On-duty Staff"}</span>
              </div>
              <div className="checklist-item" onClick={() => toggleChannel("email")} style={{ cursor: "pointer" }}>
                <Check size={16} className={channels.email ? "text-success" : "text-muted"} />
                <span>📧 <strong>Google Mail</strong> {lang === "ta" ? "மருத்துவ அறிக்கை எச்சரிக்கை" : "Formal Incident Alert & GPS Location"}</span>
              </div>
            </div>

            {/* Optional Details Toggle */}
            <div style={{ textAlign: "left", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "0.75rem" }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ fontSize: "0.82rem", color: "var(--text-muted, #64748b)" }}
              >
                {showAdvanced ? "▲ " : "▼ "}
                {lang === "ta" ? "விருப்பப்படி இடம் / குறிப்பு சேர்க்க (Optional Details)" : "Add optional location or notes"}
              </button>

              {showAdvanced && (
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: "600", display: "block" }}>{t.location}</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={lang === "ta" ? "எ.கா. இல்லம் - வரவேற்பறை, படுக்கையறை, சமையலறை" : "e.g. Home - Living Room, Bedroom, Kitchen, Adyar"}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: "600", display: "block" }}>{t.notes}</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Sudden dizziness, chest pain"
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ width: "100%" }}>
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

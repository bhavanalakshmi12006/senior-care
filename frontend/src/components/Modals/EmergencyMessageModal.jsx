import React, { useState, useEffect } from "react";
import { 
  AlertOctagon, X, Phone, Mail, MessageSquare, Send, 
  Copy, CheckCircle2, ShieldAlert, User, Users, HeartHandshake, Check, Sparkles 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

const formatWhatsAppPhone = (rawPhone) => {
  let clean = (rawPhone || "").replace(/[^0-9]/g, "");
  if (clean.length === 10) clean = "91" + clean;
  return clean || "916382598599";
};

export default function EmergencyMessageModal({ isOpen, onClose, emergency }) {
  const { lang, t, user } = useAuth();
  const { showToast } = useToast();

  const [loadingContacts, setLoadingContacts] = useState(false);
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

  const [selectedRecipientKey, setSelectedRecipientKey] = useState("caretaker");
  const [recipientPhone, setRecipientPhone] = useState("+91 6382598599");
  const [recipientEmail, setRecipientEmail] = useState("caretaker.test@seniorcare.local");
  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: true
  });
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && emergency) {
      setLoadingContacts(true);
      const targetId = emergency.seniorId?._id || emergency.seniorId || "default";

      api.get(`/seniors/${targetId}/contacts`)
        .then((res) => {
          if (res.data?.contacts) {
            setContacts(res.data.contacts);
            const initialContact = res.data.contacts[selectedRecipientKey] || res.data.contacts.caretaker;
            if (initialContact) {
              setRecipientPhone(initialContact.phone || "+91 6382598599");
              setRecipientEmail(initialContact.email || "caretaker.test@seniorcare.local");
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingContacts(false);
        });

      const defaultMsg = lang === "ta"
        ? `🚨 *அவசர உதவி எச்சரிக்கை (SeniorCare SOS)*\n\n` +
          `உறுப்பினர்: *${emergency.seniorName}*\n` +
          `குறியீடு: *${emergency.emergencyCode}*\n` +
          `இடம்: *${emergency.location || "முதியவர் இல்லம் (Home Residence)"}*\n` +
          `நிலை: *தீவிர அவசரம் (CRITICAL)*\n` +
          `குறிப்பு: *${emergency.notes || "உடனடி உதவி தேவைப்படுகிறது"}*\n\n` +
          `_SeniorCare 24/7 அவசர மீட்புக் குழு, சென்னை_`
        : `🚨 *EMERGENCY SOS ALERT - SeniorCare*\n\n` +
          `Resident: *${emergency.seniorName}*\n` +
          `Incident Code: *${emergency.emergencyCode}*\n` +
          `Location: *${emergency.location || "Home Residence (Adyar)"}*\n` +
          `Severity: *CRITICAL (IMMEDIATE RESPONSE)*\n` +
          `Details: *${emergency.notes || "Urgent assistance required immediately"}*\n\n` +
          `_SeniorCare Emergency Response Network_`;
      setCustomMessage(defaultMsg);
    }
  }, [isOpen, emergency, lang]);

  if (!isOpen || !emergency) return null;

  const handleSelectRecipient = (key) => {
    setSelectedRecipientKey(key);
    const target = contacts[key];
    if (target) {
      setRecipientPhone(target.phone || "");
      setRecipientEmail(target.email || "");
    }
  };

  const toggleChannel = (key) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Direct WhatsApp link for a specific contact
  const getWhatsAppLinkFor = (contact) => {
    const clean = formatWhatsAppPhone(contact?.phone || recipientPhone);
    const toName = contact?.name || "Care Associate";
    const msg = encodeURIComponent(
      `🚨 *EMERGENCY SOS ALERT - SeniorCare*\n\n` +
      `Resident: *${emergency.seniorName}*\n` +
      `Incident Code: *${emergency.emergencyCode}*\n` +
      `Location: *${emergency.location || "Home Residence (Adyar)"}*\n` +
      `Severity: *CRITICAL (IMMEDIATE)*\n` +
      `Alert Sent To: *${toName}*\n` +
      `Note: *${emergency.notes || "Immediate assistance requested"}*\n\n` +
      `_SeniorCare Emergency Response Team_`
    );
    return `https://api.whatsapp.com/send?phone=${clean}&text=${msg}`;
  };

  const getSmsLinkFor = (contact) => {
    const clean = (contact?.phone || recipientPhone || "+916382598599").replace(/[^0-9+]/g, "");
    const body = encodeURIComponent(
      `EMERGENCY ALERT: ${emergency.emergencyCode} for ${emergency.seniorName} at ${emergency.location}. Immediate response required!`
    );
    return `sms:${clean}?body=${body}`;
  };

  const getEmailLinkFor = (contact) => {
    const subject = encodeURIComponent(`🚨 CRITICAL EMERGENCY ALERT: ${emergency.seniorName} (${emergency.emergencyCode})`);
    return `mailto:${contact?.email || recipientEmail || "emergency@seniorcare.local"}?subject=${subject}&body=${encodeURIComponent(customMessage)}`;
  };

  const handleServerDispatch = async (targetKey = selectedRecipientKey) => {
    const activeChannels = Object.keys(channels).filter((k) => channels[k]);
    if (activeChannels.length === 0) {
      showToast(lang === "ta" ? "குறைந்தது ஒரு வழியைத் தேர்ந்தெடுக்கவும்" : "Select at least one channel", "warning");
      return;
    }

    setIsSending(true);
    try {
      const targetContact = contacts[targetKey] || contacts.caretaker;
      const roleName = targetKey === "caretaker" 
        ? "caretaker" 
        : targetKey === "volunteer" 
          ? "volunteer" 
          : "family_member";

      await api.post(`/emergencies/${emergency._id}/send-message`, {
        recipientRole: roleName,
        recipientName: targetContact?.name || "Care Team",
        recipientPhone: (targetContact?.phone || recipientPhone).trim(),
        recipientEmail: (targetContact?.email || recipientEmail).trim(),
        channels: activeChannels,
        customMessage: customMessage.trim()
      });

      showToast(
        lang === "ta" 
          ? `✓ அவசர எச்சரிக்கை அனுப்பப்பட்டது! (${targetContact?.name})` 
          : `✓ Emergency alert dispatched to ${targetContact?.name}!`,
        "success"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to dispatch alert", "error");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customMessage).then(() => {
      showToast(lang === "ta" ? "செய்தி நகலெடுக்கப்பட்டது!" : "Alert message copied to clipboard!", "success");
    }).catch(() => {
      showToast("Copied to clipboard!", "info");
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-dialog large-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 640,
          background: "var(--bg-surface, #ffffff)",
          color: "var(--text-main, #0f172a)",
          borderRadius: "16px",
          border: "1px solid var(--border-color, #e2e8f0)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          padding: "1.75rem"
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert size={26} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main, #0f172a)" }}>
                {lang === "ta" ? "அவசர செய்தி அனுப்புக (Emergency Notification)" : "Send Emergency Alert Message"}
              </h3>
              <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.82rem" }}>
                Incident: <strong>{emergency.emergencyCode}</strong> · Resident: <strong>{emergency.seniorName}</strong>
              </small>
            </div>
          </div>
          <button className="modal-close-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* FAST 1-CLICK DISPATCH CARDS FOR ALL 3 CONTACTS */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--text-main, #0f172a)" }}>
            <span>⚡ {lang === "ta" ? "விரைவு WhatsApp / SMS இணைப்புகள் (1-Click Instant Dispatch):" : "1-Click Direct Notification to Associated Team:"}</span>
            <span style={{ fontSize: "0.74rem", color: "#16a34a", fontWeight: "600" }}>✓ Instant WhatsApp Ready</span>
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {/* 1. CARETAKER CARD */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "10px", padding: "0.65rem 0.85rem" }}>
              <div>
                <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>👩‍⚕️</span>
                  <span>{contacts.caretaker?.name || "Caregiver"}</span>
                </strong>
                <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.76rem" }}>
                  {contacts.caretaker?.phone || "+91 6382598599"}
                </small>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <a
                  href={getWhatsAppLinkFor(contacts.caretaker)}
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
                    cursor: "pointer"
                  }}
                  title="Send via WhatsApp"
                >
                  <span>💬 WhatsApp</span>
                </a>
                <a
                  href={getSmsLinkFor(contacts.caretaker)}
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
                  title="Send via SMS"
                >
                  <span>📱 SMS</span>
                </a>
              </div>
            </div>

            {/* 2. VOLUNTEER CARD */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "10px", padding: "0.65rem 0.85rem" }}>
              <div>
                <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>🤝</span>
                  <span>{contacts.volunteer?.name || "Volunteer"}</span>
                </strong>
                <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.76rem" }}>
                  {contacts.volunteer?.phone || "+91 9443324444"}
                </small>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <a
                  href={getWhatsAppLinkFor(contacts.volunteer)}
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
                    cursor: "pointer"
                  }}
                  title="Send via WhatsApp"
                >
                  <span>💬 WhatsApp</span>
                </a>
                <a
                  href={getSmsLinkFor(contacts.volunteer)}
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
                  title="Send via SMS"
                >
                  <span>📱 SMS</span>
                </a>
              </div>
            </div>

            {/* 3. FAMILY MEMBER CARD */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "10px", padding: "0.65rem 0.85rem" }}>
              <div>
                <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>👨‍👩‍👧</span>
                  <span>{contacts.familyMember?.name || "Family Member"}</span>
                </strong>
                <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.76rem" }}>
                  {contacts.familyMember?.phone || "+91 9080578504"}
                </small>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <a
                  href={getWhatsAppLinkFor(contacts.familyMember)}
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
                    cursor: "pointer"
                  }}
                  title="Send via WhatsApp"
                >
                  <span>💬 WhatsApp</span>
                </a>
                <a
                  href={getSmsLinkFor(contacts.familyMember)}
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
                  title="Send via SMS"
                >
                  <span>📱 SMS</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOM RECIPIENT PHONE / EMAIL OVERRIDE */}
        <div style={{ background: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.18)", borderRadius: "12px", padding: "0.85rem 1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-main, #0f172a)" }}>
              ✏️ {lang === "ta" ? "எண்களை மாற்ற / தனிப்பயனாக்க (Customize Recipient):" : "Customize Recipient Contact Details:"}
            </span>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                type="button"
                onClick={() => handleSelectRecipient("caretaker")}
                style={{ fontSize: "0.74rem", padding: "0.15rem 0.45rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: selectedRecipientKey === "caretaker" ? "#2563eb" : "#fff", color: selectedRecipientKey === "caretaker" ? "#fff" : "inherit", cursor: "pointer" }}
              >
                Caretaker
              </button>
              <button
                type="button"
                onClick={() => handleSelectRecipient("volunteer")}
                style={{ fontSize: "0.74rem", padding: "0.15rem 0.45rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: selectedRecipientKey === "volunteer" ? "#2563eb" : "#fff", color: selectedRecipientKey === "volunteer" ? "#fff" : "inherit", cursor: "pointer" }}
              >
                Volunteer
              </button>
              <button
                type="button"
                onClick={() => handleSelectRecipient("familyMember")}
                style={{ fontSize: "0.74rem", padding: "0.15rem 0.45rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: selectedRecipientKey === "familyMember" ? "#2563eb" : "#fff", color: selectedRecipientKey === "familyMember" ? "#fff" : "inherit", cursor: "pointer" }}
              >
                Family
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+91 98765 00000"
              style={{ width: "100%", padding: "0.5rem 0.65rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", fontWeight: "600", boxSizing: "border-box" }}
            />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@seniorcare.local"
              style={{ width: "100%", padding: "0.5rem 0.65rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", fontWeight: "600", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* MESSAGE PREVIEW */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-main, #0f172a)" }}>
              {lang === "ta" ? "அவசர செய்தி உரை (Alert Text):" : "Alert Message Content:"}
            </label>
            <button 
              type="button" 
              onClick={copyToClipboard}
              style={{ background: "none", border: "none", color: "var(--primary, #2563eb)", fontSize: "0.76rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <Copy size={13} />
              <span>{lang === "ta" ? "நகலெடு" : "Copy"}</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.82rem", boxSizing: "border-box", resize: "vertical" }}
          />
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "0.85rem" }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
            style={{ padding: "0.55rem 1.25rem", borderRadius: "8px" }}
          >
            {t.close || "Close"}
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => handleServerDispatch()}
            disabled={isSending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 1.4rem",
              borderRadius: "8px",
              background: "#ef4444",
              borderColor: "#ef4444"
            }}
          >
            <Send size={15} />
            <span>
              {isSending 
                ? (lang === "ta" ? "அனுப்பப்படுகிறது..." : "Dispatching...") 
                : (lang === "ta" ? "🚀 சர்வர் மூலம் அனுப்பு (Server Dispatch)" : "🚀 Multi-Channel Server Dispatch")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

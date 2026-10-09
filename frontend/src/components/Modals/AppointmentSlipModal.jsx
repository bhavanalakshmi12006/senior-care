import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, X, Phone, Mail, MessageSquare, Send, 
  Copy, CheckCircle2, Hospital, User, Printer, Download, Clock 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function AppointmentSlipModal({ isOpen, onClose, appointment }) {
  const { lang, t, user } = useAuth();
  const { showToast } = useToast();
  const printRef = useRef(null);

  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contacts, setContacts] = useState({
    familyMember: {
      name: "Bhavana Lakshmi (Daughter)",
      phone: "+91 9345403336",
      email: "bhavanalakshmi12006@gmail.com",
      relation: "Daughter",
      role: "family_member"
    },
    caretaker: {
      name: "Anitha Krishnan (Caregiver)",
      phone: "+91 6382598599",
      email: "caretaker.test@seniorcare.local",
      role: "caretaker"
    },
    volunteer: {
      name: "Karthik Raman (Volunteer)",
      phone: "+91 9443327744",
      email: "volunteer.test@seniorcare.local",
      role: "volunteer"
    }
  });

  const [selectedRecipientKey, setSelectedRecipientKey] = useState("familyMember");
  const [recipientPhone, setRecipientPhone] = useState("+91 9345403336");
  const [recipientEmail, setRecipientEmail] = useState("bhavanalakshmi12006@gmail.com");
  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: true
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && appointment) {
      setLoadingContacts(true);
      const snrId = appointment.seniorId?._id || appointment.seniorId || "default";

      api.get(`/seniors/${snrId}/contacts`)
        .then((res) => {
          if (res.data?.contacts) {
            setContacts(res.data.contacts);
            const initial = res.data.contacts.familyMember || res.data.contacts.caretaker;
            if (initial) {
              setRecipientPhone(initial.phone || "+91 9345403336");
              setRecipientEmail(initial.email || "bhavanalakshmi12006@gmail.com");
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingContacts(false);
        });
    }
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

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

  const getActiveContact = () => {
    return contacts[selectedRecipientKey] || contacts.familyMember;
  };

  const activeContact = getActiveContact();
  const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  // Compose text for messaging
  const composeSlipText = () => {
    return (
      `🏥 *SeniorCare Hospital Appointment Confirmation & Slip*\n\n` +
      `Booking Token: *${appointment.appointmentCode}*\n` +
      `Resident: *${appointment.seniorName}*\n` +
      `Doctor: *${appointment.doctorName}* (${appointment.department})\n` +
      `Hospital / Clinic: *${appointment.hospital}*\n` +
      `Date & Slot: *${dateFormatted} at ${appointment.timeSlot}*\n` +
      `Sent To: *${activeContact?.name || "Family"} (${activeContact?.role || "Contact"})*\n` +
      `Status: *${appointment.status || "Confirmed"}*\n\n` +
      `Please arrive 10 minutes prior to scheduled time with ID and previous prescriptions.\n` +
      `_SeniorCare Geriatric Health Center, Chennai_`
    );
  };

  const formatWhatsAppPhone = (rawPhone) => {
    let clean = (rawPhone || "").replace(/[^0-9]/g, "");
    if (clean.length === 10) clean = "91" + clean;
    return clean || "919080578504";
  };

  const getWhatsAppLinkFor = (contact) => {
    const cleanPhone = formatWhatsAppPhone(contact?.phone || recipientPhone);
    const slip = 
      `🏥 *SeniorCare Hospital Appointment Confirmation & Slip*\n\n` +
      `Booking Token: *${appointment.appointmentCode}*\n` +
      `Resident: *${appointment.seniorName}*\n` +
      `Doctor: *${appointment.doctorName}* (${appointment.department})\n` +
      `Hospital / Clinic: *${appointment.hospital}*\n` +
      `Date & Slot: *${dateFormatted} at ${appointment.timeSlot}*\n` +
      `Recipient: *${contact?.name || "Care Associate"}*\n` +
      `Status: *${appointment.status || "Confirmed"}*\n\n` +
      `Please arrive 10 minutes prior to scheduled slot.\n` +
      `_SeniorCare Geriatric Health Center, Chennai_`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(slip)}`;
  };

  const getSmsLinkFor = (contact) => {
    const cleanPhone = (contact?.phone || recipientPhone || "+919080578504").replace(/[^0-9+]/g, "");
    const body = encodeURIComponent(
      `SeniorCare: Appointment ${appointment.appointmentCode} confirmed for ${appointment.seniorName} with ${appointment.doctorName} on ${dateFormatted} at ${appointment.timeSlot} (${appointment.hospital}).`
    );
    return `sms:${cleanPhone}?body=${body}`;
  };

  const getWhatsAppLink = () => {
    return getWhatsAppLinkFor(activeContact);
  };

  const getSmsLink = () => {
    return getSmsLinkFor(activeContact);
  };

  const getEmailLink = () => {
    const subject = encodeURIComponent(`Hospital Appointment Confirmation: ${appointment.doctorName} - ${appointment.seniorName} (${appointment.appointmentCode})`);
    return `mailto:${recipientEmail || "contact@seniorcare.local"}?subject=${subject}&body=${encodeURIComponent(composeSlipText())}`;
  };

  const handleServerDispatch = async () => {
    const activeChannels = Object.keys(channels).filter((k) => channels[k]);
    if (activeChannels.length === 0) {
      showToast(lang === "ta" ? "குறைந்தது ஒரு வழியைத் தேர்ந்தெடுக்கவும்" : "Select at least one channel", "warning");
      return;
    }

    setIsSending(true);
    try {
      const roleName = selectedRecipientKey === "caretaker" 
        ? "caretaker" 
        : selectedRecipientKey === "volunteer" 
          ? "volunteer" 
          : "family_member";

      await api.post(`/appointments/${appointment._id}/send-confirmation`, {
        recipientRole: roleName,
        recipientName: activeContact?.name || "Recipient",
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim(),
        channels: activeChannels
      });

      showToast(
        lang === "ta" 
          ? `✓ சந்திப்பு உறுதி சீட்டு அனுப்பப்பட்டது! (${activeContact?.name})` 
          : `✓ Appointment slip dispatched to ${activeContact?.name}!`,
        "success"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to dispatch confirmation", "error");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(composeSlipText()).then(() => {
      showToast(lang === "ta" ? "விவரங்கள் நகலெடுக்கப்பட்டது!" : "Copied appointment slip to clipboard!", "success");
    }).catch(() => {
      showToast("Copied to clipboard!", "info");
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-dialog large-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 620,
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
            <div style={{ background: "rgba(37, 99, 235, 0.12)", color: "#2563eb", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main, #0f172a)" }}>
                {lang === "ta" ? "மருத்துவ சந்திப்பு ரசீது & உறுதிசெய்தி" : "Hospital Appointment Slip & Confirmation"}
              </h3>
              <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.82rem" }}>
                Token: {appointment.appointmentCode} · Resident: {appointment.seniorName}
              </small>
            </div>
          </div>
          <button className="modal-close-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* PRINTABLE SLIP / SUMMARY CARD */}
        <div 
          ref={printRef}
          style={{ 
            background: "linear-gradient(145deg, rgba(37,99,235,0.05), rgba(16,185,129,0.05))", 
            border: "1px solid rgba(37,99,235,0.2)", 
            borderRadius: "14px", 
            padding: "1.25rem", 
            marginBottom: "1.25rem" 
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.72rem", background: "var(--primary, #2563eb)", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "700" }}>
                {appointment.appointmentCode}
              </span>
              <h4 style={{ margin: "0.4rem 0 0.1rem", fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
                👨‍⚕️ {appointment.doctorName}
              </h4>
              <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.82rem" }}>
                {appointment.department} · {appointment.hospital}
              </small>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className={`status-pill status-${(appointment.status || "upcoming").toLowerCase()}`}>
                {appointment.status || "Upcoming"}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.75rem" }}>
            <div>
              <span style={{ color: "var(--text-muted, #64748b)", display: "block", fontSize: "0.75rem" }}>{lang === "ta" ? "மூத்த உறுப்பினர்" : "Resident"}:</span>
              <strong>{appointment.seniorName}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted, #64748b)", display: "block", fontSize: "0.75rem" }}>{lang === "ta" ? "தேதி & நேரம்" : "Date & Time Slot"}:</span>
              <strong>{dateFormatted} at {appointment.timeSlot}</strong>
            </div>
          </div>
        </div>

        {/* RECIPIENT SELECTION (Family Member, Caretaker, Volunteer) */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.84rem", fontWeight: "700", marginBottom: "0.4rem", color: "var(--text-main, #0f172a)" }}>
            {lang === "ta" ? "ரசீது / உறுதிசெய்தி அனுப்பப்பட வேண்டியவர்:" : "Send Confirmation & Slip To:"}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
            {/* Family Member */}
            <button
              type="button"
              onClick={() => handleSelectRecipient("familyMember")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0.65rem 0.8rem",
                borderRadius: "10px",
                border: selectedRecipientKey === "familyMember" ? "2px solid #2563eb" : "1px solid var(--border-color, #cbd5e1)",
                background: selectedRecipientKey === "familyMember" ? "rgba(37,99,235,0.08)" : "var(--bg-subtle, #f8fafc)",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: "700", fontSize: "0.86rem", color: selectedRecipientKey === "familyMember" ? "#1d4ed8" : "inherit" }}>
                <span>👨‍👩‍👧</span>
                <span>{lang === "ta" ? "குடும்பத்தினர்" : "Family Member"}</span>
              </div>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                {contacts.familyMember?.name || "Priya"}
              </span>
            </button>

            {/* Caretaker */}
            <button
              type="button"
              onClick={() => handleSelectRecipient("caretaker")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0.65rem 0.8rem",
                borderRadius: "10px",
                border: selectedRecipientKey === "caretaker" ? "2px solid #2563eb" : "1px solid var(--border-color, #cbd5e1)",
                background: selectedRecipientKey === "caretaker" ? "rgba(37,99,235,0.08)" : "var(--bg-subtle, #f8fafc)",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: "700", fontSize: "0.86rem", color: selectedRecipientKey === "caretaker" ? "#1d4ed8" : "inherit" }}>
                <span>👩‍⚕️</span>
                <span>{lang === "ta" ? "பராமரிப்பாளர்" : "Caretaker"}</span>
              </div>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                {contacts.caretaker?.name || "Anitha"}
              </span>
            </button>

            {/* Volunteer */}
            <button
              type="button"
              onClick={() => handleSelectRecipient("volunteer")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0.65rem 0.8rem",
                borderRadius: "10px",
                border: selectedRecipientKey === "volunteer" ? "2px solid #2563eb" : "1px solid var(--border-color, #cbd5e1)",
                background: selectedRecipientKey === "volunteer" ? "rgba(37,99,235,0.08)" : "var(--bg-subtle, #f8fafc)",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: "700", fontSize: "0.86rem", color: selectedRecipientKey === "volunteer" ? "#1d4ed8" : "inherit" }}>
                <span>🤝</span>
                <span>{lang === "ta" ? "தன்னார்வலர்" : "Volunteer"}</span>
              </div>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                {contacts.volunteer?.name || "Karthik"}
              </span>
            </button>
          </div>
        </div>

        {/* RECIPIENT PHONE AND EMAIL INPUTS */}
        <div style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "12px", padding: "0.85rem 1rem", marginBottom: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.3rem", color: "var(--text-main, #0f172a)" }}>
                📱 {lang === "ta" ? "மொபைல் எண் (WhatsApp & SMS):" : "Recipient Mobile (WhatsApp & SMS):"}
              </label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+91 98765 00000"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  fontSize: "0.88rem",
                  fontWeight: "600",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.3rem", color: "var(--text-main, #0f172a)" }}>
                📧 {lang === "ta" ? "மின்னஞ்சல் முகவரி (Email):" : "Recipient Email (Google Mail):"}
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="family@seniorcare.local"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  fontSize: "0.88rem",
                  fontWeight: "600",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>
        </div>

        {/* CHANNELS SELECTION */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", marginBottom: "0.4rem", color: "var(--text-main, #0f172a)" }}>
            {lang === "ta" ? "அனுப்பப்பட வேண்டிய வழிகள் (Channels):" : "Dispatch Channels (WhatsApp, SMS, Email):"}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
            <label 
              onClick={() => toggleChannel("whatsapp")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.55rem 0.75rem",
                borderRadius: "8px",
                border: channels.whatsapp ? "2px solid #25D366" : "1px solid var(--border-color, #cbd5e1)",
                background: channels.whatsapp ? "rgba(37,211,102,0.1)" : "var(--bg-subtle, #f8fafc)",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.85rem"
              }}
            >
              <span>💬 WhatsApp</span>
              {channels.whatsapp && <span style={{ color: "#25D366", fontWeight: "800" }}>✓</span>}
            </label>

            <label 
              onClick={() => toggleChannel("sms")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.55rem 0.75rem",
                borderRadius: "8px",
                border: channels.sms ? "2px solid #2563eb" : "1px solid var(--border-color, #cbd5e1)",
                background: channels.sms ? "rgba(37,99,235,0.1)" : "var(--bg-subtle, #f8fafc)",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.85rem"
              }}
            >
              <span>📱 SMS</span>
              {channels.sms && <span style={{ color: "#2563eb", fontWeight: "800" }}>✓</span>}
            </label>

            <label 
              onClick={() => toggleChannel("email")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.55rem 0.75rem",
                borderRadius: "8px",
                border: channels.email ? "2px solid #ea580c" : "1px solid var(--border-color, #cbd5e1)",
                background: channels.email ? "rgba(234,88,12,0.1)" : "var(--bg-subtle, #f8fafc)",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.85rem"
              }}
            >
              <span>📧 Email</span>
              {channels.email && <span style={{ color: "#ea580c", fontWeight: "800" }}>✓</span>}
            </label>
          </div>
        </div>

        {/* FAST 1-CLICK ACTION CARDS FOR ALL 3 ASSOCIATED CONTACTS */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ fontSize: "0.84rem", fontWeight: "800", color: "var(--text-main, #0f172a)", margin: 0 }}>
              ⚡ {lang === "ta" ? "உடனடி WhatsApp / SMS சீட்டு அனுப்புக (1-Click Dispatch):" : "1-Click Direct Notification to Associated Contacts:"}
            </label>
            <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "700" }}>
              ● Instant Links Ready
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {/* 1. FAMILY MEMBER */}
            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "10px", padding: "0.55rem 0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <div>
                <strong style={{ fontSize: "0.86rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>👨‍👩‍👧</span>
                  <span>{contacts.familyMember?.name || "Priya Ramesh"}</span>
                </strong>
                <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.75rem" }}>
                  Family Member · {contacts.familyMember?.phone || "+91 9080578504"}
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

            {/* 2. CARETAKER */}
            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "10px", padding: "0.55rem 0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <div>
                <strong style={{ fontSize: "0.86rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>👩‍⚕️</span>
                  <span>{contacts.caretaker?.name || "Anitha Krishnan"}</span>
                </strong>
                <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.75rem" }}>
                  Caretaker · {contacts.caretaker?.phone || "+91 6382598599"}
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

            {/* 3. VOLUNTEER */}
            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "10px", padding: "0.55rem 0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <div>
                <strong style={{ fontSize: "0.86rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>🤝</span>
                  <span>{contacts.volunteer?.name || "Karthik Raman"}</span>
                </strong>
                <small style={{ color: "var(--text-muted, #64748b)", fontSize: "0.75rem" }}>
                  Volunteer · {contacts.volunteer?.phone || "+91 9443324444"}
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
          </div>
        </div>

          <div style={{ display: "grid", gridTemplateColumns: channels.sms && channels.email ? "1fr 1fr" : "1fr", gap: "0.6rem" }}>
            {channels.sms && (
              <a
                href={getSmsLink()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.65rem 1rem",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "0.86rem",
                  textDecoration: "none",
                  cursor: "pointer"
                }}
              >
                <span>📱</span>
                <span>{lang === "ta" ? "SMS மூலம் அனுப்புக" : "Send SMS Slip"}</span>
              </a>
            )}

            {channels.email && (
              <a
                href={getEmailLink()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.65rem 1rem",
                  borderRadius: "10px",
                  background: "#ea580c",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "0.86rem",
                  textDecoration: "none",
                  cursor: "pointer"
                }}
              >
                <span>📧</span>
                <span>{lang === "ta" ? "Email மூலம் அனுப்புக" : "Send Email Slip"}</span>
              </a>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.2rem" }}>
            <button
              type="button"
              onClick={copyToClipboard}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--bg-subtle, #f8fafc)",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <Copy size={14} />
              <span>{lang === "ta" ? "📋 விவரங்களை நகலெடு" : "📋 Copy Details"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--bg-subtle, #f8fafc)",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <Printer size={14} />
              <span>{lang === "ta" ? "🖨️ அச்சிடுக" : "🖨️ Print Slip"}</span>
            </button>
          </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "1rem" }}>
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
            onClick={handleServerDispatch}
            disabled={isSending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 1.4rem",
              borderRadius: "8px"
            }}
          >
            <Send size={16} />
            <span>
              {isSending 
                ? (lang === "ta" ? "அனுப்பப்படுகிறது..." : "Dispatching...") 
                : (lang === "ta" ? "🚀 சர்வர் மூலம் அனுப்பு (Dispatch)" : "🚀 Multi-Channel Server Dispatch")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

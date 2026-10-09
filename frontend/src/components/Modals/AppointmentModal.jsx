import React, { useState, useEffect } from "react";
import { 
  Calendar, X, Clock, Hospital, User, CheckCircle2, 
  Phone, Mail, MessageSquare, Send, Copy, Users, HeartHandshake 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function AppointmentModal({ isOpen, onClose, onAppointmentCreated }) {
  const { t, lang, user } = useAuth();
  const { showToast } = useToast();
  const [seniors, setSeniors] = useState([]);
  const [formData, setFormData] = useState({
    seniorId: "",
    doctorName: "",
    department: "Cardiology",
    hospital: "Apollo Senior Health Center",
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    timeSlot: "10:30 AM",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  // Associated Contacts for the Selected Senior
  const [contacts, setContacts] = useState({
    familyMember: {
      name: "Ashmitha / Priya (Family)",
      phone: "+91 9080578504",
      email: "family.test@seniorcare.local",
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
      phone: "+91 9443324444",
      email: "volunteer.test@seniorcare.local",
      role: "volunteer"
    }
  });

  const [selectedRecipientKey, setSelectedRecipientKey] = useState("familyMember");

  // Recipient Contact Details for Live Dispatch (prefilled & editable)
  const [recipientPhone, setRecipientPhone] = useState("+91 9080578504");
  const [recipientEmail, setRecipientEmail] = useState("family.test@seniorcare.local");

  // Notification Channels Selection
  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: true
  });

  // Success view state with direct dispatch action buttons
  const [appointmentSuccessData, setAppointmentSuccessData] = useState(null);
  const [activeSuccessContactKey, setActiveSuccessContactKey] = useState("familyMember");

  const fetchContacts = async (snrId) => {
    if (!snrId) return;
    try {
      const res = await api.get(`/seniors/${snrId}/contacts`);
      if (res.data?.contacts) {
        setContacts(res.data.contacts);
        const contact = res.data.contacts[selectedRecipientKey] || res.data.contacts.familyMember;
        if (contact) {
          setRecipientPhone(contact.phone || "+91 9080578504");
          setRecipientEmail(contact.email || "family.test@seniorcare.local");
        }
      }
    } catch (e) {
      // fallback to current
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAppointmentSuccessData(null);
      setSelectedRecipientKey("familyMember");
      setActiveSuccessContactKey("familyMember");
      api.get("/seniors").then((res) => {
        const fetchedSeniors = res.data.seniors || [];
        setSeniors(fetchedSeniors);
        if (fetchedSeniors.length > 0) {
          const first = fetchedSeniors[0];
          setFormData((prev) => ({ ...prev, seniorId: prev.seniorId || first._id }));
          fetchContacts(prev.seniorId || first._id);
        }
      });
    }
  }, [isOpen]);

  const handleSeniorChange = (id) => {
    setFormData((prev) => ({ ...prev, seniorId: id }));
    fetchContacts(id);
  };

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorName.trim() || !formData.appointmentDate) {
      showToast("Doctor Name and Date are required", "warning");
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
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim(),
        channels: activeChannels
      };

      const res = await api.post("/appointments", payload);
      const selectedSenior = seniors.find((s) => s._id === formData.seniorId);
      const seniorName = selectedSenior?.name || "Senior Resident";

      setAppointmentSuccessData({
        appointment: res.data.appointment,
        seniorName,
        doctorName: formData.doctorName,
        department: formData.department,
        hospital: formData.hospital,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        contacts,
        phone: recipientPhone.trim(),
        email: recipientEmail.trim(),
        channels: activeChannels
      });
      setActiveSuccessContactKey(selectedRecipientKey);

      showToast(
        lang === "ta"
          ? `✓ மருத்துவ சந்திப்பு வெற்றிகரமாக திட்டமிடப்பட்டது (${res.data.appointment.appointmentCode})`
          : `✓ Appointment scheduled successfully (${res.data.appointment.appointmentCode})`,
        "success"
      );

      if (onAppointmentCreated) onAppointmentCreated(res.data.appointment);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to schedule appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  // Generate Direct Action Links for any specific contact
  const getWhatsAppLink = (data, contact) => {
    let cleanPhone = (contact?.phone || data.phone || "919080578504").replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    const msg = encodeURIComponent(
      `🏥 *SeniorCare Hospital Appointment Confirmation & Slip*\n\n` +
      `Booking Token: *${data.appointment?.appointmentCode || "APT"}*\n` +
      `Resident: *${data.seniorName}*\n` +
      `Doctor: *${data.doctorName}* (${data.department})\n` +
      `Hospital / Clinic: *${data.hospital}*\n` +
      `Date & Slot: *${data.appointmentDate} at ${data.timeSlot}*\n` +
      `Sent To: *${contact?.name || "Contact"} (${contact?.role || "Team"})*\n` +
      `Status: *Confirmed*\n\n` +
      `Please arrive 10 minutes prior to the appointment slot.\n` +
      `_SeniorCare Geriatric Health Network, Chennai_`
    );
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
  };

  const getSmsLink = (data, contact) => {
    const cleanPhone = (contact?.phone || data.phone || "+919080578504").replace(/[^0-9+]/g, "");
    const body = encodeURIComponent(
      `SeniorCare Alert: Appointment ${data.appointment?.appointmentCode || "APT"} confirmed for ${data.seniorName} with ${data.doctorName} on ${data.appointmentDate} at ${data.timeSlot} at ${data.hospital}. Contact: ${contact?.name}.`
    );
    return `sms:${cleanPhone}?body=${body}`;
  };

  const getEmailLink = (data, contact) => {
    const subject = encodeURIComponent(`SeniorCare Hospital Appointment Confirmation: ${data.doctorName} - ${data.seniorName}`);
    const body = encodeURIComponent(
      `Hello ${contact?.name || ""},\n\nYour appointment has been confirmed.\n\nBooking ID: ${data.appointment?.appointmentCode || "APT"}\nResident: ${data.seniorName}\nDoctor: ${data.doctorName} (${data.department})\nFacility: ${data.hospital}\nSchedule: ${data.appointmentDate} at ${data.timeSlot}\n\nPlease arrive 10 minutes prior.\n\nBest regards,\nSeniorCare Medical Services`
    );
    return `mailto:${contact?.email || data.email || "family@seniorcare.local"}?subject=${subject}&body=${body}`;
  };

  const copyDetailsToClipboard = (data, contact) => {
    const text = 
      `SeniorCare Hospital Appointment Confirmation\n` +
      `Booking ID: ${data.appointment?.appointmentCode || "APT"}\n` +
      `Resident: ${data.seniorName}\n` +
      `Doctor: ${data.doctorName} (${data.department})\n` +
      `Hospital / Clinic: ${data.hospital}\n` +
      `Date & Slot: ${data.appointmentDate} at ${data.timeSlot}\n` +
      `Recipient: ${contact?.name || "Contact"} (${contact?.phone})\n` +
      `Status: Confirmed`;
    navigator.clipboard.writeText(text).then(() => {
      showToast(lang === "ta" ? "விவரங்கள் நகலெடுக்கப்பட்டது! (Copied to clipboard)" : "Copied details to clipboard!", "success");
    }).catch(() => {
      showToast("Copied details!", "info");
    });
  };

  const currentSuccessContact = appointmentSuccessData?.contacts 
    ? (appointmentSuccessData.contacts[activeSuccessContactKey] || appointmentSuccessData.contacts.familyMember)
    : contacts[selectedRecipientKey];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-dialog" 
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
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Calendar size={22} className="text-primary" />
            <h3>{t.scheduleAppointment}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {appointmentSuccessData ? (
          /* SUCCESS & MULTI-CHANNEL DISPATCH ACTIONS CARD WITH RECIPIENT TABS */
          <div style={{ padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ textAlign: "center", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", padding: "1.25rem" }}>
              <CheckCircle2 size={44} className="text-success" style={{ margin: "0 auto 0.5rem" }} />
              <h3 style={{ margin: "0 0 0.25rem", color: "#065f46", fontSize: "1.25rem" }}>
                {lang === "ta" ? "மருத்துவ சந்திப்பு உறுதி செய்யப்பட்டது!" : "Appointment Scheduled & Dispatched!"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#047857" }}>
                Token: <strong>{appointmentSuccessData.appointment?.appointmentCode || "APT"}</strong> · Resident: <strong>{appointmentSuccessData.seniorName}</strong>
              </p>
              <div style={{ fontSize: "0.82rem", marginTop: "0.4rem", color: "var(--text-muted, #64748b)" }}>
                👨‍⚕️ {appointmentSuccessData.doctorName} ({appointmentSuccessData.department}) · 📅 {appointmentSuccessData.appointmentDate} ({appointmentSuccessData.timeSlot})
              </div>
            </div>

            {/* INSTANT 1-CLICK ACTION CARDS FOR FAMILY, CARETAKER, VOLUNTEER */}
            <div style={{ textAlign: "left", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.84rem", fontWeight: "800", color: "var(--text-main, #0f172a)", margin: 0 }}>
                  ⚡ {lang === "ta" ? "உடனடி உறுதிசெய்தி சீட்டு அனுப்புக (1-Click Dispatch):" : "1-Click Send Confirmation Slip (WhatsApp / SMS):"}
                </label>
                <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "700" }}>
                  ● Instant Links Ready
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {/* 1. FAMILY MEMBER */}
                <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "1rem" }}>👨‍👩‍👧</span>
                      <strong style={{ fontSize: "0.86rem", color: "var(--text-main, #0f172a)" }}>
                        {appointmentSuccessData.contacts?.familyMember?.name || "Priya Ramesh (Daughter)"}
                      </strong>
                    </div>
                    <small style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", display: "block" }}>
                      Family Member · {appointmentSuccessData.contacts?.familyMember?.phone || appointmentSuccessData.phone}
                    </small>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a
                      href={getWhatsAppLink(appointmentSuccessData, appointmentSuccessData.contacts?.familyMember)}
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
                      title="Send Slip to Family via WhatsApp"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                    <a
                      href={getSmsLink(appointmentSuccessData, appointmentSuccessData.contacts?.familyMember)}
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
                      title="Send SMS to Family"
                    >
                      <span>📱 SMS</span>
                    </a>
                  </div>
                </div>

                {/* 2. CARETAKER */}
                <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "1rem" }}>👩‍⚕️</span>
                      <strong style={{ fontSize: "0.86rem", color: "var(--text-main, #0f172a)" }}>
                        {appointmentSuccessData.contacts?.caretaker?.name || "Anitha Krishnan (Caregiver)"}
                      </strong>
                    </div>
                    <small style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", display: "block" }}>
                      Caretaker · {appointmentSuccessData.contacts?.caretaker?.phone || "+91 6382598599"}
                    </small>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a
                      href={getWhatsAppLink(appointmentSuccessData, appointmentSuccessData.contacts?.caretaker)}
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
                      title="Send Slip to Caretaker via WhatsApp"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                    <a
                      href={getSmsLink(appointmentSuccessData, appointmentSuccessData.contacts?.caretaker)}
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

                {/* 3. VOLUNTEER */}
                <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "1rem" }}>🤝</span>
                      <strong style={{ fontSize: "0.86rem", color: "var(--text-main, #0f172a)" }}>
                        {appointmentSuccessData.contacts?.volunteer?.name || "Karthik Raman (Volunteer)"}
                      </strong>
                    </div>
                    <small style={{ fontSize: "0.76rem", color: "var(--text-muted, #64748b)", display: "block" }}>
                      Volunteer · {appointmentSuccessData.contacts?.volunteer?.phone || "+91 9443324444"}
                    </small>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a
                      href={getWhatsAppLink(appointmentSuccessData, appointmentSuccessData.contacts?.volunteer)}
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
                      title="Send Slip to Volunteer via WhatsApp"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                    <a
                      href={getSmsLink(appointmentSuccessData, appointmentSuccessData.contacts?.volunteer)}
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
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <button
                type="button"
                onClick={() => copyDetailsToClipboard(appointmentSuccessData, appointmentSuccessData.contacts?.familyMember)}
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
                href={getEmailLink(appointmentSuccessData, appointmentSuccessData.contacts?.familyMember)}
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
          /* APPOINTMENT FORM */
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

            <div className="form-group">
              <label>{t.doctor} *</label>
              <input
                type="text"
                required
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                placeholder="e.g. Dr. S. Kumar, MD"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>{t.department}</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Geriatrics">Geriatrics</option>
                  <option value="Dentistry">Dentistry</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t.hospital}</label>
                <input
                  type="text"
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  placeholder="e.g. City Care Hospital"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>{lang === "ta" ? "சந்திப்பு தேதி *" : "Appointment Date *"}</label>
                <input
                  type="date"
                  required
                  value={formData.appointmentDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{lang === "ta" ? "நேரம்" : "Time Slot"}</label>
                <select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:45 AM">11:45 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>
            </div>

            {/* Recipient Selection Section (Family Member, Caretaker, Volunteer) */}
            <div style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.18)", padding: "0.85rem 1rem", borderRadius: "12px", margin: "0.85rem 0" }}>
              <label style={{ fontSize: "0.84rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--primary, #2563eb)", marginBottom: "0.5rem" }}>
                <Users size={16} />
                <span>{lang === "ta" ? "உறுதிசெய்தி அனுப்ப வேண்டிய நபர் (Family / Caretaker / Volunteer):" : "Send Confirmation & Slip To (Select Recipient):"}</span>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => handleSelectRecipient("familyMember")}
                  style={{
                    padding: "0.55rem 0.6rem",
                    borderRadius: "8px",
                    border: selectedRecipientKey === "familyMember" ? "2px solid #2563eb" : "1px solid var(--border-color, #cbd5e1)",
                    background: selectedRecipientKey === "familyMember" ? "rgba(37,99,235,0.1)" : "#fff",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <strong style={{ display: "block", fontSize: "0.82rem", color: selectedRecipientKey === "familyMember" ? "#1d4ed8" : "inherit" }}>
                    👨‍👩‍👧 Family
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #64748b)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {contacts.familyMember?.name || "Family"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRecipient("caretaker")}
                  style={{
                    padding: "0.55rem 0.6rem",
                    borderRadius: "8px",
                    border: selectedRecipientKey === "caretaker" ? "2px solid #2563eb" : "1px solid var(--border-color, #cbd5e1)",
                    background: selectedRecipientKey === "caretaker" ? "rgba(37,99,235,0.1)" : "#fff",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <strong style={{ display: "block", fontSize: "0.82rem", color: selectedRecipientKey === "caretaker" ? "#1d4ed8" : "inherit" }}>
                    👩‍⚕️ Caretaker
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #64748b)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {contacts.caretaker?.name || "Caretaker"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRecipient("volunteer")}
                  style={{
                    padding: "0.55rem 0.6rem",
                    borderRadius: "8px",
                    border: selectedRecipientKey === "volunteer" ? "2px solid #2563eb" : "1px solid var(--border-color, #cbd5e1)",
                    background: selectedRecipientKey === "volunteer" ? "rgba(37,99,235,0.1)" : "#fff",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <strong style={{ display: "block", fontSize: "0.82rem", color: selectedRecipientKey === "volunteer" ? "#1d4ed8" : "inherit" }}>
                    🤝 Volunteer
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #64748b)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {contacts.volunteer?.name || "Volunteer"}
                  </span>
                </button>
              </div>

              {/* Phone & Email Inputs */}
              <div className="form-row-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600" }}>
                    📱 {lang === "ta" ? "மொபைல் எண் (WhatsApp & SMS) *" : "Mobile Number (WhatsApp & SMS) *"}
                  </label>
                  <input 
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 98765 00003"
                    required
                    style={{ fontSize: "0.86rem" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600" }}>
                    📧 {lang === "ta" ? "மின்னஞ்சல் முகவரி (Google Mail) *" : "Email Address (Google Mail) *"}
                  </label>
                  <input 
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="family@seniorcare.local"
                    required
                    style={{ fontSize: "0.86rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Notification Channels Options */}
            <div className="form-group" style={{ marginTop: "0.5rem" }}>
              <label style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>{lang === "ta" ? "தகவல் அனுப்பப்பட வேண்டிய வழிகள்:" : "Send Updates & Booking Slip via:"}</span>
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

            <div className="form-group">
              <label>{t.notes}</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Follow-up for blood pressure review"
              />
            </div>

            <div className="modal-actions-row" style={{ marginTop: "1.25rem" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                {t.cancel}
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                <Calendar size={18} />
                <span>{loading ? t.loading : t.scheduleAppointment}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

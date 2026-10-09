import React, { useState, useEffect } from "react";
import { 
  Calendar, Plus, CheckCircle, Clock, Hospital, User, Trash2, Check, 
  MessageSquare, Stethoscope, Pill, Activity, ArrowUpRight 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import AppointmentModal from "../components/Modals/AppointmentModal";
import AppointmentSlipModal from "../components/Modals/AppointmentSlipModal";
import ConfirmModal from "../components/Modals/ConfirmModal";
import { openGmailComposer } from "../utils/mailHelper";

export default function AppointmentsView({ onOpenAppointmentModal }) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [cancellingApt, setCancellingApt] = useState(null);
  const [selectedSlipApt, setSelectedSlipApt] = useState(null);
  const [feedbackApt, setFeedbackApt] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [liveEventSignal]);

  const handleMarkCompleted = async (id) => {
    try {
      await api.patch(`/appointments/${id}`, { status: "Completed" });
      showToast(lang === "ta" ? "சந்திப்பு முடிவடைந்தது என குறிக்கப்பட்டது" : "Appointment marked as completed", "success");
      loadAppointments();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancellingApt) return;
    try {
      await api.patch(`/appointments/${cancellingApt._id}`, { status: "Cancelled" });
      showToast(lang === "ta" ? "சந்திப்பு ரத்து செய்யப்பட்டது" : "Appointment cancelled", "info");
      setCancellingApt(null);
      loadAppointments();
    } catch (err) {
      showToast("Failed to cancel appointment", "error");
    }
  };

  const handleShareFeedbackWhatsApp = (apt) => {
    const medSummary = (apt.medicationChanges || [])
      .map(m => `• ${m.medicineName}: ${m.dosage} (${m.changeType}) - ${m.timing || 'Daily'}`)
      .join('\n');
    const msg = encodeURIComponent(
      `🩺 *SeniorCare Doctor Consultation Summary & Tablet Updates*\n\n` +
      `Resident: *${apt.seniorName}*\n` +
      `Doctor: *${apt.doctorName}* (${apt.department})\n` +
      `Hospital: *${apt.hospital}*\n` +
      `Vitals: BP: *${apt.vitalSigns?.bp || '120/80'}*, Pulse: *${apt.vitalSigns?.pulse || 72} bpm*, Sugar: *${apt.vitalSigns?.bloodSugar || '104 mg/dL'}*\n\n` +
      `*Doctor Clinical Advice:*\n"${apt.doctorFeedback}"\n\n` +
      (medSummary ? `*Prescription & Tablet Adjustments:*\n${medSummary}\n\n` : '') +
      `_Dispatched via SeniorCare Support System to Family Member (Bhavana Lakshmi)_`
    );
    window.open(`https://api.whatsapp.com/send?phone=919345403336&text=${msg}`, '_blank');
    showToast(lang === 'ta' ? 'WhatsApp-ல் மருத்துவ சம்மரி பகிரப்பட்டது!' : 'Feedback shared via WhatsApp!', 'success');
  };

  const handleShareFeedbackSms = (apt) => {
    const text = encodeURIComponent(
      `SeniorCare: Consultation summary for ${apt.seniorName} by ${apt.doctorName}. BP: ${apt.vitalSigns?.bp || '120/80'}. Notes: ${apt.doctorFeedback?.slice(0, 80)}... Tablets updated.`
    );
    window.open(`sms:+919345403336?body=${text}`, '_blank');
    showToast(lang === 'ta' ? 'SMS நினைவூட்டல் திறக்கப்பட்டது!' : 'SMS draft opened!', 'info');
  };

  const handleShareFeedbackGmail = (apt) => {
    const medSummary = (apt.medicationChanges || [])
      .map(m => `• ${m.medicineName}: ${m.dosage} (${m.changeType}) - ${m.timing || 'Daily'}`)
      .join('\n');
    const subject = encodeURIComponent(`Doctor Consultation Feedback & Tablet Updates: ${apt.seniorName}`);
    const body = encodeURIComponent(
      `Hello Bhavana Lakshmi,\n\nHere is the official consultation feedback and medication updates for ${apt.seniorName}:\n\n` +
      `Doctor: ${apt.doctorName} (${apt.department})\nFacility: ${apt.hospital}\nSchedule: ${new Date(apt.appointmentDate).toLocaleDateString()} at ${apt.timeSlot}\n\n` +
      `Recorded Vital Signs:\n- BP: ${apt.vitalSigns?.bp || '120/80'}\n- Pulse: ${apt.vitalSigns?.pulse || 72} bpm\n- Blood Sugar: ${apt.vitalSigns?.bloodSugar || '104 mg/dL'}\n- SpO2: ${apt.vitalSigns?.spo2 || 98}%\n\n` +
      `Doctor Clinical Advice:\n"${apt.doctorFeedback}"\n\n` +
      (medSummary ? `Prescription & Tablet Adjustments:\n${medSummary}\n\n` : '') +
      `Best regards,\nSeniorCare Medical Care Network, Chennai`
    );
    openGmailComposer({
      to: "bhavanalakshmi12006@gmail.com",
      subject: `Doctor Consultation Feedback & Tablet Updates: ${apt.seniorName}`,
      body: 
        `Hello Bhavana Lakshmi,\n\nHere is the official consultation feedback and medication updates for ${apt.seniorName}:\n\n` +
        `Doctor: ${apt.doctorName} (${apt.department})\nFacility: ${apt.hospital}\nSchedule: ${new Date(apt.appointmentDate).toLocaleDateString()} at ${apt.timeSlot}\n\n` +
        `Recorded Vital Signs:\n- BP: ${apt.vitalSigns?.bp || '120/80'}\n- Pulse: ${apt.vitalSigns?.pulse || 72} bpm\n- Blood Sugar: ${apt.vitalSigns?.bloodSugar || '104 mg/dL'}\n- SpO2: ${apt.vitalSigns?.spo2 || 98}%\n\n` +
        `Doctor Clinical Advice:\n"${apt.doctorFeedback}"\n\n` +
        (medSummary ? `Prescription & Tablet Adjustments:\n${medSummary}\n\n` : '') +
        `Best regards,\nSeniorCare Medical Care Network, Chennai`
    });
  };

  const filtered = appointments.filter((a) => {
    if (filter === "all") return true;
    return a.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="view-page-container">
      <div className="view-header-bar">
        <div>
          <h2>{t.appointments}</h2>
          <p>{lang === "ta" ? "மூத்த குடிமக்களின் மருத்துவ பரிசோதனைகள் மற்றும் சந்திப்புகள்" : "Scheduled consultations, hospital visits, and reminders"}</p>
        </div>

        <button className="btn-primary" onClick={onOpenAppointmentModal}>
          <Plus size={18} />
          <span>{t.scheduleAppointment}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="view-filter-bar">
        <div className="filter-pills-row">
          <button
            className={`filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {lang === "ta" ? "அனைத்தும்" : "All"} ({appointments.length})
          </button>
          <button
            className={`filter-pill ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            📅 {t.upcoming} ({appointments.filter((a) => a.status === "Upcoming").length})
          </button>
          <button
            className={`filter-pill ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            ✓ {t.completed} ({appointments.filter((a) => a.status === "Completed").length})
          </button>
          <button
            className={`filter-pill ${filter === "cancelled" ? "active" : ""}`}
            onClick={() => setFilter("cancelled")}
          >
            ✕ {t.cancelled} ({appointments.filter((a) => a.status === "Cancelled").length})
          </button>
        </div>
      </div>

      {/* Appointments Cards Grid */}
      <div className="appointments-cards-grid">
        {filtered.length === 0 ? (
          <div className="empty-panel-state col-span-full">{t.noData}</div>
        ) : (
          filtered.map((apt) => (
            <div key={apt._id} className="appointment-card-item">
              <div className="apt-card-top-row">
                <span className="apt-code-tag">{apt.appointmentCode}</span>
                <span className={`status-pill status-${apt.status.toLowerCase()}`}>
                  {apt.status}
                </span>
              </div>

              <div className="apt-card-body">
                <strong className="apt-senior-name">{apt.seniorName}</strong>
                <h4 className="apt-doctor-name">{apt.doctorName}</h4>
                <p className="apt-dept-line">
                  <Hospital size={14} />
                  <span>{apt.department} · {apt.hospital}</span>
                </p>
                <div className="apt-datetime-badge">
                  <Calendar size={14} />
                  <span>{new Date(apt.appointmentDate).toLocaleDateString()} at {apt.timeSlot}</span>
                </div>
                {apt.notes && <p className="apt-notes-text">📝 {apt.notes}</p>}

                {/* Doctor Post-Visit Consultation Feedback & Medication Changes */}
                {apt.doctorFeedback && (
                  <div style={{
                    marginTop: "0.85rem",
                    background: "rgba(2, 132, 199, 0.06)",
                    border: "1.5px solid rgba(2, 132, 199, 0.25)",
                    borderRadius: "10px",
                    padding: "0.85rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                      <strong style={{ fontSize: "0.84rem", color: "#0284c7", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Stethoscope size={15} />
                        <span>{lang === "ta" ? "மருத்துவரின் ஆலோசனை & உடல்நிலை விபரம்:" : "Doctor's Advice & Clinical Notes:"}</span>
                      </strong>
                      {apt.vitalSigns?.bp && (
                        <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.15)", color: "#15803d", padding: "0.15rem 0.5rem", borderRadius: "10px", fontWeight: "700" }}>
                          BP: {apt.vitalSigns.bp} · Pulse: {apt.vitalSigns.pulse || 74} bpm
                        </span>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-main)", fontStyle: "italic", lineHeight: 1.45 }}>
                      “{apt.doctorFeedback}”
                    </p>

                    {apt.medicationChanges && apt.medicationChanges.length > 0 && (
                      <div style={{ marginTop: "0.25rem", borderTop: "1px dashed rgba(2, 132, 199, 0.2)", paddingTop: "0.45rem" }}>
                        <small style={{ fontSize: "0.73rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem", fontWeight: "700" }}>
                          💊 {lang === "ta" ? "மாத்திரை அளவுகள் & மாற்றங்கள் (Tablet mg Updates):" : "Prescription & Tablet Dosage Adjustments:"}
                        </small>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                          {apt.medicationChanges.map((m, mi) => (
                            <span 
                              key={mi} 
                              style={{
                                fontSize: "0.74rem",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "6px",
                                fontWeight: "600",
                                background: m.changeType === "increased" ? "rgba(239, 68, 68, 0.1)" : m.changeType === "new" ? "rgba(168, 85, 247, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                color: m.changeType === "increased" ? "#dc2626" : m.changeType === "new" ? "#7c3aed" : "#16a34a",
                                border: `1px solid ${m.changeType === "increased" ? "#fca5a5" : m.changeType === "new" ? "#d8b4fe" : "#86efac"}`
                              }}
                            >
                              {m.changeType === "increased" ? "🔺 Increased mg: " : m.changeType === "new" ? "✨ New: " : "⏺️ Maintained: "}
                              <strong>{m.medicineName}</strong> {m.dosage} ({m.timing || "Daily"})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 1-Click Direct WhatsApp / SMS / Gmail Sharing to Family Member */}
                    <div style={{
                      marginTop: "0.5rem",
                      borderTop: "1px dashed rgba(2, 132, 199, 0.25)",
                      paddingTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.4rem"
                    }}>
                      <small style={{ fontSize: "0.72rem", color: "#0369a1", fontWeight: "700" }}>
                        📤 {lang === "ta" ? "குடும்பத்தினருக்கு உடனடியாக அனுப்புக (மகள் பாவனா):" : "Share Feedback to Family (Daughter Bhavana):"}
                      </small>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          type="button"
                          onClick={() => handleShareFeedbackWhatsApp(apt)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "6px",
                            background: "#25D366",
                            color: "#fff",
                            border: "none",
                            fontWeight: "700",
                            fontSize: "0.74rem",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(37,211,102,0.25)"
                          }}
                          title="Share consultation summary & tablet dosage changes via WhatsApp"
                        >
                          <span>💬 WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareFeedbackSms(apt)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "6px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            fontWeight: "700",
                            fontSize: "0.74rem",
                            cursor: "pointer"
                          }}
                          title="Send summary SMS to daughter"
                        >
                          <span>📱 SMS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareFeedbackGmail(apt)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "6px",
                            background: "#ea580c",
                            color: "#fff",
                            border: "none",
                            fontWeight: "700",
                            fontSize: "0.74rem",
                            cursor: "pointer"
                          }}
                          title="Send official consultation email to bhavanalakshmi12006@gmail.com"
                        >
                          <span>📧 Gmail</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="apt-card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "8px",
                      background: "rgba(37,211,102,0.1)",
                      color: "#15803d",
                      border: "1px solid #22c55e",
                      fontWeight: "700",
                      fontSize: "0.8rem",
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedSlipApt(apt)}
                    title="Send booking confirmation receipt / slip via WhatsApp, SMS, or Email"
                  >
                    <MessageSquare size={14} />
                    <span>{lang === "ta" ? "ரசீது / சீட்டு அனுப்பு (WhatsApp/SMS)" : "Send Slip (WhatsApp/SMS)"}</span>
                  </button>

                    <button
                      type="button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.4rem 0.75rem",
                        borderRadius: "8px",
                        background: "rgba(2, 132, 199, 0.1)",
                        color: "#0284c7",
                        border: "1px solid #0284c7",
                        fontWeight: "700",
                        fontSize: "0.8rem",
                        cursor: "pointer"
                      }}
                      onClick={() => setFeedbackApt(apt)}
                      title="View, Enter or Share Doctor Consultation Feedback & Tablet changes"
                    >
                      <Stethoscope size={14} />
                      <span>
                        {user?.role === "caregiver" || user?.role === "caretaker" || user?.role === "volunteer"
                          ? (apt.doctorFeedback ? (lang === "ta" ? "மருத்துவர் கருத்து / மாத்திரைகள்" : "Doctor Feedback / Tablets") : (lang === "ta" ? "+ மருத்துவ ஃபீட்பேக் சேர்க்க" : "+ Enter Hospital Feedback"))
                          : (user?.role === "senior_citizen"
                              ? (lang === "ta" ? "மருத்துவர் ஆலோசனை & பகிர்வு" : "Doctor Advice & Share")
                              : (apt.doctorFeedback ? (lang === "ta" ? "மருத்துவர் கருத்து / மாத்திரைகள்" : "Doctor Advice / Tablets") : (lang === "ta" ? "+ ஆலோசனை சேர்க்க" : "+ Add Feedback / Tablets")))}
                      </span>
                    </button>
                </div>

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {apt.status === "Upcoming" && (
                    <>
                      <button
                        className="btn-complete-apt"
                        onClick={() => setFeedbackApt(apt)}
                        title="Complete with Doctor Feedback & Tablet changes"
                      >
                        <Check size={16} />
                        <span>{t.completed}</span>
                      </button>
                      <button
                        className="btn-cancel-apt"
                        onClick={() => setCancellingApt(apt)}
                        title="Cancel"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancellingApt && (
        <ConfirmModal
          isOpen={!!cancellingApt}
          title={lang === "ta" ? "சந்திப்பை ரத்து செய்யவா?" : "Cancel Appointment?"}
          message={`Are you sure you want to cancel appointment ${cancellingApt.appointmentCode} with ${cancellingApt.doctorName}?`}
          onClose={() => setCancellingApt(null)}
          onConfirm={handleCancelAppointment}
        />
      )}

      {/* Appointment Slip Modal */}
      {selectedSlipApt && (
        <AppointmentSlipModal
          isOpen={!!selectedSlipApt}
          appointment={selectedSlipApt}
          onClose={() => setSelectedSlipApt(null)}
        />
      )}

      {/* Doctor Feedback & Tablet Changes Modal */}
      {feedbackApt && (
        <DoctorFeedbackModal
          isOpen={!!feedbackApt}
          appointment={feedbackApt}
          onClose={() => setFeedbackApt(null)}
          onSaved={() => loadAppointments()}
        />
      )}
    </div>
  );
}


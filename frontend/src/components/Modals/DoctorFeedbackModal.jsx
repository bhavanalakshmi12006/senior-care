import React, { useState } from "react";
import { 
  X, Stethoscope, Plus, Trash2, CheckCircle2, AlertCircle, 
  Pill, Activity, MessageSquare, Save, ArrowUpRight, ArrowDownRight, RefreshCw,
  Share2, Send, Mail, Phone, Download
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";
import { openGmailComposer } from "../../utils/mailHelper";

export default function DoctorFeedbackModal({ isOpen, onClose, appointment, onSaved }) {
  const { lang, t, user } = useAuth();
  const { showToast } = useToast();

  const [feedback, setFeedback] = useState(appointment?.doctorFeedback || "");
  const [bp, setBp] = useState(appointment?.vitalSigns?.bp || "120/80");
  const [pulse, setPulse] = useState(appointment?.vitalSigns?.pulse || 72);
  const [bloodSugar, setBloodSugar] = useState(appointment?.vitalSigns?.bloodSugar || "104 mg/dL");
  const [spo2, setSpo2] = useState(appointment?.vitalSigns?.spo2 || 98);

  const [meds, setMeds] = useState(() => {
    if (appointment?.medicationChanges && appointment.medicationChanges.length > 0) {
      return appointment.medicationChanges;
    }
    return [
      {
        medicineName: "Amlodipine",
        dosage: "10mg",
        previousDosage: "5mg",
        changeType: "increased",
        timing: "Morning after breakfast",
        instructions: "Increased from 5mg to 10mg for blood pressure control"
      },
      {
        medicineName: "Metformin",
        dosage: "500mg",
        previousDosage: "500mg",
        changeType: "continued",
        timing: "Morning & Night after meals",
        instructions: "Maintain unchanged"
      }
    ];
  });

  const [saving, setSaving] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleAddMed = () => {
    setMeds([
      ...meds,
      {
        medicineName: "",
        dosage: "10mg",
        previousDosage: "",
        changeType: "new",
        timing: "Morning after food",
        instructions: ""
      }
    ]);
  };

  const handleRemoveMed = (index) => {
    setMeds(meds.filter((_, i) => i !== index));
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...meds];
    updated[index][field] = value;
    setMeds(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        status: "Completed",
        doctorFeedback: feedback,
        vitalSigns: {
          bp,
          pulse: Number(pulse) || 72,
          bloodSugar,
          spo2: Number(spo2) || 98
        },
        medicationChanges: meds.filter(m => m.medicineName.trim() !== "")
      };

      const res = await api.patch(`/appointments/${appointment._id}`, payload);
      showToast(
        lang === "ta" 
          ? "மருத்துவர் கருத்து & மாத்திரை மாற்றங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!" 
          : "Doctor feedback & medication updates saved successfully!",
        "success"
      );
      if (onSaved) onSaved(res.data.appointment || payload);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save feedback", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsapp = () => {
    const medSummary = meds
      .filter(m => m.medicineName.trim())
      .map(m => `• ${m.medicineName}: ${m.dosage} (${m.changeType}) - ${m.timing || 'Daily'}`)
      .join('\n');
    const contactName = appointment?.emergencyContactName || appointment?.familyMemberName || user?.name || 'Family Member';
    const rawPhone = appointment?.emergencyContactPhone || appointment?.contactPhone || '9345403336';
    const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    const phoneToUse = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `🩺 *SeniorCare Doctor Consultation Summary & Tablet Updates*\n\n` +
      `Resident: *${appointment?.seniorName || 'Elder'}*\n` +
      `Doctor: *${appointment?.doctorName || 'Dr. Saravanan (Cardiologist)'}*\n` +
      `Hospital: *${appointment?.hospital || 'Apollo Hospitals, Greams Road'}*\n` +
      `Vitals: BP: *${bp}*, Pulse: *${pulse} bpm*, Sugar: *${bloodSugar}*, SpO2: *${spo2}%*\n\n` +
      `*Doctor Clinical Advice:*\n"${feedback || 'Routine checkup completed. Vitals stable.'}"\n\n` +
      (medSummary ? `*Prescription & Tablet Adjustments:*\n${medSummary}\n\n` : '') +
      `_Dispatched via SeniorCare to Family Member (${contactName} - +${phoneToUse})_`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneToUse}&text=${text}`, '_blank');
    showToast(lang === 'ta' ? 'WhatsApp வழியாக குடும்பத்தினருக்கு அனுப்பப்பட்டது!' : 'Dispatched to family member via WhatsApp!', 'success');
  };

  const handleShareSms = () => {
    const contactName = appointment?.emergencyContactName || appointment?.familyMemberName || user?.name || 'Family Member';
    const rawPhone = appointment?.emergencyContactPhone || appointment?.contactPhone || '9345403336';
    const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `SeniorCare: Consultation summary for ${appointment?.seniorName || 'Elder'}. BP: ${bp}, Sugar: ${bloodSugar}. Advice: ${feedback?.slice(0, 70)}... Tablets updated. Recipient: ${contactName}.`
    );
    window.open(`sms:+${cleanPhone}?body=${text}`, '_blank');
    showToast(lang === 'ta' ? 'SMS நினைவூட்டல் தயாராக உள்ளது!' : `SMS draft ready for ${contactName}!`, 'info');
  };

  const handleShareGmail = () => {
    const medSummary = meds
      .filter(m => m.medicineName.trim())
      .map(m => `• ${m.medicineName}: ${m.dosage} (${m.changeType}) - ${m.timing || 'Daily'}`)
      .join('\n');
    const contactEmail = appointment?.emergencyContactEmail || user?.email || 'bhavanalakshmi12006@gmail.com';
    const subject = `Doctor Consultation Feedback & Tablet Updates: ${appointment?.seniorName || 'Elder'}`;
    const body = 
      `Hello ${contactName},\n\nHere is the official post-visit consultation summary and medication updates for ${appointment?.seniorName || 'Elder'}:\n\n` +
      `Doctor: ${appointment?.doctorName || 'Dr. Saravanan'}\nHospital: ${appointment?.hospital || 'Apollo Hospitals'}\n\n` +
      `Recorded Vital Signs:\n- Blood Pressure: ${bp}\n- Pulse: ${pulse} bpm\n- Blood Sugar: ${bloodSugar}\n- SpO2: ${spo2}%\n\n` +
      `Doctor's Clinical Advice:\n"${feedback || 'Routine checkup completed. Vitals stable.'}"\n\n` +
      (medSummary ? `Prescription & Tablet Adjustments:\n${medSummary}\n\n` : '') +
      `Best regards,\nSeniorCare Medical Care Network, Chennai`;
    
    openGmailComposer({
      to: contactEmail,
      subject,
      body
    });
    showToast(lang === 'ta' ? 'Gmail திறக்கப்பட்டது!' : `Gmail opened with consultation summary!`, 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto", borderRadius: 16 }}
      >
        <div className="modal-header" style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "#fff", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Stethoscope size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#fff" }}>
                {lang === "ta" ? "மருத்துவர் ஆலோசனை & மாத்திரை அளவுகள் (mg)" : "Doctor Post-Visit Consultation & Tablet mg Updates"}
              </h3>
              <small style={{ opacity: 0.9 }}>
                {appointment.appointmentCode} · {appointment.seniorName} · {appointment.doctorName}
              </small>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: "1.5rem" }}>
          {/* Doctor Feedback Advice */}
          <div className="form-group" style={{ marginBottom: "1.2rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: "700", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
              <Stethoscope size={16} className="text-primary" />
              <span>{lang === "ta" ? "மருத்துவரின் கருத்து & அறிவுரைகள் (Doctor's Advice):" : "Doctor's Advice & Feedback Note:"}</span>
            </label>
            <textarea
              required
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Blood pressure slightly elevated (145/90). Increased Amlodipine dosage. Advised low salt diet, 20-min daily walking, and follow-up in 4 weeks."
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.9rem" }}
            />
          </div>

          {/* Vitals Recorded */}
          <div style={{ background: "rgba(2, 132, 199, 0.05)", border: "1px solid rgba(2, 132, 199, 0.2)", borderRadius: "12px", padding: "1rem", marginBottom: "1.25rem" }}>
            <strong style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.88rem", color: "#0369a1", marginBottom: "0.75rem" }}>
              <Activity size={16} />
              <span>{lang === "ta" ? "சந்திப்பில் பதிவு செய்யப்பட்ட உடல்நிலை (Vitals):" : "Vitals Recorded During Consultation:"}</span>
            </strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem" }}>
              <div>
                <small style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Blood Pressure</small>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="120/80"
                  style={{ width: "100%", padding: "0.4rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.85rem", fontWeight: "700", color: "#059669" }}
                />
              </div>
              <div>
                <small style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Pulse (bpm)</small>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="74"
                  style={{ width: "100%", padding: "0.4rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.85rem", fontWeight: "700", color: "#0284c7" }}
                />
              </div>
              <div>
                <small style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Blood Sugar</small>
                <input
                  type="text"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  placeholder="104 mg/dL"
                  style={{ width: "100%", padding: "0.4rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.85rem", fontWeight: "700", color: "#d97706" }}
                />
              </div>
              <div>
                <small style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>SpO2 (%)</small>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  placeholder="98"
                  style={{ width: "100%", padding: "0.4rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.85rem", fontWeight: "700", color: "#7c3aed" }}
                />
              </div>
            </div>
          </div>

          {/* Medication & Tablet mg Changes */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: "700", fontSize: "0.9rem" }}>
                <Pill size={16} className="text-primary" />
                <span>{lang === "ta" ? "மாத்திரை அளவுகள் & மாற்றங்கள் (Tablet mg Updates):" : "Prescription & Tablet Dosage (mg) Changes:"}</span>
              </label>
              <button
                type="button"
                className="btn-outline-small"
                onClick={handleAddMed}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.6rem", fontSize: "0.78rem" }}
              >
                <Plus size={14} />
                <span>{lang === "ta" ? "மாத்திரை சேர்க்க" : "Add Medicine"}</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {meds.map((med, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "0.75rem",
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr auto",
                    gap: "0.5rem",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <small style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Medicine Name</small>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amlodipine"
                      value={med.medicineName}
                      onChange={(e) => handleMedChange(idx, "medicineName", e.target.value)}
                      style={{ width: "100%", padding: "0.35rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem", fontWeight: "600" }}
                    />
                  </div>

                  <div>
                    <small style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Dosage / mg</small>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10mg"
                      value={med.dosage}
                      onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                      style={{ width: "100%", padding: "0.35rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem", fontWeight: "700" }}
                    />
                  </div>

                  <div>
                    <small style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Change Type</small>
                    <select
                      value={med.changeType}
                      onChange={(e) => handleMedChange(idx, "changeType", e.target.value)}
                      style={{ width: "100%", padding: "0.35rem 0.4rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      <option value="increased">🔺 Increased mg</option>
                      <option value="decreased">🔻 Decreased mg</option>
                      <option value="continued">⏺️ Continued</option>
                      <option value="new">✨ New Medicine</option>
                      <option value="discontinued">🛑 Stopped</option>
                    </select>
                  </div>

                  <div>
                    <small style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Timing & Instructions</small>
                    <input
                      type="text"
                      placeholder="e.g. Morning after food"
                      value={med.timing}
                      onChange={(e) => handleMedChange(idx, "timing", e.target.value)}
                      style={{ width: "100%", padding: "0.35rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.8rem" }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMed(idx)}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.2rem", alignSelf: "center", marginTop: "12px" }}
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Multi-Channel Dispatch to Family Member */}
          <div style={{
            background: "linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(2, 132, 199, 0.08))",
            border: "1.5px solid #10b981",
            borderRadius: "12px",
            padding: "0.95rem 1.1rem",
            marginBottom: "1rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <Share2 size={16} className="text-success" />
                <strong style={{ fontSize: "0.88rem", color: "#065f46" }}>
                  {lang === "ta" 
                    ? "குடும்பத்தினருக்கு நேரடியாக மருத்துவ விவரங்களை அனுப்பவும் (WhatsApp / SMS / Gmail):" 
                    : "Direct Family Dispatch (WhatsApp / SMS / Gmail):"}
                </strong>
              </div>
              <span style={{ fontSize: "0.74rem", background: "#ecfdf5", color: "#047857", padding: "0.2rem 0.55rem", borderRadius: "6px", fontWeight: "700" }}>
                Bhavana Lakshmi (+91 9345403336)
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  background: "#25D366",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.55rem 0.8rem",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(37, 211, 102, 0.3)"
                }}
              >
                <Phone size={14} />
                <span>{lang === "ta" ? "WhatsApp-ல் அனுப்பு" : "WhatsApp Dispatch"}</span>
              </button>

              <button
                type="button"
                onClick={handleShareSms}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  background: "#0284c7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.55rem 0.8rem",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                <MessageSquare size={14} />
                <span>{lang === "ta" ? "SMS அனுப்பு" : "SMS Alert"}</span>
              </button>

              <button
                type="button"
                onClick={handleShareGmail}
                style={{
                  flex: 1,
                  minWidth: "130px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  background: "#ea4335",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.55rem 0.8rem",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                <Mail size={14} />
                <span>{lang === "ta" ? "Gmail அறிக்கை" : "Send to Gmail"}</span>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              {t.cancel}
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.6rem 1.25rem", borderRadius: "10px" }}
            >
              <Save size={16} />
              <span>{saving ? t.loading : (lang === "ta" ? "சேமி & முடிவடைந்தது என குறிக்க" : "Save & Mark Completed")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

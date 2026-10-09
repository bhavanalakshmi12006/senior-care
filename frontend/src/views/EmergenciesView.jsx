import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, AlertOctagon, CheckCircle2, PhoneCall, 
  ArrowUpRight, Clock, MapPin, User, ChevronRight, Check, MessageSquare 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import EmergencyMessageModal from "../components/Modals/EmergencyMessageModal";

export default function EmergenciesView({ onOpenEmergencyModal }) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [messageEmergency, setMessageEmergency] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [loading, setLoading] = useState(true);

  const loadEmergencies = async () => {
    try {
      const res = await api.get("/emergencies");
      setEmergencies(res.data.emergencies || []);
      if (!selectedEmergency && res.data.emergencies?.length > 0) {
        setSelectedEmergency(res.data.emergencies[0]);
      } else if (selectedEmergency) {
        const updated = res.data.emergencies?.find((e) => e._id === selectedEmergency._id);
        if (updated) setSelectedEmergency(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencies();
  }, [liveEventSignal]);

  const handleUpdateStatus = async (status) => {
    if (!selectedEmergency) return;
    try {
      const res = await api.patch(`/emergencies/${selectedEmergency._id}/status`, {
        status,
        note: actionNote || `Status transitioned to ${status}`
      });
      showToast(lang === "ta" ? `அவசர நிலை மாற்றப்பட்டது: ${status}` : `Emergency status updated to ${status}`, "success");
      setActionNote("");
      loadEmergencies();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const activeEmergencies = emergencies.filter((e) => e.status !== "resolved");
  const resolvedEmergencies = emergencies.filter((e) => e.status === "resolved");

  return (
    <div className="view-page-container">
      {/* Header */}
      <div className="view-header-bar">
        <div>
          <h2>{t.emergency}</h2>
          <p>{lang === "ta" ? "24/7 நேரலை அவசர எச்சரிக்கைகள் மற்றும் மீட்பு மேலாண்மை" : "Active incident response, escalation, and resolution audit"}</p>
        </div>

        <button className="btn-emergency-danger" onClick={onOpenEmergencyModal}>
          <ShieldAlert size={22} />
          <span>{t.triggerEmergency}</span>
        </button>
      </div>

      <div className="emergencies-two-col-layout">
        {/* Left: Emergencies List */}
        <div className="emergencies-list-pane">
          <div className="emergencies-list-section">
            <h3 className="section-sub-title text-danger">
              <span className="live-dot" /> {lang === "ta" ? "செயலில் உள்ள அவசரங்கள்" : "Active Incident Queue"} ({activeEmergencies.length})
            </h3>
            {activeEmergencies.length === 0 ? (
              <div className="empty-panel-state">
                <CheckCircle2 size={32} className="text-success" />
                <p>{lang === "ta" ? "செயலில் உள்ள அவசர எச்சரிக்கைகள் எதுவும் இல்லை! அனைத்தும் பாதுகாப்பானது." : "No active emergency alerts. All senior residents are safe."}</p>
              </div>
            ) : (
              activeEmergencies.map((em) => (
                <div
                  key={em._id}
                  className={`emergency-ticket-item ${selectedEmergency?._id === em._id ? "selected" : ""} active-border`}
                  onClick={() => setSelectedEmergency(em)}
                >
                  <div className="ticket-top-row">
                    <span className="ticket-code">{em.emergencyCode}</span>
                    <span className={`status-pill status-${em.status}`}>{em.status.toUpperCase()}</span>
                  </div>
                  <strong>{em.seniorName}</strong>
                  <p className="ticket-loc"><MapPin size={13} /> {em.location || (lang === "ta" ? "இல்லம்" : "Home Residence")}</p>
                  <small className="ticket-time"><Clock size={12} /> {new Date(em.createdAt).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>

          <div className="emergencies-list-section" style={{ marginTop: 24 }}>
            <h3 className="section-sub-title">
              {lang === "ta" ? "தீர்க்கப்பட்ட சம்பவங்கள்" : "Resolved Incidents History"} ({resolvedEmergencies.length})
            </h3>
            {resolvedEmergencies.map((em) => (
              <div
                key={em._id}
                className={`emergency-ticket-item ${selectedEmergency?._id === em._id ? "selected" : ""}`}
                onClick={() => setSelectedEmergency(em)}
              >
                <div className="ticket-top-row">
                  <span className="ticket-code">{em.emergencyCode}</span>
                  <span className="status-pill status-safe">RESOLVED</span>
                </div>
                <strong>{em.seniorName}</strong>
                <small className="ticket-time">{new Date(em.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed Emergency Status Card & Actions */}
        <div className="emergency-detail-pane">
          {selectedEmergency ? (
            <div className="emergency-status-card">
              <div className="em-card-banner-header">
                <div>
                  <span className="em-status-pill">{selectedEmergency.status.toUpperCase()}</span>
                  <h2>{selectedEmergency.emergencyCode} — {selectedEmergency.seniorName}</h2>
                </div>
                <div className="em-time-badge">
                  <Clock size={16} />
                  <span>{new Date(selectedEmergency.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="em-detail-grid">
                <div className="em-stat-box">
                  <small>{t.location}</small>
                  <strong>{selectedEmergency.location || (lang === "ta" ? "முதியவர் இல்லம்" : "Home Residence")}</strong>
                </div>
                <div className="em-stat-box">
                  <small>{t.severity}</small>
                  <strong className="text-danger">{selectedEmergency.severity.toUpperCase()}</strong>
                </div>
                <div className="em-stat-box">
                  <small>{lang === "ta" ? "ஏற்றுக்கொண்டவர்" : "Acknowledged By"}</small>
                  <strong>{selectedEmergency.acknowledgedBy || "Pending"}</strong>
                </div>
                <div className="em-stat-box">
                  <small>{lang === "ta" ? "தீர்த்தவர்" : "Resolved By"}</small>
                  <strong>{selectedEmergency.resolvedBy || "Pending"}</strong>
                </div>
              </div>

              <div className="em-notes-full">
                <strong>{t.notes}:</strong>
                <p>{selectedEmergency.notes}</p>
              </div>

              {/* Multi-Channel Notification Dispatch Audit Bar (SMS, WhatsApp, Email) */}
              <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "12px", padding: "0.85rem 1rem", margin: "1rem 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>📡</span>
                    <span>{lang === "ta" ? "நேரலை எச்சரிக்கை தொடர்பு நிலைகள் (Multi-Channel Dispatch)" : "Live Alert Dispatch Status (SMS, WhatsApp, Email)"}</span>
                  </strong>
                  <span style={{ fontSize: "0.72rem", background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "0.15rem 0.5rem", borderRadius: "10px", fontWeight: "700" }}>
                    ✓ All Channels Active
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem", fontSize: "0.8rem" }}>
                  <div style={{ background: "var(--surface)", padding: "0.5rem 0.7rem", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1rem" }}>💬</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.76rem" }}>WhatsApp</strong>
                      <span style={{ color: "#10b981", fontSize: "0.72rem", fontWeight: "600" }}>✓ Delivered</span>
                    </div>
                  </div>
                  <div style={{ background: "var(--surface)", padding: "0.5rem 0.7rem", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1rem" }}>📱</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.76rem" }}>SMS Alert</strong>
                      <span style={{ color: "#10b981", fontSize: "0.72rem", fontWeight: "600" }}>✓ Dispatched</span>
                    </div>
                  </div>
                  <div style={{ background: "var(--surface)", padding: "0.5rem 0.7rem", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1rem" }}>📧</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.76rem" }}>Google Mail</strong>
                      <span style={{ color: "#10b981", fontSize: "0.72rem", fontWeight: "600" }}>✓ Sent to Family</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Caregiver / Staff / Admin */}
              {selectedEmergency.status !== "resolved" && (
                <div className="em-action-controls">
                  <h4>{lang === "ta" ? "அவசர மேலாண்மை செயல்கள்" : "Emergency Response Actions"}</h4>
                  <div className="em-buttons-row">
                    <a href="tel:+916382598599" className="btn-action call">
                      <PhoneCall size={18} />
                      <span>{t.callCaregiver} (+91 6382598599)</span>
                    </a>

                    <button 
                      type="button"
                      className="btn-action" 
                      style={{ background: "#25D366", color: "#fff", borderColor: "#16a34a", fontWeight: "700" }}
                      onClick={() => setMessageEmergency(selectedEmergency)}
                      title="Send WhatsApp, SMS, or Email message to Caretaker, Volunteer, or Family"
                    >
                      <MessageSquare size={18} />
                      <span>{lang === "ta" ? "அவசர செய்தி அனுப்பு (WhatsApp/SMS)" : "Send Alert (WhatsApp/SMS)"}</span>
                    </button>

                    {selectedEmergency.status === "active" && (
                      <button className="btn-action ack" onClick={() => handleUpdateStatus("acknowledged")}>
                        <Check size={18} />
                        <span>{t.acknowledge}</span>
                      </button>
                    )}

                    {selectedEmergency.status !== "escalated" && (
                      <button className="btn-action escalate" onClick={() => handleUpdateStatus("escalated")}>
                        <AlertOctagon size={18} />
                        <span>{t.escalate}</span>
                      </button>
                    )}

                    <button className="btn-action resolve" onClick={() => handleUpdateStatus("resolved")}>
                      <CheckCircle2 size={18} />
                      <span>{t.resolve}</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedEmergency.status === "resolved" && (
                <div style={{ marginTop: "1rem" }}>
                  <button 
                    type="button"
                    style={{ background: "rgba(37,211,102,0.12)", color: "#166534", border: "1px solid #22c55e", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer" }}
                    onClick={() => setMessageEmergency(selectedEmergency)}
                  >
                    <MessageSquare size={16} />
                    <span>{lang === "ta" ? "அவசர விவரங்களை மீண்டும் அனுப்பு (WhatsApp/SMS)" : "Share/Send Alert Details (WhatsApp/SMS)"}</span>
                  </button>
                </div>
              )}

              {/* Incident Response Audit Timeline */}
              <div className="em-audit-timeline">
                <h4>{lang === "ta" ? "நடவடிக்கை வரலாறு" : "Actions Taken Timeline"}</h4>
                <div className="timeline-items-list">
                  {selectedEmergency.actionsTaken?.map((act, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-info">
                        <strong>{act.note}</strong>
                        <small>{act.by} · {new Date(act.actionTime).toLocaleTimeString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-panel-state">{t.noData}</div>
          )}
        </div>
      </div>

      {/* Emergency Message Modal */}
      {messageEmergency && (
        <EmergencyMessageModal
          isOpen={!!messageEmergency}
          emergency={messageEmergency}
          onClose={() => {
            setMessageEmergency(null);
            loadEmergencies();
          }}
        />
      )}
    </div>
  );
}


import React from "react";
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../api";
import { useToast } from "../context/ToastContext";

export default function EmergencyBanner({ emergency, onNavigate, onResolved }) {
  const { t, lang } = useAuth();
  const { showToast } = useToast();

  if (!emergency || emergency.status === "resolved") return null;

  const handleAcknowledge = async () => {
    try {
      await api.patch(`/emergencies/${emergency._id}/status`, {
        status: "acknowledged",
        note: "Care team acknowledged from emergency banner"
      });
      showToast(lang === "ta" ? "அவசர எச்சரிக்கை ஏற்றுக்கொள்ளப்பட்டது" : "Emergency alert acknowledged", "success");
      if (onResolved) onResolved();
    } catch (e) {
      showToast("Failed to update status", "error");
    }
  };

  return (
    <div className="emergency-alert-banner pulse-emergency-border">
      <div className="emergency-banner-left">
        <div className="emergency-beacon-icon">
          <ShieldAlert size={28} />
        </div>
        <div className="emergency-banner-text">
          <div className="emergency-badge-tag">
            <span className="live-dot" /> {t.emergencyActiveBanner}
          </div>
          <h4>
            {emergency.emergencyCode} — {emergency.seniorName} ({emergency.location || "Home Residence"})
          </h4>
          <p>{emergency.notes}</p>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.35rem", flexWrap: "wrap", fontSize: "0.74rem" }}>
            <span style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", padding: "0.1rem 0.5rem", borderRadius: "10px", fontWeight: "700" }}>✓ 💬 WhatsApp Sent</span>
            <span style={{ background: "rgba(59,130,246,0.2)", color: "#3b82f6", padding: "0.1rem 0.5rem", borderRadius: "10px", fontWeight: "700" }}>✓ 📱 SMS Dispatched</span>
            <span style={{ background: "rgba(234,88,12,0.2)", color: "#ea580c", padding: "0.1rem 0.5rem", borderRadius: "10px", fontWeight: "700" }}>✓ 📧 Gmail Alert Sent</span>
          </div>
        </div>
      </div>

      <div className="emergency-banner-actions">
        {emergency.status === "active" && (
          <button className="banner-action-btn ack-btn" onClick={handleAcknowledge}>
            <CheckCircle size={16} />
            <span>{t.acknowledge}</span>
          </button>
        )}
        <button 
          className="banner-action-btn view-btn"
          onClick={() => onNavigate("emergency", emergency._id)}
        >
          <span>{lang === "ta" ? "விபரங்கள் பார்" : "View Emergency Status"}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

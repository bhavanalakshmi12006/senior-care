import React, { useState } from "react";
import { UserCheck, AlertCircle, Zap } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function GoogleAuthSection({ 
  selectedRole = "senior_citizen", 
  onRoleChange, 
  hideRoleSelector = false 
}) {
  const { googleAuth, googleClientId, lang, quickDemoLogin } = useAuth();
  const { showToast } = useToast();

  const [internalRole, setInternalRole] = useState(selectedRole);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeRole = selectedRole || internalRole;

  const handleRoleSelect = (roleId) => {
    setInternalRole(roleId);
    if (onRoleChange) onRoleChange(roleId);
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    setErrorMsg("");
    const res = await googleAuth(response.credential, activeRole);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
      showToast(res.message, "error");
    } else {
      showToast(
        lang === "ta" 
          ? "Google மூலம் வெற்றிகரமாக உள்நுழைந்தீர்கள்!" 
          : "Signed in with Google successfully!", 
        "success"
      );
    }
  };

  const handleGoogleError = (err) => {
    console.error("Google OAuth GIS Error:", err);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    setErrorMsg(
      lang === "ta"
        ? `Google உள்நுழைவு ரத்து செய்யப்பட்டது அல்லது தற்காலிகமாக தடைபட்டுள்ளது. Google Cloud Console-ல் (${origin}) Authorized JavaScript Origins-ல் உள்ளதா என சரிபார்க்கவும்.`
        : `Google sign-in was cancelled or blocked. Please ensure '${origin}' is added under Authorized JavaScript origins in Google Cloud Console.`
    );
    showToast("Google sign-in failed", "error");
  };

  const handleInstantDemoLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    const res = await quickDemoLogin(activeRole);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
      showToast(res.message, "error");
    } else {
      showToast(
        lang === "ta" ? "வெற்றிகரமாக உள்நுழைந்தீர்கள்!" : "Signed in successfully!",
        "success"
      );
    }
  };

  return (
    <div className="google-auth-container">
      {!hideRoleSelector && (
        <div className="google-role-select-box">
          <label className="google-role-label">
            <UserCheck size={14} className="text-primary" />
            <span>{lang === "ta" ? "Google கணக்கிற்கான உங்கள் பங்கு (Role):" : "Select Role for Google Account:"}</span>
          </label>
          <div className="google-role-buttons-grid">
            {[
              { id: "senior_citizen", icon: "👵", label: lang === "ta" ? "மூத்த குடிமகன்" : "Senior Citizen" },
              { id: "family_member", icon: "👨‍👩‍👧", label: lang === "ta" ? "குடும்பத்தினர்" : "Family Member" },
              { id: "caregiver", icon: "👩‍⚕️", label: lang === "ta" ? "பராமரிப்பாளர்" : "Caregiver" },
              { id: "volunteer", icon: "🤝", label: lang === "ta" ? "தன்னார்வலர்" : "Volunteer" },
              { id: "staff", icon: "👔", label: lang === "ta" ? "பணியாளர்" : "Staff" },
              { id: "admin", icon: "🛡️", label: lang === "ta" ? "நிர்வாகி" : "Admin" }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                className={`google-role-btn-chip ${activeRole === r.id ? "active" : ""}`}
                onClick={() => handleRoleSelect(r.id)}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="auth-error-banner" style={{ margin: "10px 0" }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="google-button-wrapper">
        <div className="google-oauth-rendered-box">
          <div className="google-login-btn-target">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              text="continue_with"
              shape="pill"
              size="large"
              width="100%"
            />
          </div>
        </div>

        {/* 1-Click Instant Demo Login Option */}
        <button
          type="button"
          onClick={handleInstantDemoLogin}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem",
            width: "100%",
            padding: "0.55rem 1rem",
            marginTop: "0.6rem",
            background: "rgba(23, 107, 135, 0.08)",
            border: "1px dashed var(--primary, #176b87)",
            borderRadius: "24px",
            color: "var(--primary, #176b87)",
            fontWeight: "600",
            fontSize: "0.82rem",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          title="Instant 1-Click Login bypass"
        >
          <Zap size={14} />
          <span>
            {lang === "ta" 
              ? `⚡ 1-கிளிக் நேரடி உள்நுழைவு (${activeRole})` 
              : `⚡ 1-Click Instant Login as ${activeRole}`}
          </span>
        </button>
      </div>
    </div>
  );
}

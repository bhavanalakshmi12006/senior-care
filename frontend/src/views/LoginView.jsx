import React, { useState, useEffect } from "react";
import { 
  HeartHandshake, LogIn, UserPlus, Shield, User, Heart, 
  Sparkles, AlertCircle, CheckCircle2, Lock, Mail, 
  Palette, UserCheck, ChevronLeft, ChevronRight, Quote,
  Phone, Eye, Camera, ShieldCheck, Star, Award
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ThemeAppearanceModal from "../components/Modals/ThemeAppearanceModal";
import GoogleAuthSection from "../components/GoogleAuthSection";
import api from "../api";

export default function LoginView({ onSwitchToRegister }) {
  const { 
    login, 
    lang, setLang, theme, setTheme, 
    actionColor, t 
  } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("SeniorCare2026");
  const [selectedRole, setSelectedRole] = useState("senior_citizen");
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const quotes = [
    {
      en: "“To care for those who once cared for us is one of the highest honors.”",
      ta: "“நமக்காக வாழ்ந்த பெரியோர்களை இன்று பாசத்தோடு கவனித்துக் கொள்வதே மனிதத்தின் மிக உயர்ந்த பெருமை.”",
      author: "Tea Obreht",
      tag: lang === "ta" ? "அன்பும் அரவணைப்பும்" : "Compassion & Honor"
    },
    {
      en: "“The heart that loves never grows old. Every senior deserves safety, gentle warmth, and dignity.”",
      ta: "“அன்பு நிறைந்த உள்ளத்திற்கு ஒருபோதும் முதுமை இல்லை. ஒவ்வொரு முதியவரும் பாதுகாப்பையும் கனிவான மரியாதையையும் பெற வேண்டும்.”",
      author: "Elder Wellness Pledge",
      tag: lang === "ta" ? "பாதுகாப்பான வாழ்க்கை" : "Dignity & Care"
    },
    {
      en: "“Compassion is the language which the deaf can hear and the blind can see.”",
      ta: "“கனிவு என்பது காது கேளாதோராலும் கேட்க முடிகின்ற, பார்வையற்றோராலும் உணர முடிகின்ற பாசமொழி.”",
      author: "Mark Twain",
      tag: lang === "ta" ? "அர்ப்பணிப்பு சேவை" : "Universal Care"
    },
    {
      en: "“Ageing is an extraordinary process where you become the person you always ought to have been.”",
      ta: "“பெரியோர்களின் ஆசியும் புன்னகையுமே ஒரு குடும்பத்தின் உண்மையான பொக்கிஷம்.”",
      author: "David Bowie",
      tag: lang === "ta" ? "குடும்ப ஆசீர்வாதம்" : "Generational Bond"
    }
  ];

  const galleryHighlights = [
    {
      id: 1,
      title: lang === "ta" ? "காலை யோகா & தியானம்" : "Morning Garden Yoga",
      subtitle: lang === "ta" ? "அமைதியான நல்வாழ்வு பயிற்சிகள்" : "Restorative Pranayama & Gentle Stretch",
      img: "/assets/senior-yoga.jpg",
      tag: "Yoga & Wellness"
    },
    {
      id: 2,
      title: lang === "ta" ? "பாரம்பரிய இசை & குடும்பம்" : "Music Therapy Moments",
      subtitle: lang === "ta" ? "பாசமிகு குடும்ப சங்கமம்" : "Soulful Melodies & Generational Joy",
      img: "/assets/senior-music.jpg",
      tag: "Music Therapy"
    },
    {
      id: 3,
      title: lang === "ta" ? "24/7 அன்பான செவிலியர் பராமரிப்பு" : "Compassionate Nursing Care",
      subtitle: lang === "ta" ? "நேரலை ஆரோக்கிய கண்காணிப்பு" : "24/7 Vitals & Dedicated Nurse Support",
      img: "/assets/caregiver-senior.jpg",
      tag: "Dedicated Care"
    },
    {
      id: 4,
      title: lang === "ta" ? "தலைமுறைகள் இணைந்த பாசம்" : "Family Reunions & Tea",
      subtitle: lang === "ta" ? "பேரக்குழந்தைகளுடன் இனிய தருணம்" : "Heartwarming Connections with Loved Ones",
      img: "/assets/family-care.jpg",
      tag: "Family Bonds"
    }
  ];

  // Auto rotate quotes every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [quotes.length]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const res = await login(email, password, selectedRole);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
      showToast(res.message, "error");
    } else {
      const mappedName = res.user?.linkedSeniorName || (lang === "ta" ? "குடும்ப பெரியவர்" : "Family Elder");
      showToast(
        lang === "ta" 
          ? `வெற்றிகரமாக உள்நுழைந்தீர்கள்! (${rolesList.find(r => r.id === selectedRole)?.label || selectedRole}${selectedRole === "family_member" ? ` · ${mappedName}` : ""})` 
          : `Signed in successfully as ${rolesList.find(r => r.id === selectedRole)?.label || selectedRole}${selectedRole === "family_member" ? ` (Linked Elder: ${mappedName})` : ""}!`, 
        "success"
      );
    }
  };

  const rolesList = [
    { id: "senior_citizen", icon: "👵", label: lang === "ta" ? "மூத்த குடிமகன்" : "Senior Citizen", desc: "Personal care & safety" },
    { id: "family_member", icon: "👨‍👩‍👧", label: lang === "ta" ? "குடும்பத்தினர்" : "Family Member", desc: "Monitor elder wellness" },
    { id: "caregiver", icon: "👩‍⚕️", label: lang === "ta" ? "பராமரிப்பாளர்" : "Caregiver / Nurse", desc: "Resident care & check-ins" },
    { id: "volunteer", icon: "🤝", label: lang === "ta" ? "தன்னார்வலர்" : "Volunteer", desc: "Errands & companion help" },
    { id: "staff", icon: "👔", label: lang === "ta" ? "பணியாளர்" : "Staff", desc: "Center operations" },
    { id: "admin", icon: "🛡️", label: lang === "ta" ? "நிர்வாகி" : "Admin", desc: "System & video moderation" }
  ];

  const currentQuote = quotes[activeQuoteIndex];

  return (
    <div className="auth-page-container">
      {/* Top Bar on Login Page */}
      <div className="auth-top-bar">
        <div className="brand-logo-inline">
          <HeartHandshake size={26} className="text-primary" />
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>SeniorCare (SCS)</span>
        </div>

        <div className="auth-top-controls">
          <button
            className={`lang-pill ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}
          >
            English
          </button>
          <button
            className={`lang-pill ${lang === "ta" ? "active" : ""}`}
            onClick={() => setLang("ta")}
          >
            தமிழ்
          </button>
          
          <button
            className="theme-pill"
            onClick={() => setThemeModalOpen(true)}
            title={t.themeCustomizer || "Theme & Colors"}
          >
            <Palette size={15} style={{ color: actionColor }} />
            <span>{lang === "ta" ? "தீம் / நிறங்கள்" : "Theme & Colors"}</span>
          </button>
        </div>
      </div>

      <div className="auth-split-layout">
        {/* Left Side: Fresh Gallery & Inspiring Quotes Showcase */}
        <div className="auth-hero-panel">
          <span className="hero-eyebrow">
            <ShieldCheck size={14} style={{ display: "inline", marginRight: "4px" }} />
            SENIOR CITIZEN SAFETY & COMPREHENSIVE CARE SYSTEM
          </span>
          <h1 className="hero-main-title">
            {lang === "ta" ? "முதியோரின் பாதுகாப்பு, நலம் மற்றும் கனிவான கவனிப்பு" : "Empowering Senior Wellness, Safety & Loving Companionship"}
          </h1>
          <p className="hero-sub-text">
            {lang === "ta" 
              ? "24/7 அவசர உதவி எச்சரிக்கைகள், தினசரி பாதுகாப்பு உறுதி, மருத்துவ ஆய்வக சேவைகள் மற்றும் இருமொழி AI உதவி."
              : "Next-generation care coordination platform connecting elders, families, geriatric nurses, and trusted volunteers."}
          </p>

          {/* Inspiring Quote Carousel Card */}
          <div className="quote-spotlight-card">
            <div className="quote-spotlight-header">
              <span className="quote-tag-pill">
                <Quote size={13} style={{ transform: "rotate(180deg)" }} />
                <span>{currentQuote.tag}</span>
              </span>
              <div className="quote-nav-arrows">
                <button 
                  type="button" 
                  onClick={() => setActiveQuoteIndex((prev) => (prev - 1 + quotes.length) % quotes.length)}
                  aria-label="Previous quote"
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>{activeQuoteIndex + 1} / {quotes.length}</span>
                <button 
                  type="button" 
                  onClick={() => setActiveQuoteIndex((prev) => (prev + 1) % quotes.length)}
                  aria-label="Next quote"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <p className="quote-text-quote">
              {lang === "ta" ? currentQuote.ta : currentQuote.en}
            </p>
            <span className="quote-author-name">— {currentQuote.author}</span>
          </div>

          {/* Fresh Care Gallery Grid */}
          <div className="landing-gallery-strip">
            <div className="landing-gallery-header">
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: "700", fontSize: "0.95rem" }}>
                <Camera size={16} className="text-primary" />
                <span>{lang === "ta" ? "📸 எங்கள் முதியோர் இல்ல நேரலை தருணங்கள்" : "📸 Life & Joy at SeniorCare"}</span>
              </span>
              <small style={{ color: "var(--text-muted)" }}>{lang === "ta" ? "நேரலை புகைப்படங்கள்" : "Real moments of care"}</small>
            </div>

            <div className="landing-gallery-grid">
              {galleryHighlights.map((item) => (
                <div key={item.id} className="landing-gallery-card">
                  <div className="landing-gallery-thumb">
                    <img src={item.img} alt={item.title} />
                    <span className="gallery-mini-badge">{item.tag}</span>
                  </div>
                  <div className="landing-gallery-info">
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top-Rated Caregivers, Volunteers & Verified Reviews Showcase */}
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1.5px solid rgba(2, 132, 199, 0.25)",
            borderRadius: "16px",
            padding: "1.1rem 1.25rem",
            marginTop: "1.25rem",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <Award size={18} className="text-warning" />
                <strong style={{ fontSize: "0.92rem", color: "#0369a1" }}>
                  {lang === "ta" ? "⭐ சிறந்த பராமரிப்பாளர்கள் & நன்மதிப்பு சான்றுகள்" : "⭐ Top Rated Caregivers & Community Reviews"}
                </strong>
              </div>
              <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.12)", color: "#047857", padding: "0.15rem 0.55rem", borderRadius: "10px", fontWeight: "700" }}>
                100% Verified Care
              </span>
            </div>

            {/* Caregiver & Volunteer Top Badges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "0.75rem" }}>
              <div style={{
                background: "linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(99, 102, 241, 0.06))",
                border: "1px solid rgba(2, 132, 199, 0.2)",
                borderRadius: "10px",
                padding: "0.65rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>👩‍⚕️</span>
                  <div>
                    <strong style={{ fontSize: "0.82rem", color: "var(--text-main)", display: "block" }}>Anitha Krishnan</strong>
                    <small style={{ fontSize: "0.7rem", color: "#0284c7", fontWeight: "700" }}>⭐ 5.0 · Top-Rated Caretaker</small>
                  </div>
                </div>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                  {lang === "ta" ? "முதியோர் நலன், மருந்துகள் மற்றும் BP நேரலை கண்காணிப்பு" : "Geriatric Nursing & Daily Vitals Tracking"}
                </p>
              </div>

              <div style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(245, 158, 11, 0.06))",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "10px",
                padding: "0.65rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>🤝</span>
                  <div>
                    <strong style={{ fontSize: "0.82rem", color: "var(--text-main)", display: "block" }}>Karthik Raman</strong>
                    <small style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: "700" }}>⭐ 4.9 · Best Volunteer</small>
                  </div>
                </div>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                  {lang === "ta" ? "18 வீட்டு வாசற்படி மருந்துகள் & உதவிகளை முடித்துள்ளார்" : "Completed 18 doorstep medicine runs & errands"}
                </p>
              </div>
            </div>

            {/* Genuine Testimonial from Bhavana Lakshmi */}
            <div style={{
              background: "rgba(248, 250, 252, 0.95)",
              border: "1px dashed rgba(2, 132, 199, 0.25)",
              borderRadius: "8px",
              padding: "0.65rem 0.8rem",
              fontSize: "0.78rem",
              lineHeight: 1.45,
              color: "var(--text-main)"
            }}>
              <p style={{ margin: 0, fontStyle: "italic" }}>
                {lang === "ta" 
                  ? "“செவிலியர் அனிதா என் தாயார் கல்யாணி அம்மாளை அடையாறில் மிகுந்த பாசத்துடன் கவனிக்கிறார். மாத்திரை மாற்றங்கள் உடனுக்குடன் பகிரப்படுவதால் முழு நிம்மதி!”"
                  : "“Nurse Anitha and volunteer Karthik take exceptional care of my mother Kalyani Ammal in Adyar. Instant vitals and doctor advice sharing gives total peace of mind!”"}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.3rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#0369a1" }}>— Bhavana Lakshmi (Daughter)</span>
                <span style={{ fontSize: "0.72rem", color: "#eab308" }}>⭐⭐⭐⭐⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card with Role Selection & Google Auth */}
        <div className="auth-form-panel">
          <div className="auth-card-box">
            <div className="auth-card-header">
              <h2>{t.signIn}</h2>
              <p>{lang === "ta" ? "உங்கள் பங்கைத் தேர்வு செய்து எளிதாக உள்நுழையுங்கள்" : "Choose your role and sign in with your email"}</p>
            </div>

            {/* Role Selection Tabs */}
            <div className="role-selection-wrapper">
              <label className="role-selection-label">
                <UserCheck size={15} className="text-primary" />
                <span>{lang === "ta" ? "உள்நுழைவதற்கான உங்கள் பங்கு (Role):" : "Choose Account Role to Sign In:"}</span>
              </label>

              <div className="role-chips-matrix">
                {rolesList.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`role-select-chip ${selectedRole === r.id ? "active" : ""}`}
                    onClick={() => setSelectedRole(r.id)}
                  >
                    <span className="role-icon">{r.icon}</span>
                    <span className="role-name">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="auth-error-banner">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email + Password Form */}
            <form onSubmit={handleEmailLogin} className="auth-form">

              <div className="form-group">
                <label>{t.emailAddress}</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com (or test email)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.password}</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    required
                    placeholder="SeniorCare2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-auth-submit" disabled={loading}>
                <LogIn size={18} />
                <span>
                  {loading 
                    ? t.loading 
                    : (lang === "ta" 
                        ? `${rolesList.find(r => r.id === selectedRole)?.label || ""} ஆக உள்நுழைக` 
                        : `Sign In as ${rolesList.find(r => r.id === selectedRole)?.label || "Member"}`)}
                </span>
              </button>
            </form>

            {/* Google OAuth Section synchronized with selectedRole */}
            <div className="oauth-divider">
              <span>{lang === "ta" ? "அல்லது Google மூலம் தொடரவும்" : "OR CONTINUE WITH GOOGLE"}</span>
            </div>

            <GoogleAuthSection 
              selectedRole={selectedRole} 
              onRoleChange={(r) => setSelectedRole(r)}
              hideRoleSelector={true}
            />

            <div className="auth-card-footer">
              <span>{lang === "ta" ? "புதியவரா? கணக்கு உருவாக்க வேண்டுமா?" : "New user? Want to register?"}</span>
              <button type="button" className="btn-link" onClick={onSwitchToRegister}>
                {t.signUp}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Appearance Customizer Modal */}
      <ThemeAppearanceModal 
        isOpen={themeModalOpen} 
        onClose={() => setThemeModalOpen(false)} 
      />
    </div>
  );
}

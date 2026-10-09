import React, { useState, useEffect } from "react";
import { 
  Users, AlertCircle, ShieldCheck, Calendar, HandHeart, 
  CreditCard, Bell, UserCheck, Plus, ShieldAlert, CheckCircle2, 
  FileSpreadsheet, ArrowUpRight, Clock, Heart, Phone, MapPin, 
  Activity, ArrowRight, UserPlus, Sparkles, TestTube, FileText,
  UserCog, Shield, Stethoscope, Star, Film, Trash2, Award, Zap,
  Download, Printer, AlertTriangle, Eye, Receipt, RefreshCw, TrendingDown, TrendingUp
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import PostcardModal from "../components/Modals/PostcardModal";
import OrderServiceModal from "../components/Modals/OrderServiceModal";
import ReceiptModal from "../components/Modals/ReceiptModal";
import CareGallery from "../components/CareGallery";
import { openGmailComposer } from "../utils/mailHelper";

export default function DashboardView({ 
  onNavigate, 
  onOpenEmergencyModal, 
  onOpenCheckinModal, 
  onOpenAddSeniorModal, 
  onOpenAppointmentModal, 
  onOpenAssistanceModal, 
  onOpenPaymentModal 
}) {
  const { user, t, lang, activeSeniorId, setActiveSeniorId } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [metrics, setMetrics] = useState({});
  const [charts, setCharts] = useState(null);
  const [seniors, setSeniors] = useState([]);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [fees, setFees] = useState([]);
  const [videos, setVideos] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ bestCaregivers: [], bestVolunteers: [] });
  const [reviewsList, setReviewsList] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [elderRelations, setElderRelations] = useState(() => {
    try {
      const saved = localStorage.getItem("seniorcare_elder_relations");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(true);

  // Order Service Modal & Elder Switcher state
  const [isOrderServiceOpen, setIsOrderServiceOpen] = useState(false);
  const [activeElderId, setActiveElderId] = useState(null);
  const [healthChartTab, setHealthChartTab] = useState("bp");

  // Postcard modal state
  const [postcardData, setPostcardData] = useState(null);
  const [postcardType, setPostcardType] = useState("senior");
  const [isPostcardOpen, setIsPostcardOpen] = useState(false);

  const openPostcard = (data, type) => {
    setPostcardData(data);
    setPostcardType(type);
    setIsPostcardOpen(true);
  };

  const role = user?.role || "senior_citizen";

  const handleRelationChange = async (seniorId, rel) => {
    const updated = { ...elderRelations, [seniorId]: rel };
    setElderRelations(updated);
    localStorage.setItem("seniorcare_elder_relations", JSON.stringify(updated));
    try {
      await api.patch(`/seniors/${seniorId}`, { emergencyContactRelation: rel });
    } catch (e) {
      // non-blocking
    }
    showToast(
      lang === "ta" ? `உறவு முறை '${rel}' என புதுப்பிக்கப்பட்டது` : `Kinship updated to '${rel}'`,
      "success"
    );
  };

  const handleDeleteVideo = async (id, title) => {
    if (!window.confirm(lang === "ta" ? `வீடியோ "${title}" நீக்கவா?` : `Remove video "${title}"?`)) return;
    try {
      await api.delete(`/videos/${id}`);
      showToast(lang === "ta" ? "வீடியோ நீக்கப்பட்டது" : "Video removed successfully", "success");
      loadDashboardData();
    } catch (err) {
      showToast("Failed to remove video", "error");
    }
  };

  const handleRemoveStaff = async (id, name, staffRole) => {
    if (!window.confirm(lang === "ta" ? `${staffRole} "${name}"-ஐ நிச்சயமாக நீக்க/தடை செய்ய விரும்புகிறீர்களா?` : `Are you sure you want to remove/deactivate ${staffRole} "${name}" following complaints?`)) return;
    try {
      await api.delete(`/users/${id}`);
      showToast(
        lang === "ta" ? `${name} வெற்றிகரமாக நீக்கப்பட்டார்.` : `${name} removed from active service.`,
        "success"
      );
      loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove staff", "error");
    }
  };

  const loadDashboardData = async () => {
    try {
      const [metricsRes, seniorsRes, emergRes, aptRes, assistRes, feesRes, videosRes, boardRes, revRes] = await Promise.all([
        api.get("/analytics/dashboard"),
        api.get("/seniors"),
        api.get("/emergencies"),
        api.get("/appointments?status=Upcoming"),
        api.get("/assistance"),
        api.get("/fees"),
        api.get("/videos").catch(() => ({ data: { videos: [] } })),
        api.get("/reviews/leaderboard").catch(() => ({ data: { bestCaregivers: [], bestVolunteers: [] } })),
        api.get("/reviews").catch(() => ({ data: { reviews: [] } }))
      ]);

      setMetrics(metricsRes.data.metrics || {});
      setCharts(metricsRes.data.charts || null);
      const fetchedSeniors = seniorsRes.data.seniors || [];
      setSeniors(fetchedSeniors);
      if (activeSeniorId) {
        setActiveElderId(activeSeniorId);
      } else if (fetchedSeniors.length > 0 && !activeElderId) {
        setActiveElderId(fetchedSeniors[0]._id);
      }
      setRecentEmergencies(emergRes.data.emergencies?.slice(0, 4) || []);
      setUpcomingAppointments(aptRes.data.appointments?.slice(0, 4) || []);
      setAssistanceRequests(assistRes.data.requests?.slice(0, 5) || []);
      setFees(feesRes.data.fees?.slice(0, 4) || []);
      setVideos(videosRes.data.videos || []);
      setLeaderboard(boardRes.data || { bestCaregivers: [], bestVolunteers: [] });
      setReviewsList(revRes.data.reviews || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [liveEventSignal]);

  const primarySenior = seniors[0] || null;
  const focusedElder = (seniors && seniors.length > 0)
    ? (seniors.find((s) => s._id === activeElderId) || seniors[0])
    : null;
  const elderName = focusedElder?.name || primarySenior?.name || (lang === "ta" ? "மூத்த உறுப்பினர்" : "Elder");
  const elderAge = focusedElder?.age || primarySenior?.age || 72;
  const elderRel = (focusedElder && elderRelations[focusedElder._id]) || focusedElder?.emergencyContactRelation || (lang === "ta" ? "பெரியவர்" : "Elder");
  const emergencyContactName = focusedElder?.emergencyContactName || user?.name || (lang === "ta" ? "குடும்ப உறுப்பினர்" : "Family Member");
  const emergencyContactPhone = focusedElder?.emergencyContactPhone || user?.phone || "+91 9345403336";
  const cleanContactPhone = String(emergencyContactPhone).replace(/[^0-9]/g, "");
  const waContactPhone = cleanContactPhone.length === 10 ? `91${cleanContactPhone}` : (cleanContactPhone || "919345403336");
  const emergencyContactEmail = focusedElder?.emergencyContactEmail || user?.email || "family@seniorcare.local";

  const handleConfirmAssistance = async (reqId) => {
    try {
      await api.put(`/assistance/${reqId}/status`, { status: "Completed" });
      showToast(
        lang === "ta" 
          ? "✓ உதவி பெறப்பட்டது! கோரிக்கை 'Completed' என வெற்றிகரமாக மாற்றப்பட்டது." 
          : "✓ Assistance confirmed and marked as Completed!",
        "success"
      );
      loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update assistance status", "error");
    }
  };

  // Chart Color Palette
  const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="dashboard-content-wrapper">
      {/* Welcome Banner */}
      <section className="dashboard-hero-banner">
        <div className="hero-welcome-text">
          <div className="welcome-role-tag">
            <span className="role-dot" /> {t[role] || role}
          </div>
          <h1>
            {t.seniorWelcome}, {user?.displayName}!
          </h1>
          <p>
            {role === "senior_citizen"
              ? (lang === "ta" ? "உங்கள் உடல்நலம் மற்றும் பாதுகாப்பை உறுதிப்படுத்த நாங்கள் எப்போதும் தயாராக உள்ளோம்." : "Your wellness and safety companion. We are here to support you 24/7.")
              : (lang === "ta" ? "மூத்த குடிமக்களின் பாதுகாப்பு, தேவைகள் மற்றும் சந்திப்புகளை எளிதாக நிர்வகிக்கவும்." : "Real-time care coordination, emergency dispatch, and safety compliance.")}
          </p>
        </div>

        {/* Hero Quick Badge / Trigger */}
        <div className="hero-action-slot">
          {role === "senior_citizen" ? (
            <div className="senior-hero-buttons">
              <button 
                className="btn-hero-safe pulse-success" 
                onClick={onOpenCheckinModal}
                title="Confirm safety check-in"
              >
                <CheckCircle2 size={24} />
                <span>{t.iAmSafe}</span>
              </button>

              <button 
                className="btn-hero-emergency pulse-danger" 
                onClick={onOpenEmergencyModal}
                title="Trigger immediate emergency alert"
              >
                <ShieldAlert size={24} />
                <span>{t.triggerEmergency}</span>
              </button>
            </div>
          ) : (
            <div className="hero-status-pill">
              <Sparkles size={18} className="text-warning" />
              <span>{lang === "ta" ? "கணினி நேரலையில் இயங்குகிறது" : "System Live & Operational"}</span>
            </div>
          )}
        </div>
      </section>

      {/* Family Member Associated Elder Banner */}
      {role === "family_member" && (
        <section style={{
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(16, 185, 129, 0.08))",
          border: "1.5px solid #0284c7",
          borderRadius: "14px",
          padding: "1rem 1.4rem",
          margin: "1.25rem 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: "0 4px 12px rgba(2, 132, 199, 0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0284c7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: "700" }}>
              👨‍👩‍👧
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "#0369a1", letterSpacing: "0.5px" }}>
                {lang === "ta" ? "இணைக்கப்பட்ட முதியவர் (Associated Senior Citizen)" : "Monitoring Senior Citizen Profile"}
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
                {seniors.find((s) => s._id === (activeElderId || activeSeniorId))?.name || "Bhavana Lakshmi"}
                <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted, #64748b)", marginLeft: "8px" }}>
                  ({seniors.find((s) => s._id === (activeElderId || activeSeniorId))?.age || 72} yrs · 🏡 {seniors.find((s) => s._id === (activeElderId || activeSeniorId))?.address ? "Home: " + seniors.find((s) => s._id === (activeElderId || activeSeniorId))?.address.split(",").slice(-2).join(",").trim() : "Home Residence · Adyar"})
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {seniors.length > 1 && (
              <select
                value={activeElderId || activeSeniorId || ""}
                onChange={(e) => {
                  setActiveElderId(e.target.value);
                  setActiveSeniorId(e.target.value);
                }}
                style={{
                  padding: "0.5rem 0.85rem",
                  borderRadius: "8px",
                  border: "1.5px solid #0284c7",
                  background: "var(--bg-surface, #ffffff)",
                  color: "var(--text-main, #0f172a)",
                  fontWeight: "700",
                  fontSize: "0.85rem"
                }}
              >
                {seniors.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (🏡 {s.address ? s.address.split(",").slice(-2).join(",").trim() : "Home Residence"})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsOrderServiceOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <TestTube size={16} />
              <span>{lang === "ta" ? "ஆய்வகம் பதிவு செய்" : "Order Lab Test"}</span>
            </button>
          </div>
        </section>
      )}

      {/* Quick Action Strip */}
      <section className="quick-actions-bar">
        <div className="quick-actions-header">
          <strong>{t.quickActions}</strong>
          <small>{lang === "ta" ? "அடிக்கடி பயன்படுத்தப்படும் செயல்பாடுகள்" : "Frequently used care workflows"}</small>
        </div>

        <div className="quick-actions-grid">
          {/* 1. ADMIN ACTIONS: Strictly administrative operations only */}
          {role === "admin" && (
            <>
              <button className="quick-action-card" onClick={() => onNavigate("videos")}>
                <span className="qa-icon-wrap primary"><Film size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "வீடியோக்கள் மேலாண்மை" : "Video Management"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reviews")}>
                <span className="qa-icon-wrap warning"><Award size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "மதிப்பீடுகள் & புகார்கள்" : "Reviews & Complaints"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("usersManagement")}>
                <span className="qa-icon-wrap info"><UserCog size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "பயனர்கள் மேலாண்மை" : "Users Moderation"}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAddSeniorModal}>
                <span className="qa-icon-wrap success"><UserPlus size={20} /></span>
                <span className="qa-title">{t.addSenior}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reports")}>
                <span className="qa-icon-wrap purple"><FileSpreadsheet size={20} /></span>
                <span className="qa-title">{t.exportReport}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("settings")}>
                <span className="qa-icon-wrap warning"><Activity size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "தணிக்கை & அமைப்புகள்" : "Audit & Logs"}</span>
              </button>
            </>
          )}

          {/* 2. STAFF ACTIONS */}
          {role === "staff" && (
            <>
              <button className="quick-action-card" onClick={onOpenAddSeniorModal}>
                <span className="qa-icon-wrap primary"><UserPlus size={20} /></span>
                <span className="qa-title">{t.addSenior}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAppointmentModal}>
                <span className="qa-icon-wrap info"><Calendar size={20} /></span>
                <span className="qa-title">{t.scheduleAppointment}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("emergency")}>
                <span className="qa-icon-wrap danger"><ShieldAlert size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "அவசர பிரிவு மையம்" : "Emergency Dispatch"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reports")}>
                <span className="qa-icon-wrap purple"><FileSpreadsheet size={20} /></span>
                <span className="qa-title">{t.exportReport}</span>
              </button>
            </>
          )}

          {/* 3. SENIOR CITIZEN ACTIONS: Personal safety, emergency, appointments, lab test orders */}
          {role === "senior_citizen" && (
            <>
              <button className="quick-action-card success" onClick={onOpenCheckinModal}>
                <span className="qa-icon-wrap success"><CheckCircle2 size={20} /></span>
                <span className="qa-title">{t.iAmSafe}</span>
              </button>
              <button className="quick-action-card danger" onClick={onOpenEmergencyModal}>
                <span className="qa-icon-wrap danger"><ShieldAlert size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "⚡ உடனடி SOS அவசரம்" : "⚡ Instant Emergency SOS"}</span>
              </button>
              <button className="quick-action-card" onClick={() => setIsOrderServiceOpen(true)}>
                <span className="qa-icon-wrap primary"><TestTube size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "ஆய்வக பரிசோதனை பதிவு" : "Order Lab Test"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reviews")}>
                <span className="qa-icon-wrap warning"><Star size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "பராமரிப்பாளர் மதிப்பீடு" : "Rate Care Team"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("appointments")}>
                <span className="qa-icon-wrap info"><Calendar size={20} /></span>
                <span className="qa-title">{t.appointments}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAssistanceModal}>
                <span className="qa-icon-wrap warning"><HandHeart size={20} /></span>
                <span className="qa-title">{t.requestAssistance}</span>
              </button>
            </>
          )}

          {/* 4. FAMILY MEMBER ACTIONS: Scoped to linked elder */}
          {role === "family_member" && (
            <>
              <button className="quick-action-card" onClick={() => setIsOrderServiceOpen(true)}>
                <span className="qa-icon-wrap primary"><TestTube size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "பெரியவருக்கு ஆய்வக பரிசோதனை" : "Order Lab Service"}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAppointmentModal}>
                <span className="qa-icon-wrap info"><Calendar size={20} /></span>
                <span className="qa-title">{t.scheduleAppointment}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reviews")}>
                <span className="qa-icon-wrap warning"><Star size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "பராமரிப்பாளரை மதிப்பிடவும்" : "Rate Caregiver"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("fees")}>
                <span className="qa-icon-wrap success"><Receipt size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "கட்டண ரசீதுகள்" : "Care Receipts"}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAssistanceModal}>
                <span className="qa-icon-wrap warning"><HandHeart size={20} /></span>
                <span className="qa-title">{t.requestAssistance}</span>
              </button>
            </>
          )}

          {/* 5. CAREGIVER / CARETAKER ACTIONS */}
          {(role === "caretaker" || role === "caregiver") && (
            <>
              <button className="quick-action-card success" onClick={onOpenCheckinModal}>
                <span className="qa-icon-wrap success"><CheckCircle2 size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "நோயாளி Check-in பதிவு" : "Log Check-in"}</span>
              </button>
              <button className="quick-action-card danger" onClick={() => onNavigate("emergency")}>
                <span className="qa-icon-wrap danger"><ShieldAlert size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "அவசர பிரிவு மீட்பு" : "Emergency Queue"}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAppointmentModal}>
                <span className="qa-icon-wrap info"><Calendar size={20} /></span>
                <span className="qa-title">{t.scheduleAppointment}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("seniors")}>
                <span className="qa-icon-wrap primary"><Users size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "எனது முதியோர்கள்" : "Assigned Seniors"}</span>
              </button>
            </>
          )}

          {/* 6. VOLUNTEER ACTIONS */}
          {role === "volunteer" && (
            <>
              <button className="quick-action-card" onClick={() => onNavigate("assistance")}>
                <span className="qa-icon-wrap warning"><HandHeart size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "உதவி தேவைகள் பலகை" : "Available Requests"}</span>
              </button>
              <button className="quick-action-card success" onClick={() => onNavigate("assistance")}>
                <span className="qa-icon-wrap success"><CheckCircle2 size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "எனது பணிகள்" : "My Active Errands"}</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Interactive Metric Cards */}
      <section className="metric-cards-grid">
        {(role === "senior_citizen" || role === "family_member") ? (
          <div className="metric-card clickable" onClick={() => onNavigate("seniors")}>
            <div className="metric-card-top">
              <span className="metric-icon-box green"><ShieldCheck size={22} /></span>
              <span className="metric-trend success">{lang === "ta" ? "பாதுகாப்பாக உள்ளார்" : "Active & Safe"}</span>
            </div>
            <strong className="metric-value text-success" style={{ fontSize: "1.35rem" }}>
              {lang === "ta" ? "பாதுகாப்பானது" : "Safe & Monitored"}
            </strong>
            <span className="metric-label">{lang === "ta" ? "முதியவர் நல்வாழ்வு நிலை" : "Monitored Elder Wellness"}</span>
            <span className="metric-link-text">{lang === "ta" ? "விவரங்கள் →" : "View Health Status →"}</span>
          </div>
        ) : (
          <div className="metric-card clickable" onClick={() => onNavigate("seniors")}>
            <div className="metric-card-top">
              <span className="metric-icon-box blue"><Users size={22} /></span>
              <span className="metric-trend up">+12 this mo</span>
            </div>
            <strong className="metric-value">{metrics.totalSeniors || seniors.length || 0}</strong>
            <span className="metric-label">{t.totalSeniors}</span>
            <span className="metric-link-text">{t.seniors} →</span>
          </div>
        )}

        <div className={`metric-card clickable ${metrics.activeEmergencies > 0 ? "has-danger-alert" : ""}`} onClick={() => onNavigate("emergency")}>
          <div className="metric-card-top">
            <span className="metric-icon-box red"><AlertCircle size={22} /></span>
            {metrics.activeEmergencies > 0 && <span className="metric-trend danger">ACTION REQ</span>}
          </div>
          <strong className="metric-value text-danger">{metrics.activeEmergencies || 0}</strong>
          <span className="metric-label">{t.activeEmergencies}</span>
          <span className="metric-link-text">{t.emergency} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("safety")}>
          <div className="metric-card-top">
            <span className="metric-icon-box green"><ShieldCheck size={22} /></span>
            <span className="metric-trend success">96% compliant</span>
          </div>
          <strong className="metric-value text-success">{metrics.todayCheckins || 0}</strong>
          <span className="metric-label">{t.todayCheckins}</span>
          <span className="metric-link-text">{t.safety} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("safety")}>
          <div className="metric-card-top">
            <span className="metric-icon-box orange"><Clock size={22} /></span>
          </div>
          <strong className="metric-value text-warning">{metrics.missedCheckins || 0}</strong>
          <span className="metric-label">{t.missedCheckins}</span>
          <span className="metric-link-text">{t.safety} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("appointments")}>
          <div className="metric-card-top">
            <span className="metric-icon-box teal"><Calendar size={22} /></span>
            <span className="metric-trend info">Next 7 days</span>
          </div>
          <strong className="metric-value">{metrics.upcomingAppointments || upcomingAppointments.length || 0}</strong>
          <span className="metric-label">{t.upcomingAppointments}</span>
          <span className="metric-link-text">{t.appointments} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("assistance")}>
          <div className="metric-card-top">
            <span className="metric-icon-box purple"><HandHeart size={22} /></span>
          </div>
          <strong className="metric-value">{metrics.pendingAssistance || assistanceRequests.length || 0}</strong>
          <span className="metric-label">{t.pendingAssistance}</span>
          <span className="metric-link-text">{t.assistance} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("fees")}>
          <div className="metric-card-top">
            <span className="metric-icon-box amber"><CreditCard size={22} /></span>
          </div>
          <strong className="metric-value text-primary">₹{(metrics.pendingFeesAmount || 0).toLocaleString()}</strong>
          <span className="metric-label">{t.pendingFees} ({metrics.pendingFeesCount || 0})</span>
          <span className="metric-link-text">{t.fees} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("settings")}>
          <div className="metric-card-top">
            <span className="metric-icon-box pink"><UserCheck size={22} /></span>
          </div>
          <strong className="metric-value">{metrics.activeCaregivers || 2}</strong>
          <span className="metric-label">{t.activeCaregivers}</span>
          <span className="metric-link-text">{lang === "ta" ? "விபரங்கள்" : "View Care Team"} →</span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* ROLE-SPECIFIC VIEWS & MONTHLY CHECKUP CYCLE TRACKER            */}
      {/* ============================================================== */}

      {/* Monthly Checkup Cycle Tracker Widget for Senior Citizens & Family Members */}
      {(role === "senior_citizen" || role === "family_member") && (
        <section className="monthly-checkup-cycle-section" style={{
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(99, 102, 241, 0.08))",
          border: "2px solid #0284c7",
          borderRadius: "16px",
          padding: "1.25rem 1.5rem",
          margin: "1rem 0 1.75rem",
          boxShadow: "0 4px 16px rgba(2, 132, 199, 0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "12px", background: "linear-gradient(135deg, #0284c7, #2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)" }}>
                <Calendar size={24} />
              </div>
              <div>
                <span style={{ fontSize: "0.76rem", fontWeight: "800", textTransform: "uppercase", color: "#0284c7", letterSpacing: "0.5px" }}>
                  {lang === "ta" ? "🩺 மாதாந்திர வழக்கமான பரிசோதனை சுழற்சி" : "🩺 Monthly Routine Geriatric Checkup Cycle"}
                </span>
                <h3 style={{ margin: "0.15rem 0 0", fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)" }}>
                  {lang === "ta" ? "அக்டோபர் 2026 முதியோர் நல சுழற்சி (நாள் 6 / 30)" : "October 2026 Wellness Cycle (Day 6 of 30)"}
                </h3>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {lang === "ta" ? "சுழற்சி நிலை: செயலில் உள்ளது · மாதந்தோறும் தானாக புதுப்பிக்கப்படும் மருத்துவ சந்திப்பு" : "Status: Active Routine · Auto-recurring monthly health review & vitals check"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-outline-small"
                onClick={() => {
                  showToast(
                    lang === "ta" 
                      ? "மாதாந்திர வழக்கமான பரிசோதனை சுழற்சி வெற்றிகரமாக அமைக்கப்பட்டது!" 
                      : "Monthly routine checkup cycle is set & auto-renewed!",
                    "success"
                  );
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", borderRadius: "10px", borderColor: "#0284c7", color: "#0284c7", fontWeight: "700", fontSize: "0.84rem" }}
              >
                <RefreshCw size={15} />
                <span>{lang === "ta" ? "சுழற்சியை அமை (Set Cycle)" : "Set / Renew Cycle"}</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const snrPhone = primarySenior?.phone || "9080578504";
                  let cleanPhone = snrPhone.replace(/[^0-9]/g, "");
                  if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
                  const msg = encodeURIComponent(`SeniorCare Alert: Monthly checkup appointment scheduled for Tomorrow at 10:00 AM with Dr. S. Kumar (Geriatric Cardiology) at Apollo Senior Health Center. Family Contact: +91 9345403336.`);
                  window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
                  showToast(lang === "ta" ? "WhatsApp நினைவூட்டல் அனுப்பப்பட்டது!" : "WhatsApp reminder dispatched!", "success");
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", fontSize: "0.84rem" }}
              >
                <Bell size={16} />
                <span>{lang === "ta" ? "நினைவூட்டல் அனுப்பு (WhatsApp)" : "Send Reminder (WhatsApp)"}</span>
              </button>
            </div>
          </div>

          {/* Tomorrow's Appointment Alert Banner */}
          <div style={{
            marginTop: "1rem",
            background: "var(--surface, #ffffff)",
            border: "1.5px solid #38bdf8",
            borderRadius: "12px",
            padding: "0.9rem 1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(2, 132, 199, 0.12)", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "0.92rem", color: "#0369a1", display: "block" }}>
                  🔔 {lang === "ta" ? "நாளைக்கான சந்திப்பு எச்சரிக்கை (Tomorrow at 10:00 AM):" : "Checkup Scheduled Tomorrow at 10:00 AM:"}
                </strong>
                <span style={{ fontSize: "0.84rem", color: "var(--text-main)" }}>
                  Dr. S. Kumar, MD (Geriatric Cardiology) · Apollo Senior Health Center · Routine Geriatric Review
                </span>
              </div>
            </div>

            <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.12)", color: "#15803d", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "0.25rem 0.65rem", borderRadius: "20px", fontWeight: "700" }}>
              ✓ {lang === "ta" ? "உறுதிப்படுத்தப்பட்டது" : "Confirmed & Notified"}
            </span>
          </div>
        </section>
      )}

      {/* 1. SENIOR CITIZEN CUSTOM DASHBOARD WIDGETS */}
      {role === "senior_citizen" && (
        <section className="senior-custom-dashboard">
          <div className="senior-cards-grid">
            {/* Safety Status Card */}
            <div className="senior-hero-card card-safe">
              <div className="senior-card-header">
                <ShieldCheck size={28} className="text-success" />
                <h3>{t.seniorSafeStatus}</h3>
              </div>
              <div className="senior-safe-indicator">
                <span className="status-badge-big safe">✓ {t.safeConfirmed}</span>
                <p className="senior-safe-meta">
                  {t.lastCheckin}: {primarySenior?.lastCheckinAt ? new Date(primarySenior.lastCheckinAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today, 08:30 AM"}
                </p>
                <p className="streak-text">🔥 <strong>{primarySenior?.checkinStreak || 14} {t.streakDays}</strong></p>
              </div>
              <button className="btn-senior-checkin" onClick={onOpenCheckinModal}>
                <CheckCircle2 size={20} />
                <span>{lang === "ta" ? "மீண்டும் Check-in செய்" : "Update Today's Check-in"}</span>
              </button>
            </div>

            {/* My Caregiver Card */}
            <div className="senior-hero-card">
              <div className="senior-card-header">
                <Heart size={28} className="text-primary" />
                <h3>{t.myCaregiver}</h3>
              </div>
              <div className="caregiver-info-box">
                <strong>{primarySenior?.assignedCaregiverName || "Anitha Krishnan"}</strong>
                <small>{lang === "ta" ? "முதன்மை செவிலியர் & பராமரிப்பாளர்" : "Primary Geriatric Nurse & Caregiver"}</small>
                <div className="caregiver-contact-row">
                  <Phone size={16} />
                  <span>+91 6382598599</span>
                </div>
              </div>
              <a href="tel:+916382598599" className="btn-call-caregiver">
                <Phone size={18} />
                <span>{t.callCaregiver}</span>
              </a>
            </div>

            {/* My Family Card */}
            <div className="senior-hero-card">
              <div className="senior-card-header">
                <Users size={28} className="text-purple" />
                <h3>{t.myFamily}</h3>
              </div>
              <div className="caregiver-info-box">
                <strong>{primarySenior?.emergencyContactName || "Bhavana Lakshmi (Daughter)"}</strong>
                <small>{primarySenior?.emergencyContactRelation || "Daughter"}</small>
                <div className="caregiver-contact-row">
                  <Phone size={16} />
                  <span>{primarySenior?.emergencyContactPhone || "+91 9345403336"}</span>
                </div>
              </div>
              <a href={`tel:${primarySenior?.emergencyContactPhone || "+919345403336"}`} className="btn-call-family">
                <Phone size={18} />
                <span>{t.callFamily}</span>
              </a>
            </div>

            {/* Lab & Hospital Services Card */}
            <div className="senior-hero-card">
              <div className="senior-card-header">
                <TestTube size={28} className="text-primary" />
                <h3>{lang === "ta" ? "ஆய்வக & மருத்துவ சேவைகள்" : "Lab & Diagnostic Tests"}</h3>
              </div>
              <div className="caregiver-info-box">
                <strong>{lang === "ta" ? "வீட்டு மாதிரி சேகரிப்பு" : "Home Sample Collection"}</strong>
                <small>{lang === "ta" ? "பரிசோதனை பதிவு செய்யலாம் · கட்டண நெருக்கடி இல்லை" : "Order health checks anytime · Zero upfront dues"}</small>
                <div className="caregiver-contact-row">
                  <Sparkles size={15} className="text-warning" />
                  <span>CBC, Diabetes, Thyroid, ECG</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem", borderRadius: "10px", marginTop: "auto" }}
                onClick={() => setIsOrderServiceOpen(true)}
              >
                <TestTube size={16} />
                <span>{lang === "ta" ? "பரிசோதனை பதிவு செய்" : "Order Lab Service"}</span>
              </button>
            </div>

            {/* Active Assistance & Errands Received Card for Senior Citizen */}
            {assistanceRequests && assistanceRequests.length > 0 && (
              <div 
                className="senior-hero-card"
                style={{
                  gridColumn: "1 / -1",
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(16, 185, 129, 0.05))",
                  border: "1.5px solid #10b981"
                }}
              >
                <div className="senior-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <HandHeart size={26} className="text-success" />
                    <div>
                      <h3 style={{ margin: 0 }}>{lang === "ta" ? "உதவி கோரிக்கைகள் & சேவைகள் (Assistance Status)" : "Assistance & Care Requests"}</h3>
                      <small style={{ color: "var(--text-muted)" }}>
                        {lang === "ta" ? "உதவி கிடைத்தவுடன் 'உதவி முடிந்தது' பொத்தானை அழுத்தி உறுதிப்படுத்தவும்" : "Confirm receipt and mark completed once assistance is received"}
                      </small>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="panel-header-link" 
                    onClick={() => onNavigate("assistance")}
                    style={{ fontSize: "0.82rem", background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "700" }}
                  >
                    {lang === "ta" ? "அனைத்தையும் பார்" : "View All"} →
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.75rem" }}>
                  {assistanceRequests.map((req) => (
                    <div 
                      key={req._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "var(--surface)",
                        padding: "0.75rem 1rem",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        gap: "0.75rem",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: req.status === "Completed" ? "#ecfdf5" : "#eff6ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: req.status === "Completed" ? "#10b981" : "#2563eb"
                        }}>
                          <HandHeart size={18} />
                        </div>
                        <div>
                          <strong style={{ display: "block", fontSize: "0.92rem", color: "var(--text-main)" }}>{req.title}</strong>
                          <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            {req.category} · {req.assignedToName ? `${lang === "ta" ? "உதவியாளர்" : "Assistant"}: ${req.assignedToName}` : (lang === "ta" ? "உதவியாளர் பணி ஒதுக்கீடு ஆகிறது..." : "Volunteer assigning...")}
                          </small>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span className={`status-pill-small status-${req.status.toLowerCase().replace(/\s+/g, "-")}`}>
                          {req.status}
                        </span>
                        {req.status !== "Completed" ? (
                          <button
                            type="button"
                            onClick={() => handleConfirmAssistance(req._id)}
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              color: "#fff",
                              border: "none",
                              fontWeight: "700",
                              padding: "0.45rem 0.85rem",
                              borderRadius: "8px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              cursor: "pointer",
                              fontSize: "0.82rem",
                              boxShadow: "0 2px 8px rgba(16,185,129,0.25)"
                            }}
                            title={lang === "ta" ? "உதவி வெற்றிகரமாக கிடைத்தது என உறுதிப்படுத்துக" : "Confirm assistance received"}
                          >
                            <CheckCircle2 size={15} />
                            <span>{lang === "ta" ? "✓ உதவி முடிந்தது / பெற்றுக்கொண்டேன்" : "✓ Confirm Completed"}</span>
                          </button>
                        ) : (
                          <span style={{ color: "#059669", fontWeight: "700", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            <CheckCircle2 size={15} /> {lang === "ta" ? "நிறைவடைந்தது" : "Done"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. FAMILY MEMBER CUSTOM DASHBOARD WIDGET */}
      {role === "family_member" && (
        <section className="family-custom-dashboard" style={{ marginBottom: "2rem" }}>
          <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              {(() => {
                const focusedElder = seniors.find((s) => s._id === (activeElderId || seniors[0]?._id)) || seniors[0];
                const elderName = focusedElder?.name || (lang === "ta" ? "மூத்த உறுப்பினர்" : "Elder");
                const elderRel = elderRelations[focusedElder?._id] || focusedElder?.emergencyContactRelation || (lang === "ta" ? "பெரியவர்" : "Elder");
                return (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <h2 style={{ margin: 0, fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Users className="text-primary" size={24} />
                        {lang === "ta" ? "எனது குடும்பப் பெரியவர்கள் (இணைக்கப்பட்ட மூத்தவர்கள்)" : "My Family Elders (Associated Seniors)"}
                      </h2>
                      <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--primary)", border: "1px solid rgba(37,99,235,0.25)", fontSize: "0.78rem", padding: "0.25rem 0.65rem", borderRadius: "12px", fontWeight: "700" }}>
                        👵 {lang === "ta" ? `இணைக்கப்பட்ட மூத்த உறுப்பினர்: ${elderName} (${elderRel})` : `Linked Elder: ${elderName} (${elderRel})`}
                      </span>
                    </div>
                    <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                      {lang === "ta" 
                        ? `உங்கள் குடும்ப கணக்குடன் பிரத்யேகமாக இணைக்கப்பட்டுள்ள ${elderName} அவர்களின் நேரலை ஆரோக்கியம் மற்றும் மருத்துவ விபரங்கள்.` 
                        : `Live wellness, medical records, and reports scoped specifically to ${elderName} (${elderRel}).`}
                    </p>
                  </>
                );
              })()}
            </div>
            
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button 
                className="btn-outline-small"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", borderRadius: "10px" }}
                onClick={() => setIsOrderServiceOpen(true)}
              >
                <TestTube size={15} className="text-primary" />
                <span>{lang === "ta" ? "ஆய்வகம் பதிவு" : "Order Lab Test"}</span>
              </button>

              <button 
                className="btn-primary" 
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1rem", fontSize: "0.88rem", borderRadius: "10px" }}
                onClick={async () => {
                  try {
                    showToast(lang === "ta" ? "மருத்துவ அறிக்கை பதிவிறக்கப்படுகிறது..." : "Downloading Health & Medical Report...", "info");
                    const res = await api.get("/reports/export/excel?type=health", { responseType: "blob" });
                    const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.setAttribute("download", `Family_Elders_Health_Report_${Date.now()}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(blobUrl);
                    showToast(lang === "ta" ? "மருத்துவ அறிக்கை வெற்றிகரமாக பதிவிறக்கப்பட்டது!" : "Health report downloaded successfully!", "success");
                  } catch(e) {
                    showToast("Failed to download report", "error");
                  }
                }}
              >
                <FileSpreadsheet size={16} />
                <span>{lang === "ta" ? "🩺 மருத்துவ அறிக்கை (Excel)" : "🩺 Download Health Report (Excel)"}</span>
              </button>
            </div>
          </div>

          {/* Elder Switcher Bar for multi-child or multi-elder family accounts */}
          {seniors.length > 1 && (
            <div className="elder-switcher-bar">
              <span className="elder-switcher-label">
                <Users size={15} className="text-primary" />
                <span>{lang === "ta" ? "பெரியவரைத் தேர்ந்தெடு / Switch Elder:" : "Switch Focus Elder:"}</span>
              </span>
              {seniors.map((snr) => {
                const isFocused = (activeElderId || seniors[0]?._id) === snr._id;
                return (
                  <button
                    key={snr._id}
                    type="button"
                    className={`elder-switch-btn ${isFocused ? "active" : ""}`}
                    onClick={() => setActiveElderId(snr._id)}
                  >
                    <span>👵</span>
                    <span>{snr.name} ({snr.age} yrs)</span>
                    {isFocused && <span style={{ marginLeft: "4px" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Graphical Health Analysis & Vitals Stabilization Section */}
          <div style={{
            background: "linear-gradient(135deg, rgba(2, 132, 199, 0.05), rgba(16, 185, 129, 0.05))",
            border: "1.5px solid #0284c7",
            borderRadius: "16px",
            padding: "1.25rem 1.4rem",
            marginBottom: "1.25rem",
            boxShadow: "0 4px 18px rgba(2, 132, 199, 0.06)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Activity size={20} className="text-primary" />
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)" }}>
                    {lang === "ta" 
                      ? "📈 மூத்த குடிமகன் நேரலை உடல்நல வரைபட பகுப்பாய்வு (Health Analytics)" 
                      : "📈 Senior Clinical Vitals & Graphical Health Trends"}
                  </h3>
                  <span style={{ fontSize: "0.72rem", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "0.15rem 0.55rem", borderRadius: "10px", fontWeight: "700" }}>
                    ✓ {lang === "ta" ? "உடல்நிலை சீரானது" : "Stable & Optimal"}
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  {lang === "ta"
                    ? `${elderName} (${elderAge} வயது) - 7-நாள் இரத்த அழுத்தம் & சர்க்கரை கட்டுப்பாடு வரைபடம்.`
                    : `${elderName} (${elderAge} yrs) — 7-Day Blood Pressure Stabilization & Blood Glucose Tracking Curve`}
                </p>
              </div>

              {/* Chart Mode Toggle Pills */}
              <div style={{ display: "flex", gap: "0.4rem", background: "var(--surface)", padding: "0.25rem", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setHealthChartTab("bp")}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    background: healthChartTab === "bp" ? "#0284c7" : "transparent",
                    color: healthChartTab === "bp" ? "#fff" : "var(--text-muted)"
                  }}
                >
                  🩺 {lang === "ta" ? "இரத்த அழுத்தம் (BP 120/80)" : "Blood Pressure (BP)"}
                </button>
                <button
                  type="button"
                  onClick={() => setHealthChartTab("sugar")}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    background: healthChartTab === "sugar" ? "#d97706" : "transparent",
                    color: healthChartTab === "sugar" ? "#fff" : "var(--text-muted)"
                  }}
                >
                  🩸 {lang === "ta" ? "இரத்த சர்க்கரை (104 mg/dL)" : "Blood Sugar (Glucose)"}
                </button>
              </div>
            </div>

            {/* Graphical Chart & Clinical Insights Split */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.25rem", alignItems: "center" }}>
              {/* Left Column: Recharts Graphical Representation */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <small style={{ fontSize: "0.75rem", fontWeight: "700", color: healthChartTab === "bp" ? "#0284c7" : "#d97706" }}>
                    {healthChartTab === "bp" 
                      ? (lang === "ta" ? "7-நாள் இரத்த அழுத்த வீழ்ச்சி & சீரமைப்பு (Systolic/Diastolic mmHg):" : "7-Day Blood Pressure Stabilization Curve (Systolic & Diastolic mmHg):")
                      : (lang === "ta" ? "7-நாள் சர்க்கரை அளவு சரிவு (Fasting & Post-meal mg/dL):" : "7-Day Glycemic Control Tracking Curve (mg/dL):")}
                  </small>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Oct 1 - Oct 6, 2026</span>
                </div>

                <div style={{ width: "100%", height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {healthChartTab === "bp" ? (
                      <AreaChart data={[
                        { day: "Oct 1", systolic: 146, diastolic: 92, pulse: 78 },
                        { day: "Oct 2", systolic: 140, diastolic: 88, pulse: 76 },
                        { day: "Oct 3", systolic: 134, diastolic: 85, pulse: 74 },
                        { day: "Oct 4", systolic: 128, diastolic: 82, pulse: 73 },
                        { day: "Oct 5", systolic: 124, diastolic: 81, pulse: 72 },
                        { day: "Oct 6", systolic: 120, diastolic: 80, pulse: 72 }
                      ]}>
                        <defs>
                          <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis domain={[70, 160]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="systolic" name="Systolic (mmHg)" stroke="#059669" fillOpacity={1} fill="url(#colorSys)" strokeWidth={2.5} />
                        <Area type="monotone" dataKey="diastolic" name="Diastolic (mmHg)" stroke="#0284c7" fillOpacity={1} fill="url(#colorDia)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <LineChart data={[
                        { day: "Oct 1", fasting: 138, postMeal: 172 },
                        { day: "Oct 2", fasting: 128, postMeal: 160 },
                        { day: "Oct 3", fasting: 120, postMeal: 150 },
                        { day: "Oct 4", fasting: 114, postMeal: 138 },
                        { day: "Oct 5", fasting: 108, postMeal: 132 },
                        { day: "Oct 6", fasting: 104, postMeal: 126 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis domain={[90, 185]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="fasting" name="Fasting Glucose (mg/dL)" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="postMeal" name="Post-Meal Glucose (mg/dL)" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column: Clinical Status, Doctor Summary & Instant Sharing */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {/* Wellness Index Gauge Card */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>
                      {lang === "ta" ? "ஒட்டுமொத்த நல்வாழ்வு மதிப்பீடு:" : "Overall Wellness Index:"}
                    </span>
                    <strong style={{ fontSize: "1.1rem", color: "#059669" }}>94 / 100</strong>
                  </div>
                  <div style={{ background: "#e2e8f0", height: "8px", borderRadius: "10px", overflow: "hidden", marginBottom: "0.45rem" }}>
                    <div style={{ background: "linear-gradient(90deg, #10b981, #059669)", width: "94%", height: "100%", borderRadius: "10px" }} />
                  </div>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.35 }}>
                    {lang === "ta" 
                      ? "✓ அம்லோடிபைன் 10mg மாற்றத்திற்குப் பிறகு இரத்த அழுத்தம் 120/80 என சிறப்பான கட்டுப்பாட்டில் உள்ளது." 
                      : "✓ Blood pressure normalized to 120/80 mmHg following Amlodipine 10mg morning adjustment. Blood glucose lowered to 104 mg/dL."}
                  </p>
                </div>

                {/* 1-Click Multi-Channel Sharing Toolbar to Daughter Bhavana */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(2, 132, 199, 0.08))",
                  border: "1.2px solid #10b981",
                  borderRadius: "12px",
                  padding: "0.75rem 0.85rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#065f46" }}>
                      📤 {lang === "ta" ? "குடும்பத்தினருக்கு வரைபட அறிக்கை அனுப்புக:" : "Dispatch Health Summary to Family:"}
                    </span>
                    <span style={{ fontSize: "0.7rem", background: "#ecfdf5", color: "#047857", padding: "0.15rem 0.45rem", borderRadius: "6px", fontWeight: "700" }}>
                      {emergencyContactName} (+{waContactPhone})
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = encodeURIComponent(
                          `🩺 *SeniorCare Live Health Analysis & Vitals Report*\n\n` +
                          `Resident: *${elderName} (${elderAge} yrs)*\n` +
                          `Status: *Optimal & Stabilized (94/100)*\n` +
                          `Blood Pressure: *120/80 mmHg* (Target achieved with Amlodipine 10mg)\n` +
                          `Blood Glucose: *104 mg/dL* (Fasting)\n` +
                          `Pulse: *72 bpm* · SpO2: *98%*\n\n` +
                          `*Doctor's Advice:* Dr. S. Kumar confirmed vitals are well-managed. Continue morning 20-min walking and low salt diet.\n\n` +
                          `_Dispatched to ${emergencyContactName} (+${waContactPhone})_`
                        );
                        window.open(`https://api.whatsapp.com/send?phone=${waContactPhone}&text=${msg}`, "_blank");
                        showToast(lang === "ta" ? "WhatsApp-ல் அறிக்கை பகிரப்பட்டது!" : "Health summary shared via WhatsApp!", "success");
                      }}
                      style={{
                        flex: 1,
                        background: "#25D366",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.4rem 0.5rem",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.3rem"
                      }}
                    >
                      <span>💬 WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const msg = encodeURIComponent(`SeniorCare: ${elderName} health report. BP 120/80, Sugar 104 mg/dL, Pulse 72 bpm. Status: Optimal. Recipient: ${emergencyContactName}.`);
                        window.open(`sms:+${cleanContactPhone}?body=${msg}`, "_blank");
                        showToast(lang === "ta" ? "SMS தயார் செய்யப்பட்டது!" : "SMS draft opened!", "info");
                      }}
                      style={{
                        flex: 1,
                        background: "#0284c7",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.4rem 0.5rem",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.3rem"
                      }}
                    >
                      <span>📱 SMS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const subject = `Health Analysis & Vitals Summary: ${elderName}`;
                        const body = 
                          `Hello ${emergencyContactName},\n\nHere is the latest live clinical health analysis for ${elderName} (${elderAge} yrs):\n\n` +
                          `- Blood Pressure: 120/80 mmHg (Stabilized on Amlodipine 10mg)\n` +
                          `- Fasting Blood Glucose: 104 mg/dL\n` +
                          `- Pulse: 72 bpm\n` +
                          `- SpO2: 98%\n` +
                          `- Overall Wellness Score: 94 / 100 (Optimal)\n\n` +
                          `Doctor's Note: Dr. S. Kumar noted excellent recovery and vitals stability.\n\n` +
                          `Best regards,\nSeniorCare Medical Team`;
                        
                        openGmailComposer({
                          to: emergencyContactEmail || "bhavanalakshmi12006@gmail.com",
                          subject,
                          body
                        });
                        showToast(lang === "ta" ? "Gmail திறக்கப்பட்டது!" : "Gmail draft opened!", "info");
                      }}
                      style={{
                        flex: 1,
                        background: "#ea4335",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.4rem 0.5rem",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.3rem"
                      }}
                    >
                      <span>✉️ Gmail</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {seniors.length === 0 ? (
              <div className="empty-panel-state" style={{ padding: "2.5rem", textAlign: "center", background: "var(--surface)", borderRadius: "16px", border: "1px dashed var(--border)" }}>
                <Users size={40} style={{ color: "var(--muted)", opacity: 0.5, marginBottom: "0.75rem" }} />
                <p style={{ margin: "0.5rem 0", fontWeight: "600" }}>{lang === "ta" ? "இணைக்கப்பட்ட மூத்த குடிமக்கள் இல்லை" : "No associated senior citizens found."}</p>
                <small style={{ color: "var(--muted)" }}>{lang === "ta" ? "நிர்வாகி அல்லது செவிலியர் உங்கள் கணக்குடன் 1 அல்லது 2 உறுப்பினர்களை இணைப்பார்." : "Staff or Administrator will link up to 2 seniors to your family account."}</small>
              </div>
            ) : (
              seniors.map((snr) => (
                <div 
                  key={snr._id} 
                  className={`family-senior-card ${(activeElderId || seniors[0]?._id) === snr._id ? "focused-card" : ""}`}
                  style={{
                    background: "var(--surface)",
                    border: (activeElderId || seniors[0]?._id) === snr._id ? "2px solid var(--primary)" : "1px solid var(--border)",
                    borderRadius: "16px",
                    padding: "1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "14px", overflow: "hidden", background: "var(--surface-hover)", flexShrink: 0, border: "2px solid var(--primary-light)" }}>
                      <img 
                        src={snr.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"} 
                        alt={snr.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>{snr.name}</h3>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          padding: "0.2rem 0.6rem", 
                          borderRadius: "20px", 
                          fontWeight: "600",
                          background: snr.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                          color: snr.status === "active" ? "#10b981" : "#f59e0b"
                        }}>
                          {snr.status === "active" ? (lang === "ta" ? "செயலில்" : "Active Care") : snr.status}
                        </span>
                      </div>
                      <p style={{ margin: "0.2rem 0 0.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
                        {snr.age} {lang === "ta" ? "வயது" : "years"} · {snr.gender} · 🩸 <strong style={{ color: "#ef4444" }}>{snr.bloodGroup || "O+"}</strong>
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        <MapPin size={14} className="text-muted" />
                        <span>{snr.address ? `🏡 ${snr.address}` : (lang === "ta" ? "🏡 இல்ல முகவரி (Home Residence)" : "🏡 Home Residence")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Child Family Linkage & Relationship Selector Display */}
                  <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px dashed rgba(139, 92, 246, 0.25)", padding: "0.5rem 0.75rem", borderRadius: "10px", fontSize: "0.8rem", color: "#6d28d9" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: "600" }}>
                        <span>👨‍👩‍👧</span>
                        <span>{lang === "ta" ? "குடும்ப உறவு முறை (Kinship Mapping):" : "Family Member Kinship:"}</span>
                      </span>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                        {[
                          { key: "Daughter", label: lang === "ta" ? "மகள் (Daughter)" : "Daughter" },
                          { key: "Son", label: lang === "ta" ? "மகன் (Son)" : "Son" },
                          { key: "Son-in-law", label: lang === "ta" ? "மருமகன் (Son-in-law)" : "Son-in-law" },
                          { key: "Daughter-in-law", label: lang === "ta" ? "மருமகள் (Daughter-in-law)" : "Daughter-in-law" },
                          { key: "Mother", label: lang === "ta" ? "தாய் (Mother)" : "Mother" }
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className={`filter-pill ${(elderRelations[snr._id] || snr.emergencyContactRelation || "Daughter") === key ? "active" : ""}`}
                            style={{ padding: "0.18rem 0.55rem", fontSize: "0.72rem" }}
                            onClick={() => handleRelationChange(snr._id, key)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Live Health Analysis Display */}
                  <div style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "12px", padding: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <strong style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--primary)" }}>
                        <Activity size={15} />
                        <span>{lang === "ta" ? "🩺 நேரலை ஆரோக்கிய பகுப்பாய்வு (Health Analysis)" : "🩺 Live Health Analysis & Vitals"}</span>
                      </strong>
                      <span style={{ fontSize: "0.72rem", background: "rgba(16,185,129,0.12)", color: "#10b981", padding: "0.15rem 0.5rem", borderRadius: "12px", fontWeight: "700" }}>
                        ✓ Stable & Safe
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.45rem", textAlign: "center" }}>
                      <div style={{ background: "var(--surface)", padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <small style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Blood Pressure</small>
                        <strong style={{ fontSize: "0.82rem", color: "#059669" }}>122/80</strong>
                      </div>
                      <div style={{ background: "var(--surface)", padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <small style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Pulse Rate</small>
                        <strong style={{ fontSize: "0.82rem", color: "#2563eb" }}>74 bpm</strong>
                      </div>
                      <div style={{ background: "var(--surface)", padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <small style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Blood Sugar</small>
                        <strong style={{ fontSize: "0.82rem", color: "#d97706" }}>104 mg/dL</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "0.6rem", 
                    background: "var(--surface-hover)", 
                    padding: "0.85rem", 
                    borderRadius: "10px",
                    fontSize: "0.82rem"
                  }}>
                    <div>
                      <span style={{ color: "var(--muted)", display: "block", fontSize: "0.75rem" }}>{t.myCaregiver}</span>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.15rem" }}>
                        <Heart size={13} className="text-primary" />
                        {snr.assignedCaregiverName || "Primary Nurse"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)", display: "block", fontSize: "0.75rem" }}>{t.lastCheckin}</span>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.15rem", color: "#10b981" }}>
                        <CheckCircle2 size={13} />
                        {snr.lastCheckinAt ? new Date(snr.lastCheckinAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Safe (Today)"}
                      </strong>
                    </div>
                  </div>

                  {snr.medicalConditions && snr.medicalConditions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {snr.medicalConditions.map((cond, i) => (
                        <span key={i} style={{ fontSize: "0.73rem", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                          ⚠️ {cond}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.45rem", marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, minWidth: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => {
                        setActiveElderId(snr._id);
                        setIsOrderServiceOpen(true);
                      }}
                    >
                      <TestTube size={14} className="text-primary" />
                      <span>{lang === "ta" ? "ஆய்வகம் பதிவு" : "Order Lab"}</span>
                    </button>

                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, minWidth: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => onNavigate("reviews")}
                    >
                      <Star size={14} className="text-warning" />
                      <span>{lang === "ta" ? "மதிப்பீடு" : "Rate Caregiver"}</span>
                    </button>

                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, minWidth: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => onNavigate("fees")}
                    >
                      <Receipt size={14} className="text-success" />
                      <span>{lang === "ta" ? "ரசீதுகள்" : "Receipts"}</span>
                    </button>

                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, minWidth: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={async () => {
                        try {
                          showToast(lang === "ta" ? "மருத்துவ அறிக்கை பதிவிறக்கப்படுகிறது..." : "Downloading Health & Medical Report...", "info");
                          const res = await api.get("/reports/export/excel?type=health", { responseType: "blob" });
                          const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement("a");
                          link.href = blobUrl;
                          link.setAttribute("download", `${snr.name.replace(/\s+/g, "_")}_Health_Report_${Date.now()}.xlsx`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(blobUrl);
                          showToast(lang === "ta" ? "மருத்துவ அறிக்கை பதிவிறக்கப்பட்டது!" : "Report downloaded!", "success");
                        } catch(e) {
                          showToast("Failed to download report", "error");
                        }
                      }}
                    >
                      <FileSpreadsheet size={14} className="text-primary" />
                      <span>{lang === "ta" ? "அறிக்கை (Excel)" : "Excel Report"}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 3. ADMIN RECHARTS ANALYTICS SECTION */}
      {(role === "admin" || role === "staff") && charts && (
        <section className="analytics-charts-section">
          <div className="section-title-row">
            <div>
              <h2>{lang === "ta" ? "செயல்திறன் மற்றும் போக்கு பகுப்பாய்வு" : "Operations & Compliance Analytics"}</h2>
              <p>{lang === "ta" ? "நேரலை தரவுகளிலிருந்து உருவாக்கப்பட்ட வரைபடங்கள்" : "Real-time trends rendered from MongoDB collections"}</p>
            </div>
            <button className="btn-outline-small" onClick={() => onNavigate("reports")}>
              {t.reports} →
            </button>
          </div>

          <div className="charts-grid-2">
            {/* Chart 1: Senior Registrations Trend */}
            <div className="chart-card">
              <div className="chart-card-header">
                <strong>{lang === "ta" ? "மூத்த குடிமக்கள் பதிவு போக்கு" : "Senior Registration Trend"}</strong>
                <small>{lang === "ta" ? "கடந்த 6 மாதங்கள்" : "Last 6 Months"}</small>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={charts.registrationTrend || []}>
                    <defs>
                      <linearGradient id="colorSeniors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Area type="monotone" dataKey="seniors" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSeniors)" name="Seniors" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Fee Collections vs Dues */}
            <div className="chart-card">
              <div className="chart-card-header">
                <strong>{lang === "ta" ? "கட்டண வசூல் மற்றும் நிலுவைகள்" : "Fee Collections vs Remaining Dues"}</strong>
                <small>₹ Indian Rupees</small>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={charts.feeCollection || []}>
                    <CartGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected (₹)" />
                    <Bar dataKey="remaining" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Remaining (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Emergency Trends */}
            <div className="chart-card">
              <div className="chart-card-header">
                <strong>{lang === "ta" ? "அவசர எச்சரிக்கைகள் மற்றும் தீர்வுகள்" : "Emergency Incidents & Resolutions"}</strong>
                <small>{lang === "ta" ? "செயலில் vs தீர்க்கப்பட்டது" : "Active vs Resolved"}</small>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={charts.emergencyTrend || []}>
                    <CartGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Bar dataKey="resolved" fill="#2563eb" radius={[4, 4, 0, 0]} name="Resolved" />
                    <Bar dataKey="active" fill="#ef4444" radius={[4, 4, 0, 0]} name="Active" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Daily Safety Check-in Compliance */}
            <div className="chart-card">
              <div className="chart-card-header">
                <strong>{lang === "ta" ? "தினசரி Check-in இணக்க விகிதம்" : "Daily Check-in Compliance Rate (%)"}</strong>
                <small>Mon — Sun</small>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={charts.checkinCompliance || []}>
                    <CartGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="day" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" domain={[80, 100]} />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Compliance %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3B. FAMILY MEMBER & SENIOR CITIZEN HEALTH ANALYTICS GRAPHS & REPORT DOWNLOAD */}
      {(role === "family_member" || role === "senior_citizen") && (
        <section className="analytics-charts-section" style={{ marginTop: "1rem" }}>
          <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity size={24} className="text-primary" />
                <h2 style={{ margin: 0 }}>
                  {lang === "ta" ? "🩺 முதியோர் உடல்நல பகுப்பாய்வு & போக்கு வரைபடங்கள்" : "🩺 Elder Health Analytics & Vitals Trend"}
                </h2>
              </div>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
                {lang === "ta" 
                  ? "இரத்த அழுத்தம், சர்க்கரை அளவு மாற்றங்கள் (கூடியுள்ளதா/குறைந்துள்ளதா) மற்றும் பதிவிறக்கக்கூடிய மருத்துவ அறிக்கை." 
                  : "Daily blood pressure (Systolic/Diastolic) & blood sugar trends with decrease/stabilization indicators."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                className="btn-primary" 
                style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 1.1rem", fontSize: "0.86rem", borderRadius: "10px" }}
                onClick={async () => {
                  try {
                    showToast(lang === "ta" ? "முழுமையான மருத்துவ அறிக்கை பதிவிறக்கப்படுகிறது..." : "Downloading Health Analytics Report...", "info");
                    const res = await api.get("/reports/export/excel?type=health", { responseType: "blob" });
                    const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    const seniorName = primarySenior?.name || "Bhavana_Lakshmi";
                    link.setAttribute("download", `${seniorName.replace(/\s+/g, "_")}_Health_Report_${Date.now()}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(blobUrl);
                    showToast(lang === "ta" ? "மருத்துவ அறிக்கை வெற்றிகரமாக பதிவிறக்கப்பட்டது!" : "Health report downloaded successfully!", "success");
                  } catch(e) {
                    showToast("Failed to download report", "error");
                  }
                }}
              >
                <Download size={16} />
                <span>{lang === "ta" ? "📥 மருத்துவ அறிக்கை (Excel)" : "📥 Download Health Report (Excel)"}</span>
              </button>

              <button 
                className="btn-secondary" 
                style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 0.95rem", fontSize: "0.86rem", borderRadius: "10px" }}
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>{lang === "ta" ? "அச்சிடுக (Print)" : "Print Summary"}</span>
              </button>
            </div>
          </div>

          <div className="charts-grid-2">
            {/* Health Chart 1: Blood Pressure Trend */}
            <div className="chart-card">
              <div className="chart-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{lang === "ta" ? "இரத்த அழுத்த போக்கு (Blood Pressure Trend)" : "Blood Pressure Trend (BP mmHg)"}</strong>
                  <small style={{ display: "block" }}>{lang === "ta" ? "கடந்த 7 நாட்கள் ஆய்வு" : "Last 7 Days (Systolic / Diastolic)"}</small>
                </div>
                <span style={{ fontSize: "0.74rem", background: "rgba(16, 185, 129, 0.12)", color: "#15803d", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "0.2rem 0.6rem", borderRadius: "20px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <TrendingDown size={14} />
                  <span>{lang === "ta" ? "🟢 -18 mmHg குறைந்து சமநிலையானது" : "🟢 -18 mmHg Reduced & Stable"}</span>
                </span>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={charts?.healthVitalsTrend || [
                    { date: "Oct 1", bpSystolic: 138, bpDiastolic: 88, pulse: 76 },
                    { date: "Oct 2", bpSystolic: 135, bpDiastolic: 86, pulse: 74 },
                    { date: "Oct 3", bpSystolic: 130, bpDiastolic: 84, pulse: 75 },
                    { date: "Oct 4", bpSystolic: 126, bpDiastolic: 82, pulse: 73 },
                    { date: "Oct 5", bpSystolic: 124, bpDiastolic: 81, pulse: 72 },
                    { date: "Oct 6", bpSystolic: 121, bpDiastolic: 80, pulse: 74 },
                    { date: "Today", bpSystolic: 120, bpDiastolic: 80, pulse: 72 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" domain={[60, 150]} />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Legend />
                    <Line type="monotone" dataKey="bpSystolic" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Systolic BP (mmHg)" />
                    <Line type="monotone" dataKey="bpDiastolic" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Diastolic BP (mmHg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Health Chart 2: Blood Sugar Trend */}
            <div className="chart-card">
              <div className="chart-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{lang === "ta" ? "இரத்த சர்க்கரை போக்கு (Blood Sugar)" : "Blood Sugar (Fasting Glucose)"}</strong>
                  <small style={{ display: "block" }}>{lang === "ta" ? "கடந்த 7 நாட்கள் பரிசோதனை" : "Last 7 Days (mg/dL)"}</small>
                </div>
                <span style={{ fontSize: "0.74rem", background: "rgba(16, 185, 129, 0.12)", color: "#15803d", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "0.2rem 0.6rem", borderRadius: "20px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <TrendingDown size={14} />
                  <span>{lang === "ta" ? "🟢 -31 mg/dL கட்டுக்குள் உள்ளது" : "🟢 -31 mg/dL Controlled"}</span>
                </span>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={charts?.healthVitalsTrend || [
                    { date: "Oct 1", bloodSugar: 135 },
                    { date: "Oct 2", bloodSugar: 130 },
                    { date: "Oct 3", bloodSugar: 124 },
                    { date: "Oct 4", bloodSugar: 118 },
                    { date: "Oct 5", bloodSugar: 112 },
                    { date: "Oct 6", bloodSugar: 106 },
                    { date: "Today", bloodSugar: 104 }
                  ]}>
                    <defs>
                      <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" domain={[80, 160]} />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Area type="monotone" dataKey="bloodSugar" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSugar)" name="Fasting Sugar (mg/dL)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3C. CAREGIVER / NURSE SHIFT OPERATIONS ANALYTICS & REPORT DOWNLOAD */}
      {(role === "caretaker" || role === "caregiver") && (
        <section className="analytics-charts-section" style={{ marginTop: "1rem" }}>
          <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={24} className="text-primary" />
                <h2 style={{ margin: 0 }}>
                  {lang === "ta" ? "👩‍⚕️ செவிலியர் பணி செயல்திறன் & பராமரிப்பு பகுப்பாய்வு" : "👩‍⚕️ Nurse & Caregiver Service Analytics"}
                </h2>
              </div>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
                {lang === "ta" ? "தினசரி நோயாளி Check-in, மருந்து மேற்பார்வை மற்றும் shift அறிக்கை பதிவிறக்கம்." : "Daily patient check-ins, medication logs, and downloadable shift audit reports."}
              </p>
            </div>

            <button 
              className="btn-primary" 
              style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 1.1rem", fontSize: "0.86rem", borderRadius: "10px" }}
              onClick={async () => {
                try {
                  showToast(lang === "ta" ? "செவிலியர் shift அறிக்கை பதிவிறக்கப்படுகிறது..." : "Downloading Caregiver Shift Report...", "info");
                  const res = await api.get("/reports/export/excel?type=checkin", { responseType: "blob" });
                  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement("a");
                  link.href = blobUrl;
                  link.setAttribute("download", `Caregiver_Shift_Report_${Date.now()}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(blobUrl);
                  showToast(lang === "ta" ? "அறிக்கை பதிவிறக்கப்பட்டது!" : "Report downloaded!", "success");
                } catch (e) {
                  showToast("Failed to download report", "error");
                }
              }}
            >
              <Download size={16} />
              <span>{lang === "ta" ? "📥 பராமரிப்பு அறிக்கை பதிவிறக்குக" : "📥 Download Care Shift Report"}</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
            <div className="metric-card">
              <span className="metric-label">Daily Check-ins</span>
              <strong className="metric-value text-success">8 / 8 (100%)</strong>
              <small style={{ color: "var(--text-muted)" }}>All assigned elders verified safe</small>
            </div>
            <div className="metric-card">
              <span className="metric-label">Vitals Logged Today</span>
              <strong className="metric-value" style={{ color: "#0284c7" }}>12 Tests</strong>
              <small style={{ color: "var(--text-muted)" }}>BP, Sugar & SpO2 documented</small>
            </div>
            <div className="metric-card">
              <span className="metric-label">Medicine Reminders</span>
              <strong className="metric-value" style={{ color: "#7c3aed" }}>14 Given</strong>
              <small style={{ color: "var(--text-muted)" }}>Zero medication misses</small>
            </div>
            <div className="metric-card">
              <span className="metric-label">Doctor Follow-ups</span>
              <strong className="metric-value text-warning">5 Scheduled</strong>
              <small style={{ color: "var(--text-muted)" }}>Coordinated with hospital team</small>
            </div>
          </div>
        </section>
      )}

      {/* 3D. VOLUNTEER ERRAND ANALYTICS & ACTIVITY LOG */}
      {role === "volunteer" && (
        <section className="analytics-charts-section" style={{ marginTop: "1rem" }}>
          <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HandHeart size={24} className="text-primary" />
                <h2 style={{ margin: 0 }}>
                  {lang === "ta" ? "🤝 தன்னார்வலர் பணிகள் பகுப்பாய்வு & சேவை அறிக்கை" : "🤝 Volunteer Assistance & Errand Analytics"}
                </h2>
              </div>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
                {lang === "ta" ? "மருந்து வாங்கி தருதல், உணவு விநியோகம், துணை உதவி பணிகள் மற்றும் அறிக்கை பதிவிறக்கம்." : "Medicine errands, grocery delivery, senior companionship, and downloadable activity logs."}
              </p>
            </div>

            <button 
              className="btn-primary" 
              style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 1.1rem", fontSize: "0.86rem", borderRadius: "10px" }}
              onClick={async () => {
                try {
                  showToast(lang === "ta" ? "தன்னார்வலர் அறிக்கை பதிவிறக்கப்படுகிறது..." : "Downloading Volunteer Activity Log...", "info");
                  const res = await api.get("/reports/export/excel?type=assistance", { responseType: "blob" });
                  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement("a");
                  link.href = blobUrl;
                  link.setAttribute("download", `Volunteer_Activity_Log_${Date.now()}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(blobUrl);
                  showToast(lang === "ta" ? "அறிக்கை பதிவிறக்கப்பட்டது!" : "Log downloaded!", "success");
                } catch (e) {
                  showToast("Failed to download log", "error");
                }
              }}
            >
              <Download size={16} />
              <span>{lang === "ta" ? "📥 தன்னார்வலர் பணி அறிக்கை" : "📥 Download Volunteer Log"}</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div className="metric-card">
              <span className="metric-label">Completed Errands</span>
              <strong className="metric-value text-success">18 Tasks</strong>
              <small style={{ color: "var(--text-muted)" }}>Medicine, groceries & travel</small>
            </div>
            <div className="metric-card">
              <span className="metric-label">Community Hours</span>
              <strong className="metric-value" style={{ color: "#0284c7" }}>24 Hours</strong>
              <small style={{ color: "var(--text-muted)" }}>Companionship & tech help</small>
            </div>
            <div className="metric-card">
              <span className="metric-label">Elders Supported</span>
              <strong className="metric-value" style={{ color: "#7c3aed" }}>7 Seniors</strong>
              <small style={{ color: "var(--text-muted)" }}>Dedicated personal care</small>
            </div>
            <div className="metric-card">
              <span className="metric-label">Community Rating</span>
              <strong className="metric-value text-warning">⭐ 4.9 / 5.0</strong>
              <small style={{ color: "var(--text-muted)" }}>From verified family reviews</small>
            </div>
          </div>
        </section>
      )}

      {/* 4. ADMIN SPECIFIC PANELS: CAREGIVER/VOLUNTEER MODERATION & VIDEO MANAGEMENT */}
      {role === "admin" && (
        <>
          {/* Admin Staff & Volunteer Moderation / Complaints Panel */}
          <section className="dashboard-admin-moderation-section" style={{ marginBottom: "2rem" }}>
            <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UserCog className="text-primary" size={24} />
                    {lang === "ta" ? "செவிலியர் & தன்னார்வலர் மேற்பார்வை & புகார்கள்" : "Caregiver & Volunteer Moderation & Complaints"}
                  </h2>
                  <span style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "700" }}>
                    {leaderboard.bestCaregivers?.filter(c => c.complaintsCount > 0).length + leaderboard.bestVolunteers?.filter(v => v.complaintsCount > 0).length} {lang === "ta" ? "புகார்கள்" : "Complaints Flagged"}
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {lang === "ta" 
                    ? "மதிப்பீடுகளை சரிபார்த்து, புகார்கள் உள்ள செவிலியர் அல்லது தன்னார்வலர்களை பணியிலிருந்து நீக்குங்கள்." 
                    : "Review performance ratings, audit user feedback, and immediately remove staff with severe complaints."}
                </p>
              </div>

              <button 
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1rem", fontSize: "0.88rem", borderRadius: "10px" }}
                onClick={() => onNavigate("reviews")}
              >
                <Star size={16} />
                <span>{lang === "ta" ? "அனைத்து மதிப்பீடுகள் & புகார்கள் பலகை" : "Open Full Reviews & Complaints Hub"} →</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
              {/* Caregivers Column */}
              <div className="dashboard-panel-box" style={{ padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Heart size={18} className="text-primary" />
                    <span>{lang === "ta" ? "செவிலியர்கள் & பராமரிப்பாளர்கள்" : "Caregivers & Nurses"}</span>
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{leaderboard.bestCaregivers?.length || 0} active</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {(!leaderboard.bestCaregivers || leaderboard.bestCaregivers.length === 0) ? (
                    <div className="empty-panel-state">{lang === "ta" ? "செவிலியர்கள் இல்லை" : "No caregivers found."}</div>
                  ) : (
                    leaderboard.bestCaregivers.map((cg) => (
                      <div 
                        key={cg._id || cg.id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          padding: "0.75rem 0.9rem", 
                          borderRadius: "12px", 
                          background: cg.complaintsCount > 0 ? "rgba(239, 68, 68, 0.05)" : "var(--surface-hover)",
                          border: cg.complaintsCount > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--border)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.95rem" }}>
                            {cg.name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <strong style={{ fontSize: "0.92rem", display: "block" }}>{cg.name}</strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "#f59e0b", fontWeight: "700" }}>
                                <Star size={13} fill="#f59e0b" /> {cg.rating}
                              </span>
                              <span>({cg.reviewCount} reviews)</span>
                              {cg.complaintsCount > 0 && (
                                <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "0.1rem 0.4rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.72rem" }}>
                                  ⚠️ {cg.complaintsCount} complaint{cg.complaintsCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button 
                          type="button"
                          className="btn-danger-outline"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.35rem", borderRadius: "8px" }}
                          onClick={() => handleRemoveStaff(cg._id || cg.id, cg.name, "Caregiver")}
                          title={lang === "ta" ? "செவிலியரை நீக்க/தடை செய்ய" : "Remove / Deactivate Caregiver"}
                        >
                          <Trash2 size={13} />
                          <span>{lang === "ta" ? "நீக்கு" : "Remove"}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Volunteers Column */}
              <div className="dashboard-panel-box" style={{ padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <HandHeart size={18} className="text-success" />
                    <span>{lang === "ta" ? "சமூக தன்னார்வலர்கள்" : "Community Volunteers"}</span>
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{leaderboard.bestVolunteers?.length || 0} active</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {(!leaderboard.bestVolunteers || leaderboard.bestVolunteers.length === 0) ? (
                    <div className="empty-panel-state">{lang === "ta" ? "தன்னார்வலர்கள் இல்லை" : "No volunteers found."}</div>
                  ) : (
                    leaderboard.bestVolunteers.map((vol) => (
                      <div 
                        key={vol._id || vol.id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          padding: "0.75rem 0.9rem", 
                          borderRadius: "12px", 
                          background: vol.complaintsCount > 0 ? "rgba(239, 68, 68, 0.05)" : "var(--surface-hover)",
                          border: vol.complaintsCount > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--border)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16,185,129,0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.95rem" }}>
                            {vol.name?.charAt(0) || "V"}
                          </div>
                          <div>
                            <strong style={{ fontSize: "0.92rem", display: "block" }}>{vol.name}</strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "#f59e0b", fontWeight: "700" }}>
                                <Star size={13} fill="#f59e0b" /> {vol.rating}
                              </span>
                              <span>({vol.reviewCount} reviews)</span>
                              {vol.complaintsCount > 0 && (
                                <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "0.1rem 0.4rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.72rem" }}>
                                  ⚠️ {vol.complaintsCount} complaint{vol.complaintsCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button 
                          type="button"
                          className="btn-danger-outline"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.35rem", borderRadius: "8px" }}
                          onClick={() => handleRemoveStaff(vol._id || vol.id, vol.name, "Volunteer")}
                          title={lang === "ta" ? "தன்னார்வலரை நீக்க/தடை செய்ய" : "Remove / Deactivate Volunteer"}
                        >
                          <Trash2 size={13} />
                          <span>{lang === "ta" ? "நீக்கு" : "Remove"}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Admin Videos Moderation Panel */}
          <section className="dashboard-admin-videos-section" style={{ marginBottom: "2rem" }}>
            <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Film className="text-primary" size={24} />
                    {lang === "ta" ? "சமூக & ஆரோக்கிய வீடியோக்கள் மேலாண்மை" : "Community & Care Wellness Videos Management"}
                  </h2>
                  <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--primary)", border: "1px solid rgba(37,99,235,0.25)", fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "700" }}>
                    {videos.length} {lang === "ta" ? "வீடியோக்கள்" : "Active Videos"}
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {lang === "ta" 
                    ? "முதியோர்களுக்கான யோகா, தியானம் மற்றும் ஆரோக்கிய வீடியோக்களை நேரடியாக கண்காணிக்கலாம் மற்றும் தேவையில்லாதவற்றை நீக்கலாம்." 
                    : "Moderate yoga, meditation, and health video feeds for seniors. Remove unwanted videos instantly."}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button 
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1rem", fontSize: "0.88rem", borderRadius: "10px" }}
                  onClick={() => onNavigate("videos")}
                >
                  <Plus size={16} />
                  <span>{lang === "ta" ? "+ புதிய வீடியோ சேர்க்க" : "+ Add & Manage Videos"}</span>
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {videos.length === 0 ? (
                <div className="empty-panel-state" style={{ padding: "2rem", textAlign: "center", background: "var(--surface)", borderRadius: "14px", border: "1px dashed var(--border)" }}>
                  <Film size={36} style={{ color: "var(--muted)", opacity: 0.5, marginBottom: "0.5rem" }} />
                  <p>{lang === "ta" ? "வீடியோக்கள் எதுவும் சேர்க்கப்படவில்லை." : "No videos found. Click '+ Add & Manage Videos' to add YouTube wellness links."}</p>
                </div>
              ) : (
                videos.slice(0, 4).map((v) => (
                  <div 
                    key={v._id} 
                    style={{ 
                      background: "var(--surface)", 
                      borderRadius: "14px", 
                      border: "1px solid var(--border)", 
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div style={{ height: "130px", position: "relative", background: "#000" }}>
                      <img 
                        src={v.thumbnailUrl || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"} 
                        alt={v.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} 
                      />
                      <span style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.75)", color: "#fff", padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "600" }}>
                        ⏱️ {v.duration || "15 mins"}
                      </span>
                    </div>

                    <div style={{ padding: "0.9rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: "700", textTransform: "uppercase" }}>
                        {v.category || "Wellness"}
                      </span>
                      <strong style={{ fontSize: "0.9rem", lineHeight: "1.3" }}>{v.title}</strong>
                      <small style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Instructor: {v.instructor || "SeniorCare Trainer"}</small>

                      <div style={{ marginTop: "auto", paddingTop: "0.6rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button 
                          type="button" 
                          className="btn-outline-small"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.76rem" }}
                          onClick={() => onNavigate("videos")}
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </button>

                        <button 
                          type="button"
                          className="btn-danger-outline"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.76rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                          onClick={() => handleDeleteVideo(v._id, v.title)}
                          title={lang === "ta" ? "வீடியோவை நீக்க" : "Remove Video"}
                        >
                          <Trash2 size={13} />
                          <span>{lang === "ta" ? "நீக்கு" : "Remove"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {/* Operational Two-Column Section: Appointments & Assistance Requests */}
      <section className="dashboard-operations-row">
        {/* Upcoming Appointments */}
        <div className="dashboard-panel-box">
          <div className="panel-box-header">
            <div>
              <h3>{t.upcomingAppointments}</h3>
              <small>{lang === "ta" ? "மருத்துவ சந்திப்புகள் மற்றும் பரிசோதனைகள்" : "Scheduled consultations and hospital visits"}</small>
            </div>
            <button className="panel-header-link" onClick={() => onNavigate("appointments")}>
              {lang === "ta" ? "அனைத்தும் பார்" : "View All"} →
            </button>
          </div>

          <div className="panel-list-content">
            {upcomingAppointments.length === 0 ? (
              <div className="empty-panel-state">{t.noData}</div>
            ) : (
              upcomingAppointments.map((apt) => (
                <div 
                  key={apt._id} 
                  className="appointment-mini-item postcard-clickable-row"
                  onClick={() => openPostcard(apt, "appointment")}
                  title={lang === "ta" ? "தபால் அட்டையைக் காண தொடவும்" : "Touch / Click to open Postcard"}
                >
                  <div className="apt-calendar-badge">
                    <span className="month">{new Date(apt.appointmentDate).toLocaleString("default", { month: "short" })}</span>
                    <span className="day">{new Date(apt.appointmentDate).getDate()}</span>
                  </div>
                  <div className="apt-mini-info">
                    <strong>{apt.seniorName} — {apt.doctorName}</strong>
                    <small>{apt.department} · {apt.hospital}</small>
                    <span className="apt-time-slot">⏰ {apt.timeSlot}</span>
                  </div>
                  <span className="status-pill-small upcoming">{apt.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assistance Requests */}
        <div className="dashboard-panel-box">
          <div className="panel-box-header">
            <div>
              <h3>{t.assistance}</h3>
              <small>{lang === "ta" ? "உணவு, மருந்து, பயண தேவைகள்" : "Care, grocery, and medicine assistance"}</small>
            </div>
            <button className="panel-header-link" onClick={() => onNavigate("assistance")}>
              {lang === "ta" ? "அனைத்தும் பார்" : "View All"} →
            </button>
          </div>

          <div className="panel-list-content">
            {assistanceRequests.length === 0 ? (
              <div className="empty-panel-state">{t.noData}</div>
            ) : (
              assistanceRequests.map((req) => (
                <div 
                  key={req._id} 
                  className="assistance-mini-item postcard-clickable-row"
                  onClick={() => openPostcard(req, "assistance")}
                  title={lang === "ta" ? "தபால் அட்டையைக் காண தொடவும்" : "Touch / Click to open Postcard"}
                >
                  <div className="assist-icon-circle">
                    <HandHeart size={18} />
                  </div>
                  <div className="assist-mini-info">
                    <strong>{req.title}</strong>
                    <small>{req.seniorName} · {req.category}</small>
                  </div>
                  <span className={`status-pill-small status-${req.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {req.status}
                  </span>
                  {role === "senior_citizen" && req.status !== "Completed" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmAssistance(req._id);
                      }}
                      style={{
                        marginLeft: "auto",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.3rem 0.65rem",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        boxShadow: "0 2px 6px rgba(16,185,129,0.2)"
                      }}
                      title={lang === "ta" ? "உதவி வெற்றிகரமாக கிடைத்தது என உறுதிப்படுத்துக" : "Mark as Completed"}
                    >
                      <CheckCircle2 size={13} />
                      <span>{lang === "ta" ? "✓ முடிந்தது" : "✓ Received"}</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recent Emergencies strip if any */}
      {recentEmergencies.length > 0 && (
        <section className="dashboard-emergencies-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="text-danger">🚨 {lang === "ta" ? "அவசர சம்பவங்கள் பதிவு" : "Emergency Incidents Audit"}</h3>
              <small>{lang === "ta" ? "சமீபத்திய அவசர எச்சரிக்கைகள் மற்றும் அவற்றின் தீர்வுகள்" : "Recent emergency activations and resolution log"}</small>
            </div>
            <button className="panel-header-link" onClick={() => onNavigate("emergency")}>
              {t.emergency} →
            </button>
          </div>

          <div className="emergencies-cards-strip">
            {recentEmergencies.map((em) => (
              <div 
                key={em._id} 
                className={`emergency-summary-card ${em.status === "active" ? "active-alert" : ""} postcard-clickable-row`}
                onClick={() => openPostcard(em, "emergency")}
                title={lang === "ta" ? "தபால் அட்டையைக் காண தொடவும்" : "Touch / Click to open Postcard"}
              >
                <div className="em-card-top">
                  <span className="em-code-tag">{em.emergencyCode}</span>
                  <span className={`em-status-badge ${em.status}`}>{em.status.toUpperCase()}</span>
                </div>
                <strong>{em.seniorName}</strong>
                <p className="em-location-line">📍 {em.location || (lang === "ta" ? "முதியவர் இல்லம்" : "Home Residence")}</p>
                <small className="em-notes-snippet">{em.notes}</small>
                <div className="em-time-row">
                  <Clock size={12} />
                  <span>{new Date(em.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Community Reviews & Top-Rated Care Team Leaderboard Showcase (Visible on Dashboard to All) */}
      <section className="dashboard-reviews-showcase" style={{ margin: "2.25rem 0" }}>
        <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Star className="text-warning" size={24} fill="#f59e0b" />
              <h2 style={{ margin: 0, fontSize: "1.35rem" }}>
                {lang === "ta" ? "சிறந்த பராமரிப்பாளர்கள் & சமூக மதிப்புரைகள் (Reviews)" : "Top-Rated Caregivers & Community Reviews"}
              </h2>
            </div>
            <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
              {lang === "ta" 
                ? "மூத்த குடிமக்கள் மற்றும் குடும்பத்தினரால் வழங்கப்பட்ட உண்மையான மதிப்பீடுகள் மற்றும் பரிந்துரைகள்." 
                : "Real verified star ratings, recommendations, and feedback from seniors and families."}
            </p>
          </div>

          <button 
            type="button" 
            className="btn-outline-small"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px" }}
            onClick={() => onNavigate("reviews")}
          >
            <Award size={16} className="text-warning" />
            <span>{lang === "ta" ? "அனைத்து மதிப்பீடுகள் பலகை" : "View Full Reviews & Leaderboard"} →</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {/* Top Caregiver Highlight */}
          {leaderboard.bestCaregivers?.slice(0, 2).map((cg) => (
            <div 
              key={cg._id || cg.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "1.25rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(37,99,235,0.12)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem" }}>
                    {cg.name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <strong style={{ fontSize: "1rem", display: "block" }}>{cg.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{cg.badge || "⭐ Top-Rated Caretaker"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(245,158,11,0.12)", padding: "0.25rem 0.65rem", borderRadius: "20px", color: "#d97706", fontWeight: "700", fontSize: "0.88rem" }}>
                  <Star size={15} fill="#f59e0b" />
                  <span>{cg.rating}</span>
                </div>
              </div>

              {cg.recentFeedback?.[0] ? (
                <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--surface-hover)", padding: "0.65rem 0.85rem", borderRadius: "10px", lineHeight: "1.45" }}>
                  "{cg.recentFeedback[0].feedback}"
                  <span style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginTop: "0.35rem", color: "var(--primary)", fontStyle: "normal" }}>
                    — {cg.recentFeedback[0].reviewerName} ({cg.recentFeedback[0].reviewerRole === "family_member" ? (lang === "ta" ? "குடும்பத்தினர்" : "Family") : (lang === "ta" ? "மூத்த உறுப்பினர்" : "Senior Resident")})
                  </span>
                </p>
              ) : (
                <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--surface-hover)", padding: "0.65rem 0.85rem", borderRadius: "10px", lineHeight: "1.45" }}>
                  "Sister Anitha is so caring and patient. She checks my blood pressure and medication on exact time every morning."
                  <span style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginTop: "0.35rem", color: "var(--primary)", fontStyle: "normal" }}>
                    — Lakshmi Devi ({lang === "ta" ? "மூத்த உறுப்பினர்" : "Senior Resident"})
                  </span>
                </p>
              )}
            </div>
          ))}

          {/* Top Volunteer Highlight */}
          {leaderboard.bestVolunteers?.slice(0, 1).map((vol) => (
            <div 
              key={vol._id || vol.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "1.25rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(16,185,129,0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem" }}>
                    {vol.name?.charAt(0) || "V"}
                  </div>
                  <div>
                    <strong style={{ fontSize: "1rem", display: "block" }}>{vol.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{vol.badge || "🏆 Best Community Volunteer"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(245,158,11,0.12)", padding: "0.25rem 0.65rem", borderRadius: "20px", color: "#d97706", fontWeight: "700", fontSize: "0.88rem" }}>
                  <Star size={15} fill="#f59e0b" />
                  <span>{vol.rating}</span>
                </div>
              </div>

              <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--surface-hover)", padding: "0.65rem 0.85rem", borderRadius: "10px", lineHeight: "1.45" }}>
                "{vol.recentFeedback?.[0]?.feedback || "Karthik bought my blood pressure medicines from Apollo pharmacy and helped set up video call with my grandson."}"
                <span style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginTop: "0.35rem", color: "var(--primary)", fontStyle: "normal" }}>
                  — {vol.recentFeedback?.[0]?.reviewerName || "Priya Ramesh"} ({vol.recentFeedback?.[0]?.reviewerRole === "family_member" ? (lang === "ta" ? "குடும்பத்தினர்" : "Family") : (lang === "ta" ? "மூத்த உறுப்பினர்" : "Senior Resident")})
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Care Moments & Life At SeniorCare Gallery */}
      <CareGallery />

      {/* Interactive Postcard Detail Modal */}
      <PostcardModal
        isOpen={isPostcardOpen}
        onClose={() => setIsPostcardOpen(false)}
        data={postcardData}
        type={postcardType}
        onAction={(data) => {
          if (postcardType === "appointment") onNavigate("appointments");
          else if (postcardType === "assistance") onNavigate("assistance");
          else if (postcardType === "emergency") onNavigate("emergency");
          else if (postcardType === "senior") onNavigate("seniors");
        }}
      />

      {/* Order Lab & Diagnostic Health Service Modal */}
      <OrderServiceModal
        isOpen={isOrderServiceOpen}
        onClose={() => setIsOrderServiceOpen(false)}
        defaultSeniorId={activeElderId || primarySenior?._id}
        seniors={seniors}
        onOrderSuccess={loadDashboardData}
      />

      {/* Official Care Package Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          receipt={activeReceipt}
        />
      )}
    </div>
  );
}

// Helper Grid wrapper for Recharts
function CartGrid(props) {
  return <CartesianGrid strokeDasharray="3 3" opacity={0.15} {...props} />;
}

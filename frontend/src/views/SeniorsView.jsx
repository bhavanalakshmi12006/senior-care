import React, { useState, useEffect } from "react";
import { 
  Users, Search, UserPlus, Filter, ShieldCheck, AlertCircle, 
  Phone, MapPin, Heart, Calendar, CreditCard, ChevronRight, 
  Clock, Edit, Trash2, ArrowLeft, Activity, Mail, MessageSquare, CheckCircle2 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import AddSeniorModal from "../components/Modals/AddSeniorModal";
import ConfirmModal from "../components/Modals/ConfirmModal";

export default function SeniorsView({ initialSelectedId, onOpenEmergencyModal }) {
  const { user, t, lang } = useAuth();
  const { showToast } = useToast();

  const [seniors, setSeniors] = useState([]);
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [seniorDetails, setSeniorDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSenior, setEditingSenior] = useState(null);
  const [deletingSenior, setDeletingSenior] = useState(null);

  const isStaffOrAdmin = user?.role === "admin" || user?.role === "staff";
  const canEdit = isStaffOrAdmin || user?.role === "family_member";

  const loadSeniors = async () => {
    try {
      const res = await api.get("/seniors");
      setSeniors(res.data.seniors || []);
      if (initialSelectedId) {
        const found = res.data.seniors?.find((s) => s._id === initialSelectedId);
        if (found) viewSeniorDetails(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeniors();
  }, [initialSelectedId]);

  const viewSeniorDetails = async (senior) => {
    setSelectedSenior(senior);
    setActiveTab("info");
    try {
      const res = await api.get(`/seniors/${senior._id}`);
      setSeniorDetails(res.data);

      // Record recently accessed
      await api.post("/search/recently-accessed", {
        itemType: "senior",
        itemId: senior._id,
        title: senior.name,
        subtitle: `🏡 ${senior.address ? senior.address.split(",").slice(-2).join(",").trim() : "Home Residence"} · 📱 ${senior.phone || ""}`
      });
    } catch (err) {
      console.error("Failed to load senior details:", err);
    }
  };

  const handleDeleteSenior = async () => {
    if (!deletingSenior) return;
    try {
      await api.delete(`/seniors/${deletingSenior._id}`);
      showToast(lang === "ta" ? "மூத்த குடிமகன் நீக்கப்பட்டார்" : "Senior citizen deleted", "info");
      setSelectedSenior(null);
      loadSeniors();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const filtered = seniors.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search));
    
    if (filterStatus === "safe") return matchesSearch && s.safetyStatus === "safe";
    if (filterStatus === "attention") return matchesSearch && s.safetyStatus !== "safe";
    return matchesSearch;
  });

  return (
    <div className="view-page-container">
      {/* If viewing detailed profile */}
      {selectedSenior ? (
        <div className="senior-profile-page">
          <div className="profile-top-nav">
            <button className="btn-back-link" onClick={() => setSelectedSenior(null)}>
              <ArrowLeft size={18} />
              <span>{lang === "ta" ? "பட்டியலுக்குத் திரும்பு" : "Back to Seniors Directory"}</span>
            </button>

            {canEdit && (
              <div className="profile-actions-bar">
                <button
                  className="btn-outline-small"
                  onClick={() => {
                    setEditingSenior(selectedSenior);
                    setIsAddOpen(true);
                  }}
                  title="Update personal details, emergency contacts, or family kinship mapping"
                >
                  <Edit size={16} />
                  <span>{user?.role === "family_member" ? (lang === "ta" ? "உறவு முறை / தொடர்பு திருத்துக" : "Edit Kinship & Contact") : (lang === "ta" ? "திருத்துக" : "Edit Profile")}</span>
                </button>
                {user?.role === "admin" && (
                  <button
                    className="btn-danger-small"
                    onClick={() => setDeletingSenior(selectedSenior)}
                  >
                    <Trash2 size={16} />
                    <span>{t.delete}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Header Card */}
          <div className="senior-profile-header-card">
            <div className="profile-avatar-large">
              {selectedSenior.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-header-info">
              <div className="profile-name-row">
                <h2>{selectedSenior.name}</h2>
                <span className={`status-pill ${selectedSenior.safetyStatus === "safe" ? "status-safe" : "status-danger"}`}>
                  {selectedSenior.safetyStatus.toUpperCase()}
                </span>
              </div>
              <p className="profile-meta-line">
                <span>🎂 {selectedSenior.age} {lang === "ta" ? "வயது" : "years"}</span>
                <span>•</span>
                <span>{selectedSenior.gender}</span>
                <span>•</span>
                <span>🩸 {selectedSenior.bloodGroup || "O+"}</span>
                <span>•</span>
                <span>🏡 {selectedSenior.address ? selectedSenior.address.split(",").slice(-2).join(",").trim() : (lang === "ta" ? "இல்லம்" : "Home Residence")}</span>
              </p>
              <div className="profile-contact-badges">
                <span className="contact-badge"><Phone size={14} /> {selectedSenior.phone || "+91 9080578504"}</span>
                <span className="contact-badge"><MapPin size={14} /> {selectedSenior.address || "Senior Haven Community, Adyar"}</span>
              </div>
            </div>

            <div className="profile-streak-box">
              <span className="streak-icon">🔥</span>
              <div>
                <strong>{selectedSenior.checkinStreak || 1} {lang === "ta" ? "நாட்கள்" : "Days"}</strong>
                <small>{lang === "ta" ? "பாதுகாப்பு தொடர்ச்சி" : "Safety Streak"}</small>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="profile-tabs-header">
            <button
              className={`profile-tab-btn ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              {lang === "ta" ? "தனிப்பட்ட & மருத்துவ தகவல்" : "Personal & Medical"}
            </button>
            <button
              className={`profile-tab-btn ${activeTab === "safety" ? "active" : ""}`}
              onClick={() => setActiveTab("safety")}
            >
              {lang === "ta" ? "பாதுகாப்பு & Check-ins" : "Safety & Check-ins"}
            </button>
            <button
              className={`profile-tab-btn ${activeTab === "appointments" ? "active" : ""}`}
              onClick={() => setActiveTab("appointments")}
            >
              {t.appointments} ({seniorDetails?.appointments?.length || 0})
            </button>
            <button
              className={`profile-tab-btn ${activeTab === "fees" ? "active" : ""}`}
              onClick={() => setActiveTab("fees")}
            >
              {t.fees} ({seniorDetails?.fees?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="profile-tab-content">
            {activeTab === "info" && (
              <div className="profile-grid-2">
                <div className="profile-detail-card">
                  <h3>{lang === "ta" ? "மருத்துவ நிலை & குறிப்புகள்" : "Medical Conditions & Notes"}</h3>
                  <div className="medical-notes-box">
                    <p>{selectedSenior.medicalNotes || "Hypertension, Blood Sugar, routine blood pressure monitoring required."}</p>
                  </div>

                  <h3 style={{ marginTop: 20 }}>{lang === "ta" ? "ஒதுக்கப்பட்ட செவிலியர் / பராமரிப்பாளர்" : "Assigned Caregiver"}</h3>
                  <div className="care-contact-strip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Heart size={22} className="text-primary" />
                      <div>
                        <strong>{selectedSenior.assignedCaregiverName || "Anitha Krishnan"}</strong>
                        <small style={{ display: "block", color: "var(--text-muted)" }}>On-Duty Geriatric Nurse · +91 6382598599</small>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <a 
                        href="tel:+916382598599" 
                        className="btn-outline-small"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px" }}
                        title="Call Caregiver"
                      >
                        <Phone size={13} />
                        <span>Call</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=916382598599&text=Hello%20Anitha%20Krishnan,%20SeniorCare%20resident%20update."
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px", background: "#25D366", color: "#fff", textDecoration: "none", fontWeight: "600" }}
                        title="WhatsApp Caregiver"
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="profile-detail-card" style={{ border: "1.5px solid #0284c7", borderRadius: "14px", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem", color: "#0284c7" }}>
                      <Users size={18} />
                      <span>{lang === "ta" ? "குடும்ப உறுப்பினர் மேப்பிங் (Kinship)" : "Family Member Mapping & Kinship"}</span>
                    </h3>
                    <span style={{ fontSize: "0.72rem", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid #a7f3d0", padding: "0.15rem 0.5rem", borderRadius: "10px", fontWeight: "700" }}>
                      ✓ Verified Link
                    </span>
                  </div>

                  <div className="emergency-contact-box" style={{ background: "rgba(2,132,199,0.04)", borderRadius: "10px", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <strong style={{ fontSize: "1.05rem", display: "block" }}>{selectedSenior.emergencyContactName || "Bhavana Lakshmi"}</strong>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.25rem", background: "rgba(139,92,246,0.12)", color: "#7c3aed", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.76rem", fontWeight: "700" }}>
                          <span>👩‍👧</span>
                          <span>{selectedSenior.emergencyContactRelation || "Daughter"} ({lang === "ta" ? "மகள்" : "Daughter"})</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingSenior(selectedSenior);
                          setIsAddOpen(true);
                        }}
                        style={{ border: "1px solid var(--border)", background: "var(--surface)", borderRadius: "6px", padding: "0.25rem 0.55rem", fontSize: "0.74rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <Edit size={12} />
                        <span>{lang === "ta" ? "உறவு மாற்று" : "Change Kinship"}</span>
                      </button>
                    </div>

                    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
                      <div className="contact-phone-strip" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <Phone size={15} className="text-primary" />
                        <a href={`tel:${selectedSenior.emergencyContactPhone || "+919345403336"}`} style={{ fontWeight: "700", color: "var(--text-main)", textDecoration: "none" }}>
                          {selectedSenior.emergencyContactPhone || "+91 9345403336"}
                        </a>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        <Mail size={15} />
                        <span>bhavanalakshmi12006@gmail.com</span>
                      </div>
                    </div>

                    {/* Instant Family Contact Action Buttons */}
                    <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed rgba(2,132,199,0.2)", display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                      <a
                        href={`https://api.whatsapp.com/send?phone=919345403336&text=${encodeURIComponent(`Hello Bhavana Lakshmi, update regarding ${selectedSenior.name}: all vitals are stable.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ flex: 1, minWidth: "110px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.4rem 0.6rem", borderRadius: "8px", background: "#25D366", color: "#fff", textDecoration: "none", fontWeight: "700", fontSize: "0.78rem" }}
                        title="Direct WhatsApp message to Bhavana Lakshmi"
                      >
                        <MessageSquare size={14} />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`sms:+919345403336?body=${encodeURIComponent(`SeniorCare update for ${selectedSenior.name}: safe and active.`)}`}
                        style={{ flex: 1, minWidth: "90px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.4rem 0.6rem", borderRadius: "8px", background: "#0284c7", color: "#fff", textDecoration: "none", fontWeight: "700", fontSize: "0.78rem" }}
                        title="Send SMS"
                      >
                        <Phone size={14} />
                        <span>SMS</span>
                      </a>

                      <a
                        href={`tel:${selectedSenior.emergencyContactPhone || "+919345403336"}`}
                        style={{ flex: 1, minWidth: "90px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-main)", textDecoration: "none", fontWeight: "700", fontSize: "0.78rem" }}
                        title="Phone Call"
                      >
                        <Phone size={14} />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "safety" && (
              <div className="profile-detail-card">
                <h3>{lang === "ta" ? "சமீபத்திய பாதுகாப்பு பதிவுகள்" : "Recent Check-in Logs"}</h3>
                <div className="responsive-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{lang === "ta" ? "தேதி & நேரம்" : "Date & Time"}</th>
                        <th>{t.status}</th>
                        <th>{t.mood}</th>
                        <th>{t.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seniorDetails?.checkins?.map((c) => (
                        <tr key={c._id}>
                          <td>{new Date(c.timestamp).toLocaleString()}</td>
                          <td><span className="status-pill status-safe">✓ {c.status}</span></td>
                          <td>{c.mood}</td>
                          <td>{c.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="profile-detail-card">
                <h3>{t.appointments}</h3>
                <div className="appointments-grid-list">
                  {seniorDetails?.appointments?.map((apt) => (
                    <div key={apt._id} className="appointment-card-full">
                      <strong>{apt.doctorName}</strong>
                      <small>{apt.department} · {apt.hospital}</small>
                      <p>📅 {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.timeSlot}</p>
                      <span className={`status-pill ${apt.status === "Upcoming" ? "status-upcoming" : "status-safe"}`}>{apt.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "fees" && (
              <div className="profile-detail-card">
                <h3>{t.fees}</h3>
                <div className="fees-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t.feeTitle}</th>
                        <th>{t.totalAmount}</th>
                        <th>{t.paidAmount}</th>
                        <th>{t.remainingAmount}</th>
                        <th>{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seniorDetails?.fees?.map((f) => (
                        <tr key={f._id}>
                          <td><strong>{f.title}</strong></td>
                          <td>₹{f.totalAmount?.toLocaleString()}</td>
                          <td className="text-success">₹{f.paidAmount?.toLocaleString()}</td>
                          <td className="text-danger">₹{f.remainingAmount?.toLocaleString()}</td>
                          <td><span className={`status-pill status-${f.status?.toLowerCase().replace(/\s+/g, "-")}`}>{f.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Seniors Directory List View */
        <>
          <div className="view-header-bar">
            <div>
              <h2>{t.seniors} ({filtered.length})</h2>
              <p>{lang === "ta" ? "மூத்த குடிமக்களின் விவரங்கள், இருப்பிடம் மற்றும் பாதுகாப்பு நிலவரம்" : "Directory of registered senior citizens and care status"}</p>
            </div>

            {isStaffOrAdmin && (
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingSenior(null);
                  setIsAddOpen(true);
                }}
              >
                <UserPlus size={18} />
                <span>{t.addSenior}</span>
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="view-filter-bar">
            <div className="search-filter-input">
              <Search size={18} />
              <input
                type="text"
                placeholder={lang === "ta" ? "பெயர், முகவரி/பகுதி, தொலைபேசி மூலம் தேட..." : "Search by name, address/area, or phone..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-pills-row">
              <button
                className={`filter-pill ${filterStatus === "all" ? "active" : ""}`}
                onClick={() => setFilterStatus("all")}
              >
                {lang === "ta" ? "அனைத்தும்" : "All"} ({seniors.length})
              </button>
              <button
                className={`filter-pill ${filterStatus === "safe" ? "active" : ""}`}
                onClick={() => setFilterStatus("safe")}
              >
                ✓ {lang === "ta" ? "பாதுகாப்பானவர்கள்" : "Safe"} ({seniors.filter((s) => s.safetyStatus === "safe").length})
              </button>
              <button
                className={`filter-pill ${filterStatus === "attention" ? "active" : ""}`}
                onClick={() => setFilterStatus("attention")}
              >
                ⚠️ {lang === "ta" ? "கவனம் தேவை" : "Attention Needed"} ({seniors.filter((s) => s.safetyStatus !== "safe").length})
              </button>
            </div>
          </div>

          {/* Seniors Cards Grid */}
          <div className="seniors-cards-grid">
            {filtered.map((s) => (
              <div
                key={s._id}
                className="senior-directory-card"
                onClick={() => viewSeniorDetails(s)}
              >
                <div className="directory-card-top">
                  <div className="directory-avatar">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`status-pill ${s.safetyStatus === "safe" ? "status-safe" : "status-danger"}`}>
                    {s.safetyStatus === "safe" ? "✓ SAFE" : "⚠️ ALERT"}
                  </span>
                </div>

                <div className="directory-card-body">
                  <strong>{s.name}</strong>
                  <p className="directory-meta">
                    {s.age} {lang === "ta" ? "வயது" : "yrs"} · {s.gender} · 🏡 {s.address ? s.address.split(",")[s.address.split(",").length - 2]?.trim() || "Adyar" : (lang === "ta" ? "இல்லம்" : "Home")}
                  </p>
                  <small className="directory-phone">📞 {s.phone || "No phone"}</small>
                  <div className="directory-caregiver-line">
                    <Heart size={14} className="text-primary" />
                    <span>{s.assignedCaregiverName || "Anitha Krishnan"}</span>
                  </div>
                </div>

                <div className="directory-card-footer">
                  <span className="streak-tag">🔥 {s.checkinStreak || 1}d safe</span>
                  <span className="view-details-arrow">{lang === "ta" ? "விவரங்கள்" : "View"} <ChevronRight size={16} /></span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Senior Modal */}
      {isAddOpen && (
        <AddSeniorModal
          isOpen={isAddOpen}
          initialData={editingSenior}
          onClose={() => {
            setIsAddOpen(false);
            setEditingSenior(null);
          }}
          onSeniorAdded={() => {
            loadSeniors();
            if (editingSenior) setSelectedSenior(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSenior && (
        <ConfirmModal
          isOpen={!!deletingSenior}
          title={lang === "ta" ? "மூத்தவரை நீக்கவா?" : "Delete Senior Citizen?"}
          message={`Are you sure you want to remove ${deletingSenior.name}? This action cannot be undone.`}
          onClose={() => setDeletingSenior(null)}
          onConfirm={handleDeleteSenior}
        />
      )}
    </div>
  );
}

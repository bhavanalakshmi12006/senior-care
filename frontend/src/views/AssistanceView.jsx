import React, { useState, useEffect } from "react";
import { HandHeart, Plus, Pill, Utensils, ShoppingBag, Car, Home, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import AssistanceModal from "../components/Modals/AssistanceModal";

export default function AssistanceView({ onOpenAssistanceModal }) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const res = await api.get("/assistance");
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [liveEventSignal]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/assistance/${id}/status`, { status });
      showToast(lang === "ta" ? `நிலை மாற்றப்பட்டது: ${status}` : `Status updated to ${status}`, "success");
      loadRequests();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Medicine Pickup": return <Pill size={18} />;
      case "Food Assistance": return <Utensils size={18} />;
      case "Shopping": return <ShoppingBag size={18} />;
      case "Travel Assistance": return <Car size={18} />;
      default: return <Home size={18} />;
    }
  };

  const filtered = requests.filter((r) => {
    if (filterCategory === "all") return true;
    return r.category === filterCategory;
  });

  return (
    <div className="view-page-container">
      <div className="view-header-bar">
        <div>
          <h2>{t.assistance}</h2>
          <p>{lang === "ta" ? "மருந்து, உணவு, மளிகை மற்றும் பயண உதவிகள் ஒருங்கிணைப்பு" : "Care, pharmacy, and meal support requests handled by volunteers and caregivers"}</p>
        </div>

        <button className="btn-primary" onClick={onOpenAssistanceModal}>
          <Plus size={18} />
          <span>{t.requestAssistance}</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="view-filter-bar">
        <div className="filter-pills-row">
          <button
            className={`filter-pill ${filterCategory === "all" ? "active" : ""}`}
            onClick={() => setFilterCategory("all")}
          >
            {lang === "ta" ? "அனைத்தும்" : "All"} ({requests.length})
          </button>
          <button
            className={`filter-pill ${filterCategory === "Medicine Pickup" ? "active" : ""}`}
            onClick={() => setFilterCategory("Medicine Pickup")}
          >
            💊 {t.medicinePickup}
          </button>
          <button
            className={`filter-pill ${filterCategory === "Food Assistance" ? "active" : ""}`}
            onClick={() => setFilterCategory("Food Assistance")}
          >
            🍱 {t.foodAssistance}
          </button>
          <button
            className={`filter-pill ${filterCategory === "Travel Assistance" ? "active" : ""}`}
            onClick={() => setFilterCategory("Travel Assistance")}
          >
            🚗 {t.travelAssistance}
          </button>
          <button
            className={`filter-pill ${filterCategory === "Home Assistance" ? "active" : ""}`}
            onClick={() => setFilterCategory("Home Assistance")}
          >
            🏠 {t.homeAssistance}
          </button>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="assistance-cards-grid">
        {filtered.length === 0 ? (
          <div className="empty-panel-state col-span-full">{t.noData}</div>
        ) : (
          filtered.map((req) => (
            <div key={req._id} className="assistance-ticket-card">
              <div className="assist-card-header">
                <span className="assist-category-tag">
                  {getCategoryIcon(req.category)}
                  <span>{req.category}</span>
                </span>
                <span className={`status-pill status-${req.status.toLowerCase().replace(/\s+/g, "-")}`}>
                  {req.status}
                </span>
              </div>

              <div className="assist-card-body">
                <h4 className="assist-title">{req.title}</h4>
                <p className="assist-senior-line">👵 <strong>{req.seniorName}</strong></p>
                {req.description && <p className="assist-desc-text">{req.description}</p>}
                
                <div className="assist-meta-row">
                  <span>Priority: <strong className={req.priority === "Urgent" ? "text-danger" : ""}>{req.priority}</strong></span>
                  <span>•</span>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="assist-assignee-box">
                  <UserCheck size={16} />
                  <span>{t.assignedTo}: <strong>{req.assignedToName || "Unassigned / Open"}</strong></span>
                </div>
              </div>

              {/* Action buttons based on Role */}
              <div className="assist-card-footer" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {/* 1. Senior Citizen Confirmation Button (As requested: Senior Citizen marks it as Completed) */}
                {user?.role === "senior_citizen" && req.status !== "Completed" && (
                  <button
                    className="btn-complete-task"
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#fff",
                      border: "none",
                      fontWeight: "700",
                      padding: "0.5rem 0.9rem",
                      borderRadius: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      boxShadow: "0 2px 8px rgba(16,185,129,0.25)"
                    }}
                    onClick={() => handleUpdateStatus(req._id, "Completed")}
                    title={lang === "ta" ? "உதவி வெற்றிகரமாக கிடைத்தது என உறுதிப்படுத்துக" : "Confirm assistance received and mark as completed"}
                  >
                    <CheckCircle2 size={16} />
                    <span>{lang === "ta" ? "✓ உதவி முடிந்தது / பெற்றுக்கொண்டேன் (Mark Completed)" : "✓ Confirm Completed (Task Done)"}</span>
                  </button>
                )}

                {/* 2. Volunteers / Caregivers Action Flow */}
                {(user?.role === "volunteer" || user?.role === "caregiver" || user?.role === "caretaker" || user?.role === "admin" || user?.role === "staff") && (
                  <>
                    {req.status === "Requested" && (
                      <button
                        className="btn-accept-task"
                        onClick={() => handleUpdateStatus(req._id, "Accepted")}
                      >
                        <span>{t.acceptTask}</span>
                      </button>
                    )}

                    {req.status === "Accepted" && (
                      <button
                        className="btn-inprogress-task"
                        onClick={() => handleUpdateStatus(req._id, "In Progress")}
                      >
                        <span>{lang === "ta" ? "தொடங்கப்பட்டது" : "Start Progress"}</span>
                      </button>
                    )}

                    {req.status === "In Progress" && user?.role !== "senior_citizen" && (
                      <button
                        className="btn-complete-task"
                        onClick={() => handleUpdateStatus(req._id, "Completed")}
                      >
                        <CheckCircle2 size={16} />
                        <span>{t.markCompleted}</span>
                      </button>
                    )}
                  </>
                )}

                {req.status === "Completed" && (
                  <div className="task-done-badge" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#059669", fontWeight: "700" }}>
                    <CheckCircle2 size={16} className="text-success" />
                    <span>{lang === "ta" ? "✓ உதவி நிறைவடைந்தது (Completed)" : "✓ Completed"}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

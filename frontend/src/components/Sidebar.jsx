import React from "react";
import { 
  LayoutDashboard, Users, ShieldCheck, AlertCircle, Calendar, 
  HandHeart, CreditCard, FileSpreadsheet, History, Settings, 
  UserCog, LogOut, ChevronLeft, ChevronRight, ShieldAlert,
  Award, Film
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Sidebar({ 
  currentTab, 
  onSelectTab, 
  isCollapsed, 
  onToggleCollapse, 
  isMobileOpen, 
  onCloseMobile 
}) {
  const { user, logout, t } = useAuth();
  const { activeEmergencyAlert } = useSocket();
  const role = user?.role || "senior_citizen";

  // Role-based visibility
  const navItems = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard, roles: ["admin", "staff", "senior_citizen", "family_member", "caretaker", "caregiver", "volunteer"] },
    { id: "seniors", label: role === "family_member" ? (t.seniors || "Family Elders") : t.seniors, icon: Users, roles: ["admin", "staff", "family_member", "caretaker", "caregiver", "volunteer"] },
    { id: "safety", label: t.safety, icon: ShieldCheck, roles: ["staff", "senior_citizen", "family_member", "caretaker", "caregiver", "volunteer"] },
    { id: "emergency", label: role === "admin" ? (t.emergency || "Emergency Incidents") : t.emergency, icon: AlertCircle, roles: ["admin", "staff", "senior_citizen", "family_member", "caretaker", "caregiver", "volunteer"], badge: activeEmergencyAlert ? "!" : null },
    { id: "appointments", label: t.appointments, icon: Calendar, roles: ["admin", "staff", "senior_citizen", "family_member", "caretaker", "caregiver", "volunteer"] },
    { id: "assistance", label: t.assistance, icon: HandHeart, roles: ["admin", "staff", "senior_citizen", "family_member", "caretaker", "caregiver", "volunteer"] },
    { id: "fees", label: t.careReceipts || "Care Receipts", icon: CreditCard, roles: ["admin", "staff", "senior_citizen", "family_member"] },
    { id: "reviews", label: t.reviewsRatings || "Reviews & Care Team", icon: Award, roles: ["admin", "staff", "senior_citizen", "family_member", "caretaker", "caregiver", "volunteer"] },
    { id: "videos", label: role === "admin" ? (t.videoManagement || "Video Management") : (t.wellnessVideos || "Care Videos"), icon: Film, roles: ["admin", "staff", "senior_citizen", "family_member"] },
    { id: "reports", label: t.reports, icon: FileSpreadsheet, roles: ["admin", "staff", "family_member"] },
    { id: "recentlyAccessed", label: t.recentlyAccessed, icon: History, roles: ["admin", "staff", "family_member", "caretaker", "caregiver"] },
    { id: "usersManagement", label: t.usersManagement, icon: UserCog, roles: ["admin"] },
    { id: "settings", label: t.settings, icon: Settings, roles: ["admin", "staff", "senior_citizen", "family_member", "caretaker", "caregiver", "volunteer"] }
  ];

  const visibleItems = navItems.filter((item) => {
    return item.roles.includes(role) || (role === "caretaker" && item.roles.includes("caregiver"));
  });

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="sidebar-mobile-backdrop" onClick={onCloseMobile} />
      )}

      <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-collapse-toggle">
          <button 
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="collapse-btn"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Emergency Quick Shortcut if Active */}
        {activeEmergencyAlert && (
          <div 
            className="sidebar-emergency-chip"
            onClick={() => {
              onSelectTab("emergency");
              if (isMobileOpen) onCloseMobile();
            }}
          >
            <ShieldAlert size={18} className="pulse-danger" />
            {!isCollapsed && <span>{t.emergencyActiveBanner}</span>}
          </div>
        )}

        <nav className="sidebar-nav">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? "active" : ""} ${item.id === "emergency" && activeEmergencyAlert ? "has-emergency" : ""}`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (isMobileOpen) onCloseMobile();
                }}
                title={isCollapsed ? item.label : ""}
              >
                <span className="nav-icon-wrap">
                  <Icon size={20} />
                  {item.badge && <span className="nav-dot-badge">{item.badge}</span>}
                </span>
                {!isCollapsed && <span className="nav-label-text">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button 
            className="sidebar-logout-btn" 
            onClick={logout}
            title={isCollapsed ? t.logout : ""}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>{t.logout}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

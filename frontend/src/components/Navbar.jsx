import React, { useState, useEffect, useRef } from "react";
import { 
  HeartHandshake, Search, Bell, Moon, Sun, Globe, User, 
  Menu, X, Check, Trash2, AlertTriangle, Calendar, Users, ShieldAlert, LogOut, ChevronDown, Palette, ExternalLink 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../api";
import NotificationModal from "./Modals/NotificationModal";
import ThemeAppearanceModal from "./Modals/ThemeAppearanceModal";

export default function Navbar({ onToggleMobileMenu, onNavigate }) {
  const { user, logout, lang, setLang, theme, setTheme, actionColor, setActionColor, t } = useAuth();
  const { liveEventSignal } = useSocket();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Full Theme & Custom Word Colors Modal
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Notification Postcard Modal state
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [modalSelectedNotif, setModalSelectedNotif] = useState(null);

  // Action Color Palette state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef(null);

  // Profile menu state
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const ACTION_COLORS = [
    { label: t.colorTeal || "Teal", hex: "#176b87" },
    { label: t.colorBlue || "Sapphire", hex: "#2563eb" },
    { label: t.colorGreen || "Emerald", hex: "#059669" },
    { label: t.colorPurple || "Purple", hex: "#7c3aed" },
    { label: t.colorRose || "Rose", hex: "#e11d48" },
    { label: t.colorAmber || "Amber", hex: "#d97706" }
  ];

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [liveEventSignal]);

  // Handle global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
        setSearchOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setPaletteOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const selectSearchResult = (type, item) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (type === "senior") onNavigate("seniors", item._id);
    else if (type === "emergency") onNavigate("emergency", item._id);
    else if (type === "appointment") onNavigate("appointments");
    else if (type === "assistance") onNavigate("assistance");
  };

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button 
          className="mobile-menu-trigger" 
          onClick={onToggleMobileMenu} 
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div className="navbar-brand" onClick={() => onNavigate("dashboard")}>
          <div className="brand-logo-icon">
            <HeartHandshake size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-name">SeniorCare</span>
            <span className="brand-badge">SCS</span>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="navbar-search" ref={searchRef}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            aria-label="Search seniors, appointments, emergencies"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && searchResults && (
          <div className="search-results-dropdown">
            {isSearching ? (
              <div className="search-status-row">{t.loading}</div>
            ) : (
              <>
                {/* Seniors Results */}
                {searchResults.seniors?.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header">
                      <Users size={14} /> {t.seniors}
                    </div>
                    {searchResults.seniors.map((s) => (
                      <div
                        key={s._id}
                        className="search-item"
                        onClick={() => selectSearchResult("senior", s)}
                      >
                        <strong>{s.name}</strong>
                        <small>{s.address ? s.address.split(",").slice(-2)[0]?.trim() || "Home" : "Home Care"} · {s.phone || ""}</small>
                      </div>
                    ))}
                  </div>
                )}

                {/* Emergencies Results */}
                {searchResults.emergencies?.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header alert-text">
                      <ShieldAlert size={14} /> {t.emergency}
                    </div>
                    {searchResults.emergencies.map((em) => (
                      <div
                        key={em._id}
                        className="search-item search-item-danger"
                        onClick={() => selectSearchResult("emergency", em)}
                      >
                        <strong>{em.emergencyCode} — {em.seniorName}</strong>
                        <small>{em.status.toUpperCase()} · {em.location}</small>
                      </div>
                    ))}
                  </div>
                )}

                {/* Appointments Results */}
                {searchResults.appointments?.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header">
                      <Calendar size={14} /> {t.appointments}
                    </div>
                    {searchResults.appointments.map((a) => (
                      <div
                        key={a._id}
                        className="search-item"
                        onClick={() => selectSearchResult("appointment", a)}
                      >
                        <strong>{a.seniorName} — {a.doctorName}</strong>
                        <small>{a.hospital} · {a.status}</small>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {!searchResults.seniors?.length &&
                  !searchResults.emergencies?.length &&
                  !searchResults.appointments?.length && (
                    <div className="search-status-row">{t.noData}</div>
                  )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="navbar-right">
        {/* Language Switcher */}
        <div className="language-selector">
          <button
            className={`lang-btn ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}
            title="English"
          >
            EN
          </button>
          <span className="lang-divider">|</span>
          <button
            className={`lang-btn ${lang === "ta" ? "active" : ""}`}
            onClick={() => setLang("ta")}
            title="தமிழ்"
          >
            தமிழ்
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          className="navbar-icon-btn theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? t.themeLight : t.themeDark}
          aria-label="Toggle Dark/Light Mode"
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Action Color Palette Selector */}
        <div className="navbar-color-wrapper" ref={paletteRef}>
          <button
            className="navbar-icon-btn color-palette-btn"
            onClick={() => setPaletteOpen(!paletteOpen)}
            title={t.actionColor}
            aria-label="Theme Action Color"
            style={{ color: actionColor }}
          >
            <Palette size={19} />
          </button>

          {paletteOpen && (
            <div className="palette-dropdown-menu">
              <div className="palette-dropdown-header">
                <strong>{t.actionColor}</strong>
                <small>{t.chooseAccentColor}</small>
              </div>
              <div className="palette-color-grid">
                {ACTION_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    className={`palette-color-dot ${actionColor === c.hex ? "active" : ""}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => {
                      setActionColor(c.hex);
                      setPaletteOpen(false);
                    }}
                    title={c.label}
                  >
                    {actionColor === c.hex && <Check size={14} color="#fff" />}
                  </button>
                ))}
              </div>
              <div className="palette-dropdown-footer">
                <button
                  type="button"
                  className="btn-open-full-customizer"
                  onClick={() => {
                    setPaletteOpen(false);
                    setThemeModalOpen(true);
                  }}
                >
                  <Palette size={13} />
                  <span>{lang === "ta" ? "முழு நிற & எழுத்து தனிப்பயனாக்கம்" : "Full Theme & Words Customizer"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="navbar-notif-wrapper" ref={notifRef}>
          <button
            className="navbar-icon-btn notif-bell-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            title={t.notifications}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifOpen && (
            <div className="notif-dropdown-panel">
              <div className="notif-panel-header">
                <div>
                  <strong>{t.notifications}</strong>
                  <span className="notif-counter">{unreadCount} {lang === "ta" ? "புதியவை" : "new"}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    className="text-link-btn" 
                    onClick={() => {
                      setNotifModalOpen(true);
                      setNotifOpen(false);
                    }}
                    title="Open Postcard Modal"
                  >
                    📋 {lang === "ta" ? "அனைத்தையும் காட்டு" : "Postcard View"}
                  </button>
                  {unreadCount > 0 && (
                    <button className="text-link-btn" onClick={handleMarkAllRead}>
                      {t.markAllRead}
                    </button>
                  )}
                </div>
              </div>

              <div className="notif-touch-hint">
                <small>{t.touchNotification || "Touch any notification to inspect details"}</small>
              </div>

              <div className="notif-list-container">
                {notifications.length === 0 ? (
                  <div className="notif-empty-state">
                    <Bell size={32} className="muted-icon" />
                    <p>{t.noNotifications}</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n._id}
                      className={`notif-list-item ${n.readAt ? "read" : "unread"} notif-priority-${n.priority}`}
                      onClick={() => {
                        setModalSelectedNotif(n);
                        setNotifModalOpen(true);
                        setNotifOpen(false);
                      }}
                    >
                      <div className="notif-body">
                        <span className="notif-title">{n.title}</span>
                        <p className="notif-msg">{n.message}</p>
                        <small className="notif-time">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>
                      <div className="notif-actions-col">
                        {!n.readAt && (
                          <button
                            className="notif-action-btn read-btn"
                            title="Mark as read"
                            onClick={(e) => handleMarkRead(n._id, e)}
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          className="notif-action-btn del-btn"
                          title="Delete"
                          onClick={(e) => handleDeleteNotif(n._id, e)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="navbar-profile-wrapper" ref={profileRef}>
          <button
            className="navbar-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="User Profile Menu"
          >
            <div className="user-avatar-circle">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="profile-btn-info">
              <span className="profile-btn-name">{user?.displayName?.split(" ")[0]}</span>
              <span className="profile-btn-role">{t[user?.role] || user?.role}</span>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {profileOpen && (
            <div className="profile-dropdown-menu">
              <div className="profile-menu-header">
                <strong>{user?.displayName}</strong>
                <small>{user?.email}</small>
                <span className="role-tag-pill">{t[user?.role] || user?.role}</span>
              </div>
              <div className="profile-menu-divider" />
              <button
                className="profile-menu-item"
                onClick={() => {
                  setProfileOpen(false);
                  onNavigate("settings");
                }}
              >
                <User size={16} /> {t.settings}
              </button>
              <button
                className="profile-menu-item text-danger"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
              >
                <LogOut size={16} /> {t.logout}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Touch Notification Details Modal */}
      <NotificationModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        notifications={notifications}
        selectedNotification={modalSelectedNotif}
        onSelectNotification={(n) => setModalSelectedNotif(n)}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDeleteNotification={handleDeleteNotif}
        onNavigate={onNavigate}
      />

      {/* Full Theme & Custom Word/Letter Colors Modal */}
      <ThemeAppearanceModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
    </header>
  );
}

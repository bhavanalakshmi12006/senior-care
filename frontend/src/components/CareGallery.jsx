import React, { useState } from "react";
import { Sparkles, X, Heart, Calendar, MapPin, Eye, Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function CareGallery() {
  const { lang } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activePhoto, setActivePhoto] = useState(null);

  const galleryItems = [
    {
      id: "yoga",
      category: "wellness",
      tag: lang === "ta" ? "யோகா & தியானம்" : "Yoga & Wellness",
      title: lang === "ta" ? "காலை யோகா & தியான பயிற்சி" : "Morning Garden Yoga & Meditation",
      caption: lang === "ta" ? "பூங்காவில் மூத்த குடிமக்கள் சூரிய வெளிச்சத்தில் அமைதியான யோகா மற்றும் பிராணாயாமம் செய்யும் இனிய தருணம்." : "Senior residents practicing gentle restorative yoga and pranayama under morning sunlight in our serene gardens.",
      img: "/assets/senior-yoga.jpg",
      date: "04 Oct 2026",
      location: "Main Courtyard Gardens"
    },
    {
      id: "music",
      category: "family",
      tag: lang === "ta" ? "இசை & குடும்பம்" : "Music & Family",
      title: lang === "ta" ? "இனிய பாரம்பரிய இசை & குடும்ப சந்திப்பு" : "Family Classical Music Therapy",
      caption: lang === "ta" ? "பாட்டி தன் மகளுடனும் பேத்தியுடனும் கர்நாடக சங்கீதத்தை ரசித்து மகிழும் பாசமிகு காட்சி." : "Heartwarming moments as grandmother enjoys soulful classical melodies with daughter and granddaughter.",
      img: "/assets/senior-music.jpg",
      date: "03 Oct 2026",
      location: "Living Lounge 2"
    },
    {
      id: "family",
      category: "family",
      tag: lang === "ta" ? "குடும்ப நலம்" : "Family Gathering",
      title: lang === "ta" ? "தலைமுறைகள் இணைந்த குடும்ப சங்கமம்" : "Sunday Family Visit & High Tea",
      caption: lang === "ta" ? "பிள்ளைகளும் பேரக்குழந்தைகளும் பெரியவர்களை சந்தித்து பாசத்தை பகிர்ந்த இனிய நினைவுகள்." : "Cherished weekend family reunions bringing multiple generations together with warmth and laughter.",
      img: "/assets/family-care.jpg",
      date: "01 Oct 2026",
      location: "Community Dining Hall"
    },
    {
      id: "caregiver",
      category: "care",
      tag: lang === "ta" ? "செவிலியர் கவனிப்பு" : "Dedicated Nursing",
      title: lang === "ta" ? "24/7 அன்பான செவிலியர் பராமரிப்பு" : "Compassionate Daily Vitals Monitoring",
      caption: lang === "ta" ? "அர்ப்பணிப்புள்ள செவிலியர் அனிதா ரத்த அழுத்தம், நாடித்துடிப்பு மற்றும் நலம் விசாரிக்கும் தருணம்." : "Nurse Anitha conducting gentle routine blood pressure check and daily wellness evaluation with genuine warmth.",
      img: "/assets/caregiver-senior.jpg",
      date: "05 Oct 2026",
      location: "Home Residence · Adyar, Chennai"
    },
    {
      id: "living",
      category: "wellness",
      tag: lang === "ta" ? "அமைதியான இல்லம்" : "Home Living",
      title: lang === "ta" ? "பாதுகாப்பான & வசதியான தனி இல்லம்" : "Safe & Comfortable Home Living",
      caption: lang === "ta" ? "முதியோர்கள் தங்கள் சொந்த வீட்டில் சறுக்காத தரை, கைப்பிடிகள் மற்றும் இயற்கை வெளிச்சத்துடன் சுதந்திரமாக வாழும் சூழல்." : "Thoughtfully supported independent home residence with non-slip flooring, support rails, and volunteer care.",
      img: "/assets/care-at-home.png",
      date: "28 Sep 2026",
      location: "Independent Home Living, Chennai"
    },
    {
      id: "health",
      category: "care",
      tag: lang === "ta" ? "மருத்துவ பரிசோதனை" : "Clinical Review",
      title: lang === "ta" ? "மாதாந்திர முழு உடல்நல ஆய்வு" : "Monthly Comprehensive Health Camp",
      caption: lang === "ta" ? "முதுமை சிறப்பு மருத்துவர் மூத்த குடிமக்களின் மருத்துவ முன்னேற்றத்தை பரிசீலிக்கும் முகாம்." : "Senior geriatricians reviewing vital trends, medication compliance, and preventive health plans.",
      img: "/assets/senior-health.jpg",
      date: "25 Sep 2026",
      location: "Consultation Suite A"
    }
  ];

  const categories = [
    { id: "all", label: lang === "ta" ? "அனைத்தும்" : "All Moments" },
    { id: "wellness", label: lang === "ta" ? "யோகா & நல்வாழ்வு" : "Yoga & Wellness" },
    { id: "family", label: lang === "ta" ? "குடும்ப சந்திப்புகள்" : "Family Visits" },
    { id: "care", label: lang === "ta" ? "செவிலியர் & மருத்துவம்" : "Nursing & Health" }
  ];

  const filtered = selectedCategory === "all" 
    ? galleryItems 
    : galleryItems.filter((item) => item.category === selectedCategory);

  return (
    <section className="dashboard-gallery-section">
      <div className="gallery-section-header">
        <div className="gallery-title-box">
          <h3>
            <Camera size={22} className="text-primary" />
            <span>{lang === "ta" ? "📸 மூத்தோர் நலம் & நினைவுகள் புகைப்பட தொகுப்பு" : "📸 Care Moments & Life At SeniorCare Gallery"}</span>
          </h3>
          <p>
            {lang === "ta" 
              ? "எங்கள் முதியவர்களின் தினசரி மகிழ்ச்சி, நல்வாழ்வு பயிற்சிகள் மற்றும் குடும்ப சந்திப்புகளின் நேரலை புகைப்படங்கள்."
              : "Vibrant snapshots of daily activities, therapeutic sessions, family bonds, and senior joy."}
          </p>
        </div>

        <div className="gallery-filter-pills">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`gallery-filter-btn ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gallery-cards-grid">
        {filtered.map((item) => (
          <div 
            key={item.id} 
            className="gallery-photo-card"
            onClick={() => setActivePhoto(item)}
            title={lang === "ta" ? "பெரிதாக்க தொடவும்" : "Click to view full photo"}
          >
            <div className="gallery-img-wrapper">
              <img src={item.img} alt={item.title} loading="lazy" />
              <span className="gallery-tag-pill">{item.tag}</span>
            </div>
            <div className="gallery-card-caption">
              <h4>{item.title}</h4>
              <p>{item.caption}</p>
              <div className="gallery-meta-row">
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Calendar size={12} /> {item.date}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <MapPin size={12} /> {item.location}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Zoom Modal */}
      {activePhoto && (
        <div className="modal-backdrop-overlay" onClick={() => setActivePhoto(null)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-container-box" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 720, padding: 0, overflow: "hidden", background: "var(--bg-card)" }}
          >
            <div style={{ position: "relative" }}>
              <img 
                src={activePhoto.img} 
                alt={activePhoto.title} 
                style={{ width: "100%", maxHeight: "440px", objectFit: "cover", display: "block" }} 
              />
              <button 
                onClick={() => setActivePhoto(null)} 
                style={{ 
                  position: "absolute", 
                  top: 12, 
                  right: 12, 
                  background: "rgba(0,0,0,0.65)", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: "50%", 
                  width: 36, 
                  height: 36, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}
              >
                <X size={20} />
              </button>
              <span style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.75)", color: "#fff", padding: "0.25rem 0.75rem", borderRadius: "14px", fontSize: "0.8rem", fontWeight: "700" }}>
                {activePhoto.tag}
              </span>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "var(--text-main)" }}>{activePhoto.title}</h3>
              <p style={{ margin: "0 0 1rem", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{activePhoto.caption}</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Calendar size={14} /> {activePhoto.date}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <MapPin size={14} /> {activePhoto.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

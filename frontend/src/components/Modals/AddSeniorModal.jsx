import React, { useState } from "react";
import { UserPlus, X, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function AddSeniorModal({ isOpen, onClose, onSeniorAdded, initialData = null }) {
  const { t, lang } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState(() => initialData || {
    name: "",
    age: "",
    gender: "Female",
    phone: "",
    address: "",
    roomNumber: "",
    bloodGroup: "O+",
    medicalNotes: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "Son/Daughter",
    assignedCaregiverName: "Anitha Krishnan"
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age) {
      showToast("Name and Age are required", "warning");
      return;
    }
    setLoading(true);
    try {
      if (initialData?._id) {
        const res = await api.patch(`/seniors/${initialData._id}`, formData);
        showToast(lang === "ta" ? "மூத்த குடிமகன் விபரம் புதுப்பிக்கப்பட்டது" : "Senior profile updated successfully", "success");
        if (onSeniorAdded) onSeniorAdded(res.data.senior);
      } else {
        const res = await api.post("/seniors", formData);
        showToast(lang === "ta" ? "புதிய மூத்த குடிமகன் பதிவு செய்யப்பட்டார்" : "Senior citizen registered successfully", "success");
        if (onSeniorAdded) onSeniorAdded(res.data.senior);
      }
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save senior profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <UserPlus size={22} className="text-primary" />
            <h3>{initialData ? (lang === "ta" ? "மூத்தவரை திருத்துக" : "Edit Senior Citizen") : t.addSenior}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-grid">
          <div className="form-row-2">
            <div className="form-group">
              <label>{lang === "ta" ? "முழுப் பெயர் *" : "Full Name *"}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Lakshmi Devi"
              />
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "வயது *" : "Age *"}</label>
              <input
                type="number"
                min="50"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
                placeholder="e.g. 72"
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>{lang === "ta" ? "பாலினம்" : "Gender"}</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "இரத்த வகை" : "Blood Group"}</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "குடியிருப்பு இல்ல முகவரி / பகுதி" : "Residential Home Address / Area"}</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. No. 14, Kasturibai Nagar, Adyar, Chennai"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{lang === "ta" ? "தொலைபேசி எண்" : "Phone Number"}</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "ஒதுக்கப்பட்ட பராமரிப்பாளர்" : "Assigned Caregiver"}</label>
              <input
                type="text"
                value={formData.assignedCaregiverName}
                onChange={(e) => setFormData({ ...formData, assignedCaregiverName: e.target.value })}
                placeholder="e.g. Anitha Krishnan"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{lang === "ta" ? "முகவரி" : "Residential Address"}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Senior Haven Community, Adyar, Chennai"
            />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>{lang === "ta" ? "அவசர தொடர்பு / குடும்ப உறுப்பினர் பெயர்" : "Emergency Contact / Family Member"}</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="e.g. Bhavana Lakshmi"
              />
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "குடும்ப உறவு முறை (Kinship / Relation) *" : "Kinship / Relation *"}</label>
              <select
                value={formData.emergencyContactRelation || "Daughter"}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                style={{ fontWeight: "600", borderColor: "#0284c7" }}
              >
                <option value="Daughter">{lang === "ta" ? "மகள் (Daughter)" : "Daughter"}</option>
                <option value="Son">{lang === "ta" ? "மகன் (Son)" : "Son"}</option>
                <option value="Son-in-law">{lang === "ta" ? "மருமகன் (Son-in-law)" : "Son-in-law"}</option>
                <option value="Daughter-in-law">{lang === "ta" ? "மருமகள் (Daughter-in-law)" : "Daughter-in-law"}</option>
                <option value="Spouse">{lang === "ta" ? "கணவர் / மனைவி (Spouse)" : "Spouse"}</option>
                <option value="Grandson">{lang === "ta" ? "பேரன் (Grandson)" : "Grandson"}</option>
                <option value="Granddaughter">{lang === "ta" ? "பேத்தி (Granddaughter)" : "Granddaughter"}</option>
                <option value="Guardian">{lang === "ta" ? "பாதுகாவலர் (Legal Guardian)" : "Guardian"}</option>
                <option value="Other">{lang === "ta" ? "பிற உறவினர் (Other Relative)" : "Other Relative"}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "அவசர தொடர்பு தொலைபேசி" : "Emergency Contact Phone"}</label>
              <input
                type="text"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+91 9345403336"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{lang === "ta" ? "மருத்துவ குறிப்புகள் & நோய்கள்" : "Medical Conditions & Care Notes"}</label>
            <textarea
              rows="2"
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              placeholder="e.g. Hypertension, Diabetes, Knee arthritis, requires morning BP check"
            />
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? t.loading : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

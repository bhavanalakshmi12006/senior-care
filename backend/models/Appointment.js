import mongoose from "mongoose";

const medicationChangeSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  previousDosage: { type: String, default: "" },
  changeType: { 
    type: String, 
    enum: ["increased", "decreased", "new", "continued", "discontinued"], 
    default: "continued" 
  },
  timing: { type: String, default: "Morning after food" },
  instructions: { type: String, default: "" }
}, { _id: false });

const appointmentSchema = new mongoose.Schema({
  appointmentCode: { type: String, required: true, unique: true },
  seniorId: { type: mongoose.Schema.Types.ObjectId, ref: "Senior", required: true },
  seniorName: { type: String, required: true },
  doctorName: { type: String, required: true },
  department: { type: String, default: "General Medicine" },
  hospital: { type: String, default: "City Senior Care Hospital" },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, default: "10:00 AM" },
  status: { 
    type: String, 
    enum: ["Upcoming", "Completed", "Cancelled", "Missed"], 
    default: "Upcoming" 
  },
  notes: { type: String, default: "" },
  doctorFeedback: { type: String, default: "" },
  vitalSigns: {
    bp: { type: String, default: "" },
    pulse: { type: Number },
    bloodSugar: { type: String, default: "" },
    spo2: { type: Number }
  },
  medicationChanges: [medicationChangeSchema],
  completedAt: { type: Date },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

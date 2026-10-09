import Senior from "../models/Senior.js";
import Appointment from "../models/Appointment.js";
import Emergency from "../models/Emergency.js";
import AssistanceRequest from "../models/AssistanceRequest.js";
import RecentlyAccessed from "../models/RecentlyAccessed.js";

export async function globalSearch(req, res) {
  try {
    const { q = "" } = req.query;
    const query = q.trim();
    if (!query) {
      return res.json({ seniors: [], appointments: [], emergencies: [], assistance: [] });
    }

    const regex = new RegExp(query, "i");

    const [seniors, appointments, emergencies, assistance] = await Promise.all([
      Senior.find({ $or: [{ name: regex }, { phone: regex }, { address: regex }] }).limit(5),
      Appointment.find({ $or: [{ appointmentCode: regex }, { doctorName: regex }, { seniorName: regex }] }).limit(5),
      Emergency.find({ $or: [{ emergencyCode: regex }, { seniorName: regex }, { notes: regex }] }).limit(5),
      AssistanceRequest.find({ $or: [{ title: regex }, { category: regex }, { seniorName: regex }] }).limit(5)
    ]);

    res.json({
      seniors,
      appointments,
      emergencies,
      assistance
    });
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
}

export async function getRecentlyAccessed(req, res) {
  try {
    const recents = await RecentlyAccessed.find({ userId: req.user._id })
      .sort({ accessedAt: -1 })
      .limit(8);
    res.json({ recentlyAccessed: recents });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recently accessed", error: err.message });
  }
}

export async function recordRecentlyAccessed(req, res) {
  try {
    const { itemType, itemId, title, subtitle = "" } = req.body;
    if (!itemType || !itemId || !title) {
      return res.status(400).json({ message: "itemType, itemId, and title are required" });
    }

    const record = await RecentlyAccessed.findOneAndUpdate(
      { userId: req.user._id, itemId, itemType },
      { userId: req.user._id, itemType, itemId, title, subtitle, accessedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ record });
  } catch (err) {
    res.status(500).json({ message: "Failed to record recently accessed", error: err.message });
  }
}

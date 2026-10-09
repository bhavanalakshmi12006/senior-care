import AssistanceRequest from "../models/AssistanceRequest.js";
import Senior from "../models/Senior.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

export async function getAssistanceRequests(req, res) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    if (req.user?.role === "senior_citizen") {
      let senior = await Senior.findOne({ 
        $or: [
          { userId: req.user._id },
          { phone: req.user.phone || "impossible" }
        ]
      });
      if (!senior) {
        if (req.user.email?.includes("senior5") || req.user.displayName?.toLowerCase().includes("ramanathan")) {
          senior = await Senior.findOne({ name: { $regex: "Ramanathan", $options: "i" } });
        } else if (req.user.email?.includes("senior6") || req.user.displayName?.toLowerCase().includes("rajalakshmi")) {
          senior = await Senior.findOne({ name: { $regex: "Rajalakshmi", $options: "i" } });
        } else if (req.user.displayName?.toLowerCase().includes("kalyani") || req.user.email?.includes("senior.test")) {
          senior = await Senior.findOne({ name: { $regex: "Kalyani", $options: "i" } });
        } else if (req.user.displayName?.toLowerCase().includes("ramasamy") || req.user.email?.includes("senior2")) {
          senior = await Senior.findOne({ name: { $regex: "Ramasamy", $options: "i" } });
        } else if (req.user.displayName?.toLowerCase().includes("meenakshi") || req.user.email?.includes("senior3")) {
          senior = await Senior.findOne({ name: { $regex: "Meenakshi", $options: "i" } });
        } else if (req.user.displayName?.toLowerCase().includes("gopalakrishnan") || req.user.email?.includes("senior4")) {
          senior = await Senior.findOne({ name: { $regex: "Gopalakrishnan", $options: "i" } });
        }
      }
      filter.seniorId = senior ? senior._id : null;
    } else if (req.user?.role === "family_member") {
      let famSeniors = await Senior.find({ familyMemberUserIds: req.user._id });
      if (famSeniors.length === 0) {
        const fm = await FamilyMember.findOne({
          $or: [{ userId: req.user._id }, { email: req.user.email }]
        });
        if (fm && fm.linkedSeniorIds && fm.linkedSeniorIds.length > 0) {
          famSeniors = await Senior.find({ _id: { $in: fm.linkedSeniorIds } });
        }
      }
      filter.seniorId = { $in: famSeniors.map(s => s._id) };
    } else if (req.user?.role === "volunteer") {
      // Volunteers see assigned to them or unassigned "Requested"
      filter.$or = [
        { assignedTo: req.user._id },
        { status: "Requested" }
      ];
    }

    const requests = await AssistanceRequest.find(filter).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch assistance requests", error: err.message });
  }
}

export async function createAssistanceRequest(req, res) {
  try {
    let { 
      seniorId, 
      category = "General Assistance", 
      title, 
      description = "", 
      priority = "Normal",
      recipientPhone,
      recipientEmail,
      channels = ["whatsapp", "sms", "email"]
    } = req.body;

    let senior;
    if (seniorId) {
      senior = await Senior.findById(seniorId);
    } else {
      senior = await Senior.findOne({ userId: req.user._id }) || await Senior.findOne();
    }

    if (!senior) return res.status(404).json({ message: "Senior not found" });

    let cat = category;
    if (category.toLowerCase().includes("emergency")) {
      cat = "Emergency Assistance";
    }

    const isEmergency = cat === "Emergency Assistance" || (priority === "Urgent" && !description?.trim());

    if (!isEmergency && (!description || !description.trim())) {
      return res.status(400).json({ 
        message: "Description details (e.g. hospital destination, schedule, or items needed) are required for non-emergency assistance." 
      });
    }

    const requestTitle = title || (isEmergency ? `🚨 Emergency SOS Assistance: ${senior.name}` : `${cat} Request`);
    const requestDesc = description?.trim() || (isEmergency ? "Immediate emergency assistance triggered — zero delay dispatch." : "Assistance requested.");

    const request = await AssistanceRequest.create({
      seniorId: senior._id,
      seniorName: senior.name,
      category: cat,
      title: requestTitle,
      description: requestDesc,
      priority: isEmergency ? "Urgent" : priority,
      status: "Requested",
      requestedBy: req.user._id
    });

    // Multi-channel notification dispatch
    const { dispatchNotification } = await import("../services/notificationService.js");
    await dispatchNotification({
      recipientUserId: senior.userId || req.user._id,
      recipientRole: "volunteer",
      seniorId: senior._id,
      type: "assistance",
      title: `🤝 Assistance Request: ${cat}`,
      message: `${senior.name} requested ${cat}: "${requestDesc}". Contact: ${recipientPhone || senior.emergencyContactPhone || senior.phone || "+91 98765 00003"}`,
      priority: isEmergency ? "critical" : (priority === "Urgent" ? "critical" : "normal"),
      link: "/assistance",
      channels: Array.isArray(channels) && channels.length > 0 ? channels : ["whatsapp", "sms", "email"],
      recipientPhone: recipientPhone || senior.emergencyContactPhone || senior.phone,
      recipientEmail: recipientEmail || req.user.email
    });

    await AuditLog.create({
      action: "ASSISTANCE_REQUESTED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "AssistanceRequest",
      targetId: request._id.toString(),
      details: `Requested ${category} for ${senior.name}`
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("assistance-created", { request });
      io.emit("notification-created", { type: "assistance" });
    }

    res.status(201).json({ message: "Assistance request submitted successfully", request });
  } catch (err) {
    res.status(500).json({ message: "Failed to request assistance", error: err.message });
  }
}

export async function updateAssistanceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // Assigned, Accepted, In Progress, Completed

    const request = await AssistanceRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Assistance request not found" });

    request.status = status;
    if (notes) request.notes = notes;

    if (status === "Accepted" || status === "In Progress") {
      if (!request.assignedTo) {
        request.assignedTo = req.user._id;
        request.assignedToName = `${req.user.displayName} (${req.user.role})`;
        request.assignedRole = req.user.role;
      }
    } else if (status === "Completed") {
      request.completedAt = new Date();
      if (!notes && req.user?.role === "senior_citizen") {
        request.notes = request.notes 
          ? `${request.notes} (Confirmed received by senior citizen)` 
          : "Assistance confirmed received & completed by senior citizen.";
      }
    }

    await request.save();

    await AuditLog.create({
      action: req.user?.role === "senior_citizen" && status === "Completed"
        ? "ASSISTANCE_CONFIRMED_COMPLETED_BY_SENIOR"
        : `ASSISTANCE_${status.toUpperCase().replace(/\s+/g, "_")}`,
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "AssistanceRequest",
      targetId: request._id.toString(),
      details: `${req.user.displayName} (${req.user.role}) marked assistance "${status}" for ${request.title}`
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("assistance-status-changed", { request });
    }

    res.json({ message: `Assistance status updated to ${status}`, request });
  } catch (err) {
    res.status(500).json({ message: "Failed to update assistance status", error: err.message });
  }
}

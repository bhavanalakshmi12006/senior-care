import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../frontend/dist");

import authRoutes from "./routes/authRoutes.js";
import seniorRoutes from "./routes/seniorRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import checkinRoutes from "./routes/checkinRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import assistanceRoutes from "./routes/assistanceRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.emit("connected", { service: "senior-care-realtime", serverTime: new Date() });

  socket.on("join-role-channel", (role) => {
    socket.join(`role-${role}`);
  });

  socket.on("disconnect", () => {
    // disconnected
  });
});

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "senior_care";

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME })
  .then(() => console.log(`✓ MongoDB Connected to ${MONGODB_DB_NAME} (Compass compatible at ${MONGODB_URI})`))
  .catch((err) => console.error("MongoDB Connection Error:", err.message));

// API Health & Config Checks
app.get("/api/health", (req, res) => res.json({ ok: true, service: "senior-care-api", db: "mongodb", timestamp: new Date() }));
app.get("/api/config", (req, res) => res.json({
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  dbName: MONGODB_DB_NAME,
  appName: "SeniorCare (SCS)"
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/seniors", seniorRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/assistance", assistanceRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/videos", videoRoutes);

// Static frontend serving for production / All-in-One deployment
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => res.json({ 
    service: "SeniorCare Backend API", 
    status: "online", 
    health: "/api/health" 
  }));
}

// Central error handler
app.use((err, req, res, next) => {
  console.error("Express Error:", err);
  res.status(500).json({ message: "An unexpected internal server error occurred", error: err.message });
});

httpServer.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SeniorCare Backend Server running on http://localhost:${PORT}`);
  console.log(`📁 Database: MongoDB Compass at ${MONGODB_URI}`);
  console.log(`📊 DB Name: ${MONGODB_DB_NAME}`);
  console.log(`⚡ Realtime: Socket.IO enabled`);
  console.log(`======================================================\n`);
});

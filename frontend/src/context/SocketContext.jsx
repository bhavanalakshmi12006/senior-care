import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState(null);
  const [liveEventSignal, setLiveEventSignal] = useState(0);

  useEffect(() => {
    const newSocket = io(API_BASE_URL || undefined, {
      transports: ["websocket", "polling"]
    });

    newSocket.on("connect", () => {
      console.log("⚡ Real-time Socket.IO connected to SeniorCare server");
      if (user?.role) {
        newSocket.emit("join-role-channel", user.role);
      }
    });

    newSocket.on("emergency-alert", (data) => {
      console.warn("🚨 EMERGENCY ALERT RECEIVED:", data);
      setActiveEmergencyAlert(data.emergency);
      showToast(
        `🚨 EMERGENCY ALERT: ${data.emergency?.seniorName} (${data.emergency?.emergencyCode}) in ${data.emergency?.location}!`,
        "emergency",
        8000
      );
      setLiveEventSignal((s) => s + 1);
    });

    newSocket.on("emergency-status-changed", (data) => {
      showToast(`Emergency ${data.emergency?.emergencyCode} updated: ${data.emergency?.status}`, "info");
      if (data.emergency?.status === "resolved") {
        setActiveEmergencyAlert(null);
      }
      setLiveEventSignal((s) => s + 1);
    });

    newSocket.on("notification-created", (data) => {
      setLiveEventSignal((s) => s + 1);
    });

    newSocket.on("checkin-updated", (data) => {
      showToast(`✓ Check-in recorded for ${data.senior?.name}: Status is Safe`, "success");
      setLiveEventSignal((s) => s + 1);
    });

    newSocket.on("assistance-created", (data) => {
      showToast(`🤝 New assistance request: ${data.request?.title} (${data.request?.category})`, "info");
      setLiveEventSignal((s) => s + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.role, showToast]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        activeEmergencyAlert,
        setActiveEmergencyAlert,
        liveEventSignal,
        triggerRefresh: () => setLiveEventSignal((s) => s + 1)
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

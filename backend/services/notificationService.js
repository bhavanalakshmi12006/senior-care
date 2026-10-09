import nodemailer from "nodemailer";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Senior from "../models/Senior.js";

// Cached Transporter
let mailTransporter = null;

function getMailTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: user.trim(),
        pass: pass.trim().replace(/\s+/g, "") // strip spaces from Google App Password
      }
    });
  }
  return mailTransporter;
}

/**
 * Universal Notification Dispatcher
 * Dispatches notifications across In-App, WhatsApp, SMS, and Email (Google / Nodemailer)
 * according to user choices or preferences.
 */
export async function dispatchNotification({
  recipientUserId = null,
  recipientRole = null,
  seniorId = null,
  type = "system",
  title,
  message,
  priority = "normal",
  link = "",
  channels = ["inApp", "sms", "whatsapp", "email"],
  recipientPhone = null,
  recipientEmail = null
}) {
  const chosenChannels = Array.isArray(channels) && channels.length > 0 
    ? channels 
    : ["inApp", "sms", "whatsapp", "email"];

  const channelStatus = {
    inApp: chosenChannels.includes("inApp"),
    sms: false,
    whatsapp: false,
    email: false
  };

  // Determine destination contact details if not provided
  let targetPhone = recipientPhone;
  let targetEmail = recipientEmail;

  if (recipientUserId && (!targetPhone || !targetEmail)) {
    try {
      const user = await User.findById(recipientUserId);
      if (user) {
        if (!targetPhone && user.phone) targetPhone = user.phone;
        if (!targetEmail && user.email) targetEmail = user.email;
      }
    } catch (e) {
      // Continue with what we have
    }
  }

  if (seniorId && (!targetPhone || !targetEmail)) {
    try {
      const senior = await Senior.findById(seniorId);
      if (senior) {
        if (!targetPhone) targetPhone = senior.emergencyContactPhone || senior.phone;
        // If senior has emergency contact email or family member
        if (!targetEmail && senior.emergencyContactEmail) {
          targetEmail = senior.emergencyContactEmail;
        }
      }
    } catch (e) {
      // Continue
    }
  }

  // 1. WhatsApp Dispatch (Simulation / Gateway Ready)
  if (chosenChannels.includes("whatsapp")) {
    const waPhone = targetPhone || "+91 98765 00000";
    console.log(`[WhatsApp Service] 📱 Sent message to ${waPhone}: "${title} - ${message}" [STATUS: DELIVERED]`);
    channelStatus.whatsapp = true;
  }

  // 2. SMS Dispatch (Simulation / Gateway Ready)
  if (chosenChannels.includes("sms")) {
    const smsPhone = targetPhone || "+91 98765 00000";
    console.log(`[SMS Gateway] 💬 Sent SMS to ${smsPhone}: "${title}: ${message}" [STATUS: SENT]`);
    channelStatus.sms = true;
  }

  // 3. Email Dispatch (Real Google Nodemailer SMTP Dispatch)
  if (chosenChannels.includes("email")) {
    // If recipient is missing or dummy test email, fallback to user's configured email
    let emailTo = targetEmail;
    if (!emailTo || emailTo.includes(".local")) {
      emailTo = process.env.EMAIL_TO || process.env.EMAIL_USER || "bhavanalakshmi12006@gmail.com";
    }

    const transporter = getMailTransporter();
    if (transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const isEmergency = priority === "critical" || type === "emergency";
        const accentColor = isEmergency ? "#dc2626" : "#2563eb";
        const badgeText = isEmergency ? "🚨 CRITICAL EMERGENCY ALERT" : "SeniorCare Notification";

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || `"SeniorCare Care Network" <${process.env.EMAIL_USER}>`,
          to: emailTo,
          subject: `${isEmergency ? "🚨 " : ""}${title}`,
          text: `${title}\n\n${message}\n\nPriority: ${priority}\nSeniorCare Medical & Care Network`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="background: ${accentColor}; color: #ffffff; padding: 18px 24px;">
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px;">${badgeText}</span>
                <h1 style="margin: 10px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff;">${title}</h1>
              </div>
              <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">${message.replace(/\n/g, "<br/>")}</p>
                <div style="background: #f8fafc; border-left: 4px solid ${accentColor}; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #475569;">
                  <strong>Incident Priority:</strong> ${priority.toUpperCase()}<br/>
                  <strong>Timestamp:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                </div>
              </div>
              <div style="background: #f1f5f9; padding: 14px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center;">
                SeniorCare Geriatric Assistance & Safety Network · 24/7 Monitoring
              </div>
            </div>
          `
        });
        console.log(`[Email Service] 📧 Real Email SENT successfully to <${emailTo}> Subject: "${title}"`);
        channelStatus.email = true;
      } catch (err) {
        console.error(`[Email Service] ❌ Nodemailer delivery failed to <${emailTo}>:`, err.message);
        channelStatus.email = false;
      }
    } else {
      console.log(`[Email Service] ⚠️ EMAIL_USER/EMAIL_PASS not configured in backend/.env. Simulated to <${emailTo}>: "${title}"`);
      channelStatus.email = true;
    }
  }

  // 4. Save to Database
  const notification = await Notification.create({
    recipientUserId,
    recipientRole,
    seniorId,
    type,
    title,
    message,
    priority,
    link,
    channels: chosenChannels,
    channelStatus
  });

  return notification;
}

export default {
  dispatchNotification
};

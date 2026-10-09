/**
 * Universal Gmail Web Composer Helper
 * Generates direct Gmail web composition links so users can send emails
 * directly from browser tabs in 1-click without requiring Windows Mail / MS Outlook setup.
 */

export const getGmailComposeUrl = ({ to = "", subject = "", body = "" }) => {
  // If email is a dummy test domain (.local) or empty, default to active Gmail
  const recipient = (!to || to.includes(".local")) ? "bhavanalakshmi12006@gmail.com" : to.trim();
  
  // Guard against double encoding
  const finalSubject = subject.startsWith("%") || subject.includes("%20") 
    ? subject 
    : encodeURIComponent(subject || "");
    
  const finalBody = body.startsWith("%") || body.includes("%20") 
    ? body 
    : encodeURIComponent(body || "");

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${finalSubject}&body=${finalBody}`;
};

export const openGmailComposer = ({ to = "", subject = "", body = "" }) => {
  const url = getGmailComposeUrl({ to, subject, body });
  window.open(url, "_blank", "noopener,noreferrer");
};

export default {
  getGmailComposeUrl,
  openGmailComposer
};

import React from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <main style={{fontFamily:"Arial",padding:32,maxWidth:720,margin:"40px auto",lineHeight:1.6}}><h1>SeniorCare could not load</h1><p>Refresh once. If it continues, open the browser Console and share the red error message.</p><pre style={{whiteSpace:"pre-wrap",background:"#fff3f3",padding:16,borderRadius:12,color:"#9b1c1c"}}>{this.state.error.message}</pre><button onClick={()=>{localStorage.removeItem("session");location.reload()}} style={{padding:"10px 16px",cursor:"pointer"}}>Clear session and reload</button></main>;
  }
}

const DEFAULT_GOOGLE_CLIENT_ID = "364550524970-hjvfvn7bkh3lcmeh0gjkppnl1cpva5ua.apps.googleusercontent.com";

function RootApp() {
  const [googleId, setGoogleId] = React.useState(() => {
    const saved = localStorage.getItem("seniorcare_google_client_id") || "";
    const env = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
    const raw = saved || env || DEFAULT_GOOGLE_CLIENT_ID;
    if (!raw || raw.includes("your-google") || raw.includes("your-google-web")) return DEFAULT_GOOGLE_CLIENT_ID;
    return raw.trim();
  });

  React.useEffect(() => {
    const checkId = () => {
      const saved = localStorage.getItem("seniorcare_google_client_id") || "";
      const env = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
      const raw = saved || env;
      const valid = (!raw || raw.includes("your-google") || raw.includes("your-google-web")) ? "" : raw.trim();
      if (valid !== googleId) setGoogleId(valid);
    };
    window.addEventListener("storage", checkId);
    window.addEventListener("seniorcare-google-id-updated", checkId);
    return () => {
      window.removeEventListener("storage", checkId);
      window.removeEventListener("seniorcare-google-id-updated", checkId);
    };
  }, [googleId]);

  return (
    <AppErrorBoundary>
      {googleId ? (
        <GoogleOAuthProvider clientId={googleId}>
          <App />
        </GoogleOAuthProvider>
      ) : (
        <App />
      )}
    </AppErrorBoundary>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);

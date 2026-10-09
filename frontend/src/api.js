import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
    try {
      const sessionStr = localStorage.getItem("seniorcare_session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      }
    } catch (e) {
      console.error("Token error in interceptor:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional auto-logout on unauthorized
      if (!window.location.pathname.includes("/login")) {
        console.warn("Session expired or unauthorized");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };

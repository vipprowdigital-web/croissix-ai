// mobile_app\lib\axiosClient.ts
import axios from "axios";
import { getToken } from "./token";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ─────────────────────────────────────────
   REQUEST INTERCEPTOR
───────────────────────────────────────── */
API.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* ─────────────────────────────────────────
   RESPONSE INTERCEPTOR
───────────────────────────────────────── */
API.interceptors.response.use(
  (response) => response,

  (error) => {
    if (typeof window !== "undefined") {
      const status = error?.response?.status;

      // 🔥 handle expired / invalid token
      if (status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("lastExternalReferrer");
        localStorage.removeItem("lastExternalReferrerTime");
        localStorage.removeItem("topicsLastReferenceTime");

        // prevent redirect loop
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

// mobile_app\lib\axiosClient.ts

import axios from "axios";
import { getToken, getRefreshToken } from "./token";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ─────────────────────────────
   REQUEST INTERCEPTOR
───────────────────────────── */

API.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ─────────────────────────────
   RESPONSE INTERCEPTOR
───────────────────────────── */

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;

        // store new token
        localStorage.setItem("accessToken", newAccessToken);

        // update axios defaults
        API.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // update original request header
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // retry request
        return API(originalRequest);

      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
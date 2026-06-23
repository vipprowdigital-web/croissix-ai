import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api/v1";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_info");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;

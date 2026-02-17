import axios from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  async (req) => {
    try {
      const res = await fetch("/api/auth/token");
      if (res.ok) {
        const { accessToken } = await res.json();
        if (accessToken) {
          req.headers["Authorization"] = `Bearer ${accessToken}`;
        }
      }
    } catch (e) {
      console.error("Failed to fetch token in middleware:", e);
    }
    return req;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          const resData = await res.json();
          const newAccessToken = resData?.accessToken;
          if (newAccessToken) {
            originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
            return api(originalRequest);
          }
        }
      } catch (tokenRefreshError) {
        console.error("Token refresh failed in admin api:", tokenRefreshError);
      }
    }

    return Promise.reject(error);
  }
);

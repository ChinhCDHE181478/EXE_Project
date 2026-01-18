import axios from "axios";
export const API = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use(
  async (req) => {
    const res = await fetch("/api/auth/token");
    const { accessToken } = await res.json();

    if (accessToken) {
      req.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    
    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await fetch("/api/auth/refresh");
        const resData = await res.json();
        const newAccessToken = resData?.accessToken;
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return API(originalRequest); // Retry the original request with the new token
      } catch (tokenRefreshError) {
        console.error("Token refresh failed:", tokenRefreshError);
        return Promise.reject(tokenRefreshError);
      }
    }

    return Promise.reject(error);
  }
);

import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1",
  withCredentials: true
});

// Attach the access token as an Authorization header on every request.
// This makes auth resilient even if the httpOnly cookie doesn't round-trip
// reliably across ports/browsers during local development.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh on the refresh/login endpoints themselves
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/refresh-token") || originalRequest?.url?.includes("/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // De-duplicate concurrent refresh calls
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh-token")
            .then((res) => {
              const newToken = res.data?.data?.accessToken as string | undefined;
              if (newToken) {
                useAuthStore.getState().setAccessToken(newToken);
                return newToken;
              }
              return null;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        if (newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        // fall through to logout below
      }

      // Refresh genuinely failed — clear auth and send to login
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        const locale = window.location.pathname.split("/")[1] || "bn";
        window.location.href = `/${locale}/login`;
      }
    }

    return Promise.reject(error);
  }
);
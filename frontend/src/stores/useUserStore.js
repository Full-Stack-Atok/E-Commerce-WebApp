import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

let refreshPromise = null;
let refreshInterval = null;

export const startTokenRefresh = () => {
  if (refreshInterval) return;

  refreshInterval = setInterval(async () => {
    const { tokenExpiry, refreshToken } = useUserStore.getState();
    const timeLeft = tokenExpiry - Date.now();

    if (timeLeft < 60 * 1000) {
      try {
        await refreshToken();
      } catch (error) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        useUserStore.getState().logout();
      }
    }
  }, 30 * 1000);
};

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  tokenExpiry: null,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      const expiry = Date.now() + 15 * 60 * 1000;
      set({ user: res.data, loading: false, tokenExpiry: expiry });
      startTokenRefresh();
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", { email, password });
      const expiry = Date.now() + 15 * 60 * 1000;
      set({ user: res.data, loading: false, tokenExpiry: expiry });
      startTokenRefresh();
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred during logout"
      );
    } finally {
      clearInterval(refreshInterval);
      refreshInterval = null;
      set({ user: null });
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });
      const expiry = Date.now() + 15 * 60 * 1000;
      set({ tokenExpiry: expiry });
      startTokenRefresh();
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },

  refreshToken: async () => {
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      const expiry = Date.now() + 15 * 60 * 1000;
      set({ checkingAuth: false, tokenExpiry: expiry });
      return response.data.accessToken;
    } catch (error) {
      set({ checkingAuth: false });
      throw error;
    }
  },
}));

// ✅ Axios interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry on expired token
    if (
      error.response?.status === 403 &&
      error.response?.data?.message === "Access token expired" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = useUserStore.getState().refreshToken();
        }

        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

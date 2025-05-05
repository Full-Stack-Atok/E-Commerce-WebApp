// src/stores/useUserStore.js
import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });
    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }
    try {
      const res = await axios.post("/auth/signup", {
        name,
        email,
        password,
      });
      set({ user: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/login", { email, password });
      set({ user: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred during logout"
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      // 1) refresh cookie-based token
      await get().refreshToken();
      // 2) fetch profile
      const { data } = await axios.get("/auth/profile");
      set({ user: data });
    } catch (error) {
      console.error("checkAuth error:", error);
      set({ user: null });
    } finally {
      set({ checkingAuth: false });
    }
  },

  refreshToken: async () => {
    // only handle cookie refresh; don't toggle checkingAuth here
    try {
      await axios.post("/auth/refresh-token");
    } catch (error) {
      set({ user: null });
      throw error;
    }
  },
}));

// Axios interceptor for auto-refresh
let refreshPromise = null;
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.endsWith("/auth/refresh-token")
    ) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = useUserStore.getState().refreshToken();
        }
        await refreshPromise;
        refreshPromise = null;
        return axios(original);
      } catch (e) {
        useUserStore.getState().logout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

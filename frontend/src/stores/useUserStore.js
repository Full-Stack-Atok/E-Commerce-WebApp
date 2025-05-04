// frontend/src/store/useUserStore.js
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
      const res = await axios.post("/auth/signup", { name, email, password });
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/login", { email, password });
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
    } finally {
      set({ user: null });
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      await get().refreshToken();
      const res = await axios.get("/auth/profile");
      set({ user: res.data });
    } catch {
      set({ user: null });
    } finally {
      set({ checkingAuth: false });
    }
  },

  refreshToken: async () => {
    try {
      await axios.post("/auth/refresh-token");
    } catch (err) {
      set({ user: null });
      throw err;
    }
  },
}));

// interceptor for auto-refresh
let refreshing = null;
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (
      response?.status === 401 &&
      !config._retry &&
      !config.url.endsWith("/refresh-token")
    ) {
      config._retry = true;
      try {
        if (!refreshing) {
          refreshing = get()
            .refreshToken()
            .finally(() => (refreshing = null));
        }
        await refreshing;
        return axios(config);
      } catch {
        get().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

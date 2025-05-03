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
    } catch (err) {
      /* ignore */
    } finally {
      set({ user: null });
    }
  },

  // Try to refresh first, then load profile
  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      // Always attempt a refresh
      await get().refreshToken();
      // Then, whether fresh or not, fetch profile
      const res = await axios.get("/auth/profile");
      set({ user: res.data });
    } catch (err) {
      set({ user: null });
    } finally {
      set({ checkingAuth: false });
    }
  },

  refreshToken: async () => {
    try {
      await axios.post("/auth/refresh-token");
    } catch (err) {
      // If refresh fails, clear user
      set({ user: null });
      throw err;
    }
  },
}));

// ---- AXIOS INTERCEPTOR FOR AUTO-REFRESH ----

let refreshing = null;

axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (
      response?.status === 401 &&
      !config._retry &&
      !config.url.endsWith("/auth/refresh-token")
    ) {
      config._retry = true;
      try {
        // If a refresh is already running, wait for it
        if (!refreshing) {
          refreshing = get()
            .refreshToken()
            .finally(() => (refreshing = null));
        }
        await refreshing;
        return axios(config);
      } catch (_e) {
        // If refresh still fails, log out
        get().logout();
        return Promise.reject(_e);
      }
    }
    return Promise.reject(error);
  }
);

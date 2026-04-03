import { create } from "zustand";
import { setAuthToken } from "../api/client";

const storedToken = localStorage.getItem("afripulse_token");
const storedUser = localStorage.getItem("afripulse_user");
if (storedToken) {
  setAuthToken(storedToken);
}

const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  setAuth: (user, token) => {
    if (token) {
      localStorage.setItem("afripulse_token", token);
    }
    if (user) {
      localStorage.setItem("afripulse_user", JSON.stringify(user));
    }
    setAuthToken(token);
    set({ user, token });
  },
  clearAuth: () => {
    localStorage.removeItem("afripulse_token");
    localStorage.removeItem("afripulse_user");
    setAuthToken(null);
    set({ user: null, token: null });
  },
}));

export default useAuthStore;

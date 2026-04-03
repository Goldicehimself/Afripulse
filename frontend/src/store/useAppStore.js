import { create } from "zustand";

const useAppStore = create((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading }),
  banner: null,
  setBanner: (banner) => set({ banner }),
  clearBanner: () => set({ banner: null }),
}));

export default useAppStore;

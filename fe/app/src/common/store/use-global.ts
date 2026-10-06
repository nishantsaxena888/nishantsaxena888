import { create } from "zustand";

interface GlobalState {
  isMobile: boolean;
  setIsMobile: (prop: boolean) => void;
}

export const useGlobal = create<GlobalState>((set) => ({
  isMobile: false,
  setIsMobile: (value) => set(() => ({ isMobile: value })),
}));

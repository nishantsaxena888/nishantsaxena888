import { create } from "zustand";

interface ConfigState {
  config: any;
  setConfig: (config: any) => void;
}

/**
 * useConfigStore
 * Global store for application configuration including admin redirects,
 * menu structures, and metadata.
 */
export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));

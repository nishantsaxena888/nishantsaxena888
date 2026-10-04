import { create } from 'zustand';

interface AppStore {
  data: Record<string, any>;
  setState: (key: string, value: any) => void;
  setMultipleStates: (payload: Record<string, any>) => void;
  clearState: (key: string) => void;
}

export const useAppStore = create<AppStore>((set: any) => ({
  data: {},
  setState: (key: string, value: any) => 
    set((prev: any) => ({ data: { ...prev.data, [key]: value } })),
  setMultipleStates: (payload: Record<string, any>) => 
    set((prev: any) => ({ data: { ...prev.data, ...payload } })),
  clearState: (key: string) => 
    set((prev: any) => {
      const newData = { ...prev.data };
      delete newData[key];
      return { data: newData };
    })
}));

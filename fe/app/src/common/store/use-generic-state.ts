import { create } from "zustand";
import { storage } from "@/platform/storage";

export interface GenericStateConfig {
  onUpdate?: (key: string, value: any, nextData: Record<string, any>) => void;
  persistentKeys?: string[];
  methods?: Record<
    string,
    (currentValue: any, inputValue: any, currentState: Record<string, any>) => any
  >;
  namespace?: string;
}

interface GenericStateStore {
  data: Record<string, any>;
  update: (key: string, value: any) => void;
  configure: (config: GenericStateConfig) => void;
  clear: (key: string) => void;
}

let storeConfig: GenericStateConfig = {
  persistentKeys: [],
  namespace: "default",
};

function getStorageKey(key: string): string {
  return `${storeConfig.namespace || "default"}_gs_${key}`;
}

export const useGenericState = create<GenericStateStore>((set: any) => ({
  data: {},

  update: (key: string, value: any) => {
    set((state: any) => {
      let finalValue = value;

      if (storeConfig.methods && typeof storeConfig.methods[key] === "function") {
        try {
          const currentValue = state.data[key];
          finalValue = storeConfig.methods[key](currentValue, value, state.data);
        } catch (error) {
          console.error(`[Generic State] Failed to execute calculation method for key "${key}":`, error);
        }
      } else if (key === "cart" || key === "wishlist") {
        const current = Array.isArray(state.data[key]) ? state.data[key] : [];
        if (key === "cart") {
          const cleanPayload = { ...value };
          const op = cleanPayload._operation || "increment";
          delete cleanPayload._operation;
          const matchVal = cleanPayload.id;
          if (matchVal !== undefined && matchVal !== null) {
            const existing = current.find((item: any) => item && String(item.id) === String(matchVal));
            if (existing) {
              finalValue = current.map((item: any) => {
                if (!item || String(item.id) !== String(matchVal)) return item;
                if (op === "decrement") {
                  const newQty = (item.qty || 1) - 1;
                  return newQty > 0 ? { ...item, qty: newQty } : null;
                }
                if (op === "remove") return null;
                if (op === "set") return { ...item, ...cleanPayload };
                return { ...item, qty: (item.qty || 0) + 1 };
              }).filter(Boolean);
            } else if (op !== "decrement" && op !== "remove") {
              finalValue = [...current, { qty: 1, ...cleanPayload }];
            }
          }
        } else if (key === "wishlist") {
          const idStr = String(typeof value === "object" && value !== null ? value.id : value);
          finalValue = current.includes(idStr)
            ? current.filter((x: any) => String(x) !== idStr)
            : [...current, idStr];
        }
      }

      const nextData = { ...state.data, [key]: finalValue };

      if (storeConfig.persistentKeys?.includes(key)) {
        try {
          storage.setItem(getStorageKey(key), JSON.stringify(finalValue));
        } catch (error) {
          console.error(`[Generic State] Failed to persist key "${key}" to localStorage:`, error);
        }
      }

      if (storeConfig.onUpdate) {
        try {
          storeConfig.onUpdate(key, finalValue, nextData);
        } catch (error) {
          console.error(`[Generic State] Failed to run onUpdate callback for key "${key}":`, error);
        }
      }

      return { data: nextData };
    });
  },

  configure: (config: GenericStateConfig) => {
    set((state: any) => {
      storeConfig = { ...storeConfig, ...config };

      const persistedData: Record<string, any> = {};
      if (storeConfig.persistentKeys) {
        storeConfig.persistentKeys.forEach((key) => {
          try {
            const valStr = storage.getItem(getStorageKey(key));
            if (valStr !== null) {
              persistedData[key] = JSON.parse(valStr);
            }
          } catch (error) {
            console.error(`[Generic State] Failed to load key "${key}" from localStorage:`, error);
          }
        });
      }

      return {
        data: {
          ...state.data,
          ...persistedData,
        },
      };
    });
  },

  clear: (key: string) => {
    set((state: any) => {
      const nextData = { ...state.data };
      delete nextData[key];

      if (storeConfig.persistentKeys?.includes(key)) {
        try {
          storage.removeItem(getStorageKey(key));
        } catch (error) {
          console.error(`[Generic State] Failed to clear persistent key "${key}" from localStorage:`, error);
        }
      }

      return { data: nextData };
    });
  },
}));

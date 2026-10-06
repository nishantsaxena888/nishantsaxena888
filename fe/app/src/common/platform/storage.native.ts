// Platform storage — React Native impl (Metro resolves this over
// storage.ts). AsyncStorage is async, so the standard pattern applies:
// a synchronous in-memory mirror hydrated at boot, then every shared
// call site stays sync.
//
//   import { hydrateStorage } from "@/platform/storage"; // → this file
//   await hydrateStorage();   // before rendering the app root
//
// After hydration `storage` behaves exactly like localStorage on web;
// writes hit the mirror immediately and flush to AsyncStorage behind
// the scenes.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setStorageBackend, type KVStorage } from "./storage-core";

const mirror = new Map<string, string>();

const asyncBackend: KVStorage = {
  getItem: (k) => mirror.get(k) ?? null,
  setItem: (k, v) => {
    mirror.set(k, v);
    AsyncStorage.setItem(k, v).catch(() => {});
  },
  removeItem: (k) => {
    mirror.delete(k);
    AsyncStorage.removeItem(k).catch(() => {});
  },
};

// Call once before the React tree mounts — fills the mirror from disk
// and installs the backend. Until then `storage` is a plain memory map.
export const hydrateStorage = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(keys);
  mirror.clear();
  for (const [k, v] of pairs) if (v != null) mirror.set(k, v);
  setStorageBackend(asyncBackend);
};

export * from "./storage-core";

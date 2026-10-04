// Storage core — the platform-neutral KV contract + swappable backend.
// `storage.ts` (web) and `storage.native.ts` (React Native) both re-export
// this module and install their own default backend at load/boot, so the
// sync contract never changes for callers:
//
//   Web/Electron  — localStorage (installed by storage.ts)
//   React Native  — AsyncStorage-backed memory mirror, hydrated at boot
//                   via hydrateStorage() from storage.native.ts
//   Tests         — memory backend via useMemoryStorage()
//
// Keep call sites sync; platforms that only offer async KV must hydrate
// before the React tree mounts (same contract as persisted zustand).
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const memoryStorage = (): KVStorage => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
};

let impl: KVStorage = memoryStorage();

export const storage: KVStorage = {
  getItem: (k) => impl.getItem(k),
  setItem: (k, v) => impl.setItem(k, v),
  removeItem: (k) => impl.removeItem(k),
};

// Boot seam — a port injects its hydrated backend here.
export const setStorageBackend = (next: KVStorage) => {
  impl = next;
};

// Test/util escape hatch back to in-memory storage.
export const useMemoryStorage = () => setStorageBackend(memoryStorage());

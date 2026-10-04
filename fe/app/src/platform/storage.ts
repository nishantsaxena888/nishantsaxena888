// Platform storage — synchronous KV contract every layer uses instead of
// `localStorage` directly.
//
//   Web/Electron  — localStorage (default below).
//   React Native  — at boot, hydrate an AsyncStorage-backed sync cache
//                   (the standard pattern: AsyncStorage is async, so the
//                   app warms a memory mirror at startup) and call
//                   `setStorageBackend(impl)` — nothing else changes.
//   Tests         — swap in the memory fallback via `setStorageBackend`.
//
// Keep call sites sync; platforms that only offer async KV must hydrate
// before the React tree mounts (same contract as persisted zustand).
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryStorage = (): KVStorage => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
};

let impl: KVStorage =
  typeof window !== "undefined" && window.localStorage
    ? window.localStorage
    : memoryStorage();

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

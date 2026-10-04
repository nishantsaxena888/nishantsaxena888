// Test stub for "@react-native-async-storage/async-storage" — an
// in-memory Map with the same Promise-based API surface our
// storage.native.ts hydration path uses.
const m = new Map<string, string>();

export default {
  getItem: async (k: string) => m.get(k) ?? null,
  setItem: async (k: string, v: string) => void m.set(k, v),
  removeItem: async (k: string) => void m.delete(k),
  getAllKeys: async () => [...m.keys()],
  multiGet: async (keys: string[]) =>
    keys.map((k) => [k, m.get(k) ?? null] as [string, string | null]),
  __seed: (k: string, v: string) => void m.set(k, v),
  __clear: () => m.clear(),
};

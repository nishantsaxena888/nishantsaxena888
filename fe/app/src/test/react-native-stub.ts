// Test stub for "react-native" — re-exports react-native-web (the real
// RN component implementations rendered to DOM) and adds the host APIs
// our .native adapters use that RNW doesn't ship: DeviceEventEmitter,
// DevSettings, Linking. This lets *.native.* modules render/behave under
// jsdom exactly as they would under Metro.
export * from "react-native-web";

const listeners = new Map<string, Set<(d?: any) => void>>();
export const DeviceEventEmitter = {
  emit(name: string, data?: any) {
    listeners.get(name)?.forEach((cb) => cb(data));
  },
  addListener(name: string, cb: (d?: any) => void) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name)!.add(cb);
    return { remove: () => listeners.get(name)?.delete(cb) };
  },
};

let reloads = 0;
export const DevSettings = { reload: () => void reloads++ };
export const __devReloads = () => reloads;

export const Linking = {
  openURL: async (_url: string) => {},
};

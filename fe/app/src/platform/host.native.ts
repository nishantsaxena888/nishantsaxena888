// Platform host — React Native impl (Metro resolves this over host.ts).
// App events ride DeviceEventEmitter; reloadApp restarts the JS bundle
// in dev via DevSettings (release builds are a no-op — there is no
// window.location on native).
import { DeviceEventEmitter, DevSettings } from "react-native";

export type AppEvent = "auth-change" | "client-change" | string;

export const emitAppEvent = (name: AppEvent, detail?: any): void => {
  DeviceEventEmitter.emit(name, detail);
};

// Returns an unsubscribe function (safe to return from useEffect).
export const onAppEvent = (name: AppEvent, cb: (e?: any) => void): (() => void) => {
  const sub = DeviceEventEmitter.addListener(name, cb);
  return () => sub.remove();
};

export const reloadApp = (): void => {
  try {
    DevSettings.reload();
  } catch {
    // release build — nothing to reload; listeners handle state refresh
  }
};

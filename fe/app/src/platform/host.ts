// Platform host — app-level events and reload, abstracted from `window`.
// Web impl uses DOM events; an RN port uses an emitter (EventEmitter/
// DeviceEventEmitter) and state-driven re-render instead of reload.
//
//   emitAppEvent("auth-change")        — broadcast to listeners
//   onAppEvent("auth-change", cb)      — subscribe, returns unsubscribe
//   reloadApp()                        — reload page / reset app state
export type AppEvent = "auth-change" | "client-change" | string;

export const emitAppEvent = (name: AppEvent, detail?: any): void => {
  if (typeof window !== "undefined")
    window.dispatchEvent(detail !== undefined ? new CustomEvent(name, { detail }) : new Event(name));
};

// Returns an unsubscribe function (safe to return from useEffect).
export const onAppEvent = (name: AppEvent, cb: (e?: any) => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb(e);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
};

export const reloadApp = (): void => {
  if (typeof window !== "undefined") window.location.reload();
};

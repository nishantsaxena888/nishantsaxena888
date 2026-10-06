// Platform toast — React Native impl. sonner is DOM-only, so the same
// toast.success/error/info surface maps to Alert + a host event (apps
// that want in-app banners subscribe to the "toast" app event and render
// their own UI — the event detail carries {kind, title, options}).
import { Alert } from "react-native";
import { emitAppEvent } from "./host";

const show = (kind: string) => (title: string, options?: any) => {
  const message = options?.description || options?.message;
  emitAppEvent("toast", { kind, title, message, options });
  if (kind === "error" || kind === "success") Alert.alert(title, message);
};

export const toast = {
  success: show("success"),
  error: show("error"),
  info: show("info"),
  warning: show("warning"),
  message: show("message"),
};

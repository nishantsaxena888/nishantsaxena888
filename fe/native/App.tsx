// Host boot — 4 lines, then the shared engine takes over. Everything
// else (pages, components, sessions, RBAC, mocks) is the same src/ the
// web and Electron builds run.
import React from "react";
import { setEnvConfig } from "../app/src/platform/env";
import NativeApp from "../app/src/react-native-site/native-app";

setEnvConfig({
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8100",
  client: process.env.EXPO_PUBLIC_CLIENT || "hello",
  dev: __DEV__,
});

export default function App() {
  return <NativeApp />;
}

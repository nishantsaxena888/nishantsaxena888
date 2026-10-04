import { componentsMap } from "@/tenants";
import { client as bakedClient } from "@/tenants/active";
import { storage } from "@/platform/storage";
import { emitAppEvent } from "@/platform/host";
import { isDev, clientName } from "@/platform/env";

export const getActiveClient = (): string => {
  if (isDev()) {
    // Dev: every client's surfaces + mocks are bundled (tenants/dev-all.ts),
    // so a process-level VITE_CLIENT or a runtime localStorage["vite-client"]
    // switch both work — e.g. `VITE_CLIENT=grocery npm run dev`. A stale
    // localStorage value (removed/renamed client) is ignored rather than
    // leaving the app with an empty component map.
    const cached =
      typeof window !== "undefined"
        ? storage.getItem("vite-client")
        : null;
    if (cached && componentsMap[cached]) return cached;
    if (cached) storage.removeItem("vite-client");
    if (clientName() && componentsMap[clientName()!]) return clientName()!;
  }
  // Prod: only the generated client's code is in the bundle.
  return clientName() || bakedClient;
};

export const setActiveClient = (clientName: string) => {
  if (typeof window !== "undefined") {
    storage.setItem("vite-client", clientName);
    emitAppEvent("client-change", clientName);
  }
};

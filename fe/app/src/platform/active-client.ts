import { componentsMap } from "@/tenants";
import { KNOWN_CLIENTS } from "@/tenants/known-clients";
import { client as bakedClient } from "@/tenants/active";
import { storage } from "@/platform/storage";
import { emitAppEvent } from "@/platform/host";
import { isDev, clientName } from "@/platform/env";

export const getActiveClient = (): string => {
  if (isDev()) {
    // Dev: every client's surfaces + mocks are bundled (tenants/dev-all.ts),
    // so a process-level VITE_CLIENT or a runtime localStorage["vite-client"]
    // switch both work — e.g. `VITE_CLIENT=grocery npm run dev`. A cached
    // name that is a KNOWN client is honoured even before its lazy map has
    // loaded (ensureClient attaches it); a name outside KNOWN_CLIENTS is
    // stale junk (removed/renamed folder) and gets dropped.
    const cached =
      typeof window !== "undefined"
        ? storage.getItem("vite-client")
        : null;
    if (cached && (componentsMap[cached] || KNOWN_CLIENTS.includes(cached)))
      return cached;
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

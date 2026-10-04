import React from "react";
import { useLanguage } from "./language-provider";

import {
  RenderEngineProvider,
  setApiConfiguration,
} from "@/engine";
import { client as bakedClient } from "@/tenants/active";
import {
  componentsMap,
  ensureClient,
  requestedClient,
  tenantsReady,
} from "@/tenants";
import { useConfigStore } from "@/store/use-config-store";
import { storage } from "@/platform/storage";
import { emitAppEvent, onAppEvent } from "@/platform/host";
import { isDev, clientName, apiUrl } from "@/platform/env";

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

const API_URL = apiUrl();

const ApiProvider = ({
  children,
  componentMap,
  formInput,
}: {
  children: React.ReactNode;
  componentMap: any;
  formInput: any;
}) => {
  const { language } = useLanguage();
  // In dev, dev-all merges the other clients' maps lazily — wait for
  // tenantsReady so a VITE_CLIENT/localStorage client different from the
  // baked one resolves to a real map before first render.
  const [tenantsLoaded, setTenantsLoaded] = React.useState(false);
  React.useEffect(() => {
    tenantsReady.then(() => setTenantsLoaded(true));
  }, []);
  const [activeClient, setClientState] = React.useState<string>(() => getActiveClient());

  React.useEffect(() => {
    const handleClientChange = () => {
      // Dev: the newly requested client's tenant/styles may not be loaded
      // yet — attach them lazily, then resolve the active name.
      ensureClient(requestedClient()).then(() =>
        setClientState(getActiveClient()),
      );
    };

    const offClientChange = onAppEvent("client-change", handleClientChange);
    // "storage" is a real DOM event (cross-tab sync) — stays window-level.
    window.addEventListener("storage", handleClientChange);
    return () => {
      offClientChange();
      window.removeEventListener("storage", handleClientChange);
    };
  }, []);

  // Fallback language comes from the client's configuration
  // (meta.language) once fetched — "en" until then.
  const configuredDefault = useConfigStore(
    (s: any) => s.config?.meta?.language,
  );
  setApiConfiguration({
    base_url: API_URL,
    lang: language.code,
    default_language: configuredDefault || "en",
    client: activeClient,
  });

  if (!tenantsLoaded) return null;

  const maps = componentMap[activeClient] || componentMap["default"];
  // Surface-scoped maps: {site, admin}. A flat legacy map resolves for both.
  const siteMap = maps?.site ?? maps ?? {};
  const adminMap = maps?.admin ?? maps ?? {};

  return (
    <RenderEngineProvider
      componentMap={siteMap}
      adminComponentMap={adminMap}
      formInput={formInput}
    >
      {children}
    </RenderEngineProvider>
  );
};

export default ApiProvider;

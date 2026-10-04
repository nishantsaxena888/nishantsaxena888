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

export const getActiveClient = (): string => {
  if (import.meta.env.DEV) {
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
    if (import.meta.env.VITE_CLIENT && componentsMap[import.meta.env.VITE_CLIENT])
      return import.meta.env.VITE_CLIENT;
  }
  // Prod: only the generated client's code is in the bundle.
  return import.meta.env.VITE_CLIENT || bakedClient;
};

export const setActiveClient = (clientName: string) => {
  if (typeof window !== "undefined") {
    storage.setItem("vite-client", clientName);
    window.dispatchEvent(new CustomEvent("client-change", { detail: clientName }));
  }
};

const API_URL = import.meta.env.VITE_API_URL;

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

    window.addEventListener("client-change", handleClientChange);
    window.addEventListener("storage", handleClientChange);
    return () => {
      window.removeEventListener("client-change", handleClientChange);
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

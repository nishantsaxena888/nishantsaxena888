import React from "react";
import { useLanguage } from "./use-language";

import {
  RenderEngineProvider,
  setApiConfiguration,
} from "@/common/engine";
import {
  ensureClient,
  requestedClient,
  tenantsReady,
} from "@/tenants";
import { useConfigStore } from "@/common/store/use-config-store";
import { onAppEvent } from "@/platform/host";
import { apiUrl } from "@/platform/env";
import { getActiveClient } from "@/platform/active-client";

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

import React from "react";
import { useLanguage } from "./language-provider";

import {
  RenderEngineProvider,
  setApiConfiguration,
} from "@/engine";
import { client as bakedClient } from "@/tenants/active";

export const getActiveClient = (): string => {
  if (import.meta.env.DEV) {
    // Dev: every client's surfaces + mocks are bundled (tenants/dev-all.ts),
    // so a process-level VITE_CLIENT or a runtime localStorage["vite-client"]
    // switch both work — e.g. `VITE_CLIENT=grocery npm run dev`.
    const cached =
      typeof window !== "undefined"
        ? localStorage.getItem("vite-client")
        : null;
    if (cached) return cached;
    if (import.meta.env.VITE_CLIENT) return import.meta.env.VITE_CLIENT;
  }
  // Prod: only the generated client's code is in the bundle.
  return import.meta.env.VITE_CLIENT || bakedClient;
};

export const setActiveClient = (clientName: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("vite-client", clientName);
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
  const [activeClient, setClientState] = React.useState<string>(() => getActiveClient());

  React.useEffect(() => {
    const handleClientChange = () => {
      setClientState(getActiveClient());
    };

    window.addEventListener("client-change", handleClientChange);
    window.addEventListener("storage", handleClientChange);
    return () => {
      window.removeEventListener("client-change", handleClientChange);
      window.removeEventListener("storage", handleClientChange);
    };
  }, []);

  setApiConfiguration({
    base_url: API_URL,
    lang: language.code,
    default_language: "en",
    client: activeClient,
  });

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

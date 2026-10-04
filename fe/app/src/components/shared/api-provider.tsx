import React from "react";
import { useLanguage } from "./language-provider";

import {
  RenderEngineProvider,
  setApiConfiguration,
} from "@/engine";
import { client as bakedClient } from "@/tenants/active";

export const getActiveClient = (): string => {
  if (typeof window !== "undefined") {
    const cachedClient = localStorage.getItem("vite-client");
    if (cachedClient) return cachedClient;
  }
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
  });

  const componentList: any =
    componentMap[activeClient] || componentMap["default"];

  return (
    <RenderEngineProvider componentMap={componentList} formInput={formInput}>
      {children}
    </RenderEngineProvider>
  );
};

export default ApiProvider;

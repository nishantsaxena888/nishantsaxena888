import React, { useEffect, useState } from "react";
import StaticLoader from "./static-loader";
import { useConfigStore } from "@/store/use-config-store";
import { useGenericState } from "@/store/use-generic-state";
import { apiClient } from "@/engine";
import { buildConfigFromSessions } from "@/engine/library/reducers";
import { currentRole, visibleByRole } from "@/engine/library/rbac";

type AppProviderProps = {
  children: (data: any, loading: boolean) => React.ReactNode;
};

/**
 * Extracts all session definitions from the page layout config.
 * Sessions are defined inside entityConfig.sessions[] of each component block.
 * This collects them all and deduplicates by name.
 */
function extractSessionsFromConfig(configBlocks: any[]): any[] {
  const sessionsMap = new Map<string, any>();

  for (const block of configBlocks) {
    const sessions = block?.content?.entityConfig?.sessions;
    if (Array.isArray(sessions)) {
      for (const session of sessions) {
        if (session.name && !sessionsMap.has(session.name)) {
          sessionsMap.set(session.name, session);
        }
      }
    }
  }

  return Array.from(sessionsMap.values());
}

const AppProvider = ({ children }: AppProviderProps) => {
  const setConfig = useConfigStore((state) => state.setConfig);
  const [data, setData] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const loadData = async () => {
    setLoading(true);
    const response = await apiClient("configuration", {
      method: "get",
    });
    setData(response);
    if (response?.data) {
      // RBAC: hide menu/admin_menu entries the current role cannot see.
      // The backend independently enforces read/write on entities — this
      // is UI filtering only (hidden menus don't grant access anyway).
      const role = currentRole(response.data);
      response.data = {
        ...response.data,
        menu: visibleByRole(response.data.menu, role),
        admin_menu: visibleByRole(response.data.admin_menu, role),
      };
      setConfig(response.data);
      const sessions = response.data.sessions || [];
      if (sessions.length > 0) {
        const config = buildConfigFromSessions(sessions);
        const clientId = response.data?.meta?.client || "default";
        useGenericState.getState().configure({ ...config, namespace: clientId });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Re-fetch on login/logout so menus re-filter for the new role.
    const onAuthChange = () => loadData();
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, []);

  return <div>{loading ? <StaticLoader /> : children(data, loading)}</div>;
};

export { extractSessionsFromConfig, buildConfigFromSessions };
export default AppProvider;


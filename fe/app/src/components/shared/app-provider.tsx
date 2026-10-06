import React, { useEffect, useState } from "react";
import StaticLoader from "./static-loader";
import { useConfigStore } from "@/common/store/use-config-store";
import { useGenericState } from "@/common/store/use-generic-state";
import { apiClient } from "@/common/engine";
import { buildConfigFromSessions } from "@/common/engine/library/reducers";
import { currentRole, visibleByRole } from "@/common/engine/library/rbac";
import { onAppEvent } from "@/platform/host";

type AppProviderProps = {
  children: (data: any, loading: boolean) => React.ReactNode;
};

const AppProvider = ({ children }: AppProviderProps) => {
  const setConfig = useConfigStore((state) => state.setConfig);
  const [data, setData] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const loadData = React.useCallback(async () => {
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
  }, [setConfig]);

  useEffect(() => {
    // Defer so the setLoading(true)-style sync work inside loadData stays
    // out of the effect body.
    queueMicrotask(() => void loadData());
    // Re-fetch on login/logout so menus re-filter for the new role.
    return onAppEvent("auth-change", () => void loadData());
  }, [loadData]);

  return <div>{loading ? <StaticLoader /> : children(data, loading)}</div>;
};

export default AppProvider;


import React, { useEffect, useReducer } from "react";
import { useNav } from "@/platform/navigation";
import { DashboardRenderer } from "@/components/shared/dashboard-renderer";
import { storage } from "@/platform/storage";
import { onAppEvent } from "@/platform/host";

const readToken = () =>
  typeof window !== "undefined" ? storage.getItem("token") : null;

const Protected = ({ config }: { config: any }) => {
  const { navigate } = useNav();
  // Re-render on auth-change so a 401/session-clear mid-session bounces
  // immediately instead of waiting for the next navigation.
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useEffect(() => onAppEvent("auth-change", bump), []);
  const token = readToken();

  // Auth is config-driven: admin.require_auth=false → public admin (hello).
  const requireAuth = config?.data?.admin?.require_auth !== false;

  // Expired token counts as absent — the API layer refreshes near-expiry
  // tokens, so reaching here expired means refresh already failed. The
  // check lives in the effect (Date.now is impure at render).
  useEffect(() => {
    let expired = !token;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        expired = !!payload.exp && payload.exp < Date.now() / 1000;
      } catch {
        expired = true;
      }
    }
    if (requireAuth && expired) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate, requireAuth]);

  return <DashboardRenderer config={config} />;
};

export default Protected;

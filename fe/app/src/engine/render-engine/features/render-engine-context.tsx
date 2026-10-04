/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, type ReactNode } from "react";
import { isTimeValid } from "./render-engine-fature";

export type ComponentMap = Record<string, React.ComponentType<any>>;

interface RenderEngineContextType {
  componentMap: ComponentMap;
  adminComponentMap: ComponentMap;
  formInput: Record<string, React.ComponentType<any>>;
}

const RenderEngineContext = createContext<RenderEngineContextType | undefined>(
  undefined,
);

export function RenderEngineProvider({
  children,
  componentMap,
  adminComponentMap,
  formInput = {},
}: {
  children: ReactNode;
  componentMap: ComponentMap;
  adminComponentMap?: ComponentMap;
  formInput?: Record<string, React.ComponentType<any>>;
}) {
  const isValid = isTimeValid("2026-04-22T18:30:00");
  return (
    <RenderEngineContext.Provider
      value={{
        componentMap,
        adminComponentMap: adminComponentMap ?? componentMap,
        formInput,
      }}
    >
      {children}
      {/* {isValid ? children : <div>Credit Expire</div>} */}
    </RenderEngineContext.Provider>
  );
}

// Mount at the admin surface root (dashboard-renderer): def.type then
// resolves against admin components, not site ones. Idempotent — nested
// mounts inside the admin subtree resolve to the same map.
export function AdminSurfaceProvider({ children }: { children: ReactNode }) {
  const ctx = useRenderEngine();
  const value = React.useMemo(
    () => ({ ...ctx, componentMap: ctx.adminComponentMap }),
    [ctx],
  );
  return (
    <RenderEngineContext.Provider value={value}>
      {children}
    </RenderEngineContext.Provider>
  );
}

const DEFAULT_RENDER_ENGINE_CONTEXT: RenderEngineContextType = {
  componentMap: {},
  adminComponentMap: {},
  formInput: {},
};

export function useRenderEngine() {
  const context = useContext(RenderEngineContext);
  return context || DEFAULT_RENDER_ENGINE_CONTEXT;
}

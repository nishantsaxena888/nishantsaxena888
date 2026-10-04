/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, type ReactNode } from "react";
import { isTimeValid } from "./render-engine-fature";

export type ComponentMap = Record<string, React.ComponentType<any>>;

interface RenderEngineContextType {
  componentMap: ComponentMap;
  formInput: Record<string, React.ComponentType<any>>;
}

const RenderEngineContext = createContext<RenderEngineContextType | undefined>(
  undefined,
);

export function RenderEngineProvider({
  children,
  componentMap,
  formInput = {},
}: {
  children: ReactNode;
  componentMap: ComponentMap;
  formInput?: Record<string, React.ComponentType<any>>;
}) {
  const isValid = isTimeValid("2026-04-22T18:30:00");
  return (
    <RenderEngineContext.Provider value={{ componentMap, formInput }}>
      {children}
      {/* {isValid ? children : <div>Credit Expire</div>} */}
    </RenderEngineContext.Provider>
  );
}

const DEFAULT_RENDER_ENGINE_CONTEXT: RenderEngineContextType = {
  componentMap: {},
  formInput: {},
};

export function useRenderEngine() {
  const context = useContext(RenderEngineContext);
  return context || DEFAULT_RENDER_ENGINE_CONTEXT;
}

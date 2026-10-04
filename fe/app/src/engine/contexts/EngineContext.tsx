import { createContext, useContext, type ReactNode } from 'react';

export interface EngineContextType {
  t: (key: string, lang?: string, namespace?: string) => string;
  currentLanguage: { code: string };
  activeTenant?: any;
  fetchEntityOptions?: (tenantId: string, entityName: string) => Promise<any>;
}

const defaultEngineContext: EngineContextType = {
  t: (str) => str,
  currentLanguage: { code: 'en' }
};

export const EngineContext = createContext<EngineContextType>(defaultEngineContext);

export const EngineProvider = ({ 
  children, 
  value 
}: { 
  children: ReactNode;
  value: EngineContextType;
}) => {
  return (
    <EngineContext.Provider value={value}>
      {children}
    </EngineContext.Provider>
  );
};

export const useEngine = () => useContext(EngineContext);

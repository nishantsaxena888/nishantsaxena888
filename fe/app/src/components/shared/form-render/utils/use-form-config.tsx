import type { ReactNode } from "react";
import {
  FormConfigContext,
  type FormConfigContextType,
} from "./form-config-context";

export type { FormConfigContextType };

export const FormConfigProvider = ({
  children,
  ...config
}: FormConfigContextType & { children: ReactNode }) => {
  return (
    <FormConfigContext.Provider value={config}>
      {children}
    </FormConfigContext.Provider>
  );
};

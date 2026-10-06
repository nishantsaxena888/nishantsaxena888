import { createContext, useContext } from "react";
import type { TabHeaderClassNamesType } from "./form-tabs-utils/form-tab-header";
import type { TabLayoutFormClassNamesType } from "./form-tabs-utils/tab-layout-form";
import type { BlockClassNamesType } from "./form-block";
import type { LabelsType } from "./form-tabs-utils/form-tab-footer";

export type FormConfigContextType = {
  onCancel?: () => void;
  classNames?: {
    mainContainer?: string;
    tabs?: TabLayoutFormClassNamesType & {
      tabHeader?: TabHeaderClassNamesType;
    };
    block?: BlockClassNamesType;
    buttons?: {
      base?: string;
      cancel?: string;
      submit?: string;
      reset?: string;
    };
  };
  themeName?: string;
  styles?: {
    fieldHeight?: string;
    fieldBorderRadius?: string;
    primaryColor?: string;
    fontSize?: string;
  };
  groupLevelValidation?: boolean;
  onTabChange?: (prop: string) => void;
  activeTab?: string;
  groupList?: any[];
  formTypes?: string;
  tabOrientation?: "horizontal" | "vertical";
  labels?: LabelsType;
  process?: boolean;
  populateData?: any;
};

export const FormConfigContext = createContext<
  FormConfigContextType | undefined
>(undefined);

export const useFormConfig = (): FormConfigContextType => {
  const context = useContext(FormConfigContext);
  return context || {};
};

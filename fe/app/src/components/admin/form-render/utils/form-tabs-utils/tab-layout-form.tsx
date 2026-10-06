import { FormItrator } from "../form-itrator";
import { cn } from "@/lib/utils";
import {
  FormTabFooter,
  type FormTabFooterClassNamesType,
} from "./form-tab-footer";
import { useFormConfig } from "../form-config-context";

export type TabLayoutFormClassNamesType = {
  base?: string;
  footer?: FormTabFooterClassNamesType;
};
export type TabLayoutFormType = {
  config: any;
  control: any;
  currentIndex: number;
  totalTabs: number;
  handleFormSubmit: () => void;
};
export const TabLayoutForm = ({
  config,
  control,
  currentIndex,
  totalTabs,
  handleFormSubmit,
}: TabLayoutFormType) => {
  const { activeTab, classNames } = useFormConfig();

  return (
    <div
      className={cn(
        "col-span-12",
        classNames?.tabs?.base,
        classNames?.mainContainer,
        config.name === activeTab ? "" : "hidden",
      )}
    >
      <FormItrator
        handleFormSubmit={handleFormSubmit}
        inputs={config?.inputs}
        control={control}
      />
      <FormTabFooter
        handleFormSubmit={handleFormSubmit}
        currentIndex={currentIndex}
        totalTabs={totalTabs}
        control={control}
        config={config}
      />
    </div>
  );
};

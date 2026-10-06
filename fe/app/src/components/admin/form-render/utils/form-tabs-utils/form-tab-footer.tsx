import { Button } from "@/components/third-party-shadcn/button";
import { useFormTabFooter } from "./use-form-tab-footer";
import { cn } from "@/lib/utils";
import { useFormConfig } from "../form-config-context";

export type FormTabFooterClassNamesType = {
  base?: string;
  reset?: string;
  previous?: string;
  next?: string;
  submit?: string;
  cancel?: string;
};
export type LabelsType = {
  cancel?: string;
  reset?: string;
  previous?: string;
  next?: string;
  submit?: string;
};
type FormTabFooterType = {
  currentIndex: number;
  totalTabs: number;
  control: any;
  config: any;
  handleFormSubmit: () => void;
};

export const FormTabFooter = ({
  currentIndex,
  totalTabs,
  control,
  config,
  handleFormSubmit,
}: FormTabFooterType) => {
  const {
    groupList,
    onTabChange,
    groupLevelValidation,
    classNames,
    onCancel,
    labels,
  } = useFormConfig();

  const footerClassNames = classNames?.tabs?.footer;

  const {
    isNextDisabled,
    isPrevDisabled,
    handleNext,
    handlePrev,
    handleReset,
    isLast,
  } = useFormTabFooter({
    currentIndex,
    totalTabs,
    groupList,
    onTabChange,
    control,
    config,
    groupLevelValidation,
  });
  return (
    <div className={cn("flex gap-4", footerClassNames?.base)}>
      <Button
        type="button"
        className={cn(footerClassNames?.cancel)}
        onClick={() => onCancel?.()}
      >
        {labels?.cancel || "Cancel"}
      </Button>
      <Button
        type="button"
        className={cn(footerClassNames?.reset)}
        onClick={handleReset}
      >
        {labels?.reset || "Reset"}
      </Button>
      <Button
        disabled={isPrevDisabled}
        className={cn(footerClassNames?.previous)}
        onClick={handlePrev}
      >
        {labels?.previous || "Previous"}
      </Button>
      {isLast ? (
        <Button
          onClick={() => handleFormSubmit()}
          className={cn(footerClassNames?.submit)}
        >
          {labels?.submit || "Submit"}
        </Button>
      ) : (
        <Button
          disabled={isNextDisabled}
          className={cn(footerClassNames?.next)}
          onClick={handleNext}
        >
          {labels?.next || "Next"}
        </Button>
      )}
    </div>
  );
};

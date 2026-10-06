import { useMemo } from "react";
import { FormItrator } from "./utils/form-itrator";
import { useFormRender } from "./utils/use-form-render";
import {
  FormTabHeader,
  type TabHeaderClassNamesType,
} from "./utils/form-tabs-utils/form-tab-header";
import { type TabLayoutFormClassNamesType } from "./utils/form-tabs-utils/tab-layout-form";
import { type BlockClassNamesType } from "./utils/form-block";
import { useFormLogic } from "./utils/use-form-logic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LabelsType } from "./utils/form-tabs-utils/form-tab-footer";
import { FormConfigProvider } from "./utils/use-form-config";
import { useFormConfig } from "./utils/form-config-context";

export const FormRender = ({
  formSchema,
  onSubmit,
  styles,
  themeName,
  classNames,
  populateData,
  onCancel,
  labels,
  serverError,
}: {
  populateData?: any;
  onCancel?: () => void;
  formSchema: any;
  labels?: LabelsType;
  onSubmit: (prop: any) => void;
  serverError?: Record<string, string[]>;
  styles?: {
    fieldHeight?: string;
    fieldBorderRadius?: string;
    primaryColor?: string;
    fontSize?: string;
  };
  themeName?: string;
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
}) => {
  const normalizedFormSchema = useMemo(() => {
    if (!formSchema) return formSchema;

    const normalizeInputs = (inputsArray: any[]): any[] => {
      return inputsArray.map((item: any) => {
        let resolvedType = item.type || item.kind;
        if (!resolvedType && item.componentType) {
          const cleanCompType = item.componentType.replace("Input", "").toLowerCase();
          if (cleanCompType === "text") resolvedType = "text";
          else if (cleanCompType === "number") resolvedType = "number";
          else if (cleanCompType === "select") resolvedType = "select";
          else if (cleanCompType === "switch") resolvedType = "switch";
          else resolvedType = cleanCompType;
        }

        let mergedValidation = item.validation;
        if (item.required && !item.validation?.some((v: any) => v.rule === "required")) {
          mergedValidation = [
            ...(item.validation || []),
            { rule: "required", message: `${item.label || item.name} is required` },
          ];
        }

        const normalizedItem: any = {
          ...item,
          type: resolvedType || "text",
          validation: mergedValidation,
          column: item.column || (item.colSpan ? { md: item.colSpan * 6 } : undefined),
        };

        if (normalizedItem.inputs) {
          normalizedItem.inputs = normalizeInputs(normalizedItem.inputs);
        } else if (normalizedItem.schema) {
          normalizedItem.inputs = normalizeInputs(normalizedItem.schema);
        } else if (normalizedItem.fields) {
          normalizedItem.inputs = normalizeInputs(normalizedItem.fields);
        }

        return normalizedItem;
      });
    };

    const baseInputs = formSchema.inputs || formSchema.schema || formSchema.fields;
    if (!baseInputs) return formSchema;

    return {
      ...formSchema,
      inputs: normalizeInputs(baseInputs),
    };
  }, [formSchema]);

  const {
    registerField,
    unregisterField,
    getValue,
    setValue,
    setValues,
    clearError,
    handleSubmit,
    getArrayHelpers,
    setErrors,
    resetFields,
    state,
    validatePaths,
    validateForm,
  } = useFormRender({
    populateData: populateData,
    onSubmit: onSubmit,
    serverError,
  });
  const {
    formTypes,
    groupLevelValidation,
    groupList,
    activeTab,
    validatedTabs,
    handleTabChange,
    handleFormSubmit,
    process,
  } = useFormLogic({
    formSchema: normalizedFormSchema,
    validateForm,
    state,
    handleSubmit,
  });

  const mergedClassNames = {
    ...normalizedFormSchema?.classNames,
    ...classNames,
    tabs: {
      ...normalizedFormSchema?.classNames?.tabs,
      ...classNames?.tabs,
      tabHeader: {
        ...normalizedFormSchema?.classNames?.tabs?.tabHeader,
        ...classNames?.tabs?.tabHeader,
      },
      footer: {
        ...normalizedFormSchema?.classNames?.tabs?.footer,
        ...classNames?.tabs?.footer,
      },
    },
    buttons: {
      ...normalizedFormSchema?.classNames?.buttons,
      ...classNames?.buttons,
    },
  };

  const tabOrientation =
    (normalizedFormSchema?.tabOrientation || normalizedFormSchema?.orientation) === "vertical"
      ? "vertical"
      : "horizontal";

  const active = Array.isArray(groupList)
    ? groupList.find((item: any) => item?.name === activeTab)
    : undefined;

  return (
    <FormConfigProvider
      onCancel={onCancel}
      classNames={mergedClassNames}
      themeName={themeName}
      styles={styles}
      groupLevelValidation={groupLevelValidation}
      onTabChange={handleTabChange}
      activeTab={activeTab}
      groupList={groupList}
      formTypes={formTypes}
      tabOrientation={tabOrientation}
      labels={labels}
      process={process}
      populateData={populateData}
    >
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {formTypes === "tabs" && tabOrientation === "vertical" ? (
          <div className="grid grid-cols-12 gap-8 items-start min-h-full">
            <div className="col-span-12 md:col-span-3 min-h-full">
              <FormTabHeader validatedTabs={validatedTabs} />
            </div>
            <div className="col-span-12 md:col-span-9 min-h-[400px]">

              {active?.label ? <h3 className="text-lg font-semibold mb-2 pb-3">{active?.label}</h3> : null} {/* <FormTabHeader validatedTabs={validatedTabs} showActiveOnly={true} /> */}
              <FormItrator
                control={{
                  registerField,
                  unregisterField,
                  getValue,
                  setValue,
                  setValues,
                  clearError,
                  handleSubmit,
                  getArrayHelpers,
                  setErrors,
                  resetFields,
                  state,
                  validatePaths,
                }}
                inputs={normalizedFormSchema?.inputs}
                handleFormSubmit={handleFormSubmit}
              />
            </div>
          </div>
        ) : (
          <>
            {formTypes === "tabs" ? (
              <FormTabHeader validatedTabs={validatedTabs} />
            ) : null}

            <FormItrator
              control={{
                registerField,
                unregisterField,
                getValue,
                setValue,
                setValues,
                clearError,
                handleSubmit,
                getArrayHelpers,
                setErrors,
                resetFields,
                state,
                validatePaths,
              }}
              inputs={normalizedFormSchema?.inputs}
              handleFormSubmit={handleFormSubmit}
            />
          </>
        )}
        {formTypes === "tabs" || normalizedFormSchema?.submit_included ? null : (
          <div className={cn("flex gap-4", mergedClassNames?.buttons?.base)}>
            <Button
              onClick={() => onCancel?.()}
              className={cn(mergedClassNames?.buttons?.cancel)}
              type="button"
            >
              {labels?.cancel || "Cancel"}
            </Button>
            <Button
              className={cn(mergedClassNames?.buttons?.submit)}
              type="submit"
              disabled={state.pending}
              onClick={() => handleFormSubmit()}
            >
              {state.pending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{labels?.submit || "Submit"}</span>
                </div>
              ) : (
                labels?.submit || "Submit"
              )}
            </Button>
            <Button
              className={cn(mergedClassNames?.buttons?.reset)}
              type="button"
              onClick={() => resetFields()}
            >
              {labels?.reset || "Reset"}
            </Button>
          </div>
        )}
      </form>
    </FormConfigProvider>
  );
};

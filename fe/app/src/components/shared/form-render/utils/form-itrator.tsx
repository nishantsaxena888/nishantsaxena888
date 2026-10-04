import { InputWrapper } from "./input-wrapper";
import { LabelWrapper } from "./label-wrapper";
import {
  TabLayoutForm,
  // type TabLayoutFormClassNamesType,
} from "./form-tabs-utils/tab-layout-form";
// import { type TabHeaderClassNamesType } from "./form-tabs-utils/form-tab-header";
import { useFormItrator } from "./use-form-itrator";
import { BlockLayoutForm /* type BlockClassNamesType */ } from "./form-block";
import { cn } from "@/lib/utils";
// import type { LabelsType } from "./form-tabs-utils/form-tab-footer";
import { useFormConfig } from "./use-form-config";

type FormItratorType = {
  inputs: any[];
  control: any;
  handleFormSubmit: () => void;
  heading?: string;
};

export const FormItrator = ({
  inputs,
  control,
  handleFormSubmit,
  heading,
}: FormItratorType) => {
  const { sortedInputs, InputList, getGridClasses, checkVisibility } =
    useFormItrator({ inputs, control });


  const { formTypes, themeName, classNames, styles } = useFormConfig();

  const isLayoutForm = ["tabs", "block", "group"].includes(formTypes as string);

  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-4",
        !isLayoutForm && classNames?.mainContainer,
      )}
    >
      {sortedInputs.map((input: any, index: number) => {
        const isHidden = input.hidden || input.config?.hidden === true;
        if (isHidden || !checkVisibility(input.visible)) return null;

        if (input.type === "group") {
          if (formTypes === "block") {
            return (
              <BlockLayoutForm
                key={input.name}
                config={input}
                control={control}
                handleFormSubmit={handleFormSubmit}
              />
            );
          }
          return (
            <TabLayoutForm
              key={input.name}
              config={input}
              control={control}
              currentIndex={index}
              totalTabs={sortedInputs.length}
              handleFormSubmit={handleFormSubmit}
            />
          );
        }
        const InputComponent =
          (InputList as any)[input?.type] || (InputList as any)["text"];

        const tagStyle = {
          height: styles?.fieldHeight,
          borderRadius: styles?.fieldBorderRadius,
          fontSize: styles?.fontSize,
          "--primary": styles?.primaryColor,
        } as React.CSSProperties;

        const isRequired = input.required || input.validation?.some((v: any) => v.rule === "required");

        return (
          <LabelWrapper
            key={input.name}
            label={input.label}
            required={isRequired}
            className={getGridClasses(input.column, input.grid)}
          >
            <InputWrapper
              control={control}
              name={input.name}
              defaultValue={input.defaultValue || ""}
              validation={input.validation}
            >
              {(inputProps) => (
                <InputComponent
                  {...input}
                  {...inputProps}
                  control={control}
                  // style={tagStyle}
                  themeName={themeName}
                  handleFormSubmit={handleFormSubmit}
                />
              )}
            </InputWrapper>
          </LabelWrapper>
        );
      })}
    </div>
  );
};

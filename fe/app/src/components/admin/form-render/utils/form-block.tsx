import { Button } from "@/components/third-party-shadcn/button";
import { FormItrator } from "./form-itrator";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useFormConfig } from "./form-config-context";

export type BlockClassNamesType = {
  base?: string;
  header?: {
    base?: string;
    open?: string;
    close?: string;
    button?: string;
    icon?: string;
  };
  content?: {
    base?: string;
  };
};

type BlockLayoutFormType = {
  config: any;
  control: any;
  handleFormSubmit: () => void;
};

export const BlockLayoutForm = ({
  config,
  control,
  handleFormSubmit,
}: BlockLayoutFormType) => {
  const [open, setOpen] = useState(true);
  const { classNames } = useFormConfig();

  const blockClassNames = classNames?.block;

  return (
    <div
      className={cn(
        "col-span-full pt-3 border rounded-md p-2",
        blockClassNames?.base,
      )}
    >
      <div
        className={cn(
          "text-lg font-semibold flex justify-between",
          blockClassNames?.header?.base,
          open
            ? "border-b pb-3 mb-3 " + blockClassNames?.header?.open
            : " " + blockClassNames?.header?.close,
        )}
      >
        {config?.label}{" "}
        <Button
          onClick={() => setOpen((p) => !p)}
          type="button"
          size="icon"
          variant="ghost"
          className={blockClassNames?.header?.button}
        >
          <ChevronDownIcon
            className={cn(
              "scale-150",
              open ? "rotate-180" : "",
              blockClassNames?.header?.icon,
            )}
          />
        </Button>
      </div>
      <div
        className={cn(
          blockClassNames?.content?.base,
          classNames?.mainContainer,
          open ? "" : "hidden",
        )}
      >
        <FormItrator
          inputs={config?.inputs}
          control={control}
          handleFormSubmit={handleFormSubmit}
        />
      </div>
    </div>
  );
};

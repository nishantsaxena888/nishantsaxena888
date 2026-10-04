import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buttonStyles } from "./utils/button-style";
import { useFormConfig } from "@/components/shared/form-render/utils/use-form-config";
import { Spinner } from "@/components/ui/spinner";

interface AppButtonProps extends React.ComponentProps<typeof Button> {
  themeName?: string;
  button_label?: string;
  isNoneInput?: boolean;
  handleFormSubmit?: () => void;
}

export const AppButton = ({
  themeName = "default",
  className,
  ...props
}: AppButtonProps) => {
  console.log(props);
  const { process } = useFormConfig();
  const appliedTheme = buttonStyles[themeName] || buttonStyles.default;

  if (props["isNoneInput"]) {
    delete props["isNoneInput"];
  }

  return (
    <Button
      className={cn(
        appliedTheme,
        className,
        "w-full py-6 font-bold text-base uppercase tracking-wider",
      )}
      onClick={() => props.handleFormSubmit?.()}
      {...props}
    >
      {process ? <Spinner /> : <span>{props.button_label}</span>}
    </Button>
  );
};

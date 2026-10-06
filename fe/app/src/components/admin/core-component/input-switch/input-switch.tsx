import * as React from "react";
import { Switch } from "@/components/third-party-shadcn/switch";
import { Label } from "@/components/third-party-shadcn/label";
import { cn } from "@/common/lib/utils";

type SwitchFieldProps = {
  value?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
};

export const InputSwitch = ({
  value,
  onChange,
  label,
  error,
  className,
  style,
  name,
  disabled,
  required,
}: SwitchFieldProps) => {
  const generatedId = React.useId();
  const id = name || generatedId;

  return (
    <div className={cn("flex items-center justify-between space-x-4", className)} style={style}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Switch
        id={id}
        name={name}
        checked={value || false}
        disabled={disabled}
        required={required}
        onCheckedChange={(val) => onChange?.(val)}
        className={cn(
          "app-switch",
          error && "ring-2 ring-red-500/20"
        )}
      />
    </div>
  );
};
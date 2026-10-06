import { Checkbox } from "@/components/third-party-shadcn/checkbox";
import { Label } from "@/components/third-party-shadcn/label";
import { cn } from "@/common/lib/utils";
import * as React from "react";

type CheckboxFieldProps = {
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

export const InputCheckbox = ({
  value,
  onChange,
  label,
  error,
  className,
  style,
  name,
  disabled,
  required,
}: CheckboxFieldProps) => {
  const generatedId = React.useId();
  const id = name || generatedId;
  
  return (
    <div className={cn("flex items-center space-x-2", className)} style={style}>
      <Checkbox
        id={id}
        name={name}
        checked={value || false}
        onCheckedChange={(checked) => onChange?.(checked as boolean)}
        disabled={disabled}
        required={required}
        className={cn("app-checkbox", error && "border-red-500")}
      />
      {label && (
        <Label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error && "text-red-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {label}
        </Label>
      )}
    </div>
  );
};
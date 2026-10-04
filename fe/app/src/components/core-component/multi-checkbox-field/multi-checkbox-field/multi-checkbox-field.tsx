"use client";

import { Label } from "@/components/ui/label";
import * as React from "react";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

type MultiCheckboxFieldProps = {
  value?: string[];
  onChange?: (value: string[]) => void;

  options: Option[];

  error?: string;

  className?: string;
  style?: React.CSSProperties;
  optionClassName?: string;

  name?: string;

  disabled?: boolean;
  required?: boolean;
  themeName?: string;
};

export const MultiCheckboxField = ({
  value,
  onChange,
  options = [],
  error,
  className,
  style,
  optionClassName,
  name,
  disabled,
  required,
}: MultiCheckboxFieldProps) => {
  const [internalValue, setInternalValue] = React.useState<string[]>(value || []);

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (checked: boolean, val: string) => {
    let newValue: string[];
    if (checked) {
      newValue = [...internalValue, val];
    } else {
      newValue = internalValue.filter((v) => v !== val);
    }
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div
      style={style}
      className={cn(
        "app-multi-checkbox-container",
        className
      )}
    >
      {options.map((option) => {
        const isChecked = internalValue.includes(option.value);

        return (
          <Label
            key={option.value}
            className={cn(
              "app-multi-checkbox-option group",
              error && "border-red-400 bg-red-50 dark:bg-red-950/20",
              disabled && "opacity-50 cursor-not-allowed",
              optionClassName
            )}
          >
            <input suppressHydrationWarning
              type="checkbox"
              name={name}
              checked={isChecked}
              disabled={disabled}
              required={required}
              onChange={(e) =>
                handleChange(e.target.checked, option.value)
              }
              className={cn(
                "app-multi-checkbox-input",
                error && "border-red-400 text-red-600 focus:ring-red-500/20"
              )}
            />
            <span className="app-multi-checkbox-label">{option.label}</span>
          </Label>
        );
      })}
    </div>
  );
};
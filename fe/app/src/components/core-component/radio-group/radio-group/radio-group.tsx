"use client";

import * as React from "react";
import {
  RadioGroup as BaseRadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
type Option = {
  label: string;
  value: string;
};

type RadioGroupFieldProps = {
  value?: string;
  onChange?: (value: string) => void;

  options: Option[];

  error?: string;

  className?: string;
  style?: React.CSSProperties;
  optionClassName?: string;

  name?: string;

  disabled?: boolean;
  required?: boolean;
};

export const RadioGroup = ({
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
}: RadioGroupFieldProps) => {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(value);

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  return (
    <BaseRadioGroup
      name={name}
      value={internalValue}
      required={required}
      onValueChange={(val) => {
        setInternalValue(val);
        onChange?.(val);
      }}
      disabled={disabled}
      style={style}
      className={cn(
        "app-radio-group",
        error && "ring-2 ring-red-400 p-2 rounded-md",
        className
      )}
    >
      {options.map((option, idx) => {
        const uniqueId = `radio-${name || 'group'}-${idx}-${option.value}`;
        const isSelected = internalValue === option.value;

        const handleSelect = () => {
          if (!disabled) {
            setInternalValue(option.value);
            onChange?.(option.value);
          }
        };

        return (
          <div
            key={option.value}
            className={cn(
              "app-radio-option relative flex items-center space-x-3 p-3 rounded-md border transition-all cursor-pointer",
              isSelected 
                ? "bg-primary/5 border-primary shadow-sm" 
                : "bg-background border-border hover:bg-accent hover:text-accent-foreground",
              disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-inherit",
              optionClassName
            )}
            onClick={handleSelect}
          >
            <RadioGroupItem value={option.value} id={uniqueId} className="app-radio-item z-10 pointer-events-none" />
            <div className="app-radio-label z-10 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-full select-none">
              {option.label}
            </div>
          </div>
        );
      })}
    </BaseRadioGroup>
  );
};
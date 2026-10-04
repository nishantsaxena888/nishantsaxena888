"use client";

import * as React from "react";
import {
  Select as BaseSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
type Option = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  value?: string;
  onChange?: (value: string) => void;

  options: Option[];

  placeholder?: string;

  error?: string;

  className?: string;
  style?: React.CSSProperties;

  name?: string;

  disabled?: boolean;
  required?: boolean;
};

export const Select = ({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  className,
  style,
  disabled,
  required,
}: SelectFieldProps) => {
  return (
    <BaseSelect
      value={value}
      onValueChange={(val) => onChange?.(val)}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        style={style}
        className={cn(
          "h-11 w-full px-3 py-2 rounded-lg text-sm app-input",
          error && "border-red-400 bg-red-50 text-red-900 focus:ring-red-500/20",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </BaseSelect>
  );
};
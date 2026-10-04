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

interface DropdownProps {
  /** Array of items to display */
  data: any[];
  /** Key to use for the label (display text) */
  labelKey?: string;
  /** Key to use for the value (unique identifier) */
  valueKey?: string;
  /** Currently selected value (matches the valueKey property of the object) */
  value?: any;
  /** Callback fired when an item is selected */
  onChange?: (item: any) => void;
  /** Whether the onChange handler should return the entire object or just the value. Default is 'value' */
  returnType?: "object" | "value";
  /** Placeholder text */
  placeholder?: string;
  /** Optional error message */
  error?: string;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Input name */
  name?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required state */
  required?: boolean;
}

export const Dropdown = ({
  data = [],
  labelKey = "label",
  valueKey = "value",
  value,
  onChange,
  returnType = "value",
  placeholder = "Select an option",
  error,
  className,
  style,
  disabled,}: DropdownProps) => {

  const handleValueChange = (selectedVal: string) => {
    const selectedItem = data.find(
      (item) => String(item[valueKey]) === selectedVal
    );
    if (selectedItem) {
      onChange?.(returnType === "object" ? selectedItem : selectedItem[valueKey]);
    }
  };

  // Find current item to display the correct label
  const currentItem = data.find((item) => String(item[valueKey]) === String(value));
  const displayValue = currentItem ? String(currentItem[valueKey]) : undefined;

  return (
    <BaseSelect
      value={displayValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        style={style}
        className={cn(
          "app-input",
          error && "border-red-400 bg-red-50 text-red-900",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {data.map((item, index) => {
          const itemValue = String(item[valueKey]);
          const itemLabel = String(item[labelKey]);
          
          return (
            <SelectItem key={`${itemValue}-${index}`} value={itemValue}>
              {itemLabel}
            </SelectItem>
          );
        })}
      </SelectContent>
    </BaseSelect>
  );
};

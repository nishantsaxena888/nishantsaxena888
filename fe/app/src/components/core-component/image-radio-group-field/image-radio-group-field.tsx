"use client";

import { Input } from "@/components/ui/input";
import * as React from "react";
import { cn } from "@/lib/utils";
import { assetUrl } from "@/platform/asset";

type Option = {
  label: string;
  value: string;
  image: string;
};

type ImageRadioGroupFieldProps = {
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
  themeName?: string;
};

export const ImageRadioGroupField = ({
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
}: ImageRadioGroupFieldProps) => {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    value,
  );

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== undefined && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value);
  }

  const handleChange = (val: string) => {
    setInternalValue(val);
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <div
      style={style}
      className={cn(
        "app-image-radio-container",
        error && "ring-2 ring-red-400 p-2 rounded-md",
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = internalValue === option.value;

        return (
          <label
            key={option.value}
            className={cn(
              "app-image-radio-option",
              isSelected
                ? "app-image-radio-selected"
                : "app-image-radio-unselected",
              disabled && "opacity-50 cursor-not-allowed",
              optionClassName,
            )}
          >
            {/* Hidden Radio */}
            <Input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              disabled={disabled}
              required={required}
              suppressHydrationWarning
              onChange={() => handleChange(option.value)}
              className="hidden"
            />

            {/* Image */}
            <img
              src={assetUrl(option.image)}
              alt={option.label}
              className="w-full h-24 object-cover rounded-md"
              width={100}
              height={96}
            />

            {/* Label */}
            <p className="mt-1 text-sm text-center">{option.label}</p>
          </label>
        );
      })}
    </div>
  );
};

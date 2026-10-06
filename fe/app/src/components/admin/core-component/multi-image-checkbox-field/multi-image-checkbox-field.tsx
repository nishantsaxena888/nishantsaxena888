"use client";

import { Input } from "@/components/third-party-shadcn/input";
import { Label } from "@/components/third-party-shadcn/label";
import * as React from "react";
import { cn } from "@/common/lib/utils";
import { assetUrl } from "@/platform/asset";

type Option = {
  label: string;
  value: string;
  image: string;
};

type MultiImageCheckboxFieldProps = {
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

export const MultiImageCheckboxField = ({
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
}: MultiImageCheckboxFieldProps) => {
  const [internalValue, setInternalValue] = React.useState<string[]>(
    value || [],
  );

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== undefined && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value);
  }

  const handleChange = (checked: boolean, val: string) => {
    const newValue = checked
      ? [...internalValue, val]
      : internalValue.filter((v) => v !== val);

    setInternalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div
      style={style}
      className={cn(
        "app-multi-image-container",
        error && "ring-2 ring-red-400 p-2 rounded-md",
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = internalValue.includes(option.value);

        return (
          <Label
            key={option.value}
            className={cn(
              "app-multi-image-option !flex-col !items-stretch !gap-2",
              isSelected
                ? "app-multi-image-selected"
                : "app-multi-image-unselected",
              disabled && "opacity-50 cursor-not-allowed",
              optionClassName,
            )}
          >
            {/* Hidden Checkbox */}
            <Input
              type="checkbox"
              name={name}
              checked={isSelected}
              disabled={disabled}
              required={required}
              suppressHydrationWarning
              onChange={(e) => handleChange(e.target.checked, option.value)}
              className="hidden"
            />

            {/* Image Container */}
            <div className="relative w-full overflow-hidden rounded-md group">
              <img
                src={assetUrl(option.image)}
                alt={option.label}
                className={cn(
                  "w-full h-28 object-cover transition-transform duration-300",
                  isSelected ? "scale-105" : "group-hover:scale-105",
                )}
                width={200}
                height={112}
              />

              {/* Overlay Checkmark */}
              {isSelected && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-all duration-300">
                  <div className="bg-white text-primary rounded-full p-1 shadow-md scale-in animate-in zoom-in duration-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Label */}
            <p
              className={cn(
                "text-sm font-medium text-center transition-colors",
                isSelected ? "text-primary" : "text-muted-foreground",
              )}
            >
              {option.label}
            </p>
          </Label>
        );
      })}
    </div>
  );
};

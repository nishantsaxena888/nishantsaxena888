"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
interface RangeSliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number[]) => void;
  label?: string;
  showLabels?: boolean;
  className?: string;
  disabled?: boolean;
}

export const RangeSlider = ({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  showLabels = true,
  className,
  disabled = false,
}: RangeSliderProps) => {
  const [internalValue, setInternalValue] = React.useState<number[] | undefined>(value || defaultValue);

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);
  const handleValueChange = (newValues: number[]) => {
    setInternalValue(newValues);
    onChange?.(newValues);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {label && (
        <div className="text-sm font-medium text-foreground mb-1">
          {label}
        </div>
      )}
      
      <Slider
        min={min}
        max={max}
        step={step}
        value={internalValue}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        className={cn(
          "py-4",
          // Base styling modifications
          "[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:rounded-full",
          "[&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:shadow-sm [&_[data-slot=slider-thumb]]:border-2",
          // Theme-specific overrides
          "[&_[data-slot=slider-track]]:app-slider-track",
          "[&_[data-slot=slider-range]]:app-slider-range",
          "[&_[data-slot=slider-thumb]]:app-slider-thumb"
        )}
      />

      {showLabels && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-500">
          <span>{Array.isArray(internalValue) ? internalValue[0] : (internalValue ?? min)}</span>
          {Array.isArray(internalValue) && internalValue.length > 1 && (
            <span>{internalValue[1]}</span>
          )}
        </div>
      )}
    </div>
  );
};

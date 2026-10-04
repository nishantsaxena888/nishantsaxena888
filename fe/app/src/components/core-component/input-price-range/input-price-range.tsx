"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
interface InputPriceRangeProps {
  value?: [number, number];
  defaultValue?: [number, number];
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: [number, number]) => void;
  className?: string;
  disabled?: boolean;
}

export const InputPriceRange = ({
  value,
  defaultValue = [1000, 5000],
  min = 0,
  max = 10000,
  step = 100,
  onChange,
  className,
  disabled = false,
}: InputPriceRangeProps) => {
  const [internalValue, setInternalValue] = React.useState<[number, number]>(value || defaultValue);
  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value);
  }

  const handleSliderChange = (newValues: number[]) => {
    const nextValue: [number, number] = [newValues[0], newValues[1]];
    setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minVal = parseInt(e.target.value.replace(/\D/g, "")) || 0;
    const nextValue: [number, number] = [Math.min(minVal, internalValue[1]), internalValue[1]];
    setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxVal = parseInt(e.target.value.replace(/\D/g, "")) || 0;
    const nextValue: [number, number] = [internalValue[0], Math.max(maxVal, internalValue[0])];
    setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 px-1">Min Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
            <Input
              type="text"
              value={internalValue[0]}
              onChange={handleMinInputChange}
              disabled={disabled}
              className={cn("app-slider-input", "pl-7 h-9 text-sm font-medium transition-all")}
            />
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 px-1">Max Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
            <Input
              type="text"
              value={internalValue[1]}
              onChange={handleMaxInputChange}
              disabled={disabled}
              className={cn("app-slider-input", "pl-7 h-9 text-sm font-medium transition-all")}
            />
          </div>
        </div>
      </div>

      <div className="px-2">
        <Slider
          min={min}
          max={max}
          step={step}
          value={internalValue}
          onValueChange={handleSliderChange}
          disabled={disabled}
          className={cn(
            "py-4",
            "[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:rounded-full",
            "[&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:shadow-sm [&_[data-slot=slider-thumb]]:border-2 transition-all",

            "[&_[data-slot=slider-track]]:app-slider-track",
            "[&_[data-slot=slider-range]]:app-slider-range",
            "[&_[data-slot=slider-thumb]]:app-slider-thumb"
          )}
        />
      </div>

      <div className="flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50/50 p-3 px-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider opacity-50">Minimum</span>
          <span>{formatCurrency(internalValue[0])}</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[9px] uppercase tracking-wider opacity-50">Maximum</span>
          <span>{formatCurrency(internalValue[1])}</span>
        </div>
      </div>
    </div>
  );
};

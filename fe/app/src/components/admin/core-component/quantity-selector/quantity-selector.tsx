"use client";

import * as React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
export type QuantitySelectorProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
};

export const QuantitySelector = ({
  value,
  defaultValue = 1,
  onChange,
  min = 1,
  max = Infinity,
  step = 1,
  disabled,
  className,
}: QuantitySelectorProps) => {
  const [internalValue, setInternalValue] = React.useState<string>(
    value !== undefined ? value.toString() : defaultValue.toString()
  );
  
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const appliedContainerTheme = "app-quantity-container";
  const appliedInputTheme = "app-quantity-input";
  const appliedButtonTheme = "app-quantity-button";

  // Sync internal state with controlled value prop
  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== undefined && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value.toString());
  }

  const updateValue = (nextVal: number) => {
    const clamped = Math.min(Math.max(nextVal, min), max);
    setInternalValue(clamped.toString());
    onChange?.(clamped);
    return clamped;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || !isNaN(Number(val))) {
      setInternalValue(val);
      const numericVal = Number(val);
      if (!isNaN(numericVal) && val !== "") {
        onChange?.(numericVal);
      }
    }
  };

  const handleBlur = () => {
    let numericVal = Number(internalValue);
    if (isNaN(numericVal) || internalValue === "") {
      numericVal = min;
    }
    updateValue(numericVal);
  };

  const valueRef = React.useRef(internalValue);
  React.useEffect(() => {
    valueRef.current = internalValue;
  }, [internalValue]);

  const increment = React.useCallback(() => {
    const current = Number(valueRef.current) || 0;
    const next = current + step;
    if (next <= max) {
      const clamped = Math.min(next, max);
      setInternalValue(clamped.toString());
      onChange?.(clamped);
    }
  }, [step, max, onChange]);

  const decrement = React.useCallback(() => {
    const current = Number(valueRef.current) || 0;
    const next = current - step;
    if (next >= min) {
      const clamped = Math.max(next, min);
      setInternalValue(clamped.toString());
      onChange?.(clamped);
    }
  }, [step, min, onChange]);

  const stopCounter = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startCounter = React.useCallback((action: () => void) => {
    if (disabled) return;
    action();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(action, 100);
    }, 500);
  }, [disabled]);

  const isDecrementDisabled = disabled || (value !== undefined ? value <= min : Number(internalValue) <= min);
  const isIncrementDisabled = disabled || (value !== undefined ? value >= max : Number(internalValue) >= max);

  return (
    <div className={cn(appliedContainerTheme, className, disabled && "opacity-50 cursor-not-allowed")}>
      <button suppressHydrationWarning
        type="button"
        onMouseDown={() => startCounter(decrement)}
        onMouseUp={stopCounter}
        onMouseLeave={stopCounter}
        disabled={isDecrementDisabled}
        className={cn(appliedButtonTheme, "border-r border-slate-200 dark:border-zinc-800")}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>

      <input suppressHydrationWarning
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(appliedInputTheme, "bg-transparent outline-none")}
      />

      <button suppressHydrationWarning
        type="button"
        onMouseDown={() => startCounter(increment)}
        onMouseUp={stopCounter}
        onMouseLeave={stopCounter}
        disabled={isIncrementDisabled}
        className={cn(appliedButtonTheme, "border-l border-slate-200 dark:border-zinc-800")}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

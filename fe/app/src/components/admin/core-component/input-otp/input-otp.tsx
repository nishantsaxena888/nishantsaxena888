"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/third-party-shadcn/input-otp";
type OtpFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
};

export const InputOTPField = ({
  value = "",
  onChange,
  length = 6,
  error,
  className,
  style,
  name,
  disabled,
  required,
}: OtpFieldProps) => {
  const id = React.useId();
  const [internalValue, setInternalValue] = React.useState(value);

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== undefined && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value);
  }

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <InputOTP
      id={id}
      name={name}
      maxLength={length}
      value={internalValue}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      style={style}
      className={cn("app-otp-container flex items-center", className)}
    >
      <InputOTPGroup className="gap-2">
        {Array.from({ length }).map((_, i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className={cn(
              "app-otp-slot flex items-center justify-center",
              error && "border-red-400 bg-red-50 text-red-900 focus-visible:ring-red-500/20"
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
};
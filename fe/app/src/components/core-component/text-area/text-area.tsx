"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TextAreaFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  onClick?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
};

export const TextAreaField = ({
  value,
  onChange,
  placeholder,
  error,
  className,
  style,
  name,
  disabled,
  required,
  rows = 4,
  onClick,
  onBlur,
}: TextAreaFieldProps) => {
  const [internalValue, setInternalValue] = React.useState(value || "");

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== undefined && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value);
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setInternalValue(newVal);
    onChange?.(newVal);
  };

  return (
    <Textarea
      id={name}
      name={name}
      value={internalValue}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      rows={rows}
      style={style}
      onChange={handleChange}
      onClick={onClick}
      onBlur={onBlur}
      className={cn(
        "w-full min-h-[100px] px-3 py-2 rounded-lg text-sm app-input",
        error && "border-red-400 bg-red-50 text-red-900 focus:ring-red-500/20",
        className
      )}
    />
  );
};
"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/third-party-shadcn/button";
import { Input } from "@/components/third-party-shadcn/input";
import { InputGroup } from "@/components/third-party-shadcn/input-group";
import { cn } from "@/lib/utils";
const DEFAULT_REQUIREMENTS = [
  { regex: /.{12,}/, text: "At least 12 characters" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  { regex: /[0-9]/, text: "At least 1 number" },
  {
    regex: /[!@#$%^&*()_+\-=\]{};':"\\|,.<>/?[]/,
    text: "At least 1 special character",
  },
];

type PasswordFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  showValidation?: boolean;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  requirements?: { regex: RegExp; text: string }[];
};

export const InputPassword = ({
  value: propValue,
  onChange,
  placeholder = "Enter password",
  error,
  showValidation = false,
  className,
  style,
  name,
  disabled,
  required,
  requirements = DEFAULT_REQUIREMENTS,
}: PasswordFieldProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(propValue || "");
  
  const value = propValue !== undefined ? propValue : internalValue;

  const handleChange = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
  };

  const strength = requirements.map((req) => ({
    met: req.regex.test(value),
    text: req.text,
  }));

  const strengthScore = strength.filter((req) => req.met).length;

  const getColor = (score: number) => {
    if (score === 0) return "bg-border";
    if (score <= 1) return "bg-destructive";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-amber-500";
    if (score === 4) return "bg-yellow-400";
    return "bg-green-500";
  };

  return (
    <div className="space-y-2" style={style}>
      <InputGroup
        className={cn(
          "h-11 w-full px-3 py-2 rounded-lg text-sm app-input",
          error && "border-red-400 bg-red-50 text-red-900 focus-within:border-red-500",
          className
        )}
      >
        <Input
          name={name}
          type={isVisible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onChange={(e) => handleChange(e.target.value)}
          className="bg-transparent border-0 focus-visible:ring-0 focus:ring-0 h-full font-medium pr-10"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible((prev) => !prev)}
          className="h-full px-3 hover:bg-transparent"
        >
          {isVisible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </Button>
      </InputGroup>

      {/* Validation */}
      {showValidation && (
        <>
          {/* Strength Bar */}
          <div className="flex h-1 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "flex-1 rounded-full",
                  i < strengthScore
                    ? getColor(strengthScore)
                    : "bg-border"
                )}
              />
            ))}
          </div>

          {/* Requirements */}
          <ul className="space-y-1">
            {strength.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                {req.met ? "✔️" : "✖️"}
                {req.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
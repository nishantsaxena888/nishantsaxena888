"use client";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
type PhoneFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
};

export const InputPhone = ({
  value,
  onChange,
  placeholder,
  error,
  className,
  style,
  name,
  disabled,
  required,
}: PhoneFieldProps) => {
  return (
    <PhoneInput
      id={name}
      name={name}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      style={style}
      onChange={(val) => onChange?.(val || "")}
      defaultCountry="IN"
      className={cn(
        "h-11 w-full rounded-lg app-input",
        error && "border-red-400 bg-red-50 text-red-900",
        "[&_input]:border-0 [&_input]:ring-0 [&_input]:bg-transparent [&_input]:h-full",
        "[&_button]:border-0 [&_button]:ring-0 [&_button]:bg-transparent [&_button]:h-full",
        className
      )}
    />
  );
};
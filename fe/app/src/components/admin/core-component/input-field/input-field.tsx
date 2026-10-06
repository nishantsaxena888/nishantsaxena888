import { Input } from "@/components/third-party-shadcn/input";
import { cn } from "@/lib/utils";

type InputFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  type?: string;
  id?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export const InputField = ({
  value,
  onChange,
  placeholder,
  error,
  className,
  style,
  name,
  type = "text",
  disabled,
  required,
  onClick,
  onBlur,
  onFocus,
}: InputFieldProps) => {

  return (
    <Input
      id={name}
      name={name}
      type={type}
      value={value || ""}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      style={style}
      onChange={(e) => onChange?.(e.target.value)}
      onClick={onClick}
      onBlur={onBlur}
      onFocus={onFocus}
      className={cn(
        "h-11 w-full px-3 py-2 rounded-lg text-sm app-input",
        error && "border-red-400 bg-red-50 text-red-900 focus:ring-red-500",
        className
      )}
    />
  );
};
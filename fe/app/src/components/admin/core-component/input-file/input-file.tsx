import * as React from "react";
import { UploadIcon } from "lucide-react";
import { cn } from "@/common/lib/utils";
type FileFieldProps = {
  value?: File | null;
  onChange?: (file: File | null) => void;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  config?: { allowedType?: string; [key: string]: any };
};

export const InputFile = ({
  value,
  onChange,
  error,
  className,
  style,
  name,
  disabled,
  required,
  config,
}: FileFieldProps) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div
      style={style}
      onClick={handleClick}
      className={cn(
        "w-full flex items-center justify-between gap-3 h-11 px-4 py-2 rounded-lg cursor-pointer app-input-file",
        error && "border-red-400 bg-red-50 text-red-900",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Hidden Input */}
      <input suppressHydrationWarning
        ref={inputRef}
        type="file"
        name={name}
        disabled={disabled}
        required={required}
        accept={config?.allowedType === "image" ? "image/*" : undefined}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          onChange?.(file);
        }}
      />

      {/* File Name */}
      <span className="text-sm truncate">
        {value?.name || "Upload file"}
      </span>

      {/* Icon */}
      <UploadIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
    </div>
  );
};
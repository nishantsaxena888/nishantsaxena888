import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface InlineSelectOption {
  value: string;
  label: string;
}

export interface SharedInlineSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: InlineSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SharedInlineSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  disabled = false,
}: SharedInlineSelectProps) {
  // Hybrid internal state for playground RenderEngine compatibility
  const [internalValue, setInternalValue] = useState<string | undefined>(value);

  // Sync prop changes to internal state
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleValueChange = (newVal: string) => {
    setInternalValue(newVal);
    onChange?.(newVal);
  };

  return (
    <Select value={internalValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={cn("app-inline-select-trigger border-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 h-8 px-2 w-auto", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      {/* 
        CRITICAL: We explicitly set position="popper" and a high z-index class 
        so this dropdown doesn't get clipped by table row overflow:hidden
      */}
      <SelectContent position="popper" className="app-inline-select-content min-w-[120px] z-50">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="app-inline-select-item">
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

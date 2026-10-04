"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StringArrayInputProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function StringArrayInput({
  value,
  onChange,
  placeholder = "Enter value...",
  className,
}: StringArrayInputProps) {
  // Use internal state for uncontrolled playground compatibility
  const [internalValue, setInternalValue] = React.useState<string[]>(value || []);

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (newVal: string[]) => {
    setInternalValue(newVal);
    onChange?.(newVal);
  };

  const handleAdd = () => {
    handleChange([...internalValue, ""]);
  };

  const handleRemove = (index: number) => {
    const newValue = [...internalValue];
    newValue.splice(index, 1);
    handleChange(newValue);
  };

  const handleItemChange = (index: number, val: string) => {
    const newValue = [...internalValue];
    newValue[index] = val;
    handleChange(newValue);
  };

  return (
    <div className={cn("w-full space-y-3 app-string-array-container", className)}>
      {internalValue.map((item, index) => (
        <div key={index} className="flex items-center gap-2 w-full app-string-array-row group">
          <Input
            value={item}
            onChange={(e) => handleItemChange(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-w-0 h-11 app-string-array-input"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleRemove(index)}
            className="shrink-0 h-10 w-10 p-0 app-string-array-delete"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        className="w-full h-11 border-dashed app-string-array-add"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}

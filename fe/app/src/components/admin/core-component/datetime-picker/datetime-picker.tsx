"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/third-party-shadcn/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/third-party-shadcn/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/third-party-shadcn/popover";
import { ScrollArea } from "@/components/third-party-shadcn/scroll-area";
import { Button } from "@/components/third-party-shadcn/button";
import { useTimePicker } from "../time-picker/hook/use-time-picker";

interface DateTimePickerProps {
  value?: string | Date;
  onChange?: (value: string) => void;
  minDate?: Date;
  maxDate?: Date;
  minTime?: string;
  maxTime?: string;
  format?: "12h" | "24h";
  withSeconds?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
}

export const DateTimePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  minTime,
  maxTime,
  format = "12h",
  withSeconds = false,
  placeholder = "Select date & time",
  error,
  className,
  style,
  name,
  disabled,
  required,}: DateTimePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const [internalError, _setInternalError] = React.useState<string | undefined>(error);

  const [internalValue, setInternalValue] = React.useState<string | Date | undefined>(value);

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== undefined && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value);
  }

  const currentDateTime = React.useMemo(() => {
    if (!internalValue) return new Date();
    const d = typeof internalValue === "string" ? new Date(internalValue) : internalValue;
    return isNaN(d.getTime()) ? new Date() : d;
  }, [internalValue]);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: withSeconds ? "2-digit" : undefined,
      hour12: format === "12h",
    });
  };

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const activeElements = document.querySelectorAll('[data-time-active="true"]');
        activeElements.forEach((el) => {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const updated = new Date(date);
    updated.setHours(currentDateTime.getHours());
    updated.setMinutes(currentDateTime.getMinutes());
    updated.setSeconds(currentDateTime.getSeconds());

    if (!isNaN(updated.getTime())) {
      const iso = updated.toISOString();
      setInternalValue(iso);
      onChange?.(iso);
    }
  };

  const timeValueString = React.useMemo(() => {
    const h = currentDateTime.getHours();
    const m = currentDateTime.getMinutes();
    const s = currentDateTime.getSeconds();
    
    if (format === "12h") {
        const hh = h % 12 || 12;
        const ampm = h >= 12 ? "PM" : "AM";
        return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}${withSeconds ? `:${String(s).padStart(2, '0')}` : ""} ${ampm}`;
    } else {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${withSeconds ? `:${String(s).padStart(2, '0')}` : ""}`;
    }
  }, [currentDateTime, format, withSeconds]);

  const {
    hh,
    mm,
    ss,
    ampm,
    handleTimeChange,
    isTimeInRange,
  } = useTimePicker({
    value: timeValueString,
    onChange: (t) => {
        const parts = t.trim().split(/[:\s]+/);
        let h = parseInt(parts[0] || "12");
        const m = parseInt(parts[1] || "00");
        const s = parseInt(parts[2] || "00");
        const p = parts[parts.length - 1]?.toUpperCase();

        if (p === "PM" && h < 12) h += 12;
        if (p === "AM" && h === 12) h = 0;

        const updated = new Date(currentDateTime);
        updated.setHours(h);
        updated.setMinutes(m);
        updated.setSeconds(s);
        
        if (!isNaN(updated.getTime())) {
            const iso = updated.toISOString();
            setInternalValue(iso);
            onChange?.(iso);
        }
    },
    minTime,
    maxTime,
    format,
    withSeconds,
  });

  return (
    <InputGroup style={style} className={cn("h-full shadow-sm focus-within:ring-0 focus-visible:ring-0", className)}>
      <InputGroupInput 
        name={name}
        value={internalValue ? formatDateTime(currentDateTime) : ""}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        readOnly
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "datetime-input",
          (error || internalError) && "border-red-400 bg-red-50 text-red-900 focus:border-red-500",
          disabled && "opacity-50 cursor-not-allowed",
          "cursor-pointer"
        )}
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled}
            >
              <CalendarIcon className="w-4 h-4" />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 shadow-2xl border-none overflow-hidden rounded-xl" 
            align="end" 
            alignOffset={-8}
            sideOffset={10}
          >
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x bg-[#ffffff]">
              <div className="p-3">
                <Calendar
                  mode="single"
                  selected={currentDateTime}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    if (minDate && date < minDate) return true;
                    if (maxDate && date > maxDate) return true;
                    return false;
                  }}
                  className="rounded-md border-none bg-white"
                />
              </div>
              <div className="flex h-[300px] divide-x border-t md:border-t-0 bg-white dark:bg-white">
                {/* Hours */}
                <ScrollArea className="w-16">
                  <div className="flex flex-col p-2 gap-1">
                    {Array.from({ length: format === "12h" ? 12 : 24 }).map((_, i) => {
                      const val = format === "12h" ? (i === 0 ? "12" : String(i).padStart(2, '0')) : String(i).padStart(2, '0');
                      const isActive = hh === val;
                      const isHourDisabled = format === "12h" 
                          ? !isTimeInRange(`${val}:00 ${ampm}`) && !isTimeInRange(`${val}:59 ${ampm}`)
                          : !isTimeInRange(`${val}:00`) && !isTimeInRange(`${val}:59`);
                      return (
                        <Button
                          key={i}
                          variant="ghost"
                          size="sm"
                          disabled={isHourDisabled}
                          data-time-active={isActive}
                          className={cn(
                            "justify-center font-mono h-8 transition-all rounded-md",
                            isActive && "bg-primary text-primary-foreground shadow-md font-bold scale-105",
                            isHourDisabled && "opacity-30"
                          )}
                          onClick={() => handleTimeChange(val, mm, ss, ampm)}
                        >
                          {val}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
                {/* Minutes */}
                <ScrollArea className="w-16">
                  <div className="flex flex-col p-2 gap-1">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const val = String(i).padStart(2, '0');
                      const isActive = mm === val;
                      const isMinDisabled = format === "12h" 
                          ? !isTimeInRange(`${hh}:${val} ${ampm}`)
                          : !isTimeInRange(`${hh}:${val}`);
                      return (
                        <Button
                          key={i}
                          variant="ghost"
                          size="sm"
                          disabled={isMinDisabled}
                          data-time-active={isActive}
                          className={cn(
                            "justify-center font-mono h-8 transition-all rounded-md",
                            isActive && "bg-primary text-primary-foreground shadow-md font-bold scale-105",
                            isMinDisabled && "opacity-30"
                          )}
                          onClick={() => handleTimeChange(hh, val, ss, ampm)}
                        >
                          {val}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
                {/* AM/PM */}
                {format === "12h" && (
                  <div className="flex flex-col p-2 gap-1 bg-white dark:bg-white w-16">
                    {["AM", "PM"].map((p) => {
                      const isDisabled = !isTimeInRange(`${hh}:${mm} ${p}`);
                      return (
                        <Button
                          key={p}
                          variant="ghost"
                          size="sm"
                          disabled={isDisabled}
                          data-time-active={ampm === p}
                          className={cn(
                            "px-2 font-bold h-8 text-xs transition-all rounded-md",
                            ampm === p && "bg-primary text-primary-foreground shadow-md scale-105",
                            isDisabled && "opacity-30"
                          )}
                          onClick={() => handleTimeChange(hh, mm, ss, p)}
                        >
                          {p}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 border-t bg-white dark:bg-white flex items-center justify-between gap-4">
               <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{timeValueString}</span>
               </div>
              <Button size="sm" className="h-8 rounded-lg px-4 font-semibold" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
};

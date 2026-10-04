"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useTimePicker } from "./hook/use-time-picker";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
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

export const TimePicker = ({
  value = "",
  onChange,
  minTime,
  maxTime,
  format = "12h",
  withSeconds = false,
  placeholder = "Select time",
  error,
  className,
  style,
  name,
  disabled,
  required,
}: TimePickerProps) => {

  const {
    open,
    setOpen,
    inputValue,
    setInputValue,
    internalError,
    handleTimeChange,
    handleBlur,
    isTimeInRange,
    hh,
    mm,
    ss,
    ampm,
  } = useTimePicker({
    value,
    onChange,
    minTime,
    maxTime,
    format,
    withSeconds,
    error,
  });

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

  return (
    <InputGroup style={style} className={cn("h-full shadow-sm focus-within:ring-0 focus-visible:ring-0", className)}>
      <InputGroupInput
        name={name}
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "w-full h-11 px-3 py-2 rounded-lg text-sm app-input",
          (error || internalError) &&
          "border-red-400 bg-red-50 text-red-900 focus:border-red-500",
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
              <Clock className="w-4 h-4" />
            </InputGroupButton>
          </PopoverTrigger>

          <PopoverContent 
            className="w-auto p-0 shadow-2xl border-none overflow-hidden rounded-xl bg-white dark:bg-zinc-950" 
            align="end" 
            alignOffset={-8}
            sideOffset={10}
          >
            <div className="flex h-[300px] divide-x divide-zinc-200 dark:divide-zinc-800">

              {/* Hours */}
              <ScrollArea className="w-20">
                <div className="flex flex-col p-2 gap-1">
                  {Array.from({
                    length: format === "12h" ? 12 : 24,
                  }).map((_, i) => {
                    const val =
                      format === "12h"
                        ? i === 0
                          ? "12"
                          : String(i).padStart(2, "0")
                        : String(i).padStart(2, "0");

                    const isActive = hh === val;

                    const isHourDisabled =
                      format === "12h"
                        ? !isTimeInRange(`${val}:00 ${ampm}`) &&
                        !isTimeInRange(`${val}:59 ${ampm}`)
                        : !isTimeInRange(`${val}:00`) &&
                        !isTimeInRange(`${val}:59`);

                    return (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        disabled={isHourDisabled}
                        data-time-active={isActive}
                        className={cn(
                          "justify-center font-mono transition-all rounded-md h-8",
                          isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary shadow-md font-bold scale-105",
                          isHourDisabled && "opacity-30 cursor-not-allowed"
                        )}
                        onClick={() =>
                          handleTimeChange(val, mm, ss, ampm)
                        }
                      >
                        {val}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Minutes */}
              <ScrollArea className="w-20">
                <div className="flex flex-col p-2 gap-1">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const val = String(i).padStart(2, "0");
                    const isActive = mm === val;

                    const isMinDisabled =
                      format === "12h"
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
                          "justify-center font-mono transition-all rounded-md h-8",
                          isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary shadow-md font-bold scale-105",
                          isMinDisabled && "opacity-30 cursor-not-allowed"
                        )}
                        onClick={() =>
                          handleTimeChange(hh, val, ss, ampm)
                        }
                      >
                        {val}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Seconds */}
              {withSeconds && (
                <ScrollArea className="w-20">
                  <div className="flex flex-col p-2 gap-1">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const val = String(i).padStart(2, "0");
                      const isActive = ss === val;

                      const isSecDisabled =
                        format === "12h"
                          ? !isTimeInRange(`${hh}:${mm}:${val} ${ampm}`)
                          : !isTimeInRange(`${hh}:${mm}:${val}`);

                      return (
                        <Button
                          key={i}
                          variant="ghost"
                          size="sm"
                          disabled={isSecDisabled}
                          data-time-active={isActive}
                          className={cn(
                            "justify-center font-mono transition-all rounded-md h-8",
                            isActive &&
                            "bg-primary text-primary-foreground hover:bg-primary shadow-md font-bold scale-105",
                            isSecDisabled &&
                            "opacity-30 cursor-not-allowed"
                          )}
                          onClick={() =>
                            handleTimeChange(hh, mm, val, ampm)
                          }
                        >
                          {val}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* AM/PM */}
              {format === "12h" && (
                <div className="flex flex-col p-2 gap-1 bg-slate-50 dark:bg-zinc-900/50 w-20">
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
                          "px-4 font-bold transition-all rounded-md h-8 text-xs",
                          ampm === p &&
                          "bg-primary text-primary-foreground hover:bg-primary shadow-md scale-105",
                          isDisabled && "opacity-30 cursor-not-allowed"
                        )}
                        onClick={() =>
                          handleTimeChange(hh, mm, ss, p)
                        }
                      >
                        {p}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-slate-50 dark:bg-zinc-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{inputValue}</span>
              </div>
              <Button size="sm" className="h-8 rounded-lg px-4 font-semibold" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
};
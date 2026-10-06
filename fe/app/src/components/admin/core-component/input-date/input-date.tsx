import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
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

function toDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatDate(date: Date | string | undefined) {
  const d = toDate(date);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  return date && !isNaN(date.getTime());
}

type DateFieldProps = {
  value?: Date | string;
  onChange?: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export const InputDate = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  error,
  className,
  style,
  name,
  disabled,
  required,
  onClick,
  onBlur,
}: DateFieldProps) => {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(() => toDate(value));
  const [month, setMonth] = React.useState<Date | undefined>(() => toDate(value));
  const [inputValue, setInputValue] = React.useState(formatDate(value));
  const [internalError, setInternalError] = React.useState<string | undefined>(error);

  const id = React.useId();

  const isWithinRange = (date: Date) => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    const d = toDate(value);
    setDate(d);
    setMonth(d);
    setInputValue(formatDate(value));
  }

  return (
    <InputGroup style={style} className={cn("h-11 w-full rounded-lg app-input", (error || internalError) && "border-red-400 bg-red-50 text-red-900 focus-within:border-red-500", className)}>
      <InputGroupInput
        id={id}
        name={name}
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onClick={(e) => {
          onClick?.(e);
          setOpen(true);
        }}
        onBlur={onBlur}
        onChange={(e) => {
          const newDate = new Date(e.target.value);
          setInputValue(e.target.value);

          if (isValidDate(newDate)) {
            if (isWithinRange(newDate)) {
              setDate(newDate);
              setMonth(newDate);
              setInternalError(undefined);
              onChange?.(newDate);
            } else {
              setInternalError("Date out of range");
            }
          } else {
            setInternalError(e.target.value ? "Invalid date" : undefined);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="bg-transparent border-0 focus-visible:ring-0 focus:ring-0 h-full font-medium"
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
              <CalendarIcon className="h-full" />
            </InputGroupButton>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              month={month}
              onMonthChange={setMonth}
              disabled={(d) => !isWithinRange(d)}
              onSelect={(d) => {
                if (d && isWithinRange(d)) {
                  setDate(d);
                  setInputValue(formatDate(d));
                  setInternalError(undefined);
                  onChange?.(d);
                  setOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
};
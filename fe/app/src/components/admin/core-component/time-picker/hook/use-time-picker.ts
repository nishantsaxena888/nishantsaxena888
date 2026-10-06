import * as React from "react";

type UseTimePickerProps = {
    value?: string;
    onChange?: (time: string) => void;
    minTime?: string;
    maxTime?: string;
    format?: "12h" | "24h";
    withSeconds?: boolean;
    error?: string;
};

export const useTimePicker = ({
    value = "",
    onChange,
    minTime,
    maxTime,
    format = "12h",
    withSeconds = false,
    error,
}: UseTimePickerProps) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);
    const [internalError, setInternalError] = React.useState<string | undefined>(error);

    const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
    if (value !== prevSyncedValue) {
      setPrevSyncedValue(value);
      setInputValue(value);
    }

    const timeToSeconds = (timeStr: string) => {
        if (!timeStr) return -1;

        const parts = timeStr.trim().split(/[:\s]+/);
        let h = parseInt(parts[0] || "0");
        const m = parseInt(parts[1] || "0");
        const s = parseInt(parts[2] || "0");

        const isPM = parts[parts.length - 1]?.toUpperCase() === "PM";
        const isAM = parts[parts.length - 1]?.toUpperCase() === "AM";

        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;

        return h * 3600 + m * 60 + s;
    };

    const parseTime = (timeStr: string) => {
        if (!timeStr) return { hh: "12", mm: "00", ss: "00", ampm: "AM" };

        const parts = timeStr.trim().split(/[:\s]+/);

        const hh = parts[0] || "12";
        const mm = parts[1] || "00";
        const ss = parts[2] || "00";
        let ampm = parts[parts.length - 1]?.toUpperCase() === "PM" ? "PM" : "AM";

        if (!timeStr.toUpperCase().includes("AM") && !timeStr.toUpperCase().includes("PM")) {
            const h = parseInt(hh);
            if (h >= 12) ampm = "PM";
        }

        return {
            hh: hh.padStart(2, "0"),
            mm: mm.padStart(2, "0"),
            ss: ss.padStart(2, "0"),
            ampm,
        };
    };

    const isTimeInRange = (timeStr: string) => {
        const t = timeToSeconds(timeStr);
        const min = minTime ? timeToSeconds(minTime) : -1;
        const max = maxTime ? timeToSeconds(maxTime) : Infinity;

        if (min !== -1 && t < min) return false;
        if (max !== Infinity && t > max) return false;

        return true;
    };

    const handleTimeChange = (hh: string, mm: string, ss: string, ampm: string) => {
        let finalTime = "";

        if (format === "12h") {
            finalTime = `${hh}:${mm}${withSeconds ? `:${ss}` : ""} ${ampm}`;
        } else {
            let h = parseInt(hh);
            if (ampm === "PM" && h < 12) h += 12;
            if (ampm === "AM" && h === 12) h = 0;

            const hh24 = String(h).padStart(2, "0");
            finalTime = `${hh24}:${mm}${withSeconds ? `:${ss}` : ""}`;
        }

        if (isTimeInRange(finalTime)) {
            setInternalError(undefined);
            setInputValue(finalTime);
            onChange?.(finalTime);
        } else {
            setInternalError("Out of range");
            setInputValue(finalTime);
        }
    };

    const handleBlur = () => {
        if (isTimeInRange(inputValue)) {
            setInternalError(undefined);
            onChange?.(inputValue);
        } else {
            setInternalError("Out of range");
        }
    };

    const parsed = parseTime(inputValue);

    return {
        open,
        setOpen,
        inputValue,
        setInputValue,
        internalError,
        handleTimeChange,
        handleBlur,
        isTimeInRange,
        ...parsed,
    };
};
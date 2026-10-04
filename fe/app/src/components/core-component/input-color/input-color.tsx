"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Pipette, ChevronDown } from "lucide-react";
import {
  hexToRgb,
  rgbToHsv,
  hsvToRgb,
  hsvToHex,
  validateHex,
  rgbToHsl,
  hslToRgb,
  type HSV,
  type RGB,
  type HSL,
} from "./utils/color-utils";

interface InputColorProps {
  value?: string;
  onChange?: (color: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  required?: boolean;
}

const PRESET_COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#FFC107",
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#E91E63",
  "#F44336",
  "#FF5722",
  "#FF9800",
  "#8BC34A",
  "#009688",
  "#00BCD4",
  "#03A9F4",
  "#3F51B5",
];

type ColorMode = "HEX" | "RGB" | "HSL";

// --- Refined Sub-components ---

const SVArea = ({
  hsv,
  onChange,
}: {
  hsv: HSV;
  onChange: (hsv: HSV) => void;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (clientX - left) / width));
    const v = Math.max(0, Math.min(1, 1 - (clientY - top) / height));
    onChange({ ...hsv, s, v });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl cursor-crosshair overflow-hidden border border-slate-200/60 shadow-inner group/sv"
      style={{
        backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1, a: 1 }),
        backgroundImage: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, transparent)
        `,
      }}
      onMouseDown={onMouseDown}
    >
      <div
        className="absolute w-4 h-4 rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-[transform,left,top] duration-75 ease-out"
        style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
      />
    </div>
  );
};

const CustomSlider = ({
  value,
  onChange,
  bgStyle,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  bgStyle: React.CSSProperties;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (clientX - left) / width)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    handleMove(e.clientX);
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-[14px] rounded-full cursor-pointer shadow-none border border-black/5",
        className,
      )}
      style={bgStyle}
      onMouseDown={onMouseDown}
    >
      <div
        className="absolute w-4 h-4 rounded-full bg-white border border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.2)] -translate-x-1/2 -translate-y-[1px] hover:scale-110 transition-transform duration-150"
        style={{ left: `${value * 100}%` }}
      />
    </div>
  );
};

// --- Main Component ---

export const InputColor = ({
  value = "#3B82F6",
  onChange,
  placeholder = "Select color",
  disabled,
  className,
  style,
  name,
  required,
}: InputColorProps) => {
  const [open, setOpen] = React.useState(false);
  const [internalHsv, setInternalHsv] = React.useState<HSV>({
    h: 0,
    s: 0,
    v: 0,
    a: 1,
  });
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [colorMode, setColorMode] = React.useState<ColorMode>("HEX");

  // Mirrors the old [value, isUpdating] effect deps: re-sync on either
  // change, but only when not mid-update and the hex is valid.
  const [prevColorValue, setPrevColorValue] = React.useState(value);
  const [prevUpdating, setPrevUpdating] = React.useState(isUpdating);
  if (value !== prevColorValue || isUpdating !== prevUpdating) {
    setPrevColorValue(value);
    setPrevUpdating(isUpdating);
    if (!isUpdating && validateHex(value)) {
      setInternalHsv(rgbToHsv(hexToRgb(value)));
    }
  }

  const updateColor = (newHsv: HSV) => {
    setInternalHsv(newHsv);
    setIsUpdating(true);
    onChange?.(hsvToHex(newHsv));
    setTimeout(() => setIsUpdating(false), 0);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (validateHex(val)) {
      updateColor(rgbToHsv(hexToRgb(val)));
    } else {
      onChange?.(val);
    }
  };

  const rgb = hsvToRgb(internalHsv);
  const hsl = rgbToHsl(rgb);

  const handleRgbInput = (part: keyof RGB, val: string) => {
    const n = Math.max(0, Math.min(255, parseInt(val) || 0));
    updateColor(rgbToHsv({ ...rgb, [part]: n }));
  };

  const handleHslInput = (part: keyof HSL, val: string) => {
    let n = parseInt(val) || 0;
    if (part === "h") n = Math.max(0, Math.min(360, n)) / 360;
    else n = Math.max(0, Math.min(100, n)) / 100;
    updateColor(rgbToHsv(hslToRgb({ ...hsl, [part]: n })));
  };

  const alphaPercentage = Math.round((internalHsv.a || 1) * 100);
  const opaqueColor = hsvToHex({ ...internalHsv, a: 1 });

  return (
    <InputGroup
      style={style}
      className={cn("h-11 w-full rounded-lg px-3 py-2 app-input", className)}
    >
      <InputGroupAddon align="inline-start" className="pl-3">
        <div
          className={cn(
            "w-6 h-6 rounded-md border border-black/10 shadow-sm transition-transform group-hover/input-group:scale-105",
            "bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+Y8CEWpWIwVCVOGiVOBg1AB8kXJsG9Y7eAAAAAElFTkSuQmCC')] bg-repeat",
          )}
        >
          <div
            className="w-full h-full rounded-[inherit]"
            style={{ backgroundColor: value }}
          />
        </div>
      </InputGroupAddon>

      <InputGroupInput
        name={name}
        value={value}
        onChange={handleHexInput}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="bg-transparent border-0 focus-visible:ring-0 focus:ring-0 h-full font-mono uppercase tracking-wide"
      />

      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-slate-400 hover:text-slate-600"
              disabled={disabled}
            >
              <Pipette className="w-4 h-4" />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-[300px] p-0 shadow-2xl border-none overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md"
            align="end"
            alignOffset={-8}
            sideOffset={12}
          >
            {/* Main Picker Area */}
            <div className="p-5 space-y-5 bg-white">
              <SVArea hsv={internalHsv} onChange={updateColor} />

              <div className="space-y-4 pt-1">
                <CustomSlider
                  value={internalHsv.h}
                  onChange={(h) => updateColor({ ...internalHsv, h })}
                  bgStyle={{
                    backgroundImage:
                      "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                  }}
                />
                <CustomSlider
                  value={internalHsv.a || 1}
                  onChange={(a) => updateColor({ ...internalHsv, a })}
                  className={
                    "bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+Y8CEWpWIwVCVOGiVOBg1AB8kXJsG9Y7eAAAAAElFTkSuQmCC')] bg-repeat"
                  }
                  bgStyle={{
                    backgroundImage: `linear-gradient(to right, transparent, ${opaqueColor})`,
                  }}
                />
              </div>

              {/* Advanced Readout Controls */}
              <div className="flex items-center gap-2 pt-1 h-9">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      suppressHydrationWarning
                      className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 dark:bg-white border border-slate-200 rounded-sm text-xs font-bold text-slate-600 transition-colors focus:outline-none min-w-[56px] justify-center"
                    >
                      <span className="text-primary">{colorMode}</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[80px]">
                    <DropdownMenuItem
                      className="text-xs font-bold"
                      onClick={() => setColorMode("HEX")}
                    >
                      HEX
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs font-bold"
                      onClick={() => setColorMode("RGB")}
                    >
                      RGB
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs font-bold"
                      onClick={() => setColorMode("HSL")}
                    >
                      HSL
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1 flex gap-1.5">
                  {colorMode === "HEX" && (
                    <Input
                      value={value.substring(0, 7).toUpperCase()}
                      onChange={handleHexInput}
                      className="h-9 text-xs font-mono text-center uppercase bg-white border-slate-200 dark:border-zinc-800  transition-all shadow-sm focus-visible:ring-0"
                    />
                  )}
                  {colorMode === "RGB" && (
                    <>
                      <Input
                        value={rgb.r}
                        onChange={(e) => handleRgbInput("r", e.target.value)}
                        className="h-9 text-[10px] p-0 text-center bg-white"
                        placeholder="R"
                      />
                      <Input
                        value={rgb.g}
                        onChange={(e) => handleRgbInput("g", e.target.value)}
                        className="h-9 text-[10px] p-0 text-center bg-white"
                        placeholder="G"
                      />
                      <Input
                        value={rgb.b}
                        onChange={(e) => handleRgbInput("b", e.target.value)}
                        className="h-9 text-[10px] p-0 text-center bg-white"
                        placeholder="B"
                      />
                    </>
                  )}
                  {colorMode === "HSL" && (
                    <>
                      <Input
                        value={Math.round(hsl.h * 360)}
                        onChange={(e) => handleHslInput("h", e.target.value)}
                        className="h-9 text-[10px] p-0 text-center bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 focus-visible:ring-0"
                        placeholder="H"
                      />
                      <Input
                        value={Math.round(hsl.s * 100)}
                        onChange={(e) => handleHslInput("s", e.target.value)}
                        className="h-9 text-[10px] p-0 text-center bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 focus-visible:ring-0"
                        placeholder="S"
                      />
                      <Input
                        value={Math.round(hsl.l * 100)}
                        onChange={(e) => handleHslInput("l", e.target.value)}
                        className="h-9 text-[10px] p-0 text-center bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 focus-visible:ring-0"
                        placeholder="L"
                      />
                    </>
                  )}
                </div>

                <div className="w-[42px] flex items-center justify-center h-9 bg-white border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-mono font-medium text-slate-500">
                  {alphaPercentage}%
                </div>
              </div>

              {/* Refined Presets Grid */}
              <div className="pt-2">
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((c) => {
                    const isActive = value.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        suppressHydrationWarning
                        key={c}
                        type="button"
                        className={cn(
                          "w-6 h-6 rounded-md border border-slate-200/60 dark:border-zinc-800/60 transition-all hover:scale-115 active:scale-95 shadow-sm",
                          isActive &&
                            "ring-2 ring-primary ring-offset-2 z-10 scale-110",
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => updateColor(rgbToHsv(hexToRgb(c)))}
                        title={c}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white flex items-center justify-between gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full border border-black/10 shadow-sm overflow-hidden flex-shrink-0",
                  "bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+Y8CEWpWIwVCVOGiVOBg1AB8kXJsG9Y7eAAAAAElFTkSuQmCC')] bg-repeat",
                )}
              >
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: value }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 text-xs font-medium text-slate-500 hover:text-black dark:text-zinc-400"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-6 text-xs font-bold rounded-lg shadow-lg active:scale-95 transition-all"
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
};

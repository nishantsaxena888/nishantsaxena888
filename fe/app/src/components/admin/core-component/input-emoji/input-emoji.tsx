"use client";

import * as React from "react";
import { cn } from "@/common/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/third-party-shadcn/popover";
import { Input } from "@/components/third-party-shadcn/input";
import { Button } from "@/components/third-party-shadcn/button";
import { ScrollArea } from "@/components/third-party-shadcn/scroll-area";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/third-party-shadcn/input-group";
import { EMOJI_DATA, type Emoji } from "./utils/emoji-data";
import { Smile, Search } from "lucide-react";

interface InputEmojiProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  required?: boolean;
}

export const InputEmoji = ({
  value = "",
  onChange,
  placeholder = "Enter text...",
  disabled,
  className,
  style,
  name,
  required,
}: InputEmojiProps) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState(
    EMOJI_DATA[0].name,
  );
  const [internalValue, setInternalValue] = React.useState(value);

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value);
  }

  const filteredEmojis = React.useMemo(() => {
    if (!searchTerm) {
      return EMOJI_DATA.find((c) => c.name === activeCategory)?.emojis || [];
    }
    const search = searchTerm.toLowerCase();
    const allEmojis: Emoji[] = EMOJI_DATA.flatMap((c) => c.emojis);
    return allEmojis.filter(
      (e) =>
        e.name.toLowerCase().includes(search) ||
        e.keywords.some((k) => k.toLowerCase().includes(search)),
    );
  }, [searchTerm, activeCategory]);

  const handleEmojiSelect = (emoji: string) => {
    const newValue = internalValue + emoji;
    setInternalValue(newValue);
    onChange?.(newValue);
    // Stay open for multiple selections
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <InputGroup
      style={style}
      className={cn("h-11 w-full rounded-lg app-input", className)}
    >
      <InputGroupInput
        name={name}
        value={internalValue}
        onChange={handleInputChange}
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
        className="bg-transparent border-0 focus-visible:ring-0 focus:ring-0 h-full font-medium"
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
              <Smile className="w-4 h-4" />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-0 shadow-2xl border-none overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <div className="flex flex-col h-[380px]">
              {/* Search */}
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Search emojis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-9 text-xs bg-slate-100/50 dark:bg-zinc-800/50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Categories */}
              {!searchTerm && (
                <div className="flex items-center gap-1.5 p-2 px-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                  {EMOJI_DATA.map((c) => (
                    <button
                      suppressHydrationWarning
                      key={c.name}
                      type="button"
                      onClick={() => setActiveCategory(c.name)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg transition-all text-lg active:scale-90",
                        activeCategory === c.name
                          ? "bg-white dark:bg-zinc-800 shadow-md ring-1 ring-black/5 dark:ring-white/10 scale-110 z-10"
                          : "hover:bg-white/80 dark:hover:bg-zinc-800/80 grayscale opacity-50 hover:opacity-100 hover:grayscale-0",
                      )}
                      title={c.name}
                    >
                      {c.icon}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid */}
              <ScrollArea className="flex-1 p-3 bg-white/30 dark:bg-zinc-950/30">
                <div className="grid grid-cols-6 gap-1">
                  {filteredEmojis.map((e, idx) => (
                    <button
                      suppressHydrationWarning
                      key={`${e.emoji}-${idx}`}
                      type="button"
                      onClick={() => handleEmojiSelect(e.emoji)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-zinc-800 shadow-none hover:shadow-md transition-all text-xl active:scale-90 hover:scale-110 group/emoji"
                      title={e.name}
                    >
                      <span className="transition-transform group-hover/emoji:rotate-12">
                        {e.emoji}
                      </span>
                    </button>
                  ))}
                  {filteredEmojis.length === 0 && (
                    <div className="col-span-6 py-12 text-center flex flex-col items-center gap-2">
                      <div className="text-3xl opacity-20 animate-bounce">
                        🔍
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                        No emojis match your search
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-3 px-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {searchTerm ? "Search Results" : activeCategory}
                </div>
                <Button
                  size="sm"
                  className="h-8 text-[11px] font-bold px-5 rounded-lg shadow-lg active:scale-95 transition-all"
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

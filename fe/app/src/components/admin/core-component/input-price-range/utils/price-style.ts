type StyleProps = {
  [key: string]: {
    track: string;
    range: string;
    thumb: string;
    input: string;
  };
};

export const priceStyles: StyleProps = {
  default: {
    track: "bg-secondary",
    range: "bg-primary",
    thumb: "border-primary bg-background ring-offset-background focus-visible:ring-ring",
    input: "rounded-lg border border-input",
  },
  lightspeed: {
    track: "bg-gray-100 dark:bg-zinc-800",
    range: "bg-[#E81C1C]",
    thumb: "border-[#E81C1C] bg-white ring-offset-white focus-visible:ring-[#E81C1C]/50",
    input: "rounded-lg border-gray-200 focus:border-[#E81C1C] focus:ring-[#E81C1C]/10",
  },
  clover: {
    track: "bg-[#344146]/10",
    range: "bg-[#228800]",
    thumb: "border-[#344146] bg-white ring-0 focus-visible:border-[#228800] rounded-none",
    input: "rounded-none border-2 border-[#344146] focus:border-[#228800]",
  },
  inventureAi: {
    track: "bg-gray-200 dark:bg-zinc-700/50",
    range: "bg-[#0D576C]",
    thumb: "border-[#0D576C] bg-white shadow-md focus-visible:ring-[#0D576C]/30 rounded-lg",
    input: "rounded-xl border-gray-300 focus:border-[#0D576C] focus:ring-4 focus:ring-[#0D576C]/20 shadow-sm",
  },
};

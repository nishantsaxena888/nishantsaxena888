type StyleProps = {
  [key: string]: {
    track: string;
    range: string;
    thumb: string;
  };
};

export const sliderStyles: StyleProps = {
  default: {
    track: "bg-secondary",
    range: "bg-primary",
    thumb: "border-primary bg-background ring-offset-background focus-visible:ring-ring",
  },
  lightspeed: {
    track: "bg-gray-100 dark:bg-zinc-800",
    range: "bg-[#E81C1C]",
    thumb: "border-[#E81C1C] bg-white ring-offset-white focus-visible:ring-[#E81C1C]/50",
  },
  clover: {
    track: "bg-[#344146]/10",
    range: "bg-[#228800]",
    thumb: "border-[#344146] bg-white ring-0 focus-visible:border-[#228800] rounded-none",
  },
  inventureAi: {
    track: "bg-gray-200 dark:bg-zinc-700/50",
    range: "bg-[#0D576C]",
    thumb: "border-[#0D576C] bg-white shadow-md focus-visible:ring-[#0D576C]/30 rounded-lg",
  },
};

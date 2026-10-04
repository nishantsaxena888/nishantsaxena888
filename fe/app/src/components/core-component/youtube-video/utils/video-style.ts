type StyleProps = {
  [key: string]: {
    container: string;
    playButton: string;
    overlay: string;
  };
};

export const videoStyles: StyleProps = {
  default: {
    container: "rounded-lg border border-slate-200 overflow-hidden shadow-sm",
    playButton: "bg-primary text-white shadow-lg",
    overlay: "bg-black/20 hover:bg-black/30 transition-colors",
  },
  lightspeed: {
    container: "rounded-xl border border-gray-200 overflow-hidden shadow-md",
    playButton: "bg-[#E81C1C] text-white shadow-[#E81C1C]/30",
    overlay: "bg-black/10 hover:bg-black/20",
  },
  clover: {
    container: "rounded-none border-2 border-[#344146] overflow-hidden",
    playButton: "bg-[#228800] text-white rounded-none",
    overlay: "bg-[#344146]/5 hover:bg-[#344146]/10",
  },
  inventureAi: {
    container: "rounded-2xl border border-gray-300 overflow-hidden bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-xl",
    playButton: "bg-[#0D576C] text-white shadow-[#0D576C]/40",
    overlay: "bg-transparent hover:bg-white/10",
  },
};

type StyleProps = {
  [key: string]: {
    container: string;
    option: string;
    item: string;
    label: string;
  };
};

export const radioGroupStyles: StyleProps = {
  default: {
    container: "flex flex-col gap-2 transition-all duration-200",
    option: "flex items-center gap-2 cursor-pointer",
    item: "",
    label: "text-sm",
  },
  
  lightspeed: {
    container: "flex flex-col gap-3",
    option: "flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-all cursor-pointer",
    item: "border-2 border-gray-200 text-[#E81C1C] focus-visible:ring-[#E81C1C]",
    label: "text-[13px] font-semibold text-[#191513]",
  },
  
  clover: {
    container: "flex flex-col gap-0 border-t border-l border-[#344146]",
    option: "flex items-center gap-3 p-3 border-r border-b border-[#344146] bg-white hover:bg-slate-50 cursor-pointer",
    item: "border-2 border-[#344146] text-[#228800] focus-visible:ring-0",
    label: "text-sm font-bold text-[#344146] uppercase tracking-wide",
  },
  
  inventureAi: {
    container: "flex flex-col gap-2.5",
    option: "flex items-center gap-3 p-3.5 rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-sm hover:border-[#0D576C]/30 hover:bg-white transition-all cursor-pointer",
    item: "border border-gray-300 text-[#0D576C] focus-visible:ring-[#0D576C]/20 shadow-sm",
    label: "text-sm font-medium text-gray-700 dark:text-gray-300",
  },
};

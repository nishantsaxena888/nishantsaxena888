type StyleProps = {
  [key: string]: {
    container: string;
    option: string;
    checkbox: string;
    label: string;
  };
};

export const multiCheckboxStyles: StyleProps = {
  default: {
    container: "grid grid-cols-2 md:grid-cols-4 gap-4 p-2 transition-all duration-200",
    option: "flex items-center gap-2 cursor-pointer",
    checkbox: "h-4 w-4 rounded border-gray-300",
    label: "text-sm",
  },
  
  lightspeed: {
    container: "grid grid-cols-1 sm:grid-cols-2 gap-3 p-1",
    option: "flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-all cursor-pointer",
    checkbox: "h-5 w-5 rounded border-2 border-gray-200 text-[#E81C1C] focus:ring-[#E81C1C]",
    label: "text-[13px] font-semibold text-[#191513]",
  },
  
  clover: {
    container: "flex flex-col gap-0 border-t border-l border-[#344146]",
    option: "flex items-center gap-3 p-3 border-r border-b border-[#344146] bg-white hover:bg-slate-50 cursor-pointer",
    checkbox: "h-5 w-5 rounded-none border-2 border-[#344146] text-[#228800] focus:ring-0",
    label: "text-sm font-bold text-[#344146] uppercase tracking-wide",
  },
  
  inventureAi: {
    container: "grid grid-cols-1 gap-2.5",
    option: "flex items-center gap-3 p-3.5 rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-sm hover:border-[#0D576C]/30 hover:bg-white transition-all cursor-pointer",
    checkbox: "h-4.5 w-4.5 rounded-lg border border-gray-300 text-[#0D576C] focus:ring-[#0D576C]/20 shadow-sm",
    label: "text-sm font-medium text-gray-700 dark:text-gray-300",
  },
};

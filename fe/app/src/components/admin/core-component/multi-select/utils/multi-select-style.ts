type StyleProps = {
  [key: string]: string;
};

export const multiSelectStyles: StyleProps = {
  default: "w-full transition-all duration-200 border-slate-200 bg-slate-50 focus-within:border-indigo-500",
  
  lightspeed: "h-auto min-h-[44px] px-3 py-1.5 rounded-lg border-2 border-gray-200 bg-white dark:bg-zinc-900/40 focus-within:border-[#E81C1C] focus-within:ring-4 focus-within:ring-[#E81C1C]/10 transition-all",
  
  clover: "h-auto min-h-[44px] px-3 py-1.5 rounded-none border-2 border-[#344146] bg-white focus-within:border-[#228800] focus-within:ring-0",
  
  inventureAi: "h-auto min-h-[44px] px-3 py-1.5 rounded-xl border border-gray-300 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm focus-within:border-[#0D576C] focus-within:ring-4 focus-within:ring-[#0D576C]/20",
};

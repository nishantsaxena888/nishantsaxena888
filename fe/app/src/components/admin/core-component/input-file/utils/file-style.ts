type StyleProps = {
  [key: string]: string;
};

export const fileStyles: StyleProps = {
  default: "w-full flex items-center justify-between gap-3 px-4 py-2 rounded-md border cursor-pointer transition-all duration-200 border-slate-200 bg-slate-50 hover:bg-white",
  
  lightspeed: "w-full flex items-center justify-between gap-3 h-11 px-4 py-2 rounded-lg border-gray-200 bg-white dark:bg-zinc-900/40 cursor-pointer transition-all duration-200 hover:border-[#E81C1C] hover:ring-4 hover:ring-[#E81C1C]/10",
  
  clover: "w-full flex items-center justify-between gap-3 h-11 px-4 py-2 rounded-none border-2 border-[#344146] bg-white cursor-pointer transition-all duration-200 hover:border-[#228800] hover:bg-slate-50",
  
  inventureAi: "w-full flex items-center justify-between gap-3 h-11 px-4 py-2 rounded-xl border border-gray-300 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:border-[#0D576C] hover:shadow-lg",
};

type StyleProps = {
  [key: string]: string;
};

export const dynamicSelectStyles: StyleProps = {
  default: "h-11 w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm transition-all duration-200 focus:border-indigo-500",
  lightspeed: "w-full h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900/40 text-sm focus:border-[#E81C1C] focus:ring-4 focus:ring-[#E81C1C]/10 transition-all",
  
  clover: "w-full h-11 rounded-none border-2 border-[#344146] dark:border-gray-700 bg-white dark:bg-zinc-900/40 text-sm focus:border-[#228800] focus:ring-0 transition-all",
  
  inventureAi: "w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm text-sm shadow-sm transition-all focus:border-[#0D576C] focus:ring-4 focus:ring-[#0D576C]/20 hover:border-gray-400",
};

type StyleProps = {
  [key: string]: string;
};

export const selectStyles: StyleProps = {
  default: "h-11 w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent dark:bg-zinc-900/50 px-3 py-2 text-sm transition-all outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 disabled:opacity-50",
  
  lightspeed: "w-full h-11 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900/40 text-sm focus:border-[#E81C1C] focus:ring-4 focus:ring-[#E81C1C]/10 transition-all",
  
  clover: "w-full h-11 px-3 py-2 rounded-none border-2 border-[#344146] dark:border-gray-700 bg-white dark:bg-zinc-900/40 text-sm focus:border-[#228800] focus:ring-0 transition-all",
  
  inventureAi: "w-full h-11 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm text-sm shadow-sm transition-all focus:border-[#0D576C] focus:ring-4 focus:ring-[#0D576C]/20 hover:border-gray-400",
};

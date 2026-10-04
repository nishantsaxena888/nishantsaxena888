type StyleProps = {
  [key: string]: string;
};

export const phoneStyles: StyleProps = {
  default: "h-11 w-full min-w-0 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm transition-all outline-none focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/5 disabled:opacity-50",
  
  lightspeed: "h-11 rounded-lg border-gray-200 bg-white dark:bg-zinc-900/40 text-sm focus-within:border-[#E81C1C] focus-within:ring-4 focus-within:ring-[#E81C1C]/10 transition-all",
  
  clover: "h-11 rounded-none border-2 border-[#344146] bg-white text-sm focus-within:border-[#228800] focus-within:ring-0 transition-all",
  
  inventureAi: "h-11 rounded-xl border border-gray-300 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm transition-all focus-within:border-[#0D576C] focus-within:ring-4 focus-within:ring-[#0D576C]/20",
};

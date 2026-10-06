type StyleProps = {
  [key: string]: string;
};

export const dropdownStyles: StyleProps = {
  default: "w-full transition-all duration-200 border-slate-200 bg-slate-50 focus:border-indigo-500",
  
  lightspeed: "w-full h-11 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white dark:bg-zinc-900/40 text-sm focus:border-[#E81C1C] focus:ring-4 focus:ring-[#E81C1C]/10 transition-all",
  
  clover: "w-full h-11 px-3 py-2 rounded-none border-2 border-[#344146] bg-white text-sm focus:border-[#228800] focus:ring-0 transition-all",
  
  inventureAi: "w-full h-11 px-3 py-2 rounded-xl border border-gray-300 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm text-sm shadow-sm transition-all focus:border-[#0D576C] focus:ring-4 focus:ring-[#0D576C]/20 hover:border-gray-400",
};

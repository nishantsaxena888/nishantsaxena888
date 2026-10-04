type StyleProps = {
  [key: string]: string;
};

export const iframeStyles: StyleProps = {
  default: "border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden",
  
  lightspeed: "border border-gray-200 rounded-xl shadow-md bg-white dark:bg-zinc-900/40 transition-all duration-300",
  
  clover: "border-2 border-[#344146] rounded-none shadow-none bg-white",
  
  inventureAi: "border border-gray-300 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out",
};

export const loaderStyles: StyleProps = {
  default: "bg-slate-100 animate-pulse",
  lightspeed: "bg-gray-100 dark:bg-zinc-800 animate-pulse",
  clover: "bg-[#344146]/5 animate-pulse",
  inventureAi: "bg-gray-200/50 dark:bg-zinc-800/50 animate-pulse",
};

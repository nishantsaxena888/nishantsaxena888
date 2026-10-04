type StyleProps = {
  [key: string]: string;
}

export const inputStyles: StyleProps = {
  default: "h-11 w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent dark:bg-zinc-900/50 px-3 py-2 text-sm transition-all outline-none placeholder:text-muted-foreground/50 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 disabled:opacity-50",
  lightspeed: "h-11 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900/40 text-sm transition-all duration-200 focus:outline-none focus:border-[#E81C1C] focus:ring-4 focus:ring-[#E81C1C]/10 placeholder:text-gray-400",
  clover: "h-11 w-full px-3 py-2 rounded-none border-2 border-[#344146] dark:border-gray-700 bg-white dark:bg-zinc-900/40 text-sm transition-all duration-200 focus:outline-none focus:border-[#228800] focus:ring-0 placeholder:text-gray-400",
  inventureAi: `
    w-full h-11 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700
    bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm
    text-sm text-gray-900 dark:text-gray-100
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    shadow-sm transition-all duration-200 ease-in-out
    focus:outline-none focus:border-[#0D576C] focus:ring-4 focus:ring-[#0D576C]/20
    hover:border-gray-400 dark:hover:border-gray-600
    disabled:opacity-50 disabled:cursor-not-allowed
    aria-invalid:border-red-500 aria-invalid:ring-4 aria-invalid:ring-red-500/20
  `
};
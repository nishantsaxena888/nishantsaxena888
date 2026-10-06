type StyleProps = {
  [key: string]: string;
}

export const inputStyles: StyleProps = {
  default: "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  lightspeed: "h-11 w-full px-3 py-2 rounded-lg border border-gray-200 bg-white dark:bg-zinc-900/40 text-sm transition-all duration-200 focus:outline-none focus:border-[#E81C1C] focus:ring-4 focus:ring-[#E81C1C]/10 placeholder:text-gray-400",
  clover: "h-11 w-full px-3 py-2 rounded-none border-2 border-[#344146] bg-white dark:bg-zinc-900/40 text-sm transition-all duration-200 focus:outline-none focus:border-[#228800] focus:ring-0 placeholder:text-gray-400",
  inventureAi: `
    w-full h-11 px-3 py-2 rounded-xl border border-gray-300
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
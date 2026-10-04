type StyleProps = {
  [key: string]: string;
}

export const containerStyles: StyleProps = {
  default: "inline-flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
  lightspeed: "inline-flex h-11 items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-zinc-900/40 transition-all focus-within:border-[#E81C1C] focus-within:ring-4 focus-within:ring-[#E81C1C]/10",
  clover: "inline-flex h-11 items-stretch overflow-hidden rounded-none border-2 border-[#344146] bg-white dark:bg-zinc-900/40 transition-all focus-within:border-[#228800]",
  inventureAi: "inline-flex h-11 items-stretch overflow-hidden rounded-xl border border-gray-300 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm transition-all focus-within:border-[#0D576C] focus-within:ring-4 focus-within:ring-[#0D576C]/20"
};

export const inputStyles: StyleProps = {
  default: "w-12 border-0 bg-transparent p-0 text-center text-sm font-medium focus:ring-0",
  lightspeed: "w-14 border-0 bg-transparent p-0 text-center text-sm font-medium focus:ring-0",
  clover: "w-14 border-0 bg-transparent p-0 text-center text-sm font-bold focus:ring-0",
  inventureAi: "w-14 border-0 bg-transparent p-0 text-center text-sm font-semibold focus:ring-0"
};

export const buttonStyles: StyleProps = {
  default: "flex w-9 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors",
  lightspeed: "flex w-10 items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-[#E81C1C] disabled:opacity-30 transition-colors",
  clover: "flex w-10 items-center justify-center text-[#344146] dark:text-gray-300 hover:bg-[#344146] hover:text-white disabled:opacity-30 transition-colors border-0",
  inventureAi: "flex w-10 items-center justify-center text-[#0D576C] dark:text-gray-300 hover:bg-[#0D576C]/5 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
};

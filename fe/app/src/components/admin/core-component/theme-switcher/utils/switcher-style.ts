type StyleProps = {
  [key: string]: string;
};

export const switcherStyles: StyleProps = {
  default: "gap-2 border-dashed",

  lightspeed: "gap-2 border-2 border-[#E81C1C] text-[#E81C1C] hover:bg-[#E81C1C]/5 rounded-lg",

  clover: "gap-2 border-2 border-[#344146] bg-[#228800] text-white hover:bg-[#228800]/90 rounded-none font-bold dark:text-[#141414]",

  inventureAi: "gap-2 border border-gray-300 bg-white/50 backdrop-blur-sm rounded-xl text-[#0D576C] font-semibold shadow-sm hover:shadow-md transition-all",
};

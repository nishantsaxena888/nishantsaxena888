type StyleProps = {
  [key: string]: {
    container: string;
    slot: string;
  };
};

export const otpStyles: StyleProps = {
  default: {
    container: "transition-all duration-200",
    slot: "",
  },
  
  lightspeed: {
    container: "gap-2",
    slot: "h-12 w-10 border-2 border-gray-200 rounded-lg focus-visible:border-[#E81C1C] focus-visible:ring-4 focus-visible:ring-[#E81C1C]/10 text-lg font-bold",
  },
  
  clover: {
    container: "gap-0",
    slot: "h-12 w-10 border-2 border-[#344146] rounded-none focus-visible:border-[#228800] focus-visible:ring-0 text-lg font-black",
  },
  
  inventureAi: {
    container: "gap-3",
    slot: "h-12 w-12 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus-visible:border-[#0D576C] focus-visible:ring-4 focus-visible:ring-[#0D576C]/20 text-lg font-semibold shadow-sm",
  },
};

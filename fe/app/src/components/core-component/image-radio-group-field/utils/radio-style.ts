type StyleProps = {
  [key: string]: {
    container: string;
    option: string;
    selected: string;
    unselected: string;
  };
};

export const radioStyles: StyleProps = {
  default: {
    container: "grid grid-cols-2 gap-3",
    option: "relative cursor-pointer rounded-lg border p-2 transition-all",
    selected: "border-primary ring-2 ring-primary",
    unselected: "border-slate-200",
  },
  
  lightspeed: {
    container: "grid grid-cols-2 gap-4",
    option: "relative cursor-pointer rounded-lg border-2 p-1.5 transition-all duration-300",
    selected: "border-[#E81C1C] bg-[#E81C1C]/5 shadow-md scale-[1.02]",
    unselected: "border-gray-100 bg-white hover:border-gray-200",
  },
  
  clover: {
    container: "grid grid-cols-2 gap-2",
    option: "relative cursor-pointer rounded-none border-t-2 border-b-2 border-x-2 p-3 transition-all",
    selected: "border-[#228800] bg-white translate-y-[-2px] shadow-[4px_4px_0px_0px_#344146]",
    unselected: "border-[#344146] bg-slate-50 opacity-80",
  },
  
  inventureAi: {
    container: "grid grid-cols-2 gap-4",
    option: "relative cursor-pointer rounded-2xl border p-2.5 transition-all duration-500 backdrop-blur-sm",
    selected: "border-[#0D576C] bg-white ring-4 ring-[#0D576C]/10 shadow-lg",
    unselected: "border-gray-200 bg-white/50 hover:border-gray-300",
  },
};

type StyleProps = {
  [key: string]: string;
};

export const checkboxStyles: StyleProps = {
  default: "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
  
  lightspeed: "h-5 w-5 rounded border-2 border-gray-200 text-[#E81C1C] focus:ring-[#E81C1C] transition-all duration-200 cursor-pointer",
  
  clover: "h-5 w-5 rounded-none border-2 border-[#344146] text-[#228800] focus:ring-0 accent-[#228800] cursor-pointer",
  
  inventureAi: "h-4.5 w-4.5 rounded-lg border border-gray-300 text-[#0D576C] focus:ring-[#0D576C]/20 shadow-sm backdrop-blur-sm",
};

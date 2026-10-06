type StyleProps = {
  [key: string]: string;
};

export const switchStyles: StyleProps = {
  default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  
  lightspeed: "data-[state=checked]:bg-[#E81C1C] data-[state=unchecked]:bg-gray-200 border-2 border-transparent transition-colors duration-300",
  
  clover: "data-[state=checked]:bg-[#228800] data-[state=unchecked]:bg-[#344146] rounded-none scale-110",
  
  inventureAi: "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#0D576C] data-[state=checked]:to-[#0A4C7A] data-[state=unchecked]:bg-gray-200/50 backdrop-blur-sm shadow-inner",
};

type StyleProps = {
  [key: string]: string;
};

export const buttonStyles: StyleProps = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",

  lightspeed: `
    bg-[#E81C1C] text-white rounded-lg shadow-lg
    hover:bg-[#191513] hover:shadow-[#E81C1C]/20
    active:scale-[0.98] transition-all duration-300
  `,

  clover: `
    bg-[#228800] text-white rounded-none border-b-4 border-[#344146]
    hover:bg-[#344146] hover:border-[#228800]
    active:translate-y-[2px] active:border-b-2
    transition-all duration-200
  `,

  inventureAi: `
    bg-gradient-to-br from-[#0D576C] to-[#0A4C7A] text-white rounded-2xl
    border border-white/20 shadow-xl
    hover:from-[#0A4C7A] hover:to-[#0D576C] hover:shadow-[#0D576C]/40
    active:scale-95 transition-all duration-300
  `,
};

type StyleProps = {
  [key: string]: string;
};

export const cardStyles: StyleProps = {
  default: `
    w-full rounded-xl
    border border-[#e5e7eb]
    bg-[#ffffff]
    shadow-sm
  `,

  minimal: `
    w-full rounded-md
    border border-[#e5e7eb]
    bg-transparent
  `,

  elevated: `
    w-full rounded-xl
    border border-[#e5e7eb]
    bg-[#ffffff]
    shadow-lg
  `,

  inventureAi: `
    w-full rounded-2xl
    border border-[#e5e7eb]
    bg-[#ffffff]

    shadow-md
    transition-all duration-200

    hover:shadow-lg
  `,

  lightspeed: `
    w-full rounded-lg
    border-2 border-[#f3f4f6]
    bg-[#ffffff]

    shadow-xl
    transition-all

    hover:shadow-2xl
    hover:border-[#E81C1C]/20
  `,

  clover: `
    w-full rounded-none
    border-2 border-[#344146]
    bg-[#ffffff]

    shadow-[4px_4px_0px_0px_#344146]
    transition-all

    hover:translate-y-[-2px]
    hover:translate-x-[-2px]
    hover:shadow-[6px_6px_0px_0px_#344146]
  `,
};
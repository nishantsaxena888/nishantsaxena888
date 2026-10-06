type StyleProps = {
  [key: string]: string;
};

export const containerStyles: StyleProps = {
  default: "space-y-4",
  lightspeed: "space-y-5",
  clover: "space-y-4",
  inventureAi: "space-y-6",
};

export const labelStyles: StyleProps = {
  default: `
    text-sm font-medium text-[#334155]
  `,

  lightspeed: `
    text-xs font-bold uppercase tracking-wider
    text-[#6b7280]
  `,

  clover: `
    text-sm font-medium text-[#344146]
  `,

  inventureAi: `
    text-sm font-semibold text-[#111827]
  `,
};
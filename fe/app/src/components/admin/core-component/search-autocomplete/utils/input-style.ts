type StyleProps = {
  [key: string]: string;
};

export const inputStyles: StyleProps = {
  default: `
    h-10 w-full min-w-0 rounded-lg
    border border-input
    bg-background

    px-3 py-2 text-sm text-foreground
    placeholder:text-muted-foreground

    transition-all duration-200
    outline-none

    focus-visible:border-ring
    focus-visible:ring-2 focus-visible:ring-ring/50

    disabled:pointer-events-none
    disabled:cursor-not-allowed
    disabled:bg-muted
    disabled:opacity-50
  `,

  lightspeed: `
    h-11 w-full px-3 py-2 rounded-lg
    border border-[#e5e7eb]
    bg-[#ffffff]

    text-sm text-[#111827]
    placeholder:text-[#9ca3af]

    transition-all duration-200
    focus:outline-none

    focus:border-[#E81C1C]
    focus:ring-4 focus:ring-[#E81C1C]/10
  `,

  clover: `
    h-11 w-full px-3 py-2 rounded-none
    border-2 border-[#344146]
    bg-[#ffffff]

    text-sm text-[#27272a]
    placeholder:text-[#a1a1aa]

    transition-all duration-200

    focus:outline-none
    focus:border-[#228800]
    focus:ring-0
  `,

  inventureAi: `
    w-full h-11 px-3 py-2 rounded-xl
    border border-[#d1d5db]
    bg-[#ffffff]

    text-sm text-[#111827]
    placeholder:text-[#9ca3af]

    shadow-sm
    transition-all duration-200

    focus:outline-none
    focus:border-[#0D576C]
    focus:ring-4 focus:ring-[#0D576C]/20

    hover:border-[#9ca3af]

    disabled:opacity-50
    disabled:cursor-not-allowed
  `
};

export const listStyles: StyleProps = {
  default: `
    bg-popover
    text-popover-foreground
    border border-border
    shadow-md
    rounded-lg
  `,

  lightspeed: `
    bg-[#ffffff]
    border border-[#e5e7eb]
    shadow-xl
    rounded-lg
    overflow-hidden
  `,

  clover: `
    bg-[#ffffff]
    border-2 border-[#344146]
    shadow-none
    rounded-none
  `,

  inventureAi: `
    bg-[#ffffff]
    border border-[#e5e7eb]
    shadow-2xl
    rounded-xl
  `
};
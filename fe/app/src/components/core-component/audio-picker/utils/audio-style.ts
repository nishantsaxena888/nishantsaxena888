type StyleProps = {
  [key: string]: {
    container: string;
    player: string;
    button: string;
    slider: string;
    input: string;
    activeTab: string;
    inactiveTab: string;
  };
};

export const audioStyles: StyleProps = {
  default: {
    container: "rounded-lg border border-slate-200 bg-white shadow-sm p-4",
    player: "bg-slate-50 rounded-md p-3",
    button: "text-primary hover:bg-slate-100",
    slider: "bg-primary",
    input: "border-slate-200",
    activeTab: "bg-primary text-white",
    inactiveTab: "bg-slate-100 text-slate-500 hover:bg-slate-200",
  },
  lightspeed: {
    container: "rounded-xl border border-gray-200 bg-white dark:bg-zinc-900/40 shadow-md p-4",
    player: "bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3",
    button: "text-[#E81C1C] hover:bg-[#E81C1C]/5",
    slider: "bg-[#E81C1C]",
    input: "border-gray-200 focus:border-[#E81C1C]",
    activeTab: "bg-[#E81C1C] text-white",
    inactiveTab: "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700",
  },
  clover: {
    container: "rounded-none border-2 border-[#344146] bg-white p-4",
    player: "bg-[#344146]/5 rounded-none p-3",
    button: "text-[#228800] hover:bg-[#228800]/5",
    slider: "bg-[#228800]",
    input: "border-2 border-[#344146] rounded-none focus:border-[#228800]",
    activeTab: "bg-[#228800] text-white rounded-none",
    inactiveTab: "bg-[#344146]/10 text-[#344146] hover:bg-[#344146]/20 rounded-none",
  },
  inventureAi: {
    container: "rounded-2xl border border-gray-300 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-xl p-5",
    player: "bg-gray-100/50 dark:bg-zinc-800/50 rounded-xl p-4 border border-white/20",
    button: "text-[#0D576C] hover:bg-[#0D576C]/10",
    slider: "bg-[#0D576C]",
    input: "rounded-xl border-gray-300 focus:border-[#0D576C] focus:ring-4 focus:ring-[#0D576C]/20 shadow-sm",
    activeTab: "bg-[#0D576C] text-white rounded-xl shadow-lg shadow-[#0D576C]/20",
    inactiveTab: "bg-gray-200/50 dark:bg-zinc-800/50 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl",
  },
};

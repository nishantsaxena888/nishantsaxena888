type StyleProps = {
  [key: string]: {
    container: string;
    row: string;
    input: string;
    deleteButton: string;
    addButton: string;
  };
};

export const stringArrayStyles: StyleProps = {
  default: {
    container: "space-y-3",
    row: "flex items-center gap-2",
    input: "flex-1",
    deleteButton: "h-10 w-10 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50",
    addButton: "w-full border-dashed",
  },
  
  lightspeed: {
    container: "space-y-4",
    row: "flex items-center gap-3 animate-in slide-in-from-left-2 duration-300",
    input: "flex-1 border-2 border-gray-100 focus:border-[#E81C1C]",
    deleteButton: "h-11 w-11 rounded-lg border-2 border-gray-100 text-gray-400 hover:text-white hover:bg-[#E81C1C] hover:border-[#E81C1C] transition-all",
    addButton: "w-full border-2 border-dashed border-gray-200 text-[#E81C1C] hover:bg-[#E81C1C]/5 font-bold h-11",
  },
  
  clover: {
    container: "space-y-0 border-t border-l border-[#344146]",
    row: "flex items-center gap-0 border-r border-b border-[#344146] bg-white",
    input: "flex-1 border-none rounded-none focus-visible:ring-1 focus-visible:ring-[#228800]",
    deleteButton: "h-[44px] w-[44px] rounded-none border-l border-[#344146] text-[#344146] hover:bg-red-100",
    addButton: "w-full rounded-none border-r border-b border-l border-[#344146] bg-slate-50 text-[#344146] font-black uppercase tracking-widest h-11 hover:bg-[#228800] hover:text-white transition-colors",
  },
  
  inventureAi: {
    container: "grid grid-cols-1 gap-3",
    row: "flex items-center gap-3 p-1.5 rounded-2xl border border-gray-100 bg-white/50 backdrop-blur-sm self-start focus-within:border-[#0D576C] transition-all",
    input: "flex-1 border-none bg-transparent shadow-none focus-visible:ring-0",
    deleteButton: "h-9 w-9 rounded-xl text-gray-400 hover:text-[#0D576C] hover:bg-white shadow-sm transition-all",
    addButton: "w-full rounded-2xl border border-gray-300 bg-white/30 backdrop-blur-sm text-[#0D576C] font-semibold h-12 shadow-sm hover:shadow-md hover:bg-white transition-all",
  },
};

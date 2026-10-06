import { create } from "zustand";

interface MediaManagerOptions {
  multiple?: boolean;
  allowedType?: "image" | "all";
  onSelect: (selectedItems: any[]) => void;
}

interface MediaManagerState {
  isOpen: boolean;
  multiple: boolean;
  allowedType: "image" | "all";
  onSelect: ((selectedItems: any[]) => void) | null;
  open: (options: MediaManagerOptions) => void;
  close: () => void;
}

export const useMediaManagerStore = create<MediaManagerState>((set) => ({
  isOpen: false,
  multiple: true,
  allowedType: "all",
  onSelect: null,
  open: (options) =>
    set(() => ({
      isOpen: true,
      multiple: options.multiple !== false,
      allowedType: options.allowedType || "all",
      onSelect: options.onSelect,
    })),
  close: () =>
    set(() => ({
      isOpen: false,
      multiple: true,
      allowedType: "all",
      onSelect: null,
    })),
}));

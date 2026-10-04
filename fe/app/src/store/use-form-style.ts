import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FormStyles {
  fieldHeight: string;
  fieldBorderRadius: string;
  primaryColor: string;
  fontSize: string;
  sidebarVariant: "floating" | "inset" | "sidebar";
  sidebarCollapsible: "icon" | "none" | "offcanvas";
  sidebarPosition: "left" | "right";
}

interface FormStyleState {
  styles: FormStyles;
  themeName: string;
  isSettingsOpen: boolean;
  setStyles: (styles: Partial<FormStyles>) => void;
  setThemeName: (theme: string) => void;
  setIsSettingsOpen: (open: boolean) => void;
}

export const useFormStyleStore = create<FormStyleState>()(
  persist(
    (set) => ({
      styles: {
        fieldHeight: "44px",
        fieldBorderRadius: "10px",
        primaryColor: "hsl(var(--primary))",
        fontSize: "14px",
        sidebarVariant: "sidebar",
        sidebarCollapsible: "offcanvas",
        sidebarPosition: "left",
      },
      themeName: "default",
      isSettingsOpen: false,
      setStyles: (newStyles) =>
        set((state) => ({
          styles: { ...state.styles, ...newStyles },
        })),
      setThemeName: (theme) => set({ themeName: theme }),
      setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
    }),
    {
      name: "nishify-form-style",
    },
  ),
);

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Palette, Settings2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/theme-provider";
import { ThemeSwitcher } from "nishify";
import { LanguageSwitcher } from "@/components/core-component/language-selector";
import { useFormStyleStore } from "@/store/use-form-style";
import { FormStyleSettings } from "@/tenants/admin/default-admin/utils/form-style-settings";
import { cn } from "@/lib/utils";

export function SiteHeader({ activePage }: { activePage: any }) {
  const { theme, setTheme } = useTheme();
  const { setIsSettingsOpen, styles } = useFormStyleStore();
  const isRightSidebar = styles.sidebarPosition === "right";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div
        className={cn(
          "flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6",
          isRightSidebar && "flex-row-reverse",
        )}
      >
        <SidebarTrigger className={cn(isRightSidebar ? "-mr-1" : "-ml-1")} />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{activePage?.name}</h1>

        <div
          className={cn(
            "flex items-center gap-4",
            isRightSidebar ? "mr-auto" : "ml-auto",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings2 className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            onClick={() => setTheme(theme === "dark" ? "default" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-primary" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          <LanguageSwitcher />
          <ThemeSwitcher
            currentTheme={theme}
            onThemeChange={setTheme}
            triggerClassName="w-10 xl:w-44 h-9 p-0 xl:px-3 text-xs border-none bg-muted/50 rounded-full xl:rounded-lg"
            contentClassName="z-[110] min-w-[200px] rounded-xl border-border/50 shadow-2xl p-2"
          />
        </div>
      </div>
      <FormStyleSettings />
    </header>
  );
}

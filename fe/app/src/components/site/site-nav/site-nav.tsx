import { Anchor } from "@/platform/primitives";
import { usePath } from "@/platform/navigation";
import { useGenericState } from "@/common/store/use-generic-state";

// Generic site-surface nav — the S-side counterpart of the admin sidebar.
// Renders config.data.menu (public items, ordered) + client branding from
// config meta. Every public page gets it for free via the renderers —
// a new menu entry becomes a link automatically.
export const SiteNav = ({ config }: { config?: any }) => {
  const pathname = usePath();
  const data = config?.data ?? config ?? {};
  const meta = data.meta || {};
  const siteName = data.site_name || meta.display_name || meta.client || "Site";
  const sessionData = useGenericState((s: any) => s.data);

  // Configured local-source sessions show as live badges (cart, progress…).
  const sessions: any[] = Array.isArray(data.sessions) ? data.sessions : [];

  const items = (Array.isArray(data.menu) ? data.menu : [])
    .filter((i: any) => i.public !== false && !i.auth_page && !i.hide)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  if (items.length === 0) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Anchor to="/" className="text-base font-bold text-foreground">
          {siteName}
        </Anchor>
        <div className="flex items-center gap-1">
          {items.map((item: any) => {
            const active = pathname === item.url;
            return (
              <Anchor
                key={item.url}
                to={item.url}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.name}
              </Anchor>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {sessions.map((s: any) => {
            const items = sessionData?.[s.name];
            const count = Array.isArray(items)
              ? items.reduce((n: number, i: any) => n + (i?.qty ?? 1), 0)
              : 0;
            return (
              <span
                key={s.name}
                className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                title={`${s.name} session (local source)`}
              >
                {s.name}: {count}
              </span>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

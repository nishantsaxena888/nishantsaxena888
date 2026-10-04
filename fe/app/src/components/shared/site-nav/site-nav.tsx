import { Link, useLocation } from "react-router-dom";

// Generic site-surface nav — the S-side counterpart of the admin sidebar.
// Renders config.data.menu (public items, ordered) + client branding from
// config meta. Every public page gets it for free via the renderers —
// a new menu entry becomes a link automatically.
export const SiteNav = ({ config }: { config?: any }) => {
  const location = useLocation();
  const data = config?.data ?? config ?? {};
  const meta = data.meta || {};
  const siteName = data.site_name || meta.display_name || meta.client || "Site";

  const items = (Array.isArray(data.menu) ? data.menu : [])
    .filter((i: any) => i.public !== false && !i.auth_page)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  if (items.length === 0) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="text-base font-bold text-foreground">
          {siteName}
        </Link>
        <div className="flex items-center gap-1">
          {items.map((item: any) => {
            const active = location.pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

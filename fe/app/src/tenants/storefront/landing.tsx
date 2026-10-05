// Generic landing — marketing/course-home page composed entirely from def
// content. Sections are opt-in: hero, journey, features, dashboard,
// categories (dynamic entity cards) and footer render only when present.
//
// Content contract (all optional):
//   hero        {badge, title_lead, title_accent, description,
//                primary:{label,to}, secondary:{label,to}, stats:[{value,label}]}
//               `to` is a route; "#id" scrolls to an in-page anchor.
//   journey     {title, subtitle, stages:[string]}
//   features    {title, subtitle, cards:[{icon,bg,title,desc}]}
//   dashboard   {title, subtitle, stats:[{icon,bg,fg,label,suffix,
//                session | value}]} — `session` shows the session item count
//   categories  {title, subtitle, key:"categories", count_key:"courses",
//                count_field:"category_id", path:"/courses", param:"category",
//                fields:{title,desc,icon,color,bg}} — cards feed from
//               actionData[key]; item counts group actionData[count_key].
//   footer      {line1, line2}
import { useNav } from "@/platform/navigation";
import { Pressable, Text, View } from "@/platform/primitives";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

const Section = ({ id, tone, title, subtitle, children }: any) => (
  <View as="section" id={id} className={`page-section${tone ? ` page-section-${tone}` : ""}`}>
    <View className="container">
      {(title || subtitle) && (
        <View className="page-section-header">
          {title && <Text as="h2">{title}</Text>}
          {subtitle && <Text as="p">{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  </View>
);

export default function Landing({ content, actionData, session }: any) {
  const c = content || {};
  const navigate = useNav().navigate;
  const go = (to?: string) => {
    if (!to) return;
    if (to.startsWith("#")) {
      if (typeof document !== "undefined")
        document.getElementById(to.slice(1))?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate(to);
  };

  const cat = c.categories || {};
  const f = {
    title: "name", desc: "description", icon: "emoji",
    color: "color", bg: "color_bg", ...(cat.fields || {}),
  };
  const cats = [...toItems(actionData?.data?.[cat.key || "categories"])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const counts: Record<string, number> = {};
  for (const r of toItems(actionData?.data?.[cat.count_key || "courses"])) {
    const k = r[cat.count_field || "category_id"];
    if (k != null) counts[k] = (counts[k] || 0) + 1;
  }
  const catPath = `${cat.path || "/courses"}?${cat.param || "category"}`;

  return (
    <View className="landing-page">
      {c.hero && (
        <View as="section" className="hero">
          <View className="hero-content">
            {c.hero.badge && <View className="hero-badge">{c.hero.badge}</View>}
            <Text as="h1">
              {c.hero.title_lead}
              <br />
              <Text className="highlight">{c.hero.title_accent}</Text>
            </Text>
            {c.hero.description && (
              <Text as="p" className="hero-desc">{c.hero.description}</Text>
            )}
            <View className="hero-cta-row">
              {c.hero.primary && (
                <Pressable className="btn btn-xl btn-primary" onPress={() => go(c.hero.primary.to)}>
                  {c.hero.primary.label}
                </Pressable>
              )}
              {c.hero.secondary && (
                <Pressable className="btn btn-xl btn-secondary" onPress={() => go(c.hero.secondary.to)}>
                  {c.hero.secondary.label}
                </Pressable>
              )}
            </View>
            {c.hero.stats?.length > 0 && (
              <View className="hero-stats">
                {c.hero.stats.map((s: any, i: number) => (
                  <View key={i} className="hero-stat">
                    <View className="hero-stat-value">{s.value}</View>
                    <View className="hero-stat-label">{s.label}</View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {c.journey?.stages?.length > 0 && (
        <Section tone="journey" title={c.journey.title} subtitle={c.journey.subtitle}>
          <View className="journey-flow">
            {c.journey.stages.map((s: string, i: number) => (
              <View key={i} style={{ display: "contents" }}>
                <View className="journey-stage">{s}</View>
                {i < c.journey.stages.length - 1 && (
                  <Text className="journey-arrow">→</Text>
                )}
              </View>
            ))}
          </View>
        </Section>
      )}

      {c.features?.cards?.length > 0 && (
        <Section title={c.features.title} subtitle={c.features.subtitle}>
          <View className="feature-grid">
            {c.features.cards.map((fc: any, i: number) => (
              <View key={i} className="feature-card">
                <View className="feature-icon" style={{ background: fc.bg }}>{fc.icon}</View>
                <View className="feature-title">{fc.title}</View>
                <Text as="p" className="feature-desc">{fc.desc}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {c.dashboard?.stats?.length > 0 && (
        <Section id="dashboard" title={c.dashboard.title} subtitle={c.dashboard.subtitle}>
          <View className="dashboard-grid">
            {c.dashboard.stats.map((s: any, i: number) => (
              <View key={i} className="stat-card">
                <View className="stat-card-icon" style={{ background: s.bg, color: s.fg }}>
                  {s.icon}
                </View>
                <View>
                  <View className="stat-card-value">
                    {s.session ? (session?.items(s.session)?.length ?? 0) : (s.value ?? 0)}
                    {s.suffix || ""}
                  </View>
                  <View className="stat-card-label">{s.label}</View>
                </View>
              </View>
            ))}
          </View>
        </Section>
      )}

      {c.categories && cats.length > 0 && (
        <Section id="categories" title={cat.title} subtitle={cat.subtitle}>
          <View className="module-grid">
            {cats.map((r: any) => (
              <Pressable key={r.id} className="card module-card" onPress={() => go(`${catPath}=${r.id}`)}>
                <View className="card-body">
                  <View className="module-icon" style={{ background: r[f.bg], color: r[f.color] }}>
                    {r[f.icon] || r[f.title]?.[0] || "📦"}
                  </View>
                  <View className="module-title">{r[f.title]}</View>
                  {r[f.desc] && <View className="module-desc">{r[f.desc]}</View>}
                  <View className="module-meta">
                    <Text>
                      📦 {counts[r.id] ?? 0}{" "}
                      {(counts[r.id] ?? 0) === 1
                        ? cat.item_label_singular || (cat.item_label || "courses").replace(/s$/, "")
                        : cat.item_label || "courses"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </Section>
      )}

      {c.footer && (
        <View as="footer" className="app-footer">
          <Text as="p">{c.footer.line1}</Text>
          {c.footer.line2 && (
            <Text as="p" className="app-footer-sub">{c.footer.line2}</Text>
          )}
        </View>
      )}
    </View>
  );
}

// Generic course/catalog grid — module-card grid fed by the def's dynamic
// action (actionData.data.data → entity list). Card action records the
// item in the "recent" session via SessionBridge and navigates to the
// content.open_pattern route (default /courses/:id). Optional content:
//   filter_param/filter_field — ?category=3 filters rows on category_id
//   categories_key/categories_title_field — sibling list lookup used for
//     the card icon/colors (course.category_id → category.emoji/color)
//     and the filtered-page title
//   count_key/count_field — second list grouped by fk for "N chapters"
//   back — {label,to} optional back link rendered above the title
//   fields — {icon,color,bg,desc,status,title} record field mapping
import { useNav, useQuery } from "@/platform/navigation";
import { Pressable, Text, View } from "@/platform/primitives";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

export default function CourseList({ content, actionData, session }: any) {
  const all = toItems(actionData?.data?.data);
  const navigate = useNav().navigate;
  // Optional query filter — ?category=3 filters rows on content.filter_field
  // (default category_id); param name itself is content.filter_param.
  const q = useQuery();
  const fv = q(content?.filter_param || "category");
  const ff = content?.filter_field || "category_id";
  const courses = fv ? all.filter((r) => String(r[ff]) === fv) : all;

  // category lookup for card icon/colors + filtered title
  const cats = toItems(actionData?.data?.[content?.categories_key || "categories"]);
  const catById: Record<string, any> = {};
  for (const c of cats) catById[c.id] = c;
  const counts: Record<string, number> = {};
  for (const r of toItems(actionData?.data?.[content?.count_key || "chapters"])) {
    const k = r[content?.count_field || "course_id"];
    if (k != null) counts[k] = (counts[k] || 0) + 1;
  }
  const activeCat = fv ? catById[fv] : null;
  const title = activeCat
    ? `${activeCat.emoji ? `${activeCat.emoji} ` : ""}${activeCat.name}`
    : content?.title;

  const open = (c: any) => {
    session?.update("recent", {
      id: c.id,
      name: c.title,
      kind: "course",
      at: new Date().toISOString(),
    });
    // detail route from def content (default /courses/:id) — the mock
    // detail-read matches by numeric id, so navigate by id, not code.
    navigate(`${content?.detail_path || "/courses"}/${c.id}`);
  };

  if (actionData?.loading) {
    return (
      <View as="section" className="course-list p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View as="section" className="course-list catalog-page">
      <View className="container">
        <View className="catalog-head">
          {content?.back && (
            <Pressable
              className="back-link"
              onPress={() => navigate(content.back.to || "/")}
            >
              {content.back.label || "← Back"}
            </Pressable>
          )}
          {title && <Text as="h2">{title}</Text>}
          {fv && (
            <Text as="p" className="catalog-filter-note">
              {courses.length} result{courses.length === 1 ? "" : "s"} —{" "}
              <Pressable
                className="underline"
                onPress={() => navigate(content?.detail_path || "/courses")}
              >
                show all
              </Pressable>
            </Text>
          )}
        </View>
        <View className="module-grid">
          {courses.map((c: any) => {
            const cat = catById[c.category_id];
            const n = counts[c.id];
            return (
              <Pressable
                key={c.id}
                className="card module-card course-card"
                onPress={() => open(c)}
              >
                <View className="card-body">
                  <View
                    className="module-icon"
                    style={{ background: cat?.color_bg, color: cat?.color }}
                  >
                    {cat?.emoji || "📚"}
                  </View>
                  <View className="module-title">{c.title}</View>
                  {c.description && (
                    <View className="module-desc">{c.description}</View>
                  )}
                  <View className="module-meta">
                    {c.status && (
                      <Text className={`badge status-${c.status}`}>{c.status}</Text>
                    )}
                    {n != null && <Text>📦 {n} chapters</Text>}
                  </View>
                  {/* visual CTA only — the card itself carries the press,
                      so this stays a span (no nested interactive elements) */}
                  <Text className="sf-action-btn">
                    {content?.cta_label || "Start learning"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {!actionData?.loading && courses.length === 0 && (
          <Text as="p" className="text-muted-foreground">No courses yet.</Text>
        )}
      </View>
    </View>
  );
}

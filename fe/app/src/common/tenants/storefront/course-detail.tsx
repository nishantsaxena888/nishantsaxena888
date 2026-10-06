// Generic course page — module-card grid for a detail route (e.g.
// /courses/:id). actions: <entity>/:id (header) + <child>?<fk>=:id
// (chapters). Each card: order bubble, icon, title, desc, progress bar
// (from the progress session), meta chips (difficulty/duration/lessons)
// and navigates to the reader route (default /learn/:id). Field names
// and labels are content-driven — the card fields map via
// content.fields {icon,desc,difficulty,duration,color,bg,lessons}.
import { useNav } from "@/platform/navigation";
import { useLanguage } from "@/components/shared/use-language";
import { Pressable, Text, View } from "@/platform/primitives";
import { makeTr } from "./utils";
import RowActions from "./entity-actions";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

export default function CourseDetail({ content, actionData, session }: any) {
  const navigate = useNav().navigate;
  const t = makeTr(useLanguage().t);
  const course = actionData?.data?.course?.data ?? actionData?.data?.course;
  const chapters = toItems(actionData?.data?.chapters)
    .filter((c: any) => !course?.id || c.course_id === course.id)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const done = new Set(
    (session?.items?.(content?.progress_session || "progress") || []).map(
      (p: any) => p.id,
    ),
  );
  const completePct = chapters.length
    ? Math.round(
        (chapters.filter((ch: any) => done.has(`ch-${ch.id}`)).length /
          chapters.length) *
          100,
      )
    : 0;

  const openChapter = (ch: any) => {
    session?.update("recent", {
      id: `ch-${ch.id}`,
      name: ch.title,
      kind: "chapter",
      at: new Date().toISOString(),
    });
    navigate(`${content?.reader_path || "/learn"}/${ch.slug || ch.id}`);
  };

  if (actionData?.loading) {
    return (
      <View as="section" className="course-detail p-6">
        <Text>{t("common.loading", "Loading…")}</Text>
      </View>
    );
  }

  return (
    <View as="section" className="course-detail course-page">
      <View className="course-page-head">
        <Pressable
          className="back-link"
          onPress={() => navigate(content?.back_path || "/")}
        >
          {content?.back_label || t("common.backToCourse", "← Back to Course")}
        </Pressable>
        <View className="course-page-title">
          <Text className="course-kicker">{content?.kicker || "Course"}</Text>
          <Text as="h1">{course?.title || content?.title || "Course"}</Text>
          {course?.description && (
            <Text as="p" className="course-page-desc">{course.description}</Text>
          )}
        </View>
        <View className="course-page-side">
          <Text className="course-page-pct">{completePct}%</Text>
          {actionData?.action && (
            <Pressable
              className="sf-action-btn"
              onPress={() =>
                // :id resolves from the route param (payload interpolation)
                actionData.action({
                  key: "enroll",
                  type: "filter",
                  data: { at: new Date().toISOString() },
                })
              }
            >
              {content?.enroll_label || "Enroll"}
            </Pressable>
          )}
        </View>
      </View>

      <View className="module-grid">
        {chapters.map((ch: any, i: number) => {
          const pct = done.has(`ch-${ch.id}`) ? 100 : 0;
          return (
            <View key={ch.id} className="card module-card chapter-row">
              <Pressable className="card-hit" onPress={() => openChapter(ch)}>
              <View className="card-body">
                <View className="module-number">
                  {String(ch.order ?? i + 1).padStart(2, "0")}
                </View>
                <View
                  className="module-icon"
                  style={{ background: ch.color_bg, color: ch.color }}
                >
                  {ch.icon || "📄"}
                </View>
                <View className="module-title">{ch.title}</View>
                {ch.description && (
                  <View className="module-desc">{ch.description}</View>
                )}
                <View className="module-progress">
                  <View className="progress-label">
                    <Text className="progress-label-title">
                      {pct === 100 ? t("lab.complete", "✅ Complete") : t("lab.progress", "In progress")}
                    </Text>
                    <Text className="progress-label-value">{pct}%</Text>
                  </View>
                  <View className="progress-bar">
                    <View
                      className="progress-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                </View>
                <View className="module-meta">
                  {ch.difficulty && (
                    <Text className={`badge difficulty-${ch.difficulty}`}>
                      {ch.difficulty}
                    </Text>
                  )}
                  {ch.duration && <Text>🕐 {ch.duration}</Text>}
                  {ch.lessons != null && <Text>📝 {ch.lessons} lessons</Text>}
                </View>
              </View>
              </Pressable>
              <RowActions
                entity={content?.chapter_entity || "chapter"}
                item={ch}
                actions={content?.row_actions}
                detail_path={content?.reader_path || "/learn"}
                reload={() => actionData?.action?.({ key: content?.chapters_key || "chapters", type: "reload" })}
              />
            </View>
          );
        })}
      </View>
      {chapters.length === 0 && (
        <Text as="p" className="p-4 text-muted-foreground">
          {content?.empty || t("chapters.empty", "No chapters yet.")}
        </Text>
      )}
    </View>
  );
}

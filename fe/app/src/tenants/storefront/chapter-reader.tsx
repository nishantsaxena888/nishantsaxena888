// Generic chapter/doc reader — the learning-platform surface. Def
// (usually a `pages/<slug>` detail route like /learn/:id) declares:
//   actions: <doc>/:id (title/meta) + <revision-entity>?<doc>_id=:id
//            + optional <doc> list (sidebar siblings, content.siblings_key)
// The component picks the pinned/latest published revision, parses its
// md_content through ./md-sections, and renders typed sections via
// ./md-render (shared with md-viewer). A sibling sidebar lists the
// course's chapters with completion state; prev/next footers navigate
// content.reader_path (default /learn/:id). Session writes (progress)
// go through the SessionBridge prop — the def's lazy actions handle
// entity writes (e.g. quiz_submission POST).
import { useMemo } from "react";
import { useNav } from "@/platform/navigation";
import { useLanguage } from "@/components/shared/use-language";
import { Pressable, Text, View } from "@/platform/primitives";
import { useRenderEngine } from "@/engine/render-engine/features/render-engine-context";
import { parseMd, type MdSection } from "./md-sections";
import { MdDoc } from "./md-render";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

export default function ChapterReader({ content, actionData, session }: any) {
  const navigate = useNav().navigate;
  const { t } = useLanguage();
  const { componentMap } = useRenderEngine();
  const chapter =
    actionData?.data?.chapter?.data ?? actionData?.data?.chapter;
  const revisions = toItems(actionData?.data?.revisions).filter(
    (r: any) => !chapter?.id || r.chapter_id === chapter.id,
  );
  // Sibling chapters for the sidebar — same course, ordered.
  const siblings = toItems(actionData?.data?.[content?.siblings_key || "chapters"])
    .filter((s: any) => chapter?.course_id != null && s.course_id === chapter.course_id)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const idx = siblings.findIndex((s: any) => s.id === chapter?.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const readerPath = content?.reader_path || "/learn";

  const progressItems =
    session?.items?.(content?.progress_session || "progress") || [];
  const done = new Set(progressItems.map((p: any) => p.id));
  const pct = siblings.length
    ? Math.round(
        (siblings.filter((s: any) => done.has(`ch-${s.id}`)).length /
          siblings.length) *
          100,
      )
    : 0;

  // Published copy: prefer the chapter's pinned revision, else latest
  // published, else latest anything (draft preview for authors).
  const rev =
    revisions.find((r: any) => r.id === chapter?.published_revision_id) ||
    revisions
      .filter((r: any) => r.status === "published")
      .sort((a: any, b: any) => (b.version_no ?? 0) - (a.version_no ?? 0))[0] ||
    revisions.sort(
      (a: any, b: any) => (b.version_no ?? 0) - (a.version_no ?? 0),
    )[0];

  const parsed = useMemo(
    () =>
      rev?.md_content ? parseMd(rev.md_content) : { sections: [] as MdSection[] },
    [rev],
  );

  // `md-<tag>` tenant components render extended directives (see
  // md-viewer); unregistered tags degrade to attr callouts.
  const resolveWidget = (sec: Extract<MdSection, { type: "widget" }>) => {
    const Comp = componentMap?.[`md-${sec.tag.toLowerCase()}`] as any;
    if (!Comp) return undefined;
    return <Comp section={sec} attrs={sec.attrs || {}} content={content} />;
  };

  const markComplete = () => {
    if (chapter?.id == null) return;
    session?.update(content?.progress_session || "progress", {
      id: `ch-${chapter.id}`,
      chapter_id: chapter.id,
      completed: true,
      at: new Date().toISOString(),
    });
  };

  const openChapter = (ch: any) => {
    session?.update("recent", {
      id: `ch-${ch.id}`,
      name: ch.title,
      kind: "chapter",
      at: new Date().toISOString(),
    });
    navigate(`${readerPath}/${ch.id}`);
  };

  if (actionData?.loading) {
    return (
      <View as="section" className="chapter-reader p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View className="reader-layout">
      {siblings.length > 0 && (
        <View as="aside" className="reader-sidebar">
          <Text className="reader-sidebar-label">{t("sidebar.modules")}</Text>
          {siblings.map((s: any, i: number) => (
            <Pressable
              key={s.id}
              className={`reader-side-item${s.id === chapter?.id ? " active" : ""}`}
              onPress={() => openChapter(s)}
            >
              <Text className="reader-side-icon">{s.icon || "📄"}</Text>
              <Text className="reader-side-title">
                {String(s.order ?? i + 1).padStart(2, "0")}. {s.title}
              </Text>
              {done.has(`ch-${s.id}`) && (
                <Text className="reader-side-done">✓</Text>
              )}
              {s.id === chapter?.id && (
                <Text className="reader-side-pct">{pct}%</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
      <View as="article" className="chapter-reader">
        <Pressable
          className="back-link"
          onPress={() =>
            navigate(
              `${content?.back_path || "/courses"}/${chapter?.course_id ?? ""}`,
            )
          }
        >
          {content?.back_label || t("common.backToCourse")}
        </Pressable>
        <View className="chapter-meta-row">
          {chapter?.difficulty && (
            <Text className={`badge difficulty-${chapter.difficulty}`}>
              {chapter.difficulty}
            </Text>
          )}
          {chapter?.duration && (
            <Text className="chapter-meta-chip">🕐 {chapter.duration}</Text>
          )}
          {rev && (
            <Text className="chapter-meta-chip">
              v{rev.version_no} · {rev.status}
            </Text>
          )}
        </View>
        <Text as="h1" className="chapter-title">
          {chapter?.title || content?.title || "Chapter"}
        </Text>
        {chapter?.description && (
          <Text as="p" className="chapter-desc">{chapter.description}</Text>
        )}
        <MdDoc
          sections={parsed.sections}
          base={chapter?.content_base}
          resolveWidget={resolveWidget}
          onQuizAnswer={(correct, i) =>
            actionData?.action?.({
              key: content?.quiz_action || "submit_quiz",
              type: "filter",
              data: {
                chapter_id: chapter?.id,
                quiz_id: `ch${chapter?.id}-q${i}`,
                score: correct ? 1 : 0,
                total: 1,
              },
            })
          }
        />
        {!actionData?.loading && parsed.sections.length === 0 && (
          <Text as="p" className="text-muted-foreground">
            {content?.empty || "No content yet."}
          </Text>
        )}
        <View className="chapter-foot">
          <Pressable className="sf-action-btn" onPress={markComplete}>
            {content?.complete_label || t("lesson.markAsRead")}
          </Pressable>
          <View className="chapter-prevnext">
            {prev && (
              <Pressable
                className="btn btn-secondary"
                onPress={() => openChapter(prev)}
              >
                {t("quiz.previous")}
              </Pressable>
            )}
            {next && (
              <Pressable
                className="btn btn-primary"
                onPress={() => openChapter(next)}
              >
                {t("quiz.next")}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

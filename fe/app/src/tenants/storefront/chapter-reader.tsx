// Generic chapter/doc reader — the learning-platform surface. Def
// (usually a `pages/<slug>` detail route like /learn/:id) declares:
//   actions: <doc>/:id (title/meta) + <revision-entity>?<doc>_id=:id
// The component picks the pinned/latest published revision, parses its
// md_content through ./md-sections, and renders typed sections via
// ./md-render (shared with md-viewer). Session writes (progress) go
// through the SessionBridge prop — the def's lazy actions handle entity
// writes (e.g. quiz_submission POST).
import { useMemo } from "react";
import { useNav } from "@/platform/navigation";
import { Pressable, Text, View } from "@/platform/primitives";
import { useRenderEngine } from "@/engine/render-engine/features/render-engine-context";
import { parseMd, type MdSection } from "./md-sections";
import { MdDoc } from "./md-render";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

export default function ChapterReader({ content, actionData, session }: any) {
  const navigate = useNav().navigate;
  const { componentMap } = useRenderEngine();
  const chapter =
    actionData?.data?.chapter?.data ?? actionData?.data?.chapter;
  const revisions = toItems(actionData?.data?.revisions).filter(
    (r: any) => !chapter?.id || r.chapter_id === chapter.id,
  );
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

  if (actionData?.loading) {
    return (
      <View as="section" className="chapter-reader p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View as="article" className="chapter-reader mx-auto max-w-3xl p-6 space-y-4">
      <Pressable
        className="text-sm text-muted-foreground hover:underline"
        onPress={() => navigate(`${content?.back_path || "/courses"}/${chapter?.course_id ?? ""}`)}
      >
        ← {content?.back_label || "Back to course"}
      </Pressable>
      <Text as="h1" className="text-3xl font-bold">
        {chapter?.title || content?.title || "Chapter"}
      </Text>
      {rev && (
        <Text className="text-xs text-muted-foreground">
          v{rev.version_no} · {rev.status}
        </Text>
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
      <Pressable className="sf-action-btn mt-6" onPress={markComplete}>
        {content?.complete_label || "Mark complete"}
      </Pressable>
    </View>
  );
}

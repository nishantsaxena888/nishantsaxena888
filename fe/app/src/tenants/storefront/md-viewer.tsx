// md-viewer — renders md++ content on ANY page def. The source of the
// markdown is config, not code:
//
//   content.markdown   — inline md string in the page def
//   content.md_key     — actionData.data[key]; string, or a record whose
//                        md_content / body / content / text field holds md
//   content.base       — asset base for relative images (the record's
//                        content_base wins when present)
//   content.toc        — truthy → "On this page" heading-nav strip
//   content.quiz_action — lazy action key fired on quiz answer
//                        (payload gets quiz_id/score/total via :params)
//
// Extended directives resolve through the tenant map: a client
// component registered as "md-<tag>" (e.g. md-githubexplorer) renders
// <GitHubExplorer …/> sections with the directive attrs as props.
import { useMemo } from "react";
import { Text, View } from "@/platform/primitives";
import { useRenderEngine } from "@/engine/render-engine/features/render-engine-context";
import { parseMd, type MdSection } from "./md-sections";
import { MdDoc, MdToc } from "./md-render";

const pickMd = (raw: any): { md?: string; base?: string } => {
  if (!raw) return {};
  if (typeof raw === "string") return { md: raw };
  const rec = raw?.data ?? raw; // unwrap ApiResponse envelope
  if (typeof rec === "string") return { md: rec };
  const out: { md?: string; base?: string } = {
    md: rec?.md_content ?? rec?.body ?? rec?.content ?? rec?.text,
  };
  if (rec?.content_base) out.base = rec.content_base;
  return out;
};

export default function MdViewer({ content, actionData }: any) {
  const { componentMap } = useRenderEngine();

  const source = useMemo((): { md?: string; base?: string } => {
    if (content?.markdown) return { md: content.markdown };
    if (content?.md_key) return pickMd(actionData?.data?.[content.md_key]);
    return {};
  }, [content?.markdown, content?.md_key, actionData?.data]);

  const parsed = useMemo(
    () => (source.md ? parseMd(source.md) : { sections: [] as MdSection[] }),
    [source.md],
  );

  // `md-<tag>` convention — client tenant components render extended
  // directives; the tag's parsed attrs arrive as props.
  const resolveWidget = (sec: Extract<MdSection, { type: "widget" }>) => {
    const C = componentMap?.[`md-${sec.tag.toLowerCase()}`];
    if (!C) return undefined;
    const Comp = C as any;
    return <Comp section={sec} attrs={sec.attrs || {}} content={content} />;
  };

  const onQuizAnswer = (correct: boolean, index: number) =>
    actionData?.action?.({
      key: content?.quiz_action || "submit_quiz",
      type: "filter",
      data: {
        quiz_id: `q${index}`,
        score: correct ? 1 : 0,
        total: 1,
      },
    });

  if (!source.md && actionData?.loading) {
    return (
      <View as="section" className="md-viewer p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View as="article" className="md-viewer mx-auto max-w-3xl p-6 space-y-4">
      {content?.title ? (
        <Text as="h1" className="text-3xl font-bold">
          {content.title}
        </Text>
      ) : null}
      {content?.toc ? <MdToc sections={parsed.sections} /> : null}
      <MdDoc
        sections={parsed.sections}
        base={source.base || content?.base}
        onQuizAnswer={onQuizAnswer}
        resolveWidget={resolveWidget}
      />
      {!actionData?.loading && parsed.sections.length === 0 && (
        <Text as="p" className="text-muted-foreground">
          {content?.empty || "No content yet."}
        </Text>
      )}
    </View>
  );
}

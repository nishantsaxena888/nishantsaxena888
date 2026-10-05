// skillom chapter reader — dynamic page for /learn/:id.
// actions: chapter/:id (title/meta) + revision?chapter_id=:id
//   → picks the latest published revision, parses md_content through
//   lib/md-sections, renders typed sections as widgets (quiz, callouts,
//   video, hotspot, code…). "Mark complete" writes to the progress
//   session via SessionBridge — no engine imports (client boundary).
import { useMemo, useState } from "react";
import { useNav } from "@/platform/navigation";
import {
  Anchor,
  Image,
  Pressable,
  Text,
  View,
} from "@/platform/primitives";
import { parseMd, type MdSection } from "./md-sections";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

const CALLOUT_ICON: Record<string, string> = {
  info: "ℹ️",
  tip: "💡",
  warning: "⚠️",
  success: "✅",
  note: "📝",
  concept: "🧠",
  "key-takeaways": "🔑",
  section: "📌",
  why: "❓",
  goal: "🎯",
  outcome: "🏁",
  quote: "❝",
};

// Minimal inline md: **bold**, `code`, [text](url). No italic-* parsing
// (rare in course md, keeps tokenizer trivial).
const Inline = ({ text }: { text: string }) => {
  const parts = useMemo(() => {
    const out: any[] = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(<Text key={k++}>{text.slice(last, m.index)}</Text>);
      const t = m[0];
      if (t.startsWith("**"))
        out.push(
          <Text key={k++} as="strong">
            {t.slice(2, -2)}
          </Text>,
        );
      else if (t.startsWith("`"))
        out.push(
          <Text key={k++} as="code" className="rounded bg-muted px-1">
            {t.slice(1, -1)}
          </Text>,
        );
      else {
        const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!;
        out.push(
          <Anchor key={k++} to={mm[2]} external>
            {mm[1]}
          </Anchor>,
        );
      }
      last = m.index + t.length;
    }
    if (last < text.length) out.push(<Text key={k++}>{text.slice(last)}</Text>);
    return out;
  }, [text]);
  return <>{parts}</>;
};

const Quiz = ({ sec }: { sec: Extract<MdSection, { type: "quiz" }> }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  return (
    <View className="quiz-card rounded-lg border p-4 space-y-3">
      <Text as="p" className="font-medium">
        {sec.question}
      </Text>
      {sec.options.map((opt: string, i: number) => (
        <Pressable
          key={i}
          className={`quiz-option rounded border p-2 text-left ${
            done && i === sec.answerIndex
              ? "border-green-500 bg-green-500/10"
              : done && i === picked
                ? "border-red-500 bg-red-500/10"
                : "hover:bg-accent"
          }`}
          onPress={() => !done && setPicked(i)}
        >
          <Text>{opt}</Text>
        </Pressable>
      ))}
      {done && (
        <Text as="p" className="text-sm text-muted-foreground">
          {picked === sec.answerIndex ? "Correct. " : "Not quite. "}
          {sec.explanation}
        </Text>
      )}
    </View>
  );
};

// Relative asset refs inside md (image-1.png, screenshots/x.png) resolve
// against the chapter's content_base — same convention as the source repo.
const resolveSrc = (src: string, base?: string) =>
  src && !/^(https?:)?\/\//.test(src) && !src.startsWith("/") && base
    ? `${base.replace(/\/?$/, "/")}${src}`
    : src;

const Section = ({ sec, base }: { sec: MdSection; base?: string }) => {
  switch (sec.type) {
    case "heading":
      return sec.level <= 2 ? (
        <Text as="h2" className="text-xl font-semibold mt-6">
          <Inline text={sec.text} />
        </Text>
      ) : (
        <Text as="h3" className="text-lg font-semibold mt-4">
          <Inline text={sec.text} />
        </Text>
      );
    case "paragraph":
      return (
        <Text as="p" className="leading-7">
          <Inline text={sec.text} />
        </Text>
      );
    case "code":
      return (
        <View className="rounded-lg border bg-muted/50 overflow-hidden">
          {sec.lang ? (
            <Text className="px-3 py-1 text-xs text-muted-foreground border-b">
              {sec.lang}
            </Text>
          ) : null}
          <Text as="pre" className="p-3 overflow-x-auto text-sm">
            {sec.code}
          </Text>
        </View>
      );
    case "list":
      return (
        <View as={sec.ordered ? "ol" : "ul"} className="list-inside space-y-1 pl-4">
          {sec.items.map((it, i) => (
            <Text as="li" key={i}>
              <Inline text={it} />
            </Text>
          ))}
        </View>
      );
    case "image":
      return <Image src={resolveSrc(sec.src, base)} alt={sec.alt} loading="lazy" />;
    case "callout":
      return (
        <View className="callout rounded-lg border p-4 space-y-1">
          <Text as="p" className="font-medium">
            {CALLOUT_ICON[sec.variant] || "ℹ️"} {sec.title}
          </Text>
          {sec.body && (
            <Text as="p" className="text-sm text-muted-foreground">
              <Inline text={sec.body} />
            </Text>
          )}
        </View>
      );
    case "quiz":
      return <Quiz sec={sec} />;
    case "video":
      return (
        <View className="video-card rounded-lg border p-4 space-y-2">
          <Image
            src={`https://img.youtube.com/vi/${sec.youtubeId}/hqdefault.jpg`}
            alt={sec.title || "video"}
            loading="lazy"
          />
          <Anchor
            to={`https://www.youtube.com/watch?v=${sec.youtubeId}`}
            external
          >
            ▶ {sec.title || "Watch video"}
          </Anchor>
        </View>
      );
    case "hotspot":
      return (
        <View className="hotspot-card rounded-lg border overflow-hidden">
          {sec.src ? (
            <Image src={resolveSrc(sec.src, base)} alt="hotspot" loading="lazy" />
          ) : null}
          <View className="p-3 space-y-1">
            {sec.hotspots.map((h: any, i: number) => (
              <Text key={i} as="p" className="text-sm">
                • {h.tip || h.label}
              </Text>
            ))}
          </View>
        </View>
      );
    case "gallery":
      return (
        <View className="gallery grid gap-2 md:grid-cols-2">
          {sec.images.map((im: any, i: number) => (
            <Image
              key={i}
              src={resolveSrc(typeof im === "string" ? im : im.src, base)}
              alt={im.alt || `image ${i + 1}`}
              loading="lazy"
            />
          ))}
        </View>
      );
    case "steps":
      return (
        <View className="steps-card rounded-lg border p-4 space-y-2">
          <Text as="p" className="font-medium">
            {sec.title}
          </Text>
          {sec.steps.map((st: any, i: number) => (
            <View key={i} className="pl-3 border-l-2 space-y-1">
              <Text as="p" className="text-sm font-medium">
                {i + 1}. {st.title || st.label}
              </Text>
              {st.code && (
                <Text as="pre" className="rounded bg-muted/50 p-2 text-xs overflow-x-auto">
                  {st.code}
                </Text>
              )}
            </View>
          ))}
        </View>
      );
    case "widget":
      return (
        <View className="callout rounded-lg border border-dashed p-4 space-y-1">
          <Text as="p" className="font-medium">
            {sec.title}
          </Text>
          {sec.body && (
            <Text as="p" className="text-sm text-muted-foreground">
              <Inline text={sec.body} />
            </Text>
          )}
        </View>
      );
    default:
      return null;
  }
};

export default function ChapterReader({ content, actionData, session }: any) {
  const navigate = useNav().navigate;
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

  const parsed = rev?.md_content
    ? parseMd(rev.md_content)
    : { sections: [] };

  const markComplete = () => {
    if (chapter?.id == null) return;
    session?.update("progress", {
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
        onPress={() => navigate(`/courses/${chapter?.course_id ?? ""}`)}
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
      {parsed.sections.map((sec, i) => (
        <Section key={i} sec={sec} base={chapter?.content_base} />
      ))}
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

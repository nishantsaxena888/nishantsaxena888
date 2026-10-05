// md-render — shared md++ renderer. parseMd() output → typed widgets.
// Used by chapter-reader (learn surface) and md-viewer (any page). A
// `widget` section (unknown/extended directive) resolves through the
// tenant component map as `md-<tag>` — a client registers e.g.
// "md-githubexplorer" in its site tenant and <GitHubExplorer …/>
// directives in markdown render as real components. Unregistered tags
// degrade to the attr callout — never a crash.
import { useMemo, useState } from "react";
import {
  Anchor,
  Image,
  Pressable,
  Text,
  View,
} from "@/platform/primitives";
import { mdAnchor, type MdSection } from "./md-sections";
import MermaidDiagram from "./mermaid-diagram";

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

// Relative asset refs inside md (image-1.png, screenshots/x.png) resolve
// against the content's base — same convention as the source repo.
export const resolveSrc = (src: string, base?: string) =>
  src && !/^(https?:)?\/\//.test(src) && !src.startsWith("/") && base
    ? `${base.replace(/\/?$/, "/")}${src}`
    : src;

// HTML entities commonly found inside imported md — decode before
// rendering so "Show &amp; Tell" doesn't leak markup.
export const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");

// Minimal inline md: **bold**, `code`, [text](url). No italic-* parsing
// (rare in course md, keeps the tokenizer trivial).
export const Inline = ({ text: raw }: { text: string }) => {
  const text = decodeEntities(raw);
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

const Quiz = ({
  sec,
  onAnswer,
}: {
  sec: Extract<MdSection, { type: "quiz" }>;
  onAnswer?: (correct: boolean) => void;
}) => {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  const pick = (i: number) => {
    if (done) return;
    setPicked(i);
    onAnswer?.(i === sec.answerIndex);
  };
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
          onPress={() => pick(i)}
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

export type MdWidgetResolver = (
  sec: Extract<MdSection, { type: "widget" }>,
) => React.ReactNode | undefined;

const Section = ({
  sec,
  base,
  index,
  onQuizAnswer,
  resolveWidget,
}: {
  sec: MdSection;
  base?: string;
  index: number;
  onQuizAnswer?: (correct: boolean, index: number) => void;
  resolveWidget?: MdWidgetResolver;
}) => {
  switch (sec.type) {
    case "heading": {
      const id = mdAnchor(sec.text);
      return sec.level <= 2 ? (
        <Text as="h2" id={id} className="text-xl font-semibold mt-6 scroll-mt-20">
          <Inline text={sec.text} />
        </Text>
      ) : (
        <Text as="h3" id={id} className="text-lg font-semibold mt-4 scroll-mt-20">
          <Inline text={sec.text} />
        </Text>
      );
    }
    case "paragraph":
      return (
        <Text as="p" className="leading-7">
          <Inline text={sec.text} />
        </Text>
      );
    case "code":
      if (sec.lang === "mermaid") return <MermaidDiagram code={sec.code} />;
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
    case "table":
      return (
        <View className="md-table-wrap overflow-x-auto rounded-lg border">
          <View as="table" className="md-table">
            <View as="thead">
              <View as="tr">
                {sec.header.map((h, i) => (
                  <Text as="th" key={i}>
                    <Inline text={h} />
                  </Text>
                ))}
              </View>
            </View>
            <View as="tbody">
              {sec.rows.map((r, i) => (
                <View as="tr" key={i}>
                  {r.map((cell, j) => (
                    <Text as="td" key={j}>
                      <Inline text={cell} />
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
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
      return (
        <Quiz
          sec={sec}
          onAnswer={onQuizAnswer ? (c) => onQuizAnswer(c, index) : undefined}
        />
      );
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
    case "widget": {
      const custom = resolveWidget?.(sec);
      if (custom !== undefined) return <>{custom}</>;
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
    }
    default:
      return null;
  }
};

export interface MdDocProps {
  sections: MdSection[];
  base?: string;
  onQuizAnswer?: (correct: boolean, index: number) => void;
  resolveWidget?: MdWidgetResolver;
  className?: string;
}

// Renders parsed md++ sections. Plain `space-y-4` flow — the surrounding
// component owns the article/chrome.
export function MdDoc({
  sections,
  base,
  onQuizAnswer,
  resolveWidget,
  className,
}: MdDocProps) {
  return (
    <View className={className ?? "space-y-4"}>
      {sections.map((sec, i) => (
        <Section
          key={i}
          sec={sec}
          index={i}
          base={base}
          onQuizAnswer={sec.type === "quiz" ? onQuizAnswer : undefined}
          resolveWidget={resolveWidget}
        />
      ))}
    </View>
  );
}

// Table-of-contents rows for `md-viewer`'s content.toc — heading
// anchors only, deduped by anchor id.
export const MdToc = ({ sections }: { sections: MdSection[] }) => {
  const heads = sections.filter(
    (s): s is Extract<MdSection, { type: "heading" }> => s.type === "heading",
  );
  if (heads.length < 2) return null;
  return (
    <View className="md-toc rounded-lg border p-3 space-y-1">
      {heads.map((h, i) => (
        <Anchor
          key={i}
          to={`#${mdAnchor(h.text)}`}
          className={`block text-sm ${h.level > 2 ? "pl-4" : ""} text-muted-foreground hover:text-foreground`}
        >
          {h.text}
        </Anchor>
      ))}
    </View>
  );
};

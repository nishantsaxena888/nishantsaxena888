// md-sections — parses course markdown into typed sections for the
// generic chapter reader. Port of the Uday_AWS moduleParser contract:
// markdown blocks + embedded JSX-style directives (<Quiz/>, <InfoCard>,
// <VideoSection/>…) become typed sections the reader renders as widgets.
//
// Pure + dependency-free (works under Metro/Hermes — no eval, no DOM).

export type MdSection =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "image"; src: string; alt: string }
  | { type: "callout"; variant: string; title: string; body: string }
  | { type: "quiz"; question: string; options: string[]; answerIndex: number; explanation?: string }
  | { type: "video"; youtubeId: string; title?: string }
  | { type: "hotspot"; src: string; hotspots: any[] }
  | { type: "gallery"; images: any[] }
  | { type: "steps"; title: string; steps: any[] }
  | {
      type: "widget";
      tag: string;
      title: string;
      body: string;
      // Raw directive attrs — a registered `md-<tag>` component in the
      // tenant map receives these as props; without one the widget
      // degrades to the attr callout (title/body).
      attrs?: Record<string, any>;
    };

export type ParsedMd = { sections: MdSection[] };

// Stable heading anchors — deep links + reviewer comment anchors. A
// leading section number wins ("3.9 Deployments" → "3-9"); otherwise the
// title slugifies. Same convention as the source platform's concept ids.
export const mdAnchor = (text: string): string => {
  const num = /^(\d+(?:\.\d+)*)\b/.exec(text.trim());
  if (num) return num[1].replace(/\./g, "-");
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
};

// ---- literal evaluator -------------------------------------------------
// JS-ish literals from directive attrs: "str" | 'str' | 12 | true | null |
// […] | {key: v} with unquoted/quoted keys. No eval — recursive descent.

type P = { s: string; i: number };

const ws = (p: P) => {
  while (p.i < p.s.length && /\s/.test(p.s[p.i])) p.i++;
};

const ident = (p: P): string | undefined => {
  ws(p);
  const m = /[A-Za-z_$][\w$]*/.exec(p.s.slice(p.i));
  if (m) p.i += m[0].length;
  return m?.[0];
};

const str = (p: P): string | undefined => {
  ws(p);
  const q = p.s[p.i];
  if (q !== '"' && q !== "'") return undefined;
  let out = "";
  for (p.i++; p.i < p.s.length; p.i++) {
    const c = p.s[p.i];
    if (c === "\\") {
      const n = p.s[++p.i];
      out += n === "n" ? "\n" : n === "t" ? "\t" : n;
    } else if (c === q) {
      p.i++;
      return out;
    } else out += c;
  }
  return undefined; // unterminated
};

const num = (p: P): number | undefined => {
  ws(p);
  const m = /-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(p.s.slice(p.i));
  if (!m || (m.index ?? 0) !== 0) return undefined;
  p.i += m[0].length;
  return Number(m[0]);
};

const value = (p: P): any => {
  ws(p);
  const c = p.s[p.i];
  if (c === '"' || c === "'") return str(p);
  if (c === "[") {
    p.i++;
    const arr: any[] = [];
    for (;;) {
      ws(p);
      if (p.s[p.i] === "]") return p.i++, arr;
      const v = value(p);
      if (v === undefined) return arr;
      arr.push(v);
      ws(p);
      if (p.s[p.i] === ",") p.i++;
    }
  }
  if (c === "{") {
    p.i++;
    const obj: any = {};
    for (;;) {
      ws(p);
      if (p.s[p.i] === "}") return p.i++, obj;
      const key = str(p) ?? ident(p);
      if (key === undefined) return obj;
      ws(p);
      if (p.s[p.i] === ":") p.i++;
      obj[key] = value(p);
      ws(p);
      if (p.s[p.i] === ",") p.i++;
    }
  }
  const kw = /^(true|false|null|undefined)\b/.exec(p.s.slice(p.i));
  if (kw) {
    p.i += kw[1].length;
    return kw[1] === "true" ? true : kw[1] === "false" ? false : kw[1] === "null" ? null : undefined;
  }
  const n = num(p);
  if (n !== undefined) return n;
  // Bare token (e.g. unquoted identifier used as a value) — keep as string.
  const bare = /^[^\s,}\]]+/.exec(p.s.slice(p.i));
  if (bare) {
    p.i += bare[0].length;
    return bare[0];
  }
  return undefined;
};

export const evalLiteral = (s: string): any => {
  const p: P = { s: s ?? "", i: 0 };
  return value(p);
};

// Directive attrs arrive as raw strings (quotes already stripped by
// parseAttrs; {}-wrapped literals arrive brace-less). evalLiteral maps
// each back to its real value — […]→array, "12"→12 — but ONLY when the
// whole string parses ("3-9 foo" must stay a string, not truncate to 3).
// This is what `md-<tag>` components receive as props.
const evalAttr = (v: string): any => {
  const p: P = { s: v, i: 0 };
  const out = value(p);
  ws(p);
  return p.i === v.length && out !== undefined ? out : v;
};

const evalAttrs = (a: Record<string, any>): Record<string, any> =>
  Object.fromEntries(
    Object.entries(a).map(([k, v]) => [
      k,
      typeof v === "string" ? evalAttr(v) : v,
    ]),
  );

// ---- directive attrs ----------------------------------------------------

const unescapeCode = (s: string) =>
  (s || "")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");

const parseAttrs = (s = ""): Record<string, any> => {
  const attrs: Record<string, any> = {};
  const re = /(\w+)\s*=\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const i = re.lastIndex;
    const c = s[i];
    let val: string, end: number;
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < s.length && (s[j] !== c || s[j - 1] === "\\")) j++;
      val = s.slice(i + 1, j);
      end = j + 1;
    } else if (c === "{" || c === "[") {
      const close = c === "{" ? "}" : "]";
      let depth = 0,
        j = i,
        quote: string | null = null;
      for (; j < s.length; j++) {
        const ch = s[j];
        if (quote) {
          if (ch === quote && s[j - 1] !== "\\") quote = null;
          continue;
        }
        if (ch === '"' || ch === "'") quote = ch;
        else if (ch === c) depth++;
        else if (ch === close) {
          depth--;
          if (!depth) break;
        }
      }
      val = c === "{" ? s.slice(i + 1, j) : s.slice(i, j + 1);
      end = j + 1;
    } else {
      const um = /^[^\s/>]+/.exec(s.slice(i));
      val = um ? um[0] : "";
      end = i + val.length;
    }
    attrs[m[1]] = val;
    re.lastIndex = end;
  }
  return attrs;
};

const tagEnd = (s: string, from: number): number => {
  let quote: string | null = null;
  let brace = 0;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote && s[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "{" || c === "[") brace++;
    else if (c === "}" || c === "]") brace = Math.max(0, brace - 1);
    else if (c === ">" && brace === 0) return i;
  }
  return -1;
};

// Paired container tags → callout sections.
const CARD_VARIANT: Record<string, string> = {
  InfoCard: "info",
  TipCard: "tip",
  WarningCard: "warning",
  SuccessCard: "success",
  NoteCard: "note",
  Note: "note",
  Tip: "tip",
  Warning: "warning",
  ConceptCard: "concept",
  KeyTakeaways: "key-takeaways",
  SectionCard: "section",
  WhyItMatters: "why",
  GoalCard: "goal",
  OutcomeCard: "outcome",
};
const CARD_RE = new RegExp(`^(${Object.keys(CARD_VARIANT).join("|")})$`);
const HTML_VOID = /^(br|hr|img|input|source|meta|link|div|span|p|a|b|i|em|strong|u|table|thead|tbody|tr|td|th|ul|ol|li|details|summary)$/i;

const TEXT_ATTRS = ["title", "subtitle", "motto", "description", "whatItDoes", "clickInstructions"];

const attrCallout = (tag: string, a: Record<string, any>): MdSection => ({
  type: "widget",
  tag,
  title: unescapeCode(a.title || a.sectionTitle || tag),
  body: TEXT_ATTRS.map((k) => unescapeCode(a[k] || ""))
    .filter(Boolean)
    .join("\n"),
  attrs: evalAttrs(a),
});

// self-closing (or Quiz) directive → section
const directive = (tag: string, attrStr: string): MdSection | null => {
  const a = parseAttrs(attrStr);
  switch (tag) {
    case "Quiz":
      return {
        type: "quiz",
        question: unescapeCode(a.question || ""),
        options: evalLiteral(a.options) || [],
        answerIndex: Number(evalLiteral(a.answerIndex ?? a.correctIndex ?? "0")) || 0,
        explanation: unescapeCode(a.explanation || a.why || "") || undefined,
      };
    case "VideoSection":
      return {
        type: "video",
        youtubeId: a.youtubeId || a.videoId || "",
        title: unescapeCode(a.title || "") || undefined,
      };
    case "HotspotImage":
      return { type: "hotspot", src: a.src || "", hotspots: evalLiteral(a.hotspots) || [] };
    case "ImageGallery":
      return { type: "gallery", images: evalLiteral(a.images) || [] };
    case "CodeExecutionPlayer":
      return {
        type: "steps",
        title: unescapeCode(a.title || "Code walkthrough"),
        steps: evalLiteral(a.steps) || [],
      };
    case "CodeExplorer":
    case "GitHubExplorer":
      // Live-repo explorer — reader degrades to a link card unless the
      // tenant registers an `md-codeexplorer`/`md-githubexplorer` comp.
      return {
        type: "widget",
        tag,
        title: unescapeCode(a.title || "Code explorer"),
        body: a.repo ? `Repository: ${a.repo}${a.ref ? ` @ ${a.ref}` : ""}` : "",
        attrs: evalAttrs(a),
      };
    case "Conversation":
      return {
        type: "widget",
        tag,
        title: unescapeCode(a.title || "Conversation"),
        body: "",
        attrs: evalAttrs(a),
      };
    case "FlowDiagram":
    case "AgentFlowStoryteller":
      return attrCallout(tag, a);
    default:
      return null;
  }
};

// Replace embedded directives with in-place sentinel lines
// (@@MDSEC:N@@ → extras[N]) so widgets keep their document position.
const SENTINEL = /^@@MDSEC:(\d+)@@$/;

const extractDirectives = (md: string): { body: string; extras: MdSection[] } => {
  const extras: MdSection[] = [];
  const marker = (s: MdSection) => `\n\n@@MDSEC:${extras.push(s) - 1}@@\n\n`;
  let out = "";
  let i = 0;
  while (i < md.length) {
    if (md[i] !== "<") {
      out += md[i++];
      continue;
    }
    const open = md.slice(i).match(/^<([A-Za-z]\w*)\s*/);
    if (!open) {
      out += md[i++];
      continue;
    }
    const tag = open[1];
    const attrStart = i + open[0].length;
    const end = tagEnd(md, attrStart);
    if (end === -1) {
      out += md[i++];
      continue;
    }
    const attrStr = md.slice(attrStart, end);
    const selfClosing = md[end - 1] === "/";

    // Paired card tags: <InfoCard ...>body</InfoCard>
    if (CARD_RE.test(tag) && !selfClosing) {
      const close = md.indexOf(`</${tag}>`, end);
      if (close !== -1) {
        const inner = md.slice(end + 1, close);
        out += marker({
          type: "callout",
          variant: CARD_VARIANT[tag],
          title: unescapeCode(parseAttrs(attrStr).title || ""),
          body: inner.trim(),
        });
        i = close + tag.length + 3;
        continue;
      }
    }

    if (selfClosing || tag === "Quiz") {
      const sec = directive(tag, attrStr);
      if (sec) {
        out += marker(sec);
        i = end + 1;
        continue;
      }
      // Unknown self-closing widget → attr callout (keep the info).
      if (selfClosing && /^[A-Z]/.test(tag) && !HTML_VOID.test(tag)) {
        const a = parseAttrs(attrStr);
        if (Object.keys(a).length) out += marker(attrCallout(tag, a));
        i = end + 1;
        continue;
      }
    }

    // Unknown paired tag / plain HTML — copy through untouched.
    out += md.slice(i, end + 1);
    i = end + 1;
  }
  return { body: out, extras };
};

// ---- block parser --------------------------------------------------------

const HEADING = /^(#{1,6})\s+(.*)$/;
const FENCE = /^```(\w*)\s*$/;
const IMG = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/;
const LI = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;

const isBlank = (l: string) => l.trim() === "";

export function parseMd(md: string): ParsedMd {
  const { body, extras } = extractDirectives(md);
  const sections: MdSection[] = [];
  const lines = body.split("\n");
  let i = 0;
  let para: string[] = [];

  const flushPara = () => {
    const text = para.join(" ").trim();
    if (text) sections.push({ type: "paragraph", text });
    para = [];
  };
  const flushQuote = (q: string[]) => {
    const title = q[0]?.match(/^\*\*(.+)\*\*$/)?.[1];
    const rest = title ? q.slice(1) : q;
    sections.push({
      type: "callout",
      variant: "quote",
      title: title || "",
      body: rest.join("\n").trim(),
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    const f = FENCE.exec(line.trim());
    if (f) {
      flushPara();
      const lang = f[1] || "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) buf.push(lines[i++]);
      i++; // skip closing fence
      sections.push({ type: "code", lang, code: buf.join("\n") });
      continue;
    }

    const h = HEADING.exec(line);
    if (h) {
      flushPara();
      sections.push({ type: "heading", level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }

    const im = IMG.exec(line.trim());
    if (im) {
      flushPara();
      sections.push({ type: "image", src: im[2], alt: im[1] });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      flushPara();
      const q: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        q.push(QUOTE.exec(lines[i])![1]);
        i++;
      }
      flushQuote(q);
      continue;
    }

    const li = LI.exec(line);
    if (li && !isBlank(li[3])) {
      flushPara();
      const ordered = /^\d/.test(li[2]);
      const items: string[] = [];
      while (i < lines.length) {
        const m = LI.exec(lines[i]);
        if (!m || /^\d/.test(m[2]) !== ordered) break;
        items.push(m[3].trim());
        i++;
      }
      sections.push({ type: "list", ordered, items });
      continue;
    }

    if (isBlank(line)) {
      flushPara();
      i++;
      continue;
    }

    // GFM table — | a | b | header row, |---|---| separator, then rows.
    if (/^\|.*\|\s*$/.test(line.trim())) {
      const cells = (l: string) =>
        l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const header = cells(line);
      const rows: string[][] = [];
      i++;
      if (i < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i].trim())) i++;
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i].trim())) {
        rows.push(cells(lines[i]));
        i++;
      }
      flushPara();
      sections.push({ type: "table", header, rows });
      continue;
    }

    const sent = SENTINEL.exec(line.trim());
    if (sent) {
      flushPara();
      const idx = Number(sent[1]);
      if (extras[idx]) sections.push(extras[idx]);
      i++;
      continue;
    }

    // Horizontal rule / stray HTML — skip silently.
    if (/^(-{3,}|\*{3,}|_{3,}|<[^>]+>\s*)$/.test(line.trim())) {
      flushPara();
      i++;
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara();

  return { sections };
}

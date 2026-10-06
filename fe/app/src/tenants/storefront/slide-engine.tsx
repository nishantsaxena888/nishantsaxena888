// Generic slide engine — renders a chapter's structured `sections[]`
// (typed lesson content) the same way across clients. Every piece of
// copy, command output, quiz answer and lab step comes from the entity
// record; the component owns only interaction state (terminal lines,
// accordion toggles, selected options).
//
// Section types: text|why|concept|expected-output|what-happened|cleanup
// (html blob), architecture (svg nodes/edges), code, command, terminal,
// lab, quiz, challenge, troubleshooting, interview, next, fallback html.
//
// Progress is reported through optional callbacks so the host page can
// wire its own session/entity writes (quiz submissions, lab completion,
// command counters). All UI strings resolve through `labels` —
// {key: "…", other: "… {var}"} merged over DEFAULT_LABELS — so a page
// def can restyle the copy per client without touching the engine.
import { useEffect, useRef, useState, useId } from "react";
import { Image, Pressable, Text, TextInput, View } from "@/platform/primitives";
import { useNav } from "@/platform/navigation";

export type SlideLabels = Record<string, string>;

type Props = {
  sections?: any[];
  labels?: SlideLabels;
  onQuizComplete?: (sectionId: string, correct: number, total: number) => void;
  onQuizAnswer?: (correct: boolean, index: number) => void;
  onLabComplete?: (sectionId: string) => void;
  onCommand?: () => void;
  onNavigate?: (target: string) => void;
};

// Engine copy — every string a slide renders. A page def overrides any
// subset via content.labels; {var} placeholders interpolate per use.
const DEFAULT_LABELS: SlideLabels = {
  diagram_hint: "Click components to inspect",
  diagram_payload: "Event Payload",
  question: "Question {n}",
  correct: "✅ Correct",
  incorrect: "❌ Incorrect",
  quiz_complete: "Quiz complete: {a}/{b}",
  run: "Run",
  copy: "Copy",
  copied: "✓ Copied",
  lang_default: "cli",
  show_expected: "Show expected output",
  hide_expected: "Hide expected output",
  common_errors: "⚠️ Common errors ({n})",
  cause: "Cause:",
  fix: "Fix:",
  prevention: "Prevention:",
  interview_question: "Interview question",
  terminal_title: "terminal",
  terminal_mode: "simulated",
  help_header: "Available commands:",
  cmd_not_found: 'command not found: {cmd} — type "help" for available commands',
  code_label: "code",
  explanations: "📖 Line-by-line explanation ({n})",
  lab_progress: "Lab Progress",
  mark_complete: "✓ Mark Complete",
  completed: "✓ Completed",
  hint: "💡 Hint",
  expected: "Expected:",
  requirements: "Requirements",
  starter: "starter",
  run_checks: "Run checks",
  hints: "💡 Hints ({n})",
  issue: "Issue {n}",
  short_answer: "Short Answer:",
  deep_explanation: "Deep Explanation:",
  real_example: "📌 Real-world Example:",
  common_mistake: "⚠️ Common Mistake:",
  follow_up: "➔ Follow-up:",
  prev_chapter: "← Previous Chapter",
  next_chapter: "Next Chapter →",
  diff_beginner: "🌱 Beginner",
  diff_intermediate: "📈 Intermediate",
  diff_advanced: "🚀 Advanced",
  diff_scenario: "🎯 Scenario-Based",
  diff_troubleshooting: "🔧 Troubleshooting",
  diff_general: "❓ Q&A",
};

const lf = (L: SlideLabels, key: string, vars: Record<string, any> = {}) =>
  (L[key] ?? key).replace(/\{(\w+)\}/g, (_m, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );

const SECTION_ICONS: Record<string, string> = {
  why: "💡", architecture: "📐", concept: "📖", lab: "🔬", console: "🖥️",
  terminal: "💻", code: "👨‍💻", command: "⌨️", "expected-output": "📤",
  "what-happened": "🔍", troubleshooting: "🔧", quiz: "🧠", challenge: "🏆",
  cleanup: "🧹", next: "➡️", text: "📝", interview: "🎙️", storyteller: "🎬",
  flowdiagram: "🧩", conversation: "💬", hotspotimage: "🖱️",
};

const HTML_TYPES = new Set([
  "text", "why", "concept", "expected-output", "what-happened", "cleanup",
]);

/* ---------- html blob (text/why/concept/…/cleanup) ---------- */

let mmSeq = 0;
let mmPromise: Promise<any> | null = null;
const loadMermaid = () => {
  if (!mmPromise) {
    mmPromise = import("mermaid").then((m) => {
      const lib = m.default || m;
      lib.initialize({ startOnLoad: false, theme: "neutral" });
      return lib;
    });
  }
  return mmPromise;
};

function SlideHtml({ html }: { html: string }) {
  const ref = useRef<any>(null);
  const [zoom, setZoom] = useState<{ src: string; alt?: string } | null>(null);

  // ```mermaid fences inside authored html → svg (same lazy path as
  // mermaid-diagram); non-DOM runtimes skip silently.
  useEffect(() => {
    const host = ref.current;
    if (!host?.querySelectorAll) return;
    const blocks = host.querySelectorAll(
      "pre code.language-mermaid, pre.mermaid, code.language-mermaid",
    );
    if (!blocks.length) return;
    loadMermaid()
      .then(async (m) => {
        for (const b of Array.from(blocks) as any[]) {
          const code = b.textContent || "";
          const holder = b.closest("pre") || b;
          try {
            const { svg } = await m.render(`se-mm-${mmSeq++}`, code);
            const wrap = document.createElement("div");
            wrap.className = "mermaid-diagram";
            wrap.innerHTML = svg;
            holder.replaceWith(wrap);
          } catch {
            /* leave the source block */
          }
        }
      })
      .catch(() => {});
  }, [html]);

  useEffect(() => {
    if (!zoom || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const onPress = (e: any) => {
    const img = e.target?.closest?.("img");
    if (img && !e.target.closest("a")) {
      setZoom({ src: img.currentSrc || img.src, alt: img.alt });
    }
  };

  return (
    <>
      <View
        ref={ref}
        className="slide-html"
        onClick={onPress}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {zoom && (
        <Pressable className="img-zoom-overlay" onPress={() => setZoom(null)}>
          <Image src={zoom.src} alt={zoom.alt} />
          {zoom.alt && <View className="img-zoom-caption">{zoom.alt}</View>}
          <Text className="img-zoom-x">✕</Text>
        </Pressable>
      )}
    </>
  );
}

/* ---------- architecture diagram (svg nodes + edges) ---------- */

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  trigger:    { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  compute:    { bg: "#fed7aa", border: "#f97316", text: "#9a3412" },
  storage:    { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  event:      { bg: "#d1fae5", border: "#10b981", text: "#065f46" },
  output:     { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
  client:     { bg: "#f1f5f9", border: "#64748b", text: "#334155" },
  monitoring: { bg: "#fce7f3", border: "#ec4899", text: "#9d174d" },
  security:   { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  network:    { bg: "#e0f2fe", border: "#0ea5e9", text: "#075985" },
};

const decodeEnt = (s: string) => {
  if (typeof document === "undefined") return s;
  const t = document.createElement("textarea");
  t.innerHTML = s || "";
  return t.value;
};

const wrapLabel = (label: string, max = 18) => {
  const s = decodeEnt(label || "");
  if (s.length <= max) return [s];
  const dashParts = s.split(/\s+[—–]\s+/);
  const lines =
    dashParts.length > 1
      ? [dashParts[0], dashParts.slice(1).join(" — ")]
      : (() => {
          const out = [""];
          for (const w of s.split(" ")) {
            const cur = out[out.length - 1];
            if (cur && (cur + " " + w).length > max) {
              out.push(w);
              if (out.length === 2) break;
            } else out[out.length - 1] = cur ? `${cur} ${w}` : w;
          }
          return out;
        })();
  return lines
    .slice(0, 2)
    .map((l) => (l.length > max + 4 ? l.slice(0, max + 3) + "…" : l));
};

function SlideDiagram({ content = {}, L }: any) {
  const uid = useId().replace(/:/g, "");
  const [selected, setSelected] = useState<any>(null);
  const nodes = content.nodes || [];
  const edges = content.edges || [];
  const width = content.width || 800;
  const height = content.height || 400;
  const byId = Object.fromEntries(nodes.map((n: any) => [n.id, n]));

  return (
    <View className="diagram-wrapper">
      {content.title && (
        <View className="diagram-titlebar">
          <Text style={{ fontSize: 18 }}>📐</Text>
          <Text className="diagram-title">{content.title}</Text>
          <Text className="diagram-hint">{lf(L, "diagram_hint")}</Text>
        </View>
      )}
      <View className="diagram-scroll">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: "block", margin: "0 auto" }}
        >
          <defs>
            <marker
              id={`arrow-${uid}`}
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
            <filter id={`shadow-${uid}`}>
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
            </filter>
          </defs>
          {edges.map((e: any, i: number) => {
            const from = byId[e.from];
            const to = byId[e.to];
            if (!from || !to) return null;
            const x1 = from.x + 60, y1 = from.y + 30;
            const x2 = to.x + 60, y2 = to.y + 30;
            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#cbd5e1" strokeWidth="2"
                  markerEnd={`url(#arrow-${uid})`}
                  strokeDasharray={e.animated ? "8 4" : undefined}
                  className={e.animated ? "diagram-edge-animated" : undefined}
                />
                {e.label && (
                  <text
                    x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8}
                    textAnchor="middle" fill="#94a3b8" fontSize="11"
                    fontFamily="Inter, sans-serif"
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {nodes.map((node: any) => {
            const colors = NODE_COLORS[node.type] || NODE_COLORS.client;
            const lines = wrapLabel(node.label);
            const twoLine = lines.length > 1;
            return (
              <g
                key={node.id}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(node)}
              >
                <rect
                  x={node.x} y={node.y} width="120" height="60" rx="10"
                  fill={colors.bg}
                  stroke={selected?.id === node.id ? "#f97316" : colors.border}
                  strokeWidth={selected?.id === node.id ? 3 : 2}
                  filter={`url(#shadow-${uid})`}
                />
                <text
                  x={node.x + 60} y={node.y + (twoLine ? 16 : 22)}
                  textAnchor="middle" fontSize="18"
                >
                  {decodeEnt(node.icon || "☁️")}
                </text>
                <text
                  x={node.x + 60} y={node.y + (twoLine ? 36 : 44)}
                  textAnchor="middle" fill={colors.text} fontSize="11"
                  fontWeight="600" fontFamily="Inter, sans-serif"
                >
                  {lines.map((l, i) => (
                    <tspan key={i} x={node.x + 60} dy={i === 0 ? 0 : 13}>{l}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </View>
      {selected && (
        <View className="diagram-detail">
          <View className="diagram-detail-head">
            <Text style={{ fontSize: 24 }}>{decodeEnt(selected.icon || "☁️")}</Text>
            <View>
              <Text as="div" className="diagram-detail-label">{decodeEnt(selected.label)}</Text>
              <Text as="div" className="diagram-detail-type">{selected.type || ""}</Text>
            </View>
          </View>
          {selected.description && (
            <View className="diagram-detail-desc">{selected.description}</View>
          )}
          {selected.eventPayload && (
            <>
              <View className="diagram-detail-payload-label">{lf(L, "diagram_payload")}</View>
              <View as="pre" className="diagram-detail-payload">
                {typeof selected.eventPayload === "string"
                  ? selected.eventPayload
                  : JSON.stringify(selected.eventPayload, null, 2)}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

/* ---------- quiz ---------- */

function QuizQuestion({ q, index, onAnswered, L }: any) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correct = answered && selected === q.correctId;
  const choose = (optId: string) => {
    if (answered) return;
    setSelected(optId);
    onAnswered?.(q.id, optId === q.correctId);
  };
  return (
    <View className="quiz-card">
      <View className="quiz-header">
        <View className="quiz-icon">🧠</View>
        <View>
          <View className="quiz-type">
            {lf(L, "question", { n: index + 1 })}
            {q.difficulty ? ` · ${q.difficulty}` : ""}
          </View>
          <View className="quiz-question">{q.question}</View>
        </View>
      </View>
      <View className="quiz-options">
        {(q.options || []).map((opt: any, i: number) => {
          let cls = "quiz-option";
          if (answered) {
            if (opt.id === q.correctId) cls += " correct";
            else if (opt.id === selected) cls += " incorrect";
          } else if (opt.id === selected) cls += " selected";
          return (
            <Pressable key={opt.id || i} className={cls} onPress={() => choose(opt.id)}>
              <Text className="quiz-option-letter">{String.fromCharCode(65 + i)}</Text>
              <Text>{opt.text}</Text>
            </Pressable>
          );
        })}
      </View>
      {answered && (
        <>
          <View className={`quiz-result ${correct ? "quiz-result-correct" : "quiz-result-incorrect"}`}>
            {correct ? lf(L, "correct") : lf(L, "incorrect")}
          </View>
          {q.explanation && (
            <View className="quiz-explanation visible" style={{ marginTop: 12 }}>
              {q.explanation}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function SlideQuiz({ content = {}, sectionId, onQuizAnswer, onQuizComplete, L }: any) {
  const questions = content.questions || [];
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const recorded = useRef(false);
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(Boolean).length;

  useEffect(() => {
    if (questions.length > 0 && answeredCount === questions.length && !recorded.current) {
      recorded.current = true;
      onQuizComplete?.(sectionId || "quiz", correctCount, questions.length);
    }
  }, [answeredCount, correctCount, questions.length, onQuizComplete, sectionId]);

  return (
    <View>
      {content.title && (
        <View className="progress-label">
          <Text className="progress-label-title">{content.title}</Text>
          <Text className="progress-label-value">
            {answeredCount === questions.length && questions.length > 0
              ? lf(L, "quiz_complete", { a: correctCount, b: questions.length })
              : `${answeredCount}/${questions.length}`}
          </Text>
        </View>
      )}
      {questions.map((q: any, i: number) => (
        <QuizQuestion
          key={q.id || i}
          q={q}
          index={i}
          L={L}
          onAnswered={(_id: string, ok: boolean) => {
            setAnswers((a) => ({ ...a, [q.id || i]: ok }));
            onQuizAnswer?.(ok, i);
          }}
        />
      ))}
    </View>
  );
}

/* ---------- command blocks ---------- */

function CommandBlock({ cmd, onCommand, L }: any) {
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [showExpected, setShowExpected] = useState(false);
  const [errorsOpen, setErrorsOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd.command || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  const run = () => {
    onCommand?.();
    if (cmd.expectedOutput) setOutput(cmd.expectedOutput);
  };

  return (
    <View>
      <View className="code-block">
        <View className="code-block-header">
          <Text className="code-block-lang">{cmd.category || lf(L, "lang_default")}</Text>
          <View className="code-block-actions">
            {cmd.expectedOutput && (
              <Pressable className="btn btn-xs btn-ghost" onPress={run}>{lf(L, "run")}</Pressable>
            )}
            <Pressable className="btn btn-xs btn-ghost" onPress={copy}>
              {copied ? lf(L, "copied") : lf(L, "copy")}
            </Pressable>
          </View>
        </View>
        <View as="pre"><Text as="code">{cmd.command}</Text></View>
      </View>

      {cmd.explanation && (
        <Text as="p" style={{ fontSize: "var(--text-sm, 0.875rem)", color: "var(--se-n-600, #475569)" }}>
          {cmd.explanation}
        </Text>
      )}

      {output !== null && (
        <View className="terminal" style={{ marginBottom: 12 }}>
          <View className="terminal-body"><View className="terminal-output">{output}</View></View>
        </View>
      )}

      {cmd.expectedOutput && !output && (
        <>
          <Pressable className="btn btn-xs btn-secondary" onPress={() => setShowExpected((s) => !s)}>
            {showExpected ? lf(L, "hide_expected") : lf(L, "show_expected")}
          </Pressable>
          {showExpected && (
            <View className="terminal" style={{ marginTop: 8 }}>
              <View className="terminal-body"><View className="terminal-output">{cmd.expectedOutput}</View></View>
            </View>
          )}
        </>
      )}

      {Array.isArray(cmd.commonErrors) && cmd.commonErrors.length > 0 && (
        <View className={`accordion-item${errorsOpen ? " open" : ""}`} style={{ marginTop: 12 }}>
          <Pressable className="accordion-header" onPress={() => setErrorsOpen((s) => !s)}>
            <Text>{lf(L, "common_errors", { n: cmd.commonErrors.length })}</Text>
            <Text className="chevron">▼</Text>
          </Pressable>
          <View className="accordion-body">
            <View className="accordion-body-inner">
              {cmd.commonErrors.map((err: any, i: number) => (
                <View key={i} style={{ marginBottom: 12, fontSize: "var(--text-sm, 0.875rem)" }}>
                  <Text as="strong">{err.error}</Text>
                  {err.cause && <View><Text as="strong">{lf(L, "cause")}</Text> {err.cause}</View>}
                  {err.fix && <View><Text as="strong">{lf(L, "fix")}</Text> {err.fix}</View>}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {cmd.interviewQ && (
        <View className="alert alert-info" style={{ marginTop: 12 }}>
          <Text className="alert-icon">🎙️</Text>
          <View className="alert-content">
            <View className="alert-title">{lf(L, "interview_question")}</View>
            <View className="alert-text">{cmd.interviewQ}</View>
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------- simulated terminal ---------- */

function SlideTerminal({ content = {}, onCommand, L }: any) {
  const commands = content.commands || {};
  const [lines, setLines] = useState<any[]>(() =>
    content.initialText ? [{ kind: "output", text: content.initialText }] : [],
  );
  const [input, setInput] = useState("");
  const bodyRef = useRef<any>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  const submit = (e: any) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    const next = [...lines, { kind: "prompt", text: cmd }];
    if (cmd === "clear") {
      setLines([]);
    } else if (cmd === "help") {
      next.push({
        kind: "output",
        text: lf(L, "help_header") + "\n" + Object.keys(commands).join("\n"),
      });
      setLines(next);
    } else if (commands[cmd]) {
      onCommand?.();
      const resp = commands[cmd];
      next.push({
        kind: resp.type === "error" ? "error" : resp.type === "success" ? "success" : "output",
        text: resp.text,
      });
      if (resp.explanation) next.push({ kind: "output", text: `ℹ ${resp.explanation}` });
      setLines(next);
    } else {
      next.push({
        kind: "error",
        text: lf(L, "cmd_not_found", { cmd }),
      });
      setLines(next);
    }
    setInput("");
  };

  return (
    <View className="terminal">
      <View className="terminal-header">
        <Text className="terminal-dot terminal-dot-red" />
        <Text className="terminal-dot terminal-dot-yellow" />
        <Text className="terminal-dot terminal-dot-green" />
        <Text className="terminal-title">{content.title || lf(L, "terminal_title")}</Text>
        <Text className="terminal-badge terminal-badge-sim">{content.mode || lf(L, "terminal_mode")}</Text>
      </View>
      <View className="terminal-body" ref={bodyRef}>
        {lines.map((l, i) => (
          <View
            key={i}
            className={
              l.kind === "prompt" ? "terminal-prompt"
              : l.kind === "error" ? "terminal-error"
              : l.kind === "success" ? "terminal-success"
              : "terminal-output"
            }
          >
            {l.text}
          </View>
        ))}
        <View as="form" className="terminal-input-line" onSubmit={submit}>
          <Text className="terminal-prompt">›</Text>
          <TextInput
            className="terminal-input"
            value={input}
            onChangeText={setInput}
            autoComplete="off"
            aria-label="terminal input"
          />
        </View>
      </View>
    </View>
  );
}

/* ---------- code viewer ---------- */

function SlideCode({ content = {}, L }: any) {
  const languages = content.languages || [];
  const [activeLang, setActiveLang] = useState(content.defaultLang || languages[0]?.id);
  const [showOutput, setShowOutput] = useState(false);
  const [explanationsOpen, setExplanationsOpen] = useState(true);
  const lang = languages.find((l: any) => l.id === activeLang) || languages[0];

  return (
    <View>
      <View className="code-block">
        <View className="code-block-header">
          <Text className="code-block-lang">{content.title || lang?.label || lf(L, "code_label")}</Text>
          <View className="code-block-actions">
            {languages.map((l: any) => (
              <Pressable
                key={l.id}
                className={`btn btn-xs ${l.id === lang?.id ? "btn-secondary" : "btn-ghost"}`}
                onPress={() => setActiveLang(l.id)}
              >
                {l.label}
              </Pressable>
            ))}
          </View>
        </View>
        <View as="pre"><Text as="code">{lang?.code || ""}</Text></View>
      </View>

      {Array.isArray(lang?.explanations) && lang.explanations.length > 0 && (
        <View className={`accordion-item${explanationsOpen ? " open" : ""}`}>
          <Pressable className="accordion-header" onPress={() => setExplanationsOpen((s) => !s)}>
            <Text>{lf(L, "explanations", { n: lang.explanations.length })}</Text>
            <Text className="chevron">▼</Text>
          </Pressable>
          <View className="accordion-body">
            <View className="accordion-body-inner">
              {lang.explanations.map((ex: any, i: number) => (
                <View key={i} style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: "var(--text-sm, 0.875rem)" }}>
                  <Text as="code" style={{ flexShrink: 0 }}>L{ex.line}</Text>
                  <Text>{ex.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {content.expectedOutput && (
        <View style={{ marginTop: 12 }}>
          <Pressable className="btn btn-xs btn-secondary" onPress={() => setShowOutput((s) => !s)}>
            {showOutput ? lf(L, "hide_expected") : lf(L, "show_expected")}
          </Pressable>
          {showOutput && (
            <View className="terminal" style={{ marginTop: 8 }}>
              <View className="terminal-body"><View className="terminal-output">{content.expectedOutput}</View></View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/* ---------- lab checklist ---------- */

function SlideLab({ content = {}, sectionId, onLabComplete, L }: any) {
  const steps = content.steps || [];
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [openHint, setOpenHint] = useState<Record<string, boolean>>({});
  const recorded = useRef(false);
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const stepsRef = useRef<any>(null);

  useEffect(() => {
    const host = stepsRef.current;
    if (!host?.querySelectorAll) return;
    const blocks = host.querySelectorAll("pre code.language-mermaid, pre.mermaid");
    if (!blocks.length) return;
    loadMermaid().then(async (m) => {
      for (const b of Array.from(blocks) as any[]) {
        try {
          const { svg } = await m.render(`se-mm-${mmSeq++}`, b.textContent || "");
          const wrap = document.createElement("div");
          wrap.className = "mermaid-diagram";
          wrap.innerHTML = svg;
          (b.closest("pre") || b).replaceWith(wrap);
        } catch { /* keep source */ }
      }
    }).catch(() => {});
  }, [steps.length]);

  useEffect(() => {
    if (steps.length > 0 && doneCount === steps.length && !recorded.current) {
      recorded.current = true;
      onLabComplete?.(sectionId || "lab");
    }
  }, [doneCount, steps.length, onLabComplete, sectionId]);

  const toggle = (key: string) => setDone((d) => ({ ...d, [key]: !d[key] }));
  const nextOpen = steps.findIndex((s: any, i: number) => !done[s.id || i]);

  return (
    <View className="lab-card">
      {(content.title || content.description) && (
        <View className="lab-card-head">
          <View className="lab-card-icon">🧪</View>
          <View className="lab-card-head-main">
            <View className="lab-card-badges">
              <Text className={`badge difficulty-${content.difficulty || "beginner"}`}>
                {content.difficulty || "beginner"}
              </Text>
              {content.duration && (
                <Text className="badge badge-neutral">⏱ {content.duration}</Text>
              )}
            </View>
            {content.title && <View className="lab-card-title">{content.title}</View>}
            {content.description && <Text as="p" className="lab-card-desc">{content.description}</Text>}
          </View>
        </View>
      )}

      {steps.length > 0 && (
        <View className="lab-progress">
          <View className="progress-label">
            <Text className="progress-label-title">{lf(L, "lab_progress")}</Text>
            <Text className="progress-label-value">{pct}%</Text>
          </View>
          <View className="progress-bar">
            <View className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </View>
        </View>
      )}

      <View className="lab-steps" ref={stepsRef}>
        {steps.map((step: any, i: number) => {
          const key = step.id || String(i);
          const complete = !!done[key];
          const isCurrent = i === nextOpen;
          return (
            <View key={key} className={`lab-step${complete ? " done" : ""}${isCurrent ? " current" : ""}`}>
              <View className="lab-step-num">{complete ? "✓" : i + 1}</View>
              <View className="lab-step-body">
                <View className="lab-step-top">
                  <Text className="lab-step-title">{step.title}</Text>
                  <Pressable
                    className={`btn btn-xs ${complete ? "lab-step-btn-done" : "btn-success"}`}
                    onPress={() => toggle(key)}
                  >
                    {complete ? lf(L, "completed") : lf(L, "mark_complete")}
                  </Pressable>
                </View>
                {step.html ? (
                  <View className="slide-html step-html" dangerouslySetInnerHTML={{ __html: step.html }} />
                ) : (
                  step.instruction && <Text as="p" className="step-desc">{step.instruction}</Text>
                )}
                {step.expectedResult && (
                  <Text as="p" className="step-desc"><Text as="strong">{lf(L, "expected")}</Text> {step.expectedResult}</Text>
                )}
                {step.hint && (
                  <>
                    <Pressable
                      className="btn btn-xs btn-ghost"
                      onPress={() => setOpenHint((h) => ({ ...h, [key]: !h[key] }))}
                    >
                      {lf(L, "hint")}
                    </Pressable>
                    {openHint[key] && (
                      <View className="alert alert-warning" style={{ marginTop: 8, marginBottom: 0 }}>
                        <Text className="alert-icon">💡</Text>
                        <View className="alert-content"><View className="alert-text">{step.hint}</View></View>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- challenge ---------- */

function SlideChallenge({ content = {}, L }: any) {
  const [attempt, setAttempt] = useState(content.starterCode || "");
  const [results, setResults] = useState<any[] | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const testCases = content.testCases || [];

  const runChecks = () => {
    setResults(
      testCases.map((tc: any) => ({
        ...tc,
        pass: (tc.keywords || []).every((k: string) => attempt.includes(k)),
      })),
    );
  };

  return (
    <View className="card">
      <View className="card-body">
        {content.description && <Text as="p">{content.description}</Text>}
        {Array.isArray(content.requirements) && content.requirements.length > 0 && (
          <>
            <Text as="h4" style={{ marginTop: 16, marginBottom: 8 }}>{lf(L, "requirements")}</Text>
            <View as="ul">{content.requirements.map((r: string, i: number) => <Text as="li" key={i}>{r}</Text>)}</View>
          </>
        )}
        {content.starterCode && (
          <View className="code-block" style={{ marginTop: 16 }}>
            <View className="code-block-header">
              <Text className="code-block-lang">{content.language || lf(L, "code_label")} — {lf(L, "starter")}</Text>
            </View>
            <View as="pre"><Text as="code">{content.starterCode}</Text></View>
          </View>
        )}
        <TextInput
          multiline
          className="challenge-editor"
          value={attempt}
          onChangeText={(v: string) => { setAttempt(v); setResults(null); }}
          spellCheck={false}
          aria-label="challenge code attempt"
        />
        {testCases.length > 0 && (
          <Pressable className="btn btn-primary" onPress={runChecks} style={{ marginTop: 12 }}>
            {lf(L, "run_checks")}
          </Pressable>
        )}
        {results && (
          <View style={{ marginTop: 16 }}>
            {results.map((r, i) => (
              <View
                key={i}
                className={`quiz-result ${r.pass ? "quiz-result-correct" : "quiz-result-incorrect"}`}
                style={{ marginBottom: 6 }}
              >
                {r.pass ? "✅" : "❌"} {r.description}
              </View>
            ))}
          </View>
        )}
        {Array.isArray(content.hints) && content.hints.length > 0 && (
          <View className={`accordion-item${hintsOpen ? " open" : ""}`} style={{ marginTop: 16 }}>
            <Pressable className="accordion-header" onPress={() => setHintsOpen((s) => !s)}>
              <Text>{lf(L, "hints", { n: content.hints.length })}</Text>
              <Text className="chevron">▼</Text>
            </Pressable>
            <View className="accordion-body">
              <View className="accordion-body-inner">
                <View as="ul">{content.hints.map((h: string, i: number) => <Text as="li" key={i}>{h}</Text>)}</View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

/* ---------- troubleshooting / interview accordions ---------- */

function SlideTroubleshooting({ content = {}, L }: any) {
  const items = content.items || (Array.isArray(content) ? content : []);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <View>
      {content.intro && (
        <View className="slide-html" style={{ marginBottom: 16 }}
          dangerouslySetInnerHTML={{ __html: content.intro }} />
      )}
      {items.map((item: any, i: number) => (
        <View key={i} className={`accordion-item${open[i] ? " open" : ""}`}>
          <Pressable className="accordion-header"
            onPress={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
            <Text>⚠️ {item.error || item.title || lf(L, "issue", { n: i + 1 })}</Text>
            <Text className="chevron">▼</Text>
          </Pressable>
          <View className="accordion-body">
            <View className="accordion-body-inner">
              {item.cause && <Text as="p"><Text as="strong">{lf(L, "cause")}</Text> {item.cause}</Text>}
              {item.fix && <Text as="p"><Text as="strong">{lf(L, "fix")}</Text> {item.fix}</Text>}
              {item.prevention && <Text as="p"><Text as="strong">{lf(L, "prevention")}</Text> {item.prevention}</Text>}
              {item.html && <View dangerouslySetInnerHTML={{ __html: item.html }} />}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const DIFF_COLORS: Record<string, string> = {
  beginner: "#22c55e", intermediate: "#f59e0b", advanced: "#ef4444",
  scenario: "#f97316", troubleshooting: "#8b5cf6", general: "#64748b",
};
const DIFF_BG: Record<string, string> = {
  beginner: "#f0fdf4", intermediate: "#fffbeb", advanced: "#fef2f2",
  scenario: "#fff7ed", troubleshooting: "#f5f3ff", general: "#f1f5f9",
};
const DIFF_ORDER = ["beginner", "intermediate", "advanced", "scenario", "troubleshooting"];

function InterviewCard({ q, index, level, L }: any) {
  const [open, setOpen] = useState(false);
  return (
    <View
      className={`accordion-item${open ? " open" : ""}`}
      style={{ marginBottom: 8, borderLeft: `3px solid ${DIFF_COLORS[level] || "#6366f1"}` }}
    >
      <Pressable className="accordion-header" style={{ padding: "12px 16px" }}
        onPress={() => setOpen((o) => !o)}>
        <Text style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text style={{
            fontSize: 12, padding: "2px 8px", borderRadius: 4,
            background: DIFF_BG[level] || "#eef2ff",
            color: DIFF_COLORS[level] || "#6366f1", fontWeight: 600,
          }}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Text>
          <Text>Q{index + 1}: {q.question}</Text>
        </Text>
        <Text className="chevron">▼</Text>
      </Pressable>
      <View className="accordion-body">
        <View className="accordion-body-inner" style={{ padding: 16 }}>
          {q.shortAnswer && (
            <View style={{ marginBottom: 12 }}>
              <Text as="strong" style={{ color: "#16a34a" }}>{lf(L, "short_answer")}</Text><br />{q.shortAnswer}
            </View>
          )}
          {q.deepExplanation && (
            <View style={{ marginBottom: 12, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
              <Text as="strong">{lf(L, "deep_explanation")}</Text><br />{q.deepExplanation}
            </View>
          )}
          {q.example && (
            <View style={{ marginBottom: 12 }}>
              <Text as="strong">{lf(L, "real_example")}</Text><br />{q.example}
            </View>
          )}
          {q.commonMistake && (
            <View style={{ marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 6, borderLeft: "3px solid #ef4444" }}>
              <Text as="strong">{lf(L, "common_mistake")}</Text> {q.commonMistake}
            </View>
          )}
          {q.followUp && (
            <View style={{ marginTop: 8, padding: "8px 12px", background: "#eef2ff", borderRadius: 6 }}>
              <Text as="strong">{lf(L, "follow_up")}</Text> {q.followUp}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function SlideInterview({ content = {}, L }: any) {
  const questions = content.questions || (Array.isArray(content) ? content : []);
  const groups: Record<string, any[]> = {};
  questions.forEach((q: any) => {
    const d = (q.difficulty || "beginner").toLowerCase();
    (groups[d] ||= []).push(q);
  });
  if (!questions.some((q: any) => q.difficulty)) {
    return (
      <View>
        {questions.map((q: any, i: number) => (
          <InterviewCard key={i} q={q} index={i} level="general" L={L} />
        ))}
      </View>
    );
  }
  return (
    <View>
      {DIFF_ORDER.filter((l) => groups[l]?.length).map((level) => (
        <View key={level} style={{ marginBottom: 24 }}>
          <Text as="h4" style={{ marginBottom: 12, color: DIFF_COLORS[level] || "#334155" }}>
            {lf(L, `diff_${level}`, {}) || level}
          </Text>
          {groups[level].map((q: any, i: number) => (
            <InterviewCard key={i} q={q} index={i} level={level} L={L} />
          ))}
        </View>
      ))}
    </View>
  );
}

/* ---------- next/prev nav card ---------- */

function SlideNext({ content = {}, onNavigate, L }: any) {
  const prev = content.prev;
  const next = content.next || content.nextModule;
  const btn = (entry: any, label: string, cls: string) =>
    entry ? (
      <Pressable
        className={`lesson-nav-btn ${cls}`}
        onPress={() => entry.url && onNavigate?.(entry.url)}
        disabled={!entry.url}
        style={{ textAlign: "left" }}
      >
        <Text className="lesson-nav-btn-label">{label}</Text>
        <Text className="lesson-nav-btn-title">{entry.title}</Text>
      </Pressable>
    ) : null;
  return (
    <View>
      {content.message && (
        <View className="alert alert-success">
          <Text className="alert-icon">🎉</Text>
          <View className="alert-content"><View className="alert-text">{content.message}</View></View>
        </View>
      )}
      <View className="lesson-nav">
        {btn(prev, lf(L, "prev_chapter"), "prev")}
        {btn(next, lf(L, "next_chapter"), "next")}
      </View>
    </View>
  );
}

/* ---------- dispatcher ---------- */

function SlideSection({ section, ctx }: { section: any; ctx: Props & { L: SlideLabels } }) {
  const c = section.content;
  const L = ctx.L;
  const icon = section.icon || SECTION_ICONS[section.type] || "📌";

  const body = (() => {
    if (HTML_TYPES.has(section.type)) {
      return <SlideHtml html={typeof c === "string" ? c : c?.html || ""} />;
    }
    switch (section.type) {
      case "architecture":    return <SlideDiagram content={c} L={L} />;
      case "quiz":            return <SlideQuiz content={c} sectionId={section.id} onQuizAnswer={ctx.onQuizAnswer} onQuizComplete={ctx.onQuizComplete} L={L} />;
      case "command":         return <View>{(Array.isArray(c) ? c : c ? [c] : []).map((cmd: any, i: number) => <CommandBlock key={i} cmd={cmd} onCommand={ctx.onCommand} L={L} />)}</View>;
      case "terminal":        return <SlideTerminal content={c} onCommand={ctx.onCommand} L={L} />;
      case "code":            return <SlideCode content={c} L={L} />;
      case "lab":             return <SlideLab content={c} sectionId={section.id} onLabComplete={ctx.onLabComplete} L={L} />;
      case "challenge":       return <SlideChallenge content={c} L={L} />;
      case "troubleshooting": return <SlideTroubleshooting content={c} L={L} />;
      case "interview":       return <SlideInterview content={c} L={L} />;
      case "next":            return <SlideNext content={c} onNavigate={ctx.onNavigate} L={L} />;
      default:                return <SlideHtml html={c?.html || ""} />;
    }
  })();

  return (
    <View
      as="section"
      id={section.id || undefined}
      data-section-id={section.id || undefined}
      className="lesson-section slide-section lesson-anchor"
    >
      {section.title && (
        <View className="lesson-section-header">
          <View className="lesson-section-icon">{icon}</View>
          <Text as="h2">{section.title}</Text>
        </View>
      )}
      <View className="lesson-section-body">{body}</View>
    </View>
  );
}

export default function SlideEngine(props: Props) {
  const navigate = useNav().navigate;
  const sections = props.sections || [];
  const L = { ...DEFAULT_LABELS, ...(props.labels || {}) };
  const onNavigate = (url: string) => {
    // orig content uses 'module-XX.html' — map to the reader route
    const m = url.match(/module-(\d+)/);
    if (m && props.onNavigate) props.onNavigate(`module-${m[1]}`);
    else if (props.onNavigate) props.onNavigate(url);
    else navigate(url);
  };
  return (
    <View className="slide-engine">
      {sections.map((s: any, i: number) => (
        <SlideSection key={s.id || i} section={s} ctx={{ ...props, onNavigate, L }} />
      ))}
    </View>
  );
}

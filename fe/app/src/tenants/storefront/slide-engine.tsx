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
// command counters).
import { useEffect, useRef, useState, useId } from "react";
import { Pressable, Text, View } from "@/platform/primitives";
import { useNav } from "@/platform/navigation";

type Props = {
  sections?: any[];
  onQuizComplete?: (sectionId: string, correct: number, total: number) => void;
  onQuizAnswer?: (correct: boolean, index: number) => void;
  onLabComplete?: (sectionId: string) => void;
  onCommand?: () => void;
  onNavigate?: (target: string) => void;
};

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
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const onClick = (e: any) => {
    const img = e.target?.closest?.("img");
    if (img && !e.target.closest("a")) {
      setZoom({ src: img.currentSrc || img.src, alt: img.alt });
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="slide-html"
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {zoom && (
        <div className="img-zoom-overlay" onClick={() => setZoom(null)}>
          <img src={zoom.src} alt={zoom.alt} />
          {zoom.alt && <div className="img-zoom-caption">{zoom.alt}</div>}
          <span className="img-zoom-x">✕</span>
        </div>
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

function SlideDiagram({ content = {} }: any) {
  const uid = useId().replace(/:/g, "");
  const [selected, setSelected] = useState<any>(null);
  const nodes = content.nodes || [];
  const edges = content.edges || [];
  const width = content.width || 800;
  const height = content.height || 400;
  const byId = Object.fromEntries(nodes.map((n: any) => [n.id, n]));

  return (
    <div className="diagram-wrapper">
      {content.title && (
        <div className="diagram-titlebar">
          <span style={{ fontSize: 18 }}>📐</span>
          <span className="diagram-title">{content.title}</span>
          <span className="diagram-hint">Click components to inspect</span>
        </div>
      )}
      <div className="diagram-scroll">
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
      </div>
      {selected && (
        <div className="diagram-detail">
          <div className="diagram-detail-head">
            <span style={{ fontSize: 24 }}>{decodeEnt(selected.icon || "☁️")}</span>
            <div>
              <div className="diagram-detail-label">{decodeEnt(selected.label)}</div>
              <div className="diagram-detail-type">{selected.type || ""}</div>
            </div>
          </div>
          {selected.description && (
            <div className="diagram-detail-desc">{selected.description}</div>
          )}
          {selected.eventPayload && (
            <>
              <div className="diagram-detail-payload-label">Event Payload</div>
              <pre className="diagram-detail-payload">
                {typeof selected.eventPayload === "string"
                  ? selected.eventPayload
                  : JSON.stringify(selected.eventPayload, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- quiz ---------- */

function QuizQuestion({ q, index, onAnswered }: any) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correct = answered && selected === q.correctId;
  const choose = (optId: string) => {
    if (answered) return;
    setSelected(optId);
    onAnswered?.(q.id, optId === q.correctId);
  };
  return (
    <div className="quiz-card">
      <div className="quiz-header">
        <div className="quiz-icon">🧠</div>
        <div>
          <div className="quiz-type">
            Question {index + 1}
            {q.difficulty ? ` · ${q.difficulty}` : ""}
          </div>
          <div className="quiz-question">{q.question}</div>
        </div>
      </div>
      <div className="quiz-options">
        {(q.options || []).map((opt: any, i: number) => {
          let cls = "quiz-option";
          if (answered) {
            if (opt.id === q.correctId) cls += " correct";
            else if (opt.id === selected) cls += " incorrect";
          } else if (opt.id === selected) cls += " selected";
          return (
            <button key={opt.id || i} type="button" className={cls} onClick={() => choose(opt.id)}>
              <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <div className={`quiz-result ${correct ? "quiz-result-correct" : "quiz-result-incorrect"}`}>
            {correct ? "✅ Correct" : "❌ Incorrect"}
          </div>
          {q.explanation && (
            <div className="quiz-explanation visible" style={{ marginTop: 12 }}>
              {q.explanation}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SlideQuiz({ content = {}, sectionId, onQuizAnswer, onQuizComplete }: any) {
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
    <div>
      {content.title && (
        <div className="progress-label">
          <span className="progress-label-title">{content.title}</span>
          <span className="progress-label-value">
            {answeredCount === questions.length && questions.length > 0
              ? `Quiz complete: ${correctCount}/${questions.length}`
              : `${answeredCount}/${questions.length}`}
          </span>
        </div>
      )}
      {questions.map((q: any, i: number) => (
        <QuizQuestion
          key={q.id || i}
          q={q}
          index={i}
          onAnswered={(_id: string, ok: boolean) => {
            setAnswers((a) => ({ ...a, [q.id || i]: ok }));
            onQuizAnswer?.(ok, i);
          }}
        />
      ))}
    </div>
  );
}

/* ---------- command blocks ---------- */

function CommandBlock({ cmd, onCommand }: any) {
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
    <div>
      <div className="code-block">
        <div className="code-block-header">
          <span className="code-block-lang">{cmd.category || "cli"}</span>
          <div className="code-block-actions">
            {cmd.expectedOutput && (
              <button type="button" className="btn btn-xs btn-ghost" onClick={run}>Run</button>
            )}
            <button type="button" className="btn btn-xs btn-ghost" onClick={copy}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
        <pre><code>{cmd.command}</code></pre>
      </div>

      {cmd.explanation && (
        <p style={{ fontSize: "var(--text-sm, 0.875rem)", color: "var(--se-n-600, #475569)" }}>
          {cmd.explanation}
        </p>
      )}

      {output !== null && (
        <div className="terminal" style={{ marginBottom: 12 }}>
          <div className="terminal-body"><div className="terminal-output">{output}</div></div>
        </div>
      )}

      {cmd.expectedOutput && !output && (
        <>
          <button type="button" className="btn btn-xs btn-secondary" onClick={() => setShowExpected((s) => !s)}>
            {showExpected ? "Hide expected output" : "Show expected output"}
          </button>
          {showExpected && (
            <div className="terminal" style={{ marginTop: 8 }}>
              <div className="terminal-body"><div className="terminal-output">{cmd.expectedOutput}</div></div>
            </div>
          )}
        </>
      )}

      {Array.isArray(cmd.commonErrors) && cmd.commonErrors.length > 0 && (
        <div className={`accordion-item${errorsOpen ? " open" : ""}`} style={{ marginTop: 12 }}>
          <button type="button" className="accordion-header" onClick={() => setErrorsOpen((s) => !s)}>
            <span>⚠️ Common errors ({cmd.commonErrors.length})</span>
            <span className="chevron">▼</span>
          </button>
          <div className="accordion-body">
            <div className="accordion-body-inner">
              {cmd.commonErrors.map((err: any, i: number) => (
                <div key={i} style={{ marginBottom: 12, fontSize: "var(--text-sm, 0.875rem)" }}>
                  <strong>{err.error}</strong>
                  {err.cause && <div><strong>Cause:</strong> {err.cause}</div>}
                  {err.fix && <div><strong>Fix:</strong> {err.fix}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {cmd.interviewQ && (
        <div className="alert alert-info" style={{ marginTop: 12 }}>
          <span className="alert-icon">🎙️</span>
          <div className="alert-content">
            <div className="alert-title">Interview question</div>
            <div className="alert-text">{cmd.interviewQ}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- simulated terminal ---------- */

function SlideTerminal({ content = {}, onCommand }: any) {
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
        text: "Available commands:\n" + Object.keys(commands).join("\n"),
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
        text: `command not found: ${cmd} — type "help" for available commands`,
      });
      setLines(next);
    }
    setInput("");
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="terminal-dot terminal-dot-red" />
        <span className="terminal-dot terminal-dot-yellow" />
        <span className="terminal-dot terminal-dot-green" />
        <span className="terminal-title">{content.title || "terminal"}</span>
        <span className="terminal-badge terminal-badge-sim">{content.mode || "simulated"}</span>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.kind === "prompt" ? "terminal-prompt"
              : l.kind === "error" ? "terminal-error"
              : l.kind === "success" ? "terminal-success"
              : "terminal-output"
            }
          >
            {l.text}
          </div>
        ))}
        <form className="terminal-input-line" onSubmit={submit}>
          <span className="terminal-prompt">›</span>
          <input
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="terminal input"
          />
        </form>
      </div>
    </div>
  );
}

/* ---------- code viewer ---------- */

function SlideCode({ content = {} }: any) {
  const languages = content.languages || [];
  const [activeLang, setActiveLang] = useState(content.defaultLang || languages[0]?.id);
  const [showOutput, setShowOutput] = useState(false);
  const [explanationsOpen, setExplanationsOpen] = useState(true);
  const lang = languages.find((l: any) => l.id === activeLang) || languages[0];

  return (
    <div>
      <div className="code-block">
        <div className="code-block-header">
          <span className="code-block-lang">{content.title || lang?.label || "code"}</span>
          <div className="code-block-actions">
            {languages.map((l: any) => (
              <button
                key={l.id}
                type="button"
                className={`btn btn-xs ${l.id === lang?.id ? "btn-secondary" : "btn-ghost"}`}
                onClick={() => setActiveLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <pre><code>{lang?.code || ""}</code></pre>
      </div>

      {Array.isArray(lang?.explanations) && lang.explanations.length > 0 && (
        <div className={`accordion-item${explanationsOpen ? " open" : ""}`}>
          <button type="button" className="accordion-header" onClick={() => setExplanationsOpen((s) => !s)}>
            <span>📖 Line-by-line explanation ({lang.explanations.length})</span>
            <span className="chevron">▼</span>
          </button>
          <div className="accordion-body">
            <div className="accordion-body-inner">
              {lang.explanations.map((ex: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: "var(--text-sm, 0.875rem)" }}>
                  <code style={{ flexShrink: 0 }}>L{ex.line}</code>
                  <span>{ex.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {content.expectedOutput && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-xs btn-secondary" onClick={() => setShowOutput((s) => !s)}>
            {showOutput ? "Hide expected output" : "Show expected output"}
          </button>
          {showOutput && (
            <div className="terminal" style={{ marginTop: 8 }}>
              <div className="terminal-body"><div className="terminal-output">{content.expectedOutput}</div></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- lab checklist ---------- */

function SlideLab({ content = {}, sectionId, onLabComplete }: any) {
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
    <div className="lab-card">
      {(content.title || content.description) && (
        <div className="lab-card-head">
          <div className="lab-card-icon">🧪</div>
          <div className="lab-card-head-main">
            <div className="lab-card-badges">
              <span className={`badge difficulty-${content.difficulty || "beginner"}`}>
                {content.difficulty || "beginner"}
              </span>
              {content.duration && (
                <span className="badge badge-neutral">⏱ {content.duration}</span>
              )}
            </div>
            {content.title && <div className="lab-card-title">{content.title}</div>}
            {content.description && <p className="lab-card-desc">{content.description}</p>}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <div className="lab-progress">
          <div className="progress-label">
            <span className="progress-label-title">Lab Progress</span>
            <span className="progress-label-value">{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="lab-steps" ref={stepsRef}>
        {steps.map((step: any, i: number) => {
          const key = step.id || String(i);
          const complete = !!done[key];
          const isCurrent = i === nextOpen;
          return (
            <div key={key} className={`lab-step${complete ? " done" : ""}${isCurrent ? " current" : ""}`}>
              <div className="lab-step-num">{complete ? "✓" : i + 1}</div>
              <div className="lab-step-body">
                <div className="lab-step-top">
                  <span className="lab-step-title">{step.title}</span>
                  <button
                    type="button"
                    className={`btn btn-xs ${complete ? "lab-step-btn-done" : "btn-success"}`}
                    onClick={() => toggle(key)}
                  >
                    {complete ? "✓ Completed" : "✓ Mark Complete"}
                  </button>
                </div>
                {step.html ? (
                  <div className="slide-html step-html" dangerouslySetInnerHTML={{ __html: step.html }} />
                ) : (
                  step.instruction && <p className="step-desc">{step.instruction}</p>
                )}
                {step.expectedResult && (
                  <p className="step-desc"><strong>Expected:</strong> {step.expectedResult}</p>
                )}
                {step.hint && (
                  <>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => setOpenHint((h) => ({ ...h, [key]: !h[key] }))}
                    >
                      💡 Hint
                    </button>
                    {openHint[key] && (
                      <div className="alert alert-warning" style={{ marginTop: 8, marginBottom: 0 }}>
                        <span className="alert-icon">💡</span>
                        <div className="alert-content"><div className="alert-text">{step.hint}</div></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- challenge ---------- */

function SlideChallenge({ content = {} }: any) {
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
    <div className="card">
      <div className="card-body">
        {content.description && <p>{content.description}</p>}
        {Array.isArray(content.requirements) && content.requirements.length > 0 && (
          <>
            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Requirements</h4>
            <ul>{content.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
          </>
        )}
        {content.starterCode && (
          <div className="code-block" style={{ marginTop: 16 }}>
            <div className="code-block-header">
              <span className="code-block-lang">{content.language || "code"} — starter</span>
            </div>
            <pre><code>{content.starterCode}</code></pre>
          </div>
        )}
        <textarea
          className="challenge-editor"
          value={attempt}
          onChange={(e) => { setAttempt(e.target.value); setResults(null); }}
          spellCheck={false}
          aria-label="challenge code attempt"
        />
        {testCases.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={runChecks} style={{ marginTop: 12 }}>
            Run checks
          </button>
        )}
        {results && (
          <div style={{ marginTop: 16 }}>
            {results.map((r, i) => (
              <div
                key={i}
                className={`quiz-result ${r.pass ? "quiz-result-correct" : "quiz-result-incorrect"}`}
                style={{ marginBottom: 6 }}
              >
                {r.pass ? "✅" : "❌"} {r.description}
              </div>
            ))}
          </div>
        )}
        {Array.isArray(content.hints) && content.hints.length > 0 && (
          <div className={`accordion-item${hintsOpen ? " open" : ""}`} style={{ marginTop: 16 }}>
            <button type="button" className="accordion-header" onClick={() => setHintsOpen((s) => !s)}>
              <span>💡 Hints ({content.hints.length})</span>
              <span className="chevron">▼</span>
            </button>
            <div className="accordion-body">
              <div className="accordion-body-inner">
                <ul>{content.hints.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- troubleshooting / interview accordions ---------- */

function SlideTroubleshooting({ content = {} }: any) {
  const items = content.items || (Array.isArray(content) ? content : []);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div>
      {content.intro && (
        <div className="slide-html" style={{ marginBottom: 16 }}
          dangerouslySetInnerHTML={{ __html: content.intro }} />
      )}
      {items.map((item: any, i: number) => (
        <div key={i} className={`accordion-item${open[i] ? " open" : ""}`}>
          <button type="button" className="accordion-header"
            onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
            <span>⚠️ {item.error || item.title || `Issue ${i + 1}`}</span>
            <span className="chevron">▼</span>
          </button>
          <div className="accordion-body">
            <div className="accordion-body-inner">
              {item.cause && <p><strong>Cause:</strong> {item.cause}</p>}
              {item.fix && <p><strong>Fix:</strong> {item.fix}</p>}
              {item.prevention && <p><strong>Prevention:</strong> {item.prevention}</p>}
              {item.html && <div dangerouslySetInnerHTML={{ __html: item.html }} />}
            </div>
          </div>
        </div>
      ))}
    </div>
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
const DIFF_LABELS: Record<string, string> = {
  beginner: "🌱 Beginner", intermediate: "📈 Intermediate", advanced: "🚀 Advanced",
  scenario: "🎯 Scenario-Based", troubleshooting: "🔧 Troubleshooting", general: "❓ Q&A",
};

function InterviewCard({ q, index, level }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`accordion-item${open ? " open" : ""}`}
      style={{ marginBottom: 8, borderLeft: `3px solid ${DIFF_COLORS[level] || "#6366f1"}` }}
    >
      <button type="button" className="accordion-header" style={{ padding: "12px 16px" }}
        onClick={() => setOpen((o) => !o)}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 12, padding: "2px 8px", borderRadius: 4,
            background: DIFF_BG[level] || "#eef2ff",
            color: DIFF_COLORS[level] || "#6366f1", fontWeight: 600,
          }}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
          <span>Q{index + 1}: {q.question}</span>
        </span>
        <span className="chevron">▼</span>
      </button>
      <div className="accordion-body">
        <div className="accordion-body-inner" style={{ padding: 16 }}>
          {q.shortAnswer && (
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: "#16a34a" }}>Short Answer:</strong><br />{q.shortAnswer}
            </div>
          )}
          {q.deepExplanation && (
            <div style={{ marginBottom: 12, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
              <strong>Deep Explanation:</strong><br />{q.deepExplanation}
            </div>
          )}
          {q.example && (
            <div style={{ marginBottom: 12 }}>
              <strong>📌 Real-world Example:</strong><br />{q.example}
            </div>
          )}
          {q.commonMistake && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 6, borderLeft: "3px solid #ef4444" }}>
              <strong>⚠️ Common Mistake:</strong> {q.commonMistake}
            </div>
          )}
          {q.followUp && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#eef2ff", borderRadius: 6 }}>
              <strong>➔ Follow-up:</strong> {q.followUp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideInterview({ content = {} }: any) {
  const questions = content.questions || (Array.isArray(content) ? content : []);
  const groups: Record<string, any[]> = {};
  questions.forEach((q: any) => {
    const d = (q.difficulty || "beginner").toLowerCase();
    (groups[d] ||= []).push(q);
  });
  if (!questions.some((q: any) => q.difficulty)) {
    return (
      <div>
        {questions.map((q: any, i: number) => (
          <InterviewCard key={i} q={q} index={i} level="general" />
        ))}
      </div>
    );
  }
  return (
    <div>
      {DIFF_ORDER.filter((l) => groups[l]?.length).map((level) => (
        <div key={level} style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: DIFF_COLORS[level] || "#334155" }}>
            {DIFF_LABELS[level] || level}
          </h4>
          {groups[level].map((q: any, i: number) => (
            <InterviewCard key={i} q={q} index={i} level={level} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- next/prev nav card ---------- */

function SlideNext({ content = {}, onNavigate }: any) {
  const prev = content.prev;
  const next = content.next || content.nextModule;
  const btn = (entry: any, label: string, cls: string) =>
    entry ? (
      <button
        type="button"
        className={`lesson-nav-btn ${cls}`}
        onClick={() => entry.url && onNavigate?.(entry.url)}
        disabled={!entry.url}
        style={{ textAlign: "left" }}
      >
        <span className="lesson-nav-btn-label">{label}</span>
        <span className="lesson-nav-btn-title">{entry.title}</span>
      </button>
    ) : null;
  return (
    <div>
      {content.message && (
        <div className="alert alert-success">
          <span className="alert-icon">🎉</span>
          <div className="alert-content"><div className="alert-text">{content.message}</div></div>
        </div>
      )}
      <div className="lesson-nav">
        {btn(prev, "← Previous Chapter", "prev")}
        {btn(next, "Next Chapter →", "next")}
      </div>
    </div>
  );
}

/* ---------- dispatcher ---------- */

function SlideSection({ section, ctx }: { section: any; ctx: Props }) {
  const c = section.content;
  const icon = section.icon || SECTION_ICONS[section.type] || "📌";

  const body = (() => {
    if (HTML_TYPES.has(section.type)) {
      return <SlideHtml html={typeof c === "string" ? c : c?.html || ""} />;
    }
    switch (section.type) {
      case "architecture":    return <SlideDiagram content={c} />;
      case "quiz":            return <SlideQuiz content={c} sectionId={section.id} onQuizAnswer={ctx.onQuizAnswer} onQuizComplete={ctx.onQuizComplete} />;
      case "command":         return <div>{(Array.isArray(c) ? c : c ? [c] : []).map((cmd: any, i: number) => <CommandBlock key={i} cmd={cmd} onCommand={ctx.onCommand} />)}</div>;
      case "terminal":        return <SlideTerminal content={c} onCommand={ctx.onCommand} />;
      case "code":            return <SlideCode content={c} />;
      case "lab":             return <SlideLab content={c} sectionId={section.id} onLabComplete={ctx.onLabComplete} />;
      case "challenge":       return <SlideChallenge content={c} />;
      case "troubleshooting": return <SlideTroubleshooting content={c} />;
      case "interview":       return <SlideInterview content={c} />;
      case "next":            return <SlideNext content={c} onNavigate={ctx.onNavigate} />;
      default:                return <SlideHtml html={c?.html || ""} />;
    }
  })();

  return (
    <section
      id={section.id || undefined}
      data-section-id={section.id || undefined}
      className="lesson-section slide-section lesson-anchor"
    >
      {section.title && (
        <div className="lesson-section-header">
          <div className="lesson-section-icon">{icon}</div>
          <h2>{section.title}</h2>
        </div>
      )}
      <div className="lesson-section-body">{body}</div>
    </section>
  );
}

export default function SlideEngine(props: Props) {
  const navigate = useNav().navigate;
  const sections = props.sections || [];
  const onNavigate = (url: string) => {
    // orig content uses 'module-XX.html' — map to the reader route
    const m = url.match(/module-(\d+)/);
    if (m && props.onNavigate) props.onNavigate(`module-${m[1]}`);
    else if (props.onNavigate) props.onNavigate(url);
    else navigate(url);
  };
  return (
    <div className="slide-engine">
      {sections.map((s: any, i: number) => (
        <SlideSection key={s.id || i} section={s} ctx={{ ...props, onNavigate }} />
      ))}
    </div>
  );
}

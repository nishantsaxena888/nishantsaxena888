// uday client — lesson feed. Dynamic def: actionData.data.lessons holds
// the GET /api/lesson response. Renders each lesson's markdown-ish
// content (headings, bullets, fenced code) without external deps.

function renderMarkdown(md: string) {
  const blocks: any[] = [];
  let inCode = false;
  let code: string[] = [];
  (md || "").split("\n").forEach((line, i) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        blocks.push(
          <pre key={i} className="md-code my-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs text-foreground">
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = [];
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      code.push(line);
      return;
    }
    const t = line.trim();
    if (!t) return;
    if (t.startsWith("# ")) {
      blocks.push(<h3 key={i} className="mt-3 text-lg font-semibold text-foreground">{t.slice(2)}</h3>);
    } else if (t.startsWith("- ")) {
      blocks.push(<li key={i} className="ml-5 list-disc text-sm text-foreground">{inline(t.slice(2))}</li>);
    } else {
      blocks.push(<p key={i} className="my-1.5 text-sm text-foreground">{inline(t)}</p>);
    }
  });
  return blocks;
}

function inline(text: string) {
  // **bold** → <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p,
  );
}

export const LessonFeed = ({ content, actionData }: any) => {
  const items = actionData?.data?.lessons?.items || [];
  const loading = actionData?.loading;

  return (
    <div className="lesson-feed m-4 max-w-3xl">
      {content?.title && (
        <h2 className="mb-3 text-xl font-semibold text-foreground">{content.title}</h2>
      )}
      {loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Loading lessons…</p>
      )}
      {items.map((l: any) => (
        <article
          key={l.id}
          className="lesson-card mb-4 rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {l.order}. {l.title}
            </h3>
            <span className="shrink-0 text-xs text-muted-foreground">
              {l.course} · {l.duration}
            </span>
          </div>
          {renderMarkdown(l.content)}
        </article>
      ))}
    </div>
  );
};

export default LessonFeed;

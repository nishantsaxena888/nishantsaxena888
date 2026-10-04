// uday client — course list. Dynamic def: actionData.data.courses holds
// the GET /api/course response ({items, page, size, total}).

const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-green-500/15 text-green-400",
  intermediate: "bg-amber-500/15 text-amber-400",
  advanced: "bg-red-500/15 text-red-400",
};

export const CourseList = ({ content, actionData }: any) => {
  const items = actionData?.data?.courses?.items || [];
  const loading = actionData?.loading;

  return (
    <div className="m-4">
      {content?.title && (
        <h2 className="mb-3 text-xl font-semibold text-foreground">{content.title}</h2>
      )}
      {loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      )}
      <div className="entity-grid-container">
        {items.map((c: any) => (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">{c.title}</h3>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                  LEVEL_STYLES[c.level] || "bg-muted text-muted-foreground"
                }`}
              >
                {c.level}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {c.lessons} lessons
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseList;

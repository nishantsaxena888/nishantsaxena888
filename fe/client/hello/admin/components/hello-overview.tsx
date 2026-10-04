// hello admin landing — engine-optional. OPTIONS /overview returns a def
// with a dynamic "todos" action; actionData.data.todos is the list
// response {items,total,...}. Falls back to content/static values.
interface TodoItem {
  id: number;
  title: string;
  done?: boolean;
  priority?: string;
}

export default function HelloOverview({
  actionData,
  content,
}: {
  actionData?: any;
  content?: any;
}) {
  const items: TodoItem[] = actionData?.data?.todos?.items ?? [];
  const done = items.filter((t) => t.done).length;
  const open = items.length - done;

  return (
    <div className="hello-overview p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">
          {content?.title ?? "Hello Admin"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Minimal client admin — one entity, one custom overview.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-xl">
        {[
          { label: "Todos", value: actionData?.data?.todos?.total ?? items.length },
          { label: "Open", value: open },
          { label: "Done", value: done },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <ul className="max-w-xl space-y-1 text-sm">
          {items.slice(0, 5).map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <span>{t.done ? "✅" : "⬜"}</span>
              <span className={t.done ? "line-through opacity-60" : ""}>
                {t.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

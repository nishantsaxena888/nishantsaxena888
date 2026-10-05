// Generic revision pipeline — CMS workflow board (e.g.
// /admin/review-queue).
// Columns = revision.status; row buttons fire the def's lazy write
// actions (transition: PUT revision/:rid, rollback: POST revision with
// the old row's md copied into a new draft — history is never rewritten).
// All endpoints/payloads live in the OPTIONS def; the component just
// renders rows and calls actionData.action({key, type:"filter", data}).
import { Pressable, Text, View } from "@/platform/primitives";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

const COLUMNS = ["draft", "in_review", "published", "rejected"];
const ICONS: Record<string, string> = {
  draft: "✏️",
  in_review: "👀",
  published: "✅",
  rejected: "⛔",
};

// status → available transitions {label, to}
const TRANSITIONS: Record<string, { label: string; to: string }[]> = {
  draft: [{ label: "Submit for review", to: "in_review" }],
  in_review: [
    { label: "Approve", to: "published" },
    { label: "Reject", to: "rejected" },
  ],
  rejected: [{ label: "Back to draft", to: "draft" }],
  published: [],
};

export default function RevisionPipeline({ content, actionData }: any) {
  const revisions = toItems(actionData?.data?.revisions);
  const call = actionData?.action;

  const reload = () => call?.({ key: "revisions", type: "reload" });

  const transition = async (r: any, to: string) => {
    await call?.({
      key: "transition",
      type: "filter",
      data: { rid: r.id, status: to },
    });
    await reload();
  };

  // Rollback: copy an old revision into a NEW draft for its chapter —
  // published history stays immutable, the audit trail survives.
  const rollback = async (r: any) => {
    const nextVersion =
      Math.max(
        0,
        ...revisions
          .filter((x: any) => x.chapter_id === r.chapter_id)
          .map((x: any) => x.version_no || 0),
      ) + 1;
    await call?.({
      key: "rollback",
      type: "filter",
      data: {
        chapter_id: r.chapter_id,
        version_no: nextVersion,
        md_content: r.md_content,
        author: "admin",
      },
    });
    await reload();
  };

  if (actionData?.loading) {
    return (
      <View className="p-6">
        <Text>Loading pipeline…</Text>
      </View>
    );
  }

  return (
    <View className="revision-pipeline p-6">
      <Text as="h2" className="text-xl font-bold mb-4">
        {content?.title || "Review Pipeline"}
      </Text>
      <View className="grid gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => {
          const rows = revisions.filter((r: any) => (r.status || "draft") === col);
          return (
            <View key={col} className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <Text as="h3" className="font-semibold text-sm uppercase tracking-wide">
                {ICONS[col]} {col.replace("_", " ")} ({rows.length})
              </Text>
              {rows.map((r: any) => (
                <View key={r.id} className="rounded-md border bg-card p-3 space-y-2">
                  <Text as="p" className="text-sm font-medium">
                    #{r.id} · ch {r.chapter_id} · v{r.version_no}
                  </Text>
                  <Text as="p" className="text-xs text-muted-foreground">
                    {r.author || "—"} · {String(r.created_at || "").slice(0, 10)}
                  </Text>
                  <View className="flex flex-wrap gap-1">
                    {(TRANSITIONS[col] || []).map((t) => (
                      <Pressable
                        key={t.to}
                        className="rounded border px-2 py-1 text-xs hover:bg-accent"
                        onPress={() => transition(r, t.to)}
                      >
                        {t.label}
                      </Pressable>
                    ))}
                    {col === "published" && (
                      <Pressable
                        className="rounded border px-2 py-1 text-xs hover:bg-accent"
                        onPress={() => rollback(r)}
                      >
                        Rollback → draft
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
              {rows.length === 0 && (
                <Text as="p" className="text-xs text-muted-foreground">
                  empty
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

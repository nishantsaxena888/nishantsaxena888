// skillom admin landing — OPTIONS /overview returns a def whose dynamic
// actions fetch course/chapter/revision/enrollment lists; this renders
// counts + a publish-pipeline snapshot. Engine-optional like every client
// component (actionData?.data.* ?? content fallbacks).
export default function SkillomOverview({
  actionData,
  content,
}: {
  actionData?: any;
  content?: any;
}) {
  const courses = actionData?.data?.courses?.items ?? [];
  const chapters = actionData?.data?.chapters?.items ?? [];
  const revisions = actionData?.data?.revisions?.items ?? [];
  const enrollments = actionData?.data?.enrollments?.items ?? [];

  const inReview = revisions.filter((r: any) => r.status === "in_review").length;
  const drafts = revisions.filter((r: any) => r.status === "draft").length;

  const stats = [
    { label: "Courses", value: actionData?.data?.courses?.total ?? courses.length },
    { label: "Chapters", value: actionData?.data?.chapters?.total ?? chapters.length },
    { label: "In Review", value: inReview },
    { label: "Drafts", value: drafts },
    { label: "Enrollments", value: actionData?.data?.enrollments?.total ?? enrollments.length },
  ];

  return (
    <div className="skillom-overview p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {content?.title ?? "Skillom Admin"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Courses, chapters, content pipeline, learners.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {courses.length > 0 && (
        <div className="max-w-3xl space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">Recent courses</h3>
          <ul className="space-y-1 text-sm">
            {courses.slice(0, 6).map((c: any) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="w-16 shrink-0 rounded border px-1.5 py-0.5 text-xs text-center">
                  {c.status}
                </span>
                <span>{c.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

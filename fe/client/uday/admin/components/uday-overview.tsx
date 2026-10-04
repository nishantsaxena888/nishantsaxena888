// uday admin landing — learning-platform snapshot: course catalogue,
// content volume, and per-course lesson rollup from dynamic actions.
interface Course {
  id: number;
  title: string;
  level?: string;
  lessons?: number;
}
interface Lesson {
  id: number;
  title: string;
  course?: string; // course title, not an id
  duration?: string;
}

const LEVEL_ORDER = ["beginner", "intermediate", "advanced"];

export default function UdayOverview({
  actionData,
  content,
}: {
  actionData?: any;
  content?: any;
}) {
  const courses: Course[] = actionData?.data?.courses?.items ?? [];
  const lessons: Lesson[] = actionData?.data?.lessons?.items ?? [];
  const quizCount: number =
    actionData?.data?.quizzes?.total ??
    actionData?.data?.quizzes?.items?.length ??
    0;

  const stats = [
    { label: "Courses", value: actionData?.data?.courses?.total ?? courses.length },
    { label: "Lessons", value: actionData?.data?.lessons?.total ?? lessons.length },
    { label: "Quizzes", value: quizCount },
  ];

  const sorted = [...courses].sort(
    (a, b) =>
      LEVEL_ORDER.indexOf(a.level ?? "beginner") -
      LEVEL_ORDER.indexOf(b.level ?? "beginner"),
  );

  return (
    <div className="uday-overview p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {content?.title ?? "Learning Overview"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Content pipeline across courses, lessons and assessments.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-xl">
        {stats.map((s) => (
          <div key={s.label} className="stat-card rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {sorted.length > 0 && (
        <div className="max-w-2xl space-y-2">
          <h3 className="text-sm font-medium">Catalogue</h3>
          {sorted.map((c) => (
            <div
              key={c.id}
              className="course-row flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <div className="text-sm font-medium">{c.title}</div>
                <div className="text-xs text-muted-foreground">
                  {lessons.filter((l) => l.course === c.title).length ||
                    c.lessons ||
                    0}{" "}
                  lessons
                </div>
              </div>
              <span className={`level-badge level-${c.level ?? "beginner"}`}>
                {c.level}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

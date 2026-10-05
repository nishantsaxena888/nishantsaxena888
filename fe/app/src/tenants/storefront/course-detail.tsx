// Generic entity detail — dynamic page for a detail route (e.g.
// /courses/:id). actions: <entity>/:id (header) + <child>?<fk>=:id
// (ordered row list). Rows navigate to the reader route (default
// /learn/:id) and record the
// visit in the "recent" session via the SessionBridge prop.
import { useNav } from "@/platform/navigation";
import { Pressable, Text, View } from "@/platform/primitives";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

export default function CourseDetail({ content, actionData, session }: any) {
  const navigate = useNav().navigate;
  const course = actionData?.data?.course?.data ?? actionData?.data?.course;
  const chapters = toItems(actionData?.data?.chapters)
    .filter((c: any) => !course?.id || c.course_id === course.id)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  const openChapter = (ch: any) => {
    session?.update("recent", {
      id: `ch-${ch.id}`,
      name: ch.title,
      kind: "chapter",
      at: new Date().toISOString(),
    });
    navigate(`${content?.reader_path || "/learn"}/${ch.id}`);
  };

  if (actionData?.loading) {
    return (
      <View as="section" className="course-detail p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View as="section" className="course-detail p-6 space-y-6">
      <View className="course-detail-head space-y-2">
        <Text as="h1" className="text-2xl font-bold">
          {course?.title || content?.title || "Course"}
        </Text>
        {course?.description && (
          <Text as="p" className="text-muted-foreground">
            {course.description}
          </Text>
        )}
        <Pressable
          className="sf-action-btn"
          onPress={() =>
            // :id resolves from the route param (payload interpolation)
            actionData?.action?.({
              key: "enroll",
              type: "filter",
              data: { at: new Date().toISOString() },
            })
          }
        >
          {content?.enroll_label || "Enroll"}
        </Pressable>
      </View>
      <View className="course-chapters divide-y rounded-lg border">
        {chapters.map((ch: any, i: number) => (
          <Pressable
            key={ch.id}
            className="chapter-row flex w-full items-center gap-3 p-4 text-left hover:bg-accent"
            onPress={() => openChapter(ch)}
          >
            <Text className="w-8 text-sm text-muted-foreground">{i + 1}</Text>
            <Text className="flex-1 font-medium">{ch.title}</Text>
            {ch.published_revision_id != null && (
              <Text className="text-xs text-muted-foreground">published</Text>
            )}
          </Pressable>
        ))}
        {chapters.length === 0 && (
          <Text as="p" className="p-4 text-muted-foreground">
            {content?.empty || "No chapters yet."}
          </Text>
        )}
      </View>
    </View>
  );
}

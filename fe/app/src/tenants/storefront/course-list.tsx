// Generic course/catalog grid — card grid fed by the def's dynamic
// action (actionData.data.data → entity list). Card action records the
// item in the "recent" session via SessionBridge and navigates to the
// content.open_pattern route (default /courses/:id). Content drives
// title/cta — no domain literals baked in.
import { useNav } from "@/platform/navigation";
import { Image, Pressable, Text, View } from "@/platform/primitives";

const toItems = (res: any): any[] =>
  Array.isArray(res) ? res : res?.items ?? res?.data ?? [];

export default function CourseList({ content, actionData, session }: any) {
  const courses = toItems(actionData?.data?.data);
  const navigate = useNav().navigate;

  const open = (c: any) => {
    session?.update("recent", {
      id: c.id,
      name: c.title,
      kind: "course",
      at: new Date().toISOString(),
    });
    // detail route from def content (default /courses/:id) — the mock
    // detail-read matches by numeric id, so navigate by id, not code.
    navigate(`${content?.detail_path || "/courses"}/${c.id}`);
  };

  if (actionData?.loading) {
    return (
      <View as="section" className="course-list p-6">
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View as="section" className="course-list p-6">
      {content?.title && <Text as="h2">{content.title}</Text>}
      <View className="course-list-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c: any) => (
          <View as="article" key={c.id} className="course-card rounded-lg border bg-card overflow-hidden">
            {c.image && <Image src={c.image} alt={c.title} loading="lazy" />}
            <View className="p-4 space-y-2">
              <View className="flex items-center gap-2">
                <Text as="h3" className="font-semibold flex-1">{c.title}</Text>
                <Text className="text-xs rounded border px-1.5 py-0.5">{c.status}</Text>
              </View>
              {c.description && (
                <Text as="p" className="text-sm text-muted-foreground">{c.description}</Text>
              )}
              <Pressable className="sf-action-btn" onPress={() => open(c)}>
                {content?.cta_label || "Start learning"}
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      {!actionData?.loading && courses.length === 0 && (
        <Text as="p" className="text-muted-foreground">No courses yet.</Text>
      )}
    </View>
  );
}

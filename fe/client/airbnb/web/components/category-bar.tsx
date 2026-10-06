// airbnb client — category icon bar. Sticky-ish chip row above the stay
// grid, the signature Airbnb pattern. Chips come from def content.items
// [{label, icon, category}]; tapping navigates to content.target
// (default "/stays") with ?cat=<category> — the stay-grid comp reads it
// back through platform useQuery and filters.
import { Pressable, Text, View } from "@/platform/primitives";
import { useNav, useQuery } from "@/platform/navigation";

export const CategoryBar = ({ content }: any) => {
  const { navigate } = useNav();
  const q = useQuery();
  const active = q("cat") || "";
  const target = content?.target || "/stays";
  const items: any[] = content?.items || [];

  return (
    <View className="ab-catbar">
      {items.map((it: any, i: number) => {
        const isActive = (it.category || "") === active;
        return (
          <Pressable
            key={it.category ?? i}
            className={`ab-cat-chip${isActive ? " ab-cat-chip--active" : ""}`}
            onPress={() =>
              navigate(it.category ? `${target}?cat=${it.category}` : target)
            }
          >
            <Text className="ab-cat-icon">{it.icon}</Text>
            <Text className="ab-cat-label">{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default CategoryBar;

// Platform icons — React Native variant. lucide-react-native isn't a
// dependency of the native host, so the named-icon seam maps the same
// REGISTRY names to unicode glyphs rendered in a Text. Swap for
// lucide-react-native (same names) if the host app adds it.
import { Text } from "react-native";
import type { IconProps } from "./icons";

const GLYPHS: Record<string, { on: string; off: string }> = {
  heart: { on: "♥", off: "♡" },
  home: { on: "⌂", off: "⌂" },
  search: { on: "⌕", off: "⌕" },
  cart: { on: "🛒", off: "🛒" },
  star: { on: "★", off: "☆" },
  user: { on: "👤", off: "👤" },
};

export const Icon = ({ name, className, filled, size = 18 }: IconProps) => {
  const g = GLYPHS[name];
  if (!g) return null;
  return (
    <Text className={className} style={{ fontSize: size }}>
      {filled ? g.on : g.off}
    </Text>
  );
};

export default Icon;

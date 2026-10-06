// Platform icons — a named-icon seam so components (especially
// fe/client/* comps, which can't resolve fe/app deps and must stay
// portable) never import an icon library directly.
//
//   <Icon name="heart" filled />   — web: lucide; native: icons.native
//
// Add a name to REGISTRY in both variants when a new glyph is needed.
import {
  Heart,
  Home,
  Search,
  ShoppingCart,
  Star,
  User,
} from "lucide-react";

const REGISTRY: Record<string, any> = {
  heart: Heart,
  home: Home,
  search: Search,
  cart: ShoppingCart,
  star: Star,
  user: User,
};

export interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
  color?: string;
  fill?: string;
}

export const Icon = ({
  name,
  className,
  filled,
  size = 18,
  color,
  fill,
}: IconProps) => {
  const C = REGISTRY[name];
  if (!C) return null;
  return (
    <C
      className={className}
      size={size}
      color={color}
      fill={fill ?? (filled ? "currentColor" : "none")}
    />
  );
};

export default Icon;

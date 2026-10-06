// Client SDK — the single import surface for engine services inside
// fe/client/* code. The boundary eslint rule allows only `@/platform/*`,
// so every engine hook/store/util a client component legitimately needs
// is re-exported here instead of opening engine internals.
//
// Keep this list intentional: if a client comp needs something not here,
// the seam is the place to add it — don't loosen the import rule.
export { apiClient, useEntity } from "@/common/engine";
export { useRenderEngine } from "@/common/engine/render-engine/features/render-engine-context";
export { useConfigStore } from "@/common/store/use-config-store";
export { useGenericState } from "@/common/store/use-generic-state";
export { useLanguage } from "@/components/shared/use-language";
export { useTheme } from "@/components/shared/use-theme";
export { LanguageSwitcher } from "@/components/shared/language-selector/language-switcher";
export { toast } from "@/common/lib/toast";

// Icon glyphs used by client comps — routed through the seam so the client
// never imports the icon package directly (RN swaps the impl).
export {
  Search, ShoppingCart, User, Heart, Clock, X, Zap, Star, Trash2,
} from "lucide-react";

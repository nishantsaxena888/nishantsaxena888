import React from "react";
import { Search, ShoppingCart, User, Heart, Clock, X, Zap } from "lucide-react";
import { useGenericState } from "@/common/store/use-generic-state";
import { useLanguage } from "@/components/shared/use-language";
import { LanguageSwitcher } from "@/components/shared/language-selector/language-switcher";
import { useConfigStore } from "@/common/store/use-config-store";
import { listOf, firstOf, makeTr } from "./utils";
import { storage } from "@/platform/storage";
import { useNav } from "@/platform/navigation";
import { Anchor, Image, Pressable, Text, TextInput, View } from "@/platform/primitives";

// Generic storefront header — matches the reference storefront layout:
//   topbar (tagline | phone | hours)
//   logo | pill search (primary button inset) | actions
//   actions: theme?, language, sign-in, favorite, green CART pill + badge
//   category nav row
// Data comes from the def's dynamic action:
//   actionData.data.data     → header record (name/tagline/logo/phone/…)
//   actionData.data.category → category list for the nav row
// Cart badge reads the registered "cart" session; sign-in target comes
// from configuration.admin.login_path. If a client defines no cart
// session or no auth page, those controls simply render inertly.
// Platform primitives — ports to RN unchanged (mouse-specific handlers
// on suggestion rows are the only web-only bits; RN uses onPress).
export const StorefrontHeader = ({ content, actionData }: any) => {
  const { navigate } = useNav();
  const tr = makeTr(useLanguage().t);
  const config = useConfigStore((s: any) => s.config);
  const header = firstOf(actionData?.data?.data) || content?.data || {};
  const categories =
    listOf(actionData?.data?.category) || header.categories || [];
  // NB: selector must return a stable reference — `?? []` inside the
  // selector creates a new array every snapshot → infinite re-render.
  const cartItems = useGenericState((s: any) => s.data?.cart);
  const cartCount = Array.isArray(cartItems)
    ? cartItems.reduce((n: number, i: any) => n + (i.qty ?? 1), 0)
    : 0;
  const [q, setQ] = React.useState("");
  const [showSugg, setShowSugg] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>(() => {
    try {
      return (JSON.parse(storage.getItem("recentSearches") || "[]") as string[])
        .filter((s) => s && s.trim());
    } catch {
      return [];
    }
  });

  const catList = categories.map((c: any, i: number) =>
    typeof c === "object" && c !== null ? c : { id: i, name: String(c) },
  );
  const filteredCats = q
    ? catList.filter((c: any) =>
        c.name?.toLowerCase().includes(q.toLowerCase()),
      )
    : [];

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((s) => s !== term)].slice(0, 5);
    setRecent(next);
    storage.setItem("recentSearches", JSON.stringify(next));
  };

  // Category → category-filtered listing; term → query-filtered listing.
  const selectSearch = (term: string, isCategory = false) => {
    if (!term.trim() && !isCategory) return setShowSugg(false);
    setQ(term);
    setShowSugg(false);
    saveRecent(term);
    navigate(
      isCategory
        ? `/shop?category=${encodeURIComponent(term)}`
        : `/shop?q=${encodeURIComponent(term)}`,
    );
  };

  const signInPath =
    config?.admin?.login_path || config?.admin?.dashboard_path || "/login";

  const suggestions = (
    <View className="sf-sugg">
      {q && filteredCats.length > 0 && (
        <View className="sf-sugg-section">
          <View className="sf-sugg-label">
            <Text>{tr("search.suggested_categories", "Suggested Categories")}</Text>
          </View>
          {filteredCats.map((c: any) => (
            <Pressable
              key={c.id ?? c.name}
              onPress={() => selectSearch(c.name, true)}
              className="sf-sugg-row"
            >
              <Text className="sf-sugg-ic">
                <Search className="h-4 w-4" />
              </Text>
              <Text className="sf-sugg-name">{c.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {!q && recent.length > 0 && (
        <View className="sf-sugg-section">
          <View className="sf-sugg-label">
            <Text>{tr("search.recent", "Recent Searches")}</Text>
            <Pressable
              onPress={(e?: any) => {
                e?.stopPropagation?.();
                setRecent([]);
                storage.removeItem("recentSearches");
              }}
            >
              {tr("search.clear_all", "Clear All")}
            </Pressable>
          </View>
          {recent.map((term) => (
            <View key={term} className="sf-sugg-rowwrap">
              <Pressable
                onPress={() => selectSearch(term)}
                className="sf-sugg-row"
              >
                <Text className="sf-sugg-ic sf-sugg-ic-muted">
                  <Clock className="h-4 w-4" />
                </Text>
                <Text className="sf-sugg-name">{term}</Text>
              </Pressable>
              <Pressable
                className="sf-sugg-x"
                onPress={(e?: any) => {
                  e?.stopPropagation?.();
                  const next = recent.filter((s) => s !== term);
                  setRecent(next);
                  storage.setItem("recentSearches", JSON.stringify(next));
                }}
              >
                <X className="h-4 w-4" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {!q && catList.length > 0 && (
        <View className="sf-sugg-cats">
          <View className="sf-sugg-label"><Text>{tr("search.categories", "Categories")}</Text></View>
          <View className="sf-sugg-grid">
            {catList.slice(0, 4).map((c: any) => (
              <Pressable
                key={c.id ?? c.name}
                onPress={() => selectSearch(c.name, true)}
                className="sf-sugg-card"
              >
                <Text className="sf-sugg-ic sf-sugg-ic-big">
                  <Zap className="h-5 w-5" />
                </Text>
                <Text className="sf-sugg-cardname">{c.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const searchBox = (mobile = false) => (
    <View
      as="form"
      className={`sf-search ${mobile ? "sf-search-mobile" : "sf-search-desktop"}`}
      onSubmit={(e: any) => {
        e.preventDefault();
        selectSearch(q);
      }}
    >
      <TextInput
        value={q}
        onChangeText={setQ}
        onFocus={() => setShowSugg(true)}
        onBlur={() => setTimeout(() => setShowSugg(false), 200)}
        placeholder={tr("search.placeholder", "Search for products...")}
      />
      <Pressable type="submit" aria-label={tr("search.placeholder", "Search")}>
        <Search className="h-4 w-4" />
      </Pressable>
      {showSugg && suggestions}
    </View>
  );

  return (
    <View as="header" className="sf-header">
      {(header.topBarMessage || header.phone || header.hours) && (
        <View className="sf-topbar">
          <Text>{header.topBarMessage}</Text>
          <Text className="sf-topbar-contact">
            {header.phone && <Text>{header.phone}</Text>}
            {header.hours && <Text>{header.hours}</Text>}
          </Text>
        </View>
      )}
      <View className="sf-header-main">
        <Anchor to="/" className="sf-logo">
          <Text className="sf-logo-iconbox">
            {header.logoUrl ? (
              <Image src={header.logoUrl} alt={header.name} />
            ) : (
              <Text className="sf-logo-icon">{header.logoIcon || "🛒"}</Text>
            )}
          </Text>
          <Text className="sf-logo-text">
            <Text as="strong">{header.name || "Store"}</Text>
            {header.tagline && <Text as="em">{header.tagline}</Text>}
          </Text>
        </Anchor>
        {searchBox(false)}
        <View as="nav" className="sf-header-actions">
          <LanguageSwitcher />
          <Pressable
            className="sf-signin"
            onPress={() => navigate(signInPath)}
          >
            <User className="h-4 w-4" />
            <Text className="sf-signin-label">
              {tr("header.sign_in", "Sign In")}
            </Text>
          </Pressable>
          <Pressable
            className="sf-fav"
            aria-label={tr("header.wishlist", "Wishlist")}
            onPress={() => navigate("/my-account")}
          >
            <Heart className="h-5 w-5" />
          </Pressable>
          <Anchor to="/cart" className="sf-session-pill">
            <ShoppingCart className="h-5 w-5" />
            <Text className="sf-session-label">{tr("header.cart", "Cart")}</Text>
            {cartCount > 0 && <Text className="sf-session-badge">{cartCount}</Text>}
          </Anchor>
        </View>
      </View>
      {searchBox(true)}
      {categories.length > 0 && (
        <View as="nav" className="sf-catnav">
          {categories.map((c: any) => {
            const label = typeof c === "string" ? c : c.name;
            return (
              <Anchor key={label} to={`/shop?category=${encodeURIComponent(label)}`}>
                {label}
              </Anchor>
            );
          })}
        </View>
      )}
    </View>
  );
};

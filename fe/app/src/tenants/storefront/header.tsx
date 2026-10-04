import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Heart, Clock, X, Zap } from "lucide-react";
import { useGenericState } from "@/store/use-generic-state";
import { useLanguage } from "@/components/shared/language-provider";
import { LanguageSwitcher } from "@/components/core-component/language-selector/language-switcher";
import { useConfigStore } from "@/store/use-config-store";
import { listOf, firstOf, makeTr } from "./utils";

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
export const StorefrontHeader = ({ content, actionData }: any) => {
  const navigate = useNavigate();
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
      return (JSON.parse(localStorage.getItem("recentSearches") || "[]") as string[])
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
    localStorage.setItem("recentSearches", JSON.stringify(next));
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
    <div className="sf-sugg">
      {q && filteredCats.length > 0 && (
        <div className="sf-sugg-section">
          <div className="sf-sugg-label">
            {tr("search.suggested_categories", "Suggested Categories")}
          </div>
          {filteredCats.map((c: any) => (
            <button
              key={c.id ?? c.name}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSearch(c.name, true);
              }}
              className="sf-sugg-row"
            >
              <span className="sf-sugg-ic">
                <Search className="h-4 w-4" />
              </span>
              <span className="sf-sugg-name">{c.name}</span>
            </button>
          ))}
        </div>
      )}
      {!q && recent.length > 0 && (
        <div className="sf-sugg-section">
          <div className="sf-sugg-label">
            <span>{tr("search.recent", "Recent Searches")}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRecent([]);
                localStorage.removeItem("recentSearches");
              }}
            >
              {tr("search.clear_all", "Clear All")}
            </button>
          </div>
          {recent.map((term) => (
            <div key={term} className="sf-sugg-rowwrap">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSearch(term);
                }}
                className="sf-sugg-row"
              >
                <span className="sf-sugg-ic sf-sugg-ic-muted">
                  <Clock className="h-4 w-4" />
                </span>
                <span className="sf-sugg-name">{term}</span>
              </button>
              <button
                className="sf-sugg-x"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = recent.filter((s) => s !== term);
                  setRecent(next);
                  localStorage.setItem("recentSearches", JSON.stringify(next));
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {!q && catList.length > 0 && (
        <div className="sf-sugg-cats">
          <div className="sf-sugg-label">{tr("search.categories", "Categories")}</div>
          <div className="sf-sugg-grid">
            {catList.slice(0, 4).map((c: any) => (
              <button
                key={c.id ?? c.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSearch(c.name, true);
                }}
                className="sf-sugg-card"
              >
                <span className="sf-sugg-ic sf-sugg-ic-big">
                  <Zap className="h-5 w-5" />
                </span>
                <span className="sf-sugg-cardname">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const searchBox = (mobile = false) => (
    <form
      className={`sf-search ${mobile ? "sf-search-mobile" : "sf-search-desktop"}`}
      onSubmit={(e) => {
        e.preventDefault();
        selectSearch(q);
      }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setShowSugg(true)}
        onBlur={() => setTimeout(() => setShowSugg(false), 200)}
        placeholder={tr("search.placeholder", "Search for products...")}
      />
      <button type="submit" aria-label={tr("search.placeholder", "Search")}>
        <Search className="h-4 w-4" />
      </button>
      {showSugg && suggestions}
    </form>
  );

  return (
    <header className="sf-header">
      {(header.topBarMessage || header.phone || header.hours) && (
        <div className="sf-topbar">
          <span>{header.topBarMessage}</span>
          <span className="sf-topbar-contact">
            {header.phone && <span>{header.phone}</span>}
            {header.hours && <span>{header.hours}</span>}
          </span>
        </div>
      )}
      <div className="sf-header-main">
        <Link to="/" className="sf-logo">
          <span className="sf-logo-iconbox">
            {header.logoUrl ? (
              <img src={header.logoUrl} alt={header.name} />
            ) : (
              <span className="sf-logo-icon">{header.logoIcon || "🛒"}</span>
            )}
          </span>
          <span className="sf-logo-text">
            <strong>{header.name || "Store"}</strong>
            {header.tagline && <em>{header.tagline}</em>}
          </span>
        </Link>
        {searchBox(false)}
        <nav className="sf-header-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className="sf-signin"
            onClick={() => navigate(signInPath)}
          >
            <User className="h-4 w-4" />
            <span className="sf-signin-label">
              {tr("header.sign_in", "Sign In")}
            </span>
          </button>
          <button
            type="button"
            className="sf-fav"
            aria-label={tr("header.wishlist", "Wishlist")}
            onClick={() => navigate("/my-account")}
          >
            <Heart className="h-5 w-5" />
          </button>
          <Link to="/cart" className="sf-cart-pill">
            <ShoppingCart className="h-5 w-5" />
            <span className="sf-cart-label">{tr("header.cart", "Cart")}</span>
            {cartCount > 0 && <span className="sf-cart-badge">{cartCount}</span>}
          </Link>
        </nav>
      </div>
      {searchBox(true)}
      {categories.length > 0 && (
        <nav className="sf-catnav">
          {categories.map((c: any) => {
            const label = typeof c === "string" ? c : c.name;
            return (
              <Link key={label} to={`/shop?category=${encodeURIComponent(label)}`}>
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
};

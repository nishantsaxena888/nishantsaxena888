import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User } from "lucide-react";
import { useGenericState } from "@/store/use-generic-state";
import { listOf, firstOf } from "./utils";

// Generic storefront header. Data comes from the def's dynamic action:
//   actionData.data.data     → header record (name/tagline/logo/phone/…)
//   actionData.data.category → category list for the nav row
// Cart badge reads any registered "cart" session. If the client defines
// none, the badge simply does not render.
export const StorefrontHeader = ({ content, actionData }: any) => {
  const navigate = useNavigate();
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
          {header.logoUrl ? (
            <img src={header.logoUrl} alt={header.name} />
          ) : (
            <span className="sf-logo-icon">{header.logoIcon || "🛒"}</span>
          )}
          <span>
            <strong>{header.name || "Store"}</strong>
            {header.tagline && <em>{header.tagline}</em>}
          </span>
        </Link>
        <form
          className="sf-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
          />
          <button type="submit" aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
        </form>
        <nav className="sf-header-actions">
          <Link to="/cart" className="sf-icon-btn" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <span className="sf-badge">{cartCount}</span>}
          </Link>
          <Link to="/login" className="sf-icon-btn" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
        </nav>
      </div>
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

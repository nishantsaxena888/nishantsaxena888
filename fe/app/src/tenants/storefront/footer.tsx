import { Link } from "react-router-dom";
import { firstOf } from "./utils";

// Generic storefront footer — columns from the footer endpoint record:
// categories, navigationLinks, socialLinks, contact info.
export const StorefrontFooter = ({ content, actionData }: any) => {
  const f = firstOf(actionData?.data?.data) || content?.data || {};
  const navLinks = f.navigationLinks || [];
  const categories = f.categories || [];
  const social = f.socialLinks || [];

  return (
    <footer className="sf-footer">
      <div className="sf-footer-grid">
        <div className="sf-footer-brand">
          <strong>
            {f.logoIcon} {f.name}
          </strong>
          {f.tagline && <p>{f.tagline}</p>}
          {social.length > 0 && (
            <div className="sf-social">
              {social.map((s: any) => (
                <a key={s.icon} href={s.url} target="_blank" rel="noreferrer">
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>
        {categories.length > 0 && (
          <div>
            <h4>Categories</h4>
            {categories.map((c: any) => {
              const label = typeof c === "string" ? c : c.name;
              return <Link key={label} to="/shop">{label}</Link>;
            })}
          </div>
        )}
        {navLinks.length > 0 && (
          <div>
            <h4>Links</h4>
            {navLinks.map((l: any) => (
              <Link key={l.label} to={l.url || `/${l.target || ""}`}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
        {(f.phone || f.email || f.address) && (
          <div>
            <h4>Contact</h4>
            {f.phone && <p>{f.phone}</p>}
            {f.email && <p>{f.email}</p>}
            {f.address && <p>{f.address}</p>}
          </div>
        )}
      </div>
      <div className="sf-footer-bottom">
        © {new Date().getFullYear()} {f.name || "Store"}. All rights reserved.
      </div>
    </footer>
  );
};

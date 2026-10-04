import { useLanguage } from "@/components/shared/use-language";
import { Anchor, Text, View } from "@/platform/primitives";
import { firstOf, makeTr } from "./utils";

// Generic storefront footer — columns from the footer endpoint record:
// categories, navigationLinks, socialLinks, contact info.
// Platform primitives — ports to RN unchanged.
export const StorefrontFooter = ({ content, actionData }: any) => {
  const tr = makeTr(useLanguage().t);
  const f = firstOf(actionData?.data?.data) || content?.data || {};
  const navLinks = f.navigationLinks || [];
  const categories = f.categories || [];
  const social = f.socialLinks || [];

  return (
    <View as="footer" className="sf-footer">
      <View className="sf-footer-grid">
        <View className="sf-footer-brand">
          <Text as="strong">
            {f.logoIcon} {f.name}
          </Text>
          {f.tagline && <Text as="p">{f.tagline}</Text>}
          {social.length > 0 && (
            <View className="sf-social">
              {social.map((s: any) => (
                <Anchor key={s.icon} to={s.url} external>
                  {s.icon}
                </Anchor>
              ))}
            </View>
          )}
        </View>
        {categories.length > 0 && (
          <View>
            <Text as="h4">{tr("footer.categories", "Categories")}</Text>
            {categories.map((c: any) => {
              const label = typeof c === "string" ? c : c.name;
              return <Anchor key={label} to="/shop">{label}</Anchor>;
            })}
          </View>
        )}
        {navLinks.length > 0 && (
          <View>
            <Text as="h4">{tr("footer.quick_links", "Links")}</Text>
            {navLinks.map((l: any) => (
              <Anchor key={l.label} to={l.url || `/${l.target || ""}`}>
                {l.label}
              </Anchor>
            ))}
          </View>
        )}
        {(f.phone || f.email || f.address) && (
          <View>
            <Text as="h4">{tr("footer.contact", "Contact")}</Text>
            {f.phone && <Text as="p">{f.phone}</Text>}
            {f.email && <Text as="p">{f.email}</Text>}
            {f.address && <Text as="p">{f.address}</Text>}
          </View>
        )}
      </View>
      <View className="sf-footer-bottom">
        <Text>© {new Date().getFullYear()} {f.name || "Store"}. All rights reserved.</Text>
      </View>
    </View>
  );
};

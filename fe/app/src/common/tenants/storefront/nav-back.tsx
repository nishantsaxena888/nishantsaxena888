// Generic back-link block — renders content.label navigating to content.to
// (default "/"). Drop as a static def at the top of any page that needs a
// breadcrumb-style return link (clients with site_nav off).
import { useNav } from "@/platform/navigation";
import { Pressable } from "@/platform/primitives";

export default function NavBack({ content }: any) {
  const navigate = useNav().navigate;
  return (
    <Pressable
      className="back-link nav-back"
      onPress={() => navigate(content?.to || "/")}
    >
      {content?.label || "← Back"}
    </Pressable>
  );
}

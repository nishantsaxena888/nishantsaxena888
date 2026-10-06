// Generic RBAC-gated row/card actions — any list comp can declare
// content.card_actions / row_actions in its def and render this:
//   <RowActions entity="chapter" item={row} actions={content.row_actions}
//     detail_path="/courses" reload={() => action({key:"data",type:"reload"})}/>
// Each action: {icon,label} + either {opens:"detail"} (navigates
// detail_path/:id) or {method:"delete"|"put"|"post", confirm} — the
// method gates visibility through the entity's rbac spec (useEntity.can),
// so a viewer never sees an admin-only chip. The backend enforces the
// same spec server-side; this is the UI mirror.
import { useEntity } from "@/engine";
import { useNav } from "@/platform/navigation";
import { Pressable, View } from "@/platform/primitives";

export default function RowActions({
  entity,
  item,
  actions,
  detail_path,
  reload,
}: {
  entity: string;
  item: any;
  actions?: any[];
  detail_path?: string;
  reload?: () => void;
}) {
  const navigate = useNav().navigate;
  const ent = useEntity(entity, { prefetch: false });
  const allowed = (actions || []).filter((a: any) =>
    a.method ? ent.can(a.method) : true,
  );
  if (!allowed.length) return null;

  const run = async (a: any) => {
    if (a.opens === "detail" || !a.method) {
      navigate(`${a.path || detail_path || ""}/${item.id}`);
      return;
    }
    const label = (a.confirm || "").replace("{title}", item.title || item.name || `#${item.id}`);
    if (a.confirm && typeof window !== "undefined" && !window.confirm(label))
      return;
    if (a.method === "delete") {
      await ent.onDelete(item.id);
      reload?.();
    }
  };

  return (
    <View className="card-actions">
      {allowed.map((a: any, i: number) => (
        <Pressable
          key={i}
          className="card-action-btn"
          title={a.label}
          onPress={() => run(a)}
        >
          {a.icon}
        </Pressable>
      ))}
    </View>
  );
}

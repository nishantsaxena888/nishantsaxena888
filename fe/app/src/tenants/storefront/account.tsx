import React from "react";
import { useEntity } from "@/engine";
import { useConfigStore } from "@/store/use-config-store";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/components/shared/use-language";
import { listOf, money, makeTr } from "./utils";
import { storage } from "@/platform/storage";
import { Pressable, Text, TextInput, View } from "@/platform/primitives";

// Generic account page — profile form (saved to the configured user
// entity, default "user") + recent orders from the order entity when the
// def's action supplies it.
export const StorefrontAccount = ({ content, actionData }: any) => {
  const tr = makeTr(useLanguage().t);
  const currency = useConfigStore(
    (s: any) => s.config?.meta?.currency_symbol || "$",
  );
  const userEntity = content?.user_entity || "user";
  const user = useEntity(userEntity);
  const canSave = user.can("post");
  const [form, setForm] = React.useState<Record<string, string>>(() => {
    try {
      return JSON.parse(storage.getItem("profile") || "{}");
    } catch {
      return {};
    }
  });
  const orders = listOf(actionData?.data?.orders);

  const set = (k: string) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    storage.setItem("profile", JSON.stringify(form));
    const res = await user.onPost(form).catch(() => null);
    if (res?.error) toast.error(tr("profile.save_error", "Could not save profile"));
    else toast.success(tr("profile.saved", "Profile saved"));
  };

  const field = (key: string, label: string, extra: any = {}) => (
    <View as="label" className="sf-field" key={key}>
      <Text>{label}</Text>
      <TextInput value={form[key] || ""} onChangeText={set(key)} {...extra} />
    </View>
  );

  return (
    <View as="section" className="sf-account-view">
      <Text as="h1">{content?.title || tr("profile.title", "My account")}</Text>
      <View className="sf-summary-layout">
        <View as="form" className="sf-summary-form" onSubmit={save}>
          <Text as="h3">{tr("profile.title", "Profile")}</Text>
          {field("name", tr("address.full_name", "Full name"))}
          {field("email", tr("auth.email", "Email"), { type: "email" })}
          {field("phone", tr("address.phone", "Phone"), { type: "tel" })}
          {field("address", tr("address.street", "Default address"))}
          <Pressable type="submit" className="sf-cta" disabled={!canSave}>
            {canSave ? "Save" : tr("profile.read_only", "Read only")}
          </Pressable>
        </View>
        <View as="aside" className="sf-summary-panel">
          <Text as="h3">{tr("profile.recent_orders", "Recent orders")}</Text>
          {orders.length === 0 && <Text as="p">{tr("profile.no_orders", "No orders yet.")}</Text>}
          {orders.map((o: any) => (
            <View key={o.id} className="sf-summary-row">
              <Text>
                #{o.id} · {o.status || "placed"}
              </Text>
              <Text as="strong">{money(o.total, currency)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

import React from "react";
import { apiClient } from "@/engine";
import { useLanguage } from "@/components/shared/use-language";
import { toast } from "@/lib/toast";
import { makeTr } from "./utils";
import { storage } from "@/platform/storage";
import { useNav } from "@/platform/navigation";
import { emitAppEvent } from "@/platform/host";
import { Anchor, Image, Pressable, Text, TextInput, View } from "@/platform/primitives";

// Generic auth screen (def type "login-layout-1"). content.config drives
// the variant: login-card | register-card | forgot-password-card |
// reset-password-card | verify-email-card. content.config.action describes
// what happens on submit: redirect navigation, storage
// store/populate/remove, and "login" (stores a token). footerText
// supports the {{Label||l||/path}} link shorthand from the source model.

const FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  "login-card": [
    { key: "email", label: "auth.email", type: "email" },
    { key: "password", label: "auth.password", type: "password" },
  ],
  "register-card": [
    { key: "name", label: "address.full_name" },
    { key: "email", label: "auth.email", type: "email" },
    { key: "password", label: "auth.password", type: "password" },
  ],
  "forgot-password-card": [{ key: "email", label: "auth.email", type: "email" }],
  "reset-password-card": [
    { key: "email", label: "auth.email", type: "email" },
    { key: "password", label: "auth.new_password", type: "password" },
    { key: "confirm", label: "auth.confirm_password", type: "password" },
  ],
  "verify-email-card": [{ key: "code", label: "auth.verification_code" }],
};

const TITLES: Record<string, string> = {
  "login-card": "auth.sign_in",
  "register-card": "auth.sign_up",
  "forgot-password-card": "auth.forgot_password",
  "reset-password-card": "auth.reset_password",
  "verify-email-card": "auth.verify_email",
};

// Portable base64url — btoa doesn't exist on React Native. Payload is
// JSON (ASCII-safe for our claims), so a byte-walk encoder suffices.
const b64urlEncode = (str: string): string => {
  const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i), b = str.charCodeAt(i + 1), c = str.charCodeAt(i + 2);
    out += CH[a >> 2] + CH[((a & 3) << 4) | (b >> 4) || 0] +
      (i + 1 < str.length ? CH[((b & 15) << 2) | (c >> 6) || 0] : "") +
      (i + 2 < str.length ? CH[c & 63] : "");
  }
  return out.replace(/\+/g, "-").replace(/\//g, "_");
};

// Unsigned dev JWT — 3 segments so jwt-decode never crashes Protected.
// Only used when the configured endpoint doesn't return a token.
const devJwt = (email: string): string => {
  const b64 = (o: object) => b64urlEncode(JSON.stringify(o));
  return `${b64({ alg: "none", typ: "JWT" })}.${b64({
    sub: email,
    email,
    exp: Math.floor(Date.now() / 1000) + 86400,
  })}.dev`;
};

// "{{Label||l||/path}}" → link
const renderFooterText = (text: string) => {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((p, i) => {
    const m = p.match(/^\{\{(.+?)\|\|l\|\|(.+?)\}\}$/);
    if (!m) return <React.Fragment key={i}>{p}</React.Fragment>;
    return (
      <Anchor key={i} to={m[2]} className="sf-footer-link">
        {m[1]}
      </Anchor>
    );
  });
};

export const StorefrontAuthLayout = ({ content }: any) => {
  const tr = makeTr(useLanguage().t);
  const { navigate } = useNav();
  const cfg = content?.config || {};
  const cardType = cfg.type || "login-card";
  const fields = FIELDS[cardType] || FIELDS["login-card"];
  const action = cfg.action || {};

  const [form, setForm] = React.useState<Record<string, string>>(() => {
    // populate_from_local_storage — e.g. reset-password prefills email
    const init: Record<string, string> = {};
    for (const k of action.populate_from_local_storage || []) {
      init[k] = storage.getItem(k) || "";
    }
    return init;
  });
  const [busy, setBusy] = React.useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (cardType === "reset-password-card" && form.password !== form.confirm) {
      toast.error(tr("auth.password_mismatch", "Passwords do not match"));
      return;
    }
    setBusy(true);
    // POST to the configured endpoint when it exists — mocked or real.
    // The generic backend's /api/login returns a decodable JWT; when a
    // response carries a token use it verbatim.
    const res = cfg.endpoint
      ? await apiClient(cfg.endpoint, { method: "post", payload: form })
      : null;
    setBusy(false);
    if (res?.error && cardType === "login-card") {
      toast.error(res.message || tr("auth.sign_in", "Sign in failed"));
      return;
    }

    for (const k of action.store_local_storage || [])
      storage.setItem(k, form[k] || "");
    for (const k of action.remove_local_storage || [])
      storage.removeItem(k);
    if (action.login || cardType === "login-card") {
      // Prefer the endpoint's token (the generic backend's /api/login
      // returns a signed JWT); otherwise mint an unsigned dev one.
      const token = res?.data?.token || devJwt(form.email || "user@local");
      storage.setItem("token", token);
      // Role claim may have changed — AppProvider re-fetches configuration
      // and re-filters menus for the new role.
      emitAppEvent("auth-change");
    }
    if (action.navigation) navigate(action.navigation);
    else navigate("/");
  };

  const set = (k: string) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <View as="section" className="sf-auth">
      <View className="sf-auth-card">
        {(content?.name || content?.imageURL) && (
          <View className="sf-auth-brand">
            {content?.imageURL ? (
              <Image src={content.imageURL} alt={content?.name || "logo"} />
            ) : (
              <Text as="strong">{content.name}</Text>
            )}
          </View>
        )}
        <Text as="h2">{content?.title || tr(TITLES[cardType] || "auth.sign_in", "Sign in")}</Text>
        <View as="form" onSubmit={submit}>
          {fields.map((f) => (
            <View as="label" className="sf-field" key={f.key}>
              <Text>{tr(f.label, f.label)}</Text>
              <TextInput
                required
                type={f.type || "text"}
                value={form[f.key] || ""}
                onChangeText={set(f.key)}
              />
            </View>
          ))}
          <Pressable type="submit" className="sf-cta" disabled={busy}>
            {busy ? "…" : tr(TITLES[cardType] || "auth.sign_in", "Continue")}
          </Pressable>
        </View>
        {cardType === "login-card" && (
          <Anchor to="/forgot-password" className="sf-footer-link">
            {tr("auth.forgot_password", "Forgot password?")}
          </Anchor>
        )}
        {content?.footerText && (
          <Text as="p" className="sf-auth-footer">{renderFooterText(content.footerText)}</Text>
        )}
      </View>
    </View>
  );
};

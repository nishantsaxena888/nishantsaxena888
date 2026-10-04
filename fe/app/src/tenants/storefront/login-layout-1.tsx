import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, useEntity } from "@/engine";
import { toast } from "@/lib/toast";

// Generic auth screen (def type "login-layout-1"). content.config drives
// the variant: login-card | register-card | forgot-password-card |
// reset-password-card | verify-email-card. content.config.action describes
// what happens on submit: redirect navigation, localStorage
// store/populate/remove, and "login" (drops a dev token). footerText
// supports the {{Label||l||/path}} link shorthand from the source model.

const FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  "login-card": [
    { key: "email", label: "Email", type: "email" },
    { key: "password", label: "Password", type: "password" },
  ],
  "register-card": [
    { key: "name", label: "Full name" },
    { key: "email", label: "Email", type: "email" },
    { key: "password", label: "Password", type: "password" },
  ],
  "forgot-password-card": [{ key: "email", label: "Email", type: "email" }],
  "reset-password-card": [
    { key: "email", label: "Email", type: "email" },
    { key: "password", label: "New password", type: "password" },
    { key: "confirm", label: "Confirm password", type: "password" },
  ],
  "verify-email-card": [{ key: "code", label: "Verification code" }],
};

const TITLES: Record<string, string> = {
  "login-card": "Sign in",
  "register-card": "Create account",
  "forgot-password-card": "Forgot password",
  "reset-password-card": "Reset password",
  "verify-email-card": "Verify your email",
};

// "{{Label||l||/path}}" → link
const renderFooterText = (text: string) => {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((p, i) => {
    const m = p.match(/^\{\{(.+?)\|\|l\|\|(.+?)\}\}$/);
    if (!m) return <React.Fragment key={i}>{p}</React.Fragment>;
    return (
      <Link key={i} to={m[2]} className="sf-footer-link">
        {m[1]}
      </Link>
    );
  });
};

export const StorefrontLoginLayout = ({ content }: any) => {
  const navigate = useNavigate();
  const cfg = content?.config || {};
  const cardType = cfg.type || "login-card";
  const fields = FIELDS[cardType] || FIELDS["login-card"];
  const action = cfg.action || {};

  const [form, setForm] = React.useState<Record<string, string>>(() => {
    // populate_from_local_storage — e.g. reset-password prefills email
    const init: Record<string, string> = {};
    for (const k of action.populate_from_local_storage || []) {
      init[k] = localStorage.getItem(k) || "";
    }
    return init;
  });
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardType === "reset-password-card" && form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    // POST to the configured endpoint when it exists — mocked or real.
    // An error response doesn't block local flows (no real auth backend).
    const res = cfg.endpoint
      ? await apiClient(cfg.endpoint, { method: "post", payload: form })
      : null;
    setBusy(false);
    if (res?.error && cardType === "login-card") {
      toast.error(res.message || "Sign in failed");
      return;
    }

    for (const k of action.store_local_storage || [])
      localStorage.setItem(k, form[k] || "");
    for (const k of action.remove_local_storage || [])
      localStorage.removeItem(k);
    if (action.login || cardType === "login-card") {
      // Dev token — real auth swaps this flow via the same action config.
      localStorage.setItem("token", `dev-${Date.now()}`);
    }
    if (action.navigation) navigate(action.navigation);
    else navigate("/");
  };

  const set = (k: string) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className="sf-auth">
      <div className="sf-auth-card">
        {(content?.name || content?.imageURL) && (
          <div className="sf-auth-brand">
            {content?.imageURL ? (
              <img src={content.imageURL} alt={content?.name || "logo"} />
            ) : (
              <strong>{content.name}</strong>
            )}
          </div>
        )}
        <h2>{content?.title || TITLES[cardType] || "Sign in"}</h2>
        <form onSubmit={submit}>
          {fields.map((f) => (
            <label className="sf-field" key={f.key}>
              <span>{f.label}</span>
              <input
                required
                type={f.type || "text"}
                value={form[f.key] || ""}
                onChange={set(f.key)}
              />
            </label>
          ))}
          <button className="sf-cta" disabled={busy}>
            {busy ? "…" : TITLES[cardType] || "Continue"}
          </button>
        </form>
        {cardType === "login-card" && (
          <Link to="/forgot-password" className="sf-footer-link">
            Forgot password?
          </Link>
        )}
        {content?.footerText && (
          <p className="sf-auth-footer">{renderFooterText(content.footerText)}</p>
        )}
      </div>
    </section>
  );
};

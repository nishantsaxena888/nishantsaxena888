// Validates every client's mock registry + page definitions:
//   1. fe/client/<name>/mock/config.json flags endpoint+METHOD → the file
//      mock/<lang>/<endpoint>/<METHOD>/<response_type>.json must exist.
//   2. Every def.type inside a definition file's config[]/data[] must
//      resolve: generic tenant types (layout + storefront + admin + default
//      maps) or a key in the client's site/admin tenant.ts.
//   3. Every properties.action[].endpoint must resolve to a mock dir (in
//      the same language tree or the "en" fallback) or be registry-flagged
//      mock:false — an action pointing at a missing endpoint silently
//      renders an empty component.
//   4. Legacy alias types (products, cart-view, ...) warn — they still
//      resolve, but new defs should use canonical names.
//
//   node scripts/check-mocks.mjs [client...]     (default: all clients)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), "../../client");
const wanted = process.argv.slice(2);
const clients = readdirSync(clientRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && (!wanted.length || wanted.includes(d.name)))
  .map((d) => d.name);

// Full client isolation — site/layout types resolve from each client's
// own web/tenant.ts + layouts/tenant.ts (client-owned component copies).
// Only the generic admin plumbing stays engine-shared.
const GENERIC_ADMIN_TYPES = new Set([
  "revision-pipeline",
  // admin/default map
  "default-admin", "iterator", "form", "table", "media-upload",
  // auth-layout card variants (selected by OPTIONS config def.type)
  "login-card", "register-card", "forgot-password-card",
  "reset-password-card", "verify-email-card",
]);
const LEGACY_TYPES = new Set([
  "hero-section", "products", "product-grid", "cart-view",
  "checkout", "profile", "login-layout-1",
]);

function tenantTypes(client, surface) {
  const f = join(clientRoot, client, surface, "tenant.ts");
  if (!existsSync(f)) return new Set();
  const src = readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
  const types = new Set();
  const m = src.match(/components\s*:\s*\{([\s\S]*?)\}\s*,?\s*\}/);
  const block = m ? m[1] : src;
  for (const k of block.matchAll(/["']?([\w-]+)["']?\s*:/g)) types.add(k[1]);
  return types;
}

function* walkDefs(defs) {
  if (!Array.isArray(defs)) return;
  for (const d of defs) {
    if (d && typeof d === "object" && d.type) yield d;
    if (Array.isArray(d?.children)) yield* walkDefs(d.children);
  }
}

let failures = 0;
let warnings = 0;

for (const client of clients) {
  const mockDir = join(clientRoot, client, "mock");
  const registryPath = join(mockDir, "config.json");
  if (!existsSync(registryPath)) {
    console.log(`${client}: no mock registry (skipping — real API only)`);
    continue;
  }
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const langs = readdirSync(mockDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const siteTypes = new Set([
    ...tenantTypes(client, "web"),
    ...tenantTypes(client, "layouts"),
  ]);
  const adminTypes = new Set([
    ...GENERIC_ADMIN_TYPES,
    ...tenantTypes(client, "layouts"),
    ...tenantTypes(client, "admin"),
  ]);

  let checked = 0;
  for (const [endpoint, methods] of Object.entries(registry)) {
    for (const [method, cfg] of Object.entries(methods)) {
      if (cfg?.mock !== true) continue;
      const rt = cfg.response_type || "success";
      const found = langs.some((lang) =>
        existsSync(join(mockDir, lang, endpoint, method, `${rt}.json`)),
      );
      checked++;
      if (!found) {
        failures++;
        console.error(`  MISSING ${client} ${method} ${endpoint} (${rt})`);
      }
    }
  }
  console.log(`${client}: ${checked} flagged endpoint+methods — ${failures ? "FAILURES" : "all files present"}`);

  // Definition checks — every GET success.json that carries config[]/data[].
  const files = [];
  (function scan(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) scan(p);
      else if (e.name === "success.json") files.push(p);
    }
  })(mockDir);

  for (const f of files) {
    let page;
    try {
      page = JSON.parse(readFileSync(f, "utf8"));
    } catch {
      continue;
    }
    const rel = f.split("/mock/")[1];
    const lang = rel.split("/")[0];
    // Only config[] holds definitions — data[] is entity rows whose "type"
    // field is domain data (document kind, menu kind, discount kind).
    const defs = page.config;
    for (const def of walkDefs(defs)) {
      // Unknown type → hard failure (renders nothing).
      const known = siteTypes.has(def.type) || adminTypes.has(def.type);
      if (!known) {
        failures++;
        console.error(`  UNKNOWN-TYPE ${client} ${rel}: "${def.type}" (def ${def.id ?? "?"})`);
      } else if (LEGACY_TYPES.has(def.type)) {
        warnings++;
        console.warn(`  legacy-alias ${client} ${rel}: "${def.type}" — prefer canonical name`);
      }
      // Dynamic action endpoints must exist as a mock dir in this lang or
      // the en fallback, or be a real-API endpoint by design (registry
      // entry with mock:false/absent is acceptable — warn only).
      for (const a of def.properties?.action || []) {
        const ep = String(a.endpoint || "").replace(/^\/+|\/+$/g, "");
        if (!ep) continue;
        const inLang = existsSync(join(mockDir, lang, ep));
        const inEn = existsSync(join(mockDir, "en", ep));
        const regEntry = registry[ep] || registry[`/${ep}`];
        const mockFlagged = Object.values(regEntry || {}).some((m) => m?.mock === true);
        if (mockFlagged && !inLang && !inEn) {
          failures++;
          console.error(`  MISSING-ACTION ${client} ${rel}: action endpoint "${ep}" flagged mock but no files`);
        } else if (!inLang && !inEn && !regEntry) {
          warnings++;
          console.warn(`  unregistered-action ${client} ${rel}: "${ep}" — will hit the real API`);
        }
      }
    }
  }
}

console.log(`${warnings} warnings`);
process.exit(failures ? 1 : 0);

// scripts/validate-defs.mjs — static contract check for client configs.
// Catches at build/CI time what used to be runtime-only failures:
//   · def.type that no componentMap resolves ("Component Matching Error")
//   · menu/admin_menu entities that don't exist
//   · session methods with no reducer strategy
//   · action endpoints pointing at undeclared entities
//   · themes pointing at missing style-configs
//
//   npm run validate            — all clients
//   npm run validate -- airbnb  — one client
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = join(appDir, "../client");
const beDir = join(appDir, "../../be/client");
const srcDir = join(appDir, "src");

const only = process.argv[2];
let failures = 0;
let checks = 0;

const fail = (where, msg) => {
  failures++;
  console.error(`  ✗ ${where}: ${msg}`);
};
const ok = () => checks++;

// ---- collect the def-type universe -------------------------------
// componentMap keys live in the tenant registries (string keys) and in
// each client's tenant.ts ("key": Comp).
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

function mapKeys(file) {
  if (!existsSync(file)) return [];
  const src = stripComments(readFileSync(file, "utf8"));
  const keys = new Set();
  for (const m of src.matchAll(/(?:["'`]([\w-]+)["'`]|(\b[A-Za-z_]\w*))\s*:/g))
    keys.add(m[1] ?? m[2]);
  return keys;
}

// Generic maps shared by every client
const genericKeys = new Set([
  ...mapKeys(join(srcDir, "tenants/storefront/index.tsx")),
  ...mapKeys(join(srcDir, "tenants/layout/index.tsx")),
]);
// Admin component universe (OPTIONS-driven types resolve here)
const adminKeys = new Set([
  ...mapKeys(join(srcDir, "tenants/admin/default-admin/index.ts")),
  "default-admin",
]);

// Session reducer strategies — the allowed session.method values.
function reducerStrategies() {
  const f = join(srcDir, "engine/library/reducers.ts");
  if (!existsSync(f)) return new Set();
  const src = stripComments(readFileSync(f, "utf8"));
  const keys = new Set();
  for (const m of src.matchAll(/const\s+(\w+)\s*:\s*ReducerStrategy/g)) keys.add(m[1]);
  return keys;
}
const SESSION_METHODS = reducerStrategies();

// Entity names from entities.py — quoted top-level keys of `entities`.
function entityNames(client) {
  const f = join(beDir, client, "entities.py");
  if (!existsSync(f)) return new Set();
  const src = readFileSync(f, "utf8");
  const block = src.slice(src.indexOf("entities = {"));
  const names = new Set();
  for (const m of block.matchAll(/^\s{4}"(\w+)"\s*:/gm)) names.add(m[1]);
  return names;
}

// Endpoint names served purely by mocks — the client's own tree plus the
// shared default layer every client merges with (mock/<lang>/<endpoint>).
function mockEndpoints(client) {
  const names = new Set();
  const scan = (dir) => {
    if (!existsSync(dir)) return;
    for (const lang of readdirSync(dir)) {
      const ld = join(dir, lang);
      try {
        for (const ep of readdirSync(ld)) names.add(ep);
      } catch {}
    }
  };
  scan(join(clientDir, client, "mock"));
  scan(join(srcDir, "mock"));
  return names;
}

// ---- per-client validation ---------------------------------------
function validateClient(name) {
  const beCfg = join(beDir, name, "configuration.json");
  if (!existsSync(beCfg)) {
    fail(name, `missing be/client/${name}/configuration.json`);
    return;
  }
  const cfg = JSON.parse(readFileSync(beCfg, "utf8"));
  const entities = entityNames(name);
  const sessionNames = new Set((cfg.sessions || []).map((s) => s.name));
  const mocks = mockEndpoints(name);
  const endpointKnown = (e) =>
    entities.has(e) || sessionNames.has(e) || mocks.has(e);
  const siteKeys = new Set([
    ...genericKeys,
    ...mapKeys(join(clientDir, name, "site/tenant.ts")),
  ]);
  const adminCompKeys = new Set([
    ...adminKeys,
    ...mapKeys(join(clientDir, name, "admin/tenant.ts")),
  ]);

  const defs = cfg.pages || {};
  for (const [slug, page] of Object.entries(defs)) {
    for (const def of page?.config || []) {
      ok();
      if (!siteKeys.has(def.type))
        fail(`pages/${slug}`, `def type "${def.type}" has no component (id ${def.id})`);
      // action endpoints → declared entity (strip :params and ?query)
      for (const a of def.properties?.action || []) {
        ok();
        const ep = String(a.endpoint || "")
          .split("?")[0]
          .replace(/\/:[^/]+/g, "")
          .replace(/^\/+|\/+$/g, "");
        const base = ep.split("/")[0];
        if (
          base &&
          !ep.startsWith("http") &&
          !endpointKnown(base) &&
          !base.startsWith("pages")
        )
          fail(`pages/${slug}`, `action endpoint "${a.endpoint}" — entity "${base}" not found (entities.py / sessions / mocks)`);
      }
      // referenced sessions must be declared
      const sess = def.properties?.session || def.content?.session;
      if (sess) {
        ok();
        if (!(cfg.sessions || []).some((s) => s.name === sess))
          fail(`pages/${slug}`, `def "${def.id}" references undeclared session "${sess}"`);
      }
    }
  }

  // menu + admin_menu entities resolve
  const pagesKnown = new Set(Object.keys(defs).map((s) => `pages/${s}`));
  for (const m of [...(cfg.menu || []), ...(cfg.admin_menu || [])]) {
    ok();
    const e = m.entity;
    if (!e) continue;
    if (!endpointKnown(e) && !pagesKnown.has(e))
      fail(m.url || m.name, `menu entity "${e}" not found (not an entity, page, session or mock endpoint)`);
  }

  // sessions use known reducer strategies
  for (const s of cfg.sessions || []) {
    ok();
    if (SESSION_METHODS.size && s.method && !SESSION_METHODS.has(s.method))
      fail(`session "${s.name}"`, `unknown method "${s.method}" (have: ${[...SESSION_METHODS].join(", ")})`);
  }

  // themes → style-configs present
  for (const t of cfg.themes || []) {
    ok();
    const ep = String(t.endpoint || "");
    const theme = ep.replace(/^style-config\//, "");
    if (ep.startsWith("style-config/") && !(cfg["style-configs"] || {})[theme])
      fail(`theme "${t.value}"`, `endpoint "${ep}" has no entry in style-configs`);
  }

  // admin entity config blocks (OPTIONS `config` defs) resolve too —
  // only "type" values inside `"config": [...]` blocks count (field
  // types like "str"/"int" are DSL, not def types).
  const entSrc = join(beDir, name, "entities.py");
  if (existsSync(entSrc)) {
    const src = readFileSync(entSrc, "utf8");
    for (const cb of src.matchAll(/"config"\s*:\s*\[([\s\S]*?)\]/g)) {
      for (const m of cb[1].matchAll(/"type"\s*:\s*"([\w-]+)"/g)) {
        // properties.type carries static|dynamic — not a component type
        if (m[1] === "dynamic" || m[1] === "static") continue;
        ok();
        if (!adminCompKeys.has(m[1]) && !siteKeys.has(m[1]))
          fail("entities.py", `config def type "${m[1]}" has no component (site or admin)`);
      }
    }
  }
}

const clients = readdirSync(clientDir).filter((d) =>
  existsSync(join(clientDir, d, "client.json")),
);
const targets = only ? clients.filter((c) => c === only) : clients;
if (only && targets.length === 0) {
  console.error(`unknown client: ${only}`);
  process.exit(1);
}

for (const c of targets) {
  console.log(`\n▸ ${c}`);
  validateClient(c);
}

console.log(`\n${failures ? "✗" : "✓"} ${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);

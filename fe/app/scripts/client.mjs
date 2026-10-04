// Client switcher + scaffolder. The client.json manifest in
// fe/client/<name>/ is the contract — everything is derived from it.
//
//   npm run client -- <name>   switch active client (validate + generate)
//   npm run client -- --new <name>   scaffold a new client (fe + be)
//
// Generates:
//   src/tenants/active.ts      — tenant imports + declared styles imports
//   src/tenants/mock-active.ts — mock glob (empty when manifest mock:false)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = join(appDir, "../client");
const beDir = join(appDir, "../../be/client");
const arg = process.argv[2];
const name = process.argv[3] || process.argv[2];

const SURFACES = ["site", "admin"];

function readManifest(dir, name) {
  const p = join(dir, name, "client.json");
  if (!existsSync(p)) return null;
  const m = JSON.parse(readFileSync(p, "utf8"));
  if (m.name !== name) {
    console.error(`client.json name "${m.name}" != folder "${name}"`);
    process.exit(1);
  }
  return m;
}

function validate(name, m) {
  const root = join(clientDir, name);
  const missing = [];
  for (const s of SURFACES) {
    if (!existsSync(join(root, s, "tenant.ts")))
      missing.push(`fe/client/${name}/${s}/tenant.ts`);
    if (m.surfaces?.[s]?.styles && !existsSync(join(root, s, "styles.css")))
      missing.push(`fe/client/${name}/${s}/styles.css (declared in client.json)`);
  }
  if (m.mock && !existsSync(join(root, "mock/config.json")))
    console.warn(`warn: mock:true but fe/client/${name}/mock/config.json is missing — gen with be/tools/gen_mocks.py ${name}`);
  if (missing.length) {
    console.error("missing files:\n  " + missing.join("\n  "));
    process.exit(1);
  }
}

function activate(name) {
  const m = readManifest(clientDir, name);
  if (!m) {
    console.error(`missing: fe/client/${name}/client.json (see fe/client/README.md)`);
    process.exit(1);
  }
  validate(name, m);

  const styleImports = SURFACES.filter((s) => m.surfaces?.[s]?.styles)
    .map((s) => `import "@clients/${name}/${s}/styles.css";`)
    .join("\n");

  writeFileSync(
    join(appDir, "src/tenants/active.ts"),
    `// GENERATED — do not edit by hand.
// \`npm run client <name>\` (fe/app) rewrites this file to point at
// fe/client/<name>/{site,admin}/. Importing statically keeps the
// bundle lean: only the active client's code and styles are included.
${styleImports ? styleImports + "\n" : ""}export const client = "${name}";
export { default as site_tenant } from "@clients/${name}/site/tenant";
export { default as admin_tenant } from "@clients/${name}/admin/tenant";
`,
  );

  writeFileSync(
    join(appDir, "src/tenants/mock-active.ts"),
    `// GENERATED — do not edit by hand.
// \`npm run client <name>\` rewrites this file.${m.mock ? ` The glob pattern is
// literal so only fe/client/${name}/mock/ is bundled — other clients' mock
// JSON is never included in this client's build.
export const mockFiles = import.meta.glob("../../../client/${name}/mock/**/*.json", {
  eager: true,
});` : ` manifest mock:false — no mock
// files are bundled; every apiClient call hits the real API.
export const mockFiles: Record<string, unknown> = {};`}
`,
  );

  // React Native twin — Metro resolves .native.ts first. import.meta.glob
  // is Vite-only; Metro's equivalent is require.context (needs a literal
  // path, so this file is generated per client exactly like the web one).
  writeFileSync(
    join(appDir, "src/tenants/mock-active.native.ts"),
    `// GENERATED — do not edit by hand.
// \`npm run client <name>\` rewrites this file. Native variant of
// mock-active.ts — import.meta.glob is Vite-only; require.context is the
// Metro equivalent (synchronous like eager:true). Keys are rewritten to
// the same ../../../client/... shape loadGlobs expects.${m.mock ? `
const ctx = (require as any).context(
  "../../../client/${name}/mock",
  true,
  /\\.json$/,
);
export const mockFiles: Record<string, unknown> = Object.fromEntries(
  ctx.keys().map((k: string) => [
    \`../../../client/${name}/mock/\${k.replace(/^\\.\\//, "")}\`,
    ctx(k),
  ]),
);` : `
// manifest mock:false — no mock files bundled; every call hits the API.
export const mockFiles: Record<string, unknown> = {};`}
`,
  );

  // Dev-all bindings: lazy per-client loaders in one generated file.
  // Only imported under import.meta.env.DEV, so production builds
  // tree-shake it away entirely — prod stays single-client lean. Lazy
  // import()s keep every client in its own chunk, so a tree of thousands
  // of clients costs nothing until ensureClient() requests one.
  const names = readdirSync(clientDir)
    .filter((d) => existsSync(join(clientDir, d, "client.json")))
    .sort();

  let dev = `// GENERATED — do not edit by hand.
// \`npm run client <name>\` rewrites this file. Dev only: imported under
// import.meta.env.DEV so prod builds drop it completely. Dynamic imports
// (not static) — dev-all never eagerly bundles any client's code.
import type { ClientTenant } from "./types";

type TenantModule = { default: ClientTenant };
type ClientLoader = {
  site: () => Promise<TenantModule>;
  admin: () => Promise<TenantModule>;
  styles: (() => Promise<unknown>)[];
};

export const clientLoaders: Record<string, ClientLoader> = {
`;
  for (const n of names) {
    const manifest = readManifest(clientDir, n);
    const styleLoads = SURFACES.filter((s) => manifest?.surfaces?.[s]?.styles)
      .map((s) => `() => import("@clients/${n}/${s}/styles.css")`)
      .join(", ");
    dev += `  ${n}: {
    site: () => import("@clients/${n}/site/tenant"),
    admin: () => import("@clients/${n}/admin/tenant"),
    styles: [${styleLoads}],
  },\n`;
  }
  dev += `};

// Lazy mock glob — one () => import() per JSON file, keyed by
// ../../../client/<name>/mock/<...> path. ensureClientMocks in
// engine/library/mock-data.ts loads only the requested client's prefix.
export const mockGlobs: Record<string, () => Promise<unknown>> =
  import.meta.glob("../../../client/*/mock/**/*.json");
`;
  writeFileSync(join(appDir, "src/tenants/dev-all.ts"), dev);

  // Native twin — same loaders (dynamic import() works on Metro), but
  // mockGlobs comes from require.context instead of import.meta.glob.
  // require.context is synchronous; keys are wrapped in () => Promise so
  // ensureClientMocks keeps its lazy contract.
  const devNative =
    `// GENERATED — do not edit by hand. Native variant of dev-all.ts;
// require.context replaces import.meta.glob (see mock-active.native.ts).
` + dev.split("export const mockGlobs")[0] + `const __ctx = (require as any).context(
  "../../../client",
  true,
  /\\/mock\\/.*\\.json$/,
);
export const mockGlobs: Record<string, () => Promise<unknown>> =
  Object.fromEntries(
    __ctx.keys().map((k: string) => [
      \`../../../client/\${k.replace(/^\\.\\//, "")}\`,
      () => Promise.resolve(__ctx(k)),
    ]),
  );
`;
  writeFileSync(join(appDir, "src/tenants/dev-all.native.ts"), devNative);

  console.log(`active client → ${name} (${m.title || name})`);
}

function scaffold(name) {
  const fe = join(clientDir, name);
  const be = join(beDir, name);
  if (existsSync(fe)) {
    console.error(`exists: fe/client/${name}`);
    process.exit(1);
  }

  const put = (p, s) => {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, s);
  };

  // --- frontend: dumb folder — components + styles + manifest
  put(join(fe, "client.json"),
    JSON.stringify(
      {
        name,
        title: name,
        surfaces: { site: { styles: true }, admin: { styles: true } },
        mock: false, // flip true after: python be/tools/gen_mocks.py <name>
      },
      null,
      2,
    ) + "\n",
  );
  for (const s of SURFACES) {
    put(join(fe, s, "tenant.ts"),
      `// ${name} ${s} tenant — ${s}-surface components (def.type → component).
// See fe/client/README.md for the contract.
export default {
  components: {},
};
`);
    put(join(fe, s, "styles.css"),
      `/* ${name} ${s} surface — auto-bundled by \`npm run client -- ${name}\` */\n`);
    mkdirSync(join(fe, s, "components"), { recursive: true });
  }

  // --- backend: entities + configuration (the actual product definition)
  put(join(be, "entities.py"),
    `# be/client/${name}/entities.py — entity DSL, the single source of truth.

ENTITIES_ORDER = ["todo"]

entities = {
    "todo": {
        "source": "json",
        "fields": {
            "id":    {"type": "int", "primary_key": True},
            "title": {"type": "str", "required": True},
            "done":  {"type": "bool", "default": False},
        },
        "ui": {
            "table": {
                "columns": [
                    {"key": "id",    "label": "ID",    "sortable": True},
                    {"key": "title", "label": "Title", "searchable": True},
                    {"key": "done",  "label": "Done",  "type": "status"},
                ],
                "actions": ["open_form", "confirm_delete"],
            },
            "form": {
                "fields": [
                    {"name": "title", "componentType": "TextInput",
                     "required": True, "colSpan": 2, "label": "Title"},
                    {"name": "done",  "componentType": "Checkbox",
                     "default": False, "label": "Done"},
                ]
            },
        },
        "sample_data": [
            {"id": 1, "title": "First ${name} todo", "done": False},
        ],
    },
}
`);

  put(join(be, "configuration.json"),
    JSON.stringify(
      {
        meta: { client: name, site_name: name, title: name },
        home_page: "pages/home",
        admin: { require_auth: false, logout_redirect: "/" },
        // RBAC — roles the login endpoint may mint. Menu/admin_menu
        // entries may carry "roles": ["admin"] to hide per role; entities
        // get "rbac": {"read": "*", "write": ["admin"]} in entities.py.
        roles: [{ name: "viewer", default: true }, { name: "admin" }],
        menu: [
          { name: "Home", url: "/", entity: "pages/home", public: true, order: 0 },
        ],
        admin_menu: [
          { name: "Todos", url: "/admin/todo", entity: "todo", icon: "list" },
        ],
        language: [{ name: "English", code: "en" }],
        sessions: [],
        themes: [
          { value: "default", label: "Default", endpoint: "style-config/default" },
        ],
        "style-configs": {
          default: {
            styles: {
              primary: "240 10% 10%",
              "primary-foreground": "0 0% 98%",
              background: "0 0% 100%",
              foreground: "240 10% 10%",
              card: "0 0% 100%",
              "card-foreground": "240 10% 10%",
              muted: "240 5% 96%",
              "muted-foreground": "240 4% 46%",
              border: "240 6% 90%",
              destructive: "0 72% 51%",
              radius: "0.5rem",
            },
          },
        },
        pages: {
          home: {
            meta: { title: name },
            config: [],
          },
        },
      },
      null,
      2,
    ) + "\n",
  );

  // Named data sources — entity DSL "source" keys pick one of these.
  // kinds: json | sqlite | http. Add more entries per business need.
  put(join(be, "datasources.json"),
    JSON.stringify(
      {
        json: { kind: "json", path: "data.json" },
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`scaffolded ${name}:
  fe/client/${name}/   client.json + site/ + admin/
  be/client/${name}/   entities.py + configuration.json + datasources.json
next: npm run client -- ${name}   then CLIENT_NAME=${name} on the backend`);
}

if (!arg) {
  console.error("usage: node scripts/client.mjs <client-name> | --new <client-name>");
  process.exit(1);
}

arg === "--new" ? scaffold(name) : activate(arg);

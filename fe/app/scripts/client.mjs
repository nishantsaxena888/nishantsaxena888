// Regenerates the generated bindings for a given client:
//   src/tenants/active.ts      — site/admin tenant imports (+ optional styles)
//   src/tenants/mock-active.ts — mock glob scoped to this client only
//   node scripts/client.mjs <name>
// or: npm run client -- <name>
// The active client's fe/client/<name>/{site,admin}/tenant.ts must exist
// (admin/tenant.ts may export { components: {} } — generic admin covers it).
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = join(appDir, "../client");
const name = process.argv[2];

if (!name) {
  console.error("usage: node scripts/client.mjs <client-name>");
  process.exit(1);
}

const siteTenant = join(clientDir, name, "site/tenant.ts");
const adminTenant = join(clientDir, name, "admin/tenant.ts");
for (const f of [siteTenant, adminTenant]) {
  if (!existsSync(f)) {
    console.error(`missing: ${f}`);
    console.error(`create fe/client/${name}/{site,admin}/tenant.ts first (see fe/client/README.md)`);
    process.exit(1);
  }
}

// Optional per-surface stylesheets — fe/client/<name>/{site,admin}/styles.css
// is bundled only when present (convention, not required).
const styleImports = ["site", "admin"]
  .filter((s) => existsSync(join(clientDir, name, s, "styles.css")))
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
// \`npm run client <name>\` rewrites this file. The glob pattern is literal
// so only fe/client/${name}/mock/ is bundled — other clients' mock JSON is
// never included in this client's build.
export const mockFiles = import.meta.glob("../../../client/${name}/mock/**/*.json", {
  eager: true,
});
`,
);

console.log(`active client → ${name}`);

// Regenerates src/tenants/active.ts for a given client.
//   node scripts/client.mjs <name>
// or: npm run client -- <name>
// The active client's fe/client/<name>/{site,admin}/tenant.ts must exist
// (admin/tenant.ts may export { components: {} } — generic admin covers it).
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];

if (!name) {
  console.error("usage: node scripts/client.mjs <client-name>");
  process.exit(1);
}

const siteTenant = join(appDir, "../client", name, "site/tenant.ts");
const adminTenant = join(appDir, "../client", name, "admin/tenant.ts");
for (const f of [siteTenant, adminTenant]) {
  if (!existsSync(f)) {
    console.error(`missing: ${f}`);
    console.error(`create fe/client/${name}/{site,admin}/tenant.ts first (see fe/client/README.md)`);
    process.exit(1);
  }
}

const out = join(appDir, "src/tenants/active.ts");
writeFileSync(
  out,
  `// GENERATED — do not edit by hand.
// \`npm run client <name>\` (fe/app) rewrites this file to point at
// fe/client/<name>/{site,admin}/tenant.ts. Importing statically keeps the
// bundle lean: only the active client's code is included.
export const client = "${name}";
export { default as site_tenant } from "@clients/${name}/site/tenant";
export { default as admin_tenant } from "@clients/${name}/admin/tenant";
`,
);

console.log(`active client → ${name}`);

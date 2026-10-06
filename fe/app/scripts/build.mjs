// Per-client build — no per-client package.json entries.
//
//   npm run build:client -- uday        → activates uday, builds → dist/uday
//   npm run build:client -- all         → every client folder → dist/<name>
//   ELECTRON=1 npm run build:client -- uday  → desktop variant
//
// Client names come from fe/client/<name>/configs/client.json — adding a
// client needs no script changes here.
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = join(appDir, "../client");
const arg = process.argv[2];

const clients = readdirSync(clientDir)
  .filter((d) => existsSync(join(clientDir, d, "configs/client.json")))
  .sort();

const targets = arg === "all" ? clients : arg ? [arg] : [];
if (!targets.length) {
  console.error(
    `usage: npm run build:client -- <name|all>\nclients: ${clients.join(", ")}`,
  );
  process.exit(1);
}
for (const t of targets) {
  if (!clients.includes(t)) {
    console.error(`unknown client "${t}" — known: ${clients.join(", ")}`);
    process.exit(1);
  }
}

const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, {
    cwd: appDir,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

for (const name of targets) {
  console.log(`\n=== build:client ${name} → dist/${name} ===`);
  run("node", ["scripts/client.mjs", name]);
  run("npx", ["tsc", "-b"]);
  run(
    "npx",
    ["vite", "build", "--outDir", `dist/${name}`],
    process.env.ELECTRON ? { ELECTRON: "1" } : {},
  );
}

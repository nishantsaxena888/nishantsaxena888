// Validates every client's mock registry against its files:
//   fe/client/<name>/mock/config.json flags endpoint+METHOD → the file
//   mock/<lang>/<endpoint>/<METHOD>/<response_type>.json must exist.
// Flagged-but-missing = a 404 in the app, so this fails loudly.
//   node scripts/check-mocks.mjs [client...]     (default: all clients)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), "../../client");
const wanted = process.argv.slice(2);
const clients = readdirSync(clientRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && (!wanted.length || wanted.includes(d.name)))
  .map((d) => d.name);

let failures = 0;

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
}

process.exit(failures ? 1 : 0);

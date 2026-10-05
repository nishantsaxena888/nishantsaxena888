// Native twin guard — Hermes (the RN engine) cannot parse `import.meta`
// at all, even behind a `typeof` guard. Any shared src/ file that uses
// `import.meta` must ship a `.native.<ext>` sibling so Metro resolves the
// platform version instead. This is how env.ts, mock-active.ts and
// dev-all.ts already work — asset.ts was the hole that broke the iOS
// bundle at Hermes-compile time.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../src");

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(p);
  }
  return out;
};

const SKIP = /\.(native|test|spec|d)\.(ts|tsx|js|jsx)$/;
const missing = [];

for (const file of walk(SRC)) {
  if (SKIP.test(file)) continue;
  const src = readFileSync(file, "utf8");
  if (!src.includes("import.meta")) continue;
  const twin = file.replace(/\.(ts|tsx|js|jsx)$/, ".native.$1");
  if (!existsSync(twin)) missing.push(path.relative(SRC, file));
}

if (missing.length) {
  console.log("FAIL files using import.meta without a .native twin:");
  for (const f of missing) console.log("  -", f);
  process.exit(1);
}
console.log("native twins: ok");

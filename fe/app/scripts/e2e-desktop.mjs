// Desktop E2E — drives the REAL Electron shell (electron/main.cjs) over
// the production dist/ bundle via Playwright's first-class Electron
// support. No packaging needed — this exercises the same main process,
// preload, and file:// load path the packed .app uses.
//
//   node scripts/e2e-desktop.mjs            # builds dist if missing
//   CI=1 node scripts/e2e-desktop.mjs       # always rebuild first
import { _electron as electron } from "playwright";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let fail = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${extra ? "  " + extra : ""}`);
  if (!ok) fail++;
};

// ---- build ----------------------------------------------------------------
// ELECTRON=1 → vite.config sets base "./" so dist works over file://.
if (process.env.CI || !existsSync(path.join(APP, "dist/index.html"))) {
  console.log("building dist (ELECTRON=1)...");
  const b = spawnSync("npm", ["run", "build"], {
    cwd: APP,
    env: { ...process.env, ELECTRON: "1" },
    stdio: "inherit",
  });
  if (b.status !== 0) {
    console.log("FAIL build");
    process.exit(1);
  }
}

// ---- launch ----------------------------------------------------------------
const app = await electron.launch({
  args: [path.join(APP, "electron/main.cjs")],
  cwd: APP,
  env: {
    ...process.env,
    // Dev machines that ran `ELECTRON_RUN_AS_NODE=1 node …` would pass the
    // var down and boot the binary as plain Node — never leave it set.
    ELECTRON_RUN_AS_NODE: undefined,
  },
});

const page = await app.firstWindow();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 160)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 140));
});

const body = () => page.evaluate(() => document.body.innerText);
const settle = (ms = 2500) => page.waitForTimeout(ms);
// file:// uses hash routing (create-router picks createHashRouter) —
// history.pushState would escape the bundle path, so navigate via hash.
const nav = async (route) => {
  await page.evaluate((r) => {
    window.location.hash = "#" + r;
  }, route);
  await settle();
};

// ---- checks ----------------------------------------------------------------
// Chromium restores the persisted navigation history (last hash route)
// on relaunch — pin to "#/" so the suite is deterministic regardless of
// what the previous session was looking at.
await settle(3000);
await page.evaluate(() => {
  window.location.hash = "#/";
});
await settle(3000);
check(
  (await page.evaluate(() => location.protocol)) === "file:",
  "boots over file:// (packed-app path)",
);

const home = await body();
check(
  home.length > 40 && !home.includes("crashed"),
  "storefront renders",
  home.slice(0, 50).replace(/\n/g, " "),
);

await nav("/admin/order");
// Wait for real rows — the edit form also prints "Customer" so text
// matching alone can false-positive while OPTIONS is still resolving.
let rows = 0;
for (let i = 0; i < 10 && rows === 0; i++) {
  rows = await page.evaluate(
    () => document.querySelectorAll("tbody tr").length,
  );
  if (rows === 0) await page.waitForTimeout(700);
}
const orders = await body();
check(
  rows > 0 && !orders.includes("crashed"),
  "admin orders table",
  rows > 0 ? "" : `rows=0 | ${orders.slice(0, 60).replace(/\n/g, " ")}`,
);

// Edit regression — the string-date crash that killed default-admin.
// The actions cell holds icon buttons (pencil = edit); wait for a real
// row first so the OPTIONS fetch has finished.
const editBtn = page.locator("tbody tr td:last-child button").first();
try {
  await page.locator("tbody tr").first().waitFor({ timeout: 10000 });
  await editBtn.waitFor({ timeout: 5000 });
  await editBtn.click();
  await settle(1800);
  const form = await body();
  check(
    !form.includes("crashed") && /submit|cancel/i.test(form),
    "order edit form renders on desktop",
  );
} catch (e) {
  await page
    .screenshot({ path: "/tmp/e2e-desktop-fail.png" })
    .catch(() => {});
  check(
    false,
    "order edit form renders on desktop",
    String(e?.message || e).slice(0, 80),
  );
}

await app.close();
console.log(fail ? `\n${fail} desktop check(s) failed` : "\nDESKTOP E2E PASS");
process.exit(fail ? 1 : 0);

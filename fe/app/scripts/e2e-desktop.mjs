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
await settle(4000);
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
const orders = await body();
check(
  /order id|customer/i.test(orders) && !orders.includes("crashed"),
  "admin orders table",
);

// Edit regression — the string-date crash that killed default-admin.
const actionsBtn = page.locator("tbody tr td:last-child button").first();
if (await actionsBtn.count()) {
  await actionsBtn.click();
  await settle(1500);
  const form = await body();
  check(
    !form.includes("crashed") && /submit|cancel/i.test(form),
    "order edit form renders on desktop",
  );
} else {
  check(false, "order edit form renders on desktop", "no action button");
}

await app.close();
console.log(fail ? `\n${fail} desktop check(s) failed` : "\nDESKTOP E2E PASS");
process.exit(fail ? 1 : 0);

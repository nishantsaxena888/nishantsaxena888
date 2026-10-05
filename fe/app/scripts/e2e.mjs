// Self-contained E2E — boots ONE vite dev server and drives every
// client through it (dev mode resolves the client from
// localStorage["vite-client"], so no per-client servers are needed).
//
//   node scripts/e2e.mjs            # spawn server, run, exit code
//   E2E_BASE=http://localhost:5173 node scripts/e2e.mjs   # reuse one
//
// Two layers per client:
//   1. route sweep — render errors, console/page errors, HTTP >=400
//   2. interactions — real user flows (wishlist toggle, query filter,
//      detail route, language switch) asserted against the live DOM
//      and persisted session storage.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import net from "node:net";

const freePort = () =>
  new Promise((res) => {
    const s = net.createServer().listen(0, () => {
      const p = s.address().port;
      s.close(() => res(p));
    });
  });

const PORT = await freePort();
const BASE = process.env.E2E_BASE || `http://localhost:${PORT}`;

const ROUTES = {
  hello: ["/", "/admin", "/admin/todo"],
  grocery: [
    "/", "/shop", "/cart", "/login",
    "/admin", "/admin/overview", "/admin/product", "/admin/order",
  ],
  uday: ["/", "/courses", "/admin", "/admin/overview", "/admin/course"],
  airbnb: ["/", "/stays", "/wishlist", "/admin", "/admin/overview", "/admin/listing"],
};

let fail = 0;
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${extra ? "  " + extra : ""}`);
  if (!ok) fail++;
};

// ---- server --------------------------------------------------------------
let server = null;
if (!process.env.E2E_BASE) {
  server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    cwd: new URL("..", import.meta.url).pathname,
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("vite start timeout")), 30000);
    server.stdout.on("data", (d) => {
      if (String(d).includes("Local:")) { clearTimeout(t); resolve(); }
    });
    server.stderr.on("data", (d) => process.stderr.write(d));
    server.on("exit", (code) => {
      clearTimeout(t);
      reject(new Error(`vite exited early (${code}) — port ${PORT} busy?`));
    });
  });
}

const browser = await chromium.launch();

const newClientPage = async (client) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(
    (c) => window.localStorage.setItem("vite-client", c),
    client,
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 160)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 140));
  });
  return { ctx, page, errors };
};

const goto = async (page, route) => {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 25000 });
  await page.waitForTimeout(900);
};

// ---- 1. route sweep -------------------------------------------------------
for (const [client, routes] of Object.entries(ROUTES)) {
  for (const route of routes) {
    const { ctx, page, errors } = await newClientPage(client);
    try {
      await goto(page, route);
      const text = (await page.textContent("body"))?.trim() || "";
      const ok =
        text.length > 20 &&
        !text.includes("Configuration Error") &&
        // A still-mounted skeleton after the settle wait = a fetch that
        // never resolved — text-length checks alone let this through.
        !text.includes("Loading Component") &&
        errors.length === 0;
      check(ok, `${client}${route}`, text.slice(0, 60));
      if (errors.length) console.log("   errors:", errors.slice(0, 3).join(" | "));
    } catch (e) {
      check(false, `${client}${route}`, "NAV: " + e.message.slice(0, 100));
    }
    await ctx.close();
  }
}

// ---- 2. interactions (airbnb — the richest client) -------------------------
{
  const { ctx, page, errors } = await newClientPage("airbnb");
  try {
    // wishlist toggle persists to the configured session storage
    await goto(page, "/stays");
    const cards = await page.locator(".ab-card").count();
    check(cards > 0, "airbnb /stays cards render", `${cards} cards`);
    await page.locator(".ab-heart").first().click();
    await page.waitForTimeout(300);
    const wl = await page.evaluate(() =>
      window.localStorage.getItem("airbnb_gs_wishlist"),
    );
    check(!!wl && JSON.parse(wl).length > 0, "wishlist heart → session persist");

    // query-param filter narrows the grid
    await goto(page, "/stays?cat=cabins");
    const cabins = await page.locator(".ab-card").count();
    check(cabins > 0 && cabins < cards, "category filter ?cat=cabins", `${cabins} cards`);

    // parameterized detail route
    await goto(page, "/stays/7");
    const detail = (await page.textContent("body")) || "";
    check(
      detail.length > 40 && !/not found|404/i.test(detail.slice(0, 200)),
      "detail route /stays/7",
    );
  } catch (e) {
    check(false, "airbnb interactions", e.message.slice(0, 120));
  }
  check(errors.length === 0, "airbnb interactions: no page errors", errors[0] || "");
  await ctx.close();
}

// grocery — language switch renders Hindi from the mock tree
{
  const { ctx, page } = await newClientPage("grocery");
  try {
    await ctx.addInitScript(() =>
      window.localStorage.setItem("language", "hi"),
    );
    await goto(page, "/");
    const text = (await page.textContent("body")) || "";
    check(/[\u0900-\u097F]/.test(text), "grocery hi language render");
  } catch (e) {
    check(false, "grocery hi", e.message.slice(0, 100));
  }
  await ctx.close();
}

await browser.close();
server?.kill();
console.log(fail ? `\n${fail} check(s) failed` : "\nALL E2E PASS");
process.exit(fail ? 1 : 0);

// Headless UI smoke — renders every client surface in a real browser and
// reports render failures, console errors, page errors and 404s.
// Requires dev servers running:
//   VITE_CLIENT=<c> VITE_BACKEND_URL=http://localhost:810x npm run dev -- --port 517x
// Run: node scripts/smoke-ui.mjs [port=client ...]
//      node scripts/smoke-ui.mjs            (defaults below)
import { chromium } from "playwright";

const DEFAULTS = [
  [5173, "hello"],
  [5174, "grocery"],
  [5175, "uday"],
];

// Per-client route table — site pages + every admin_menu entity page.
const ROUTES = {
  hello: ["/", "/admin", "/admin/todo", "/definitely-missing"],
  grocery: [
    "/", "/shop", "/deals",
    "/admin", "/admin/overview", "/admin/product", "/admin/category",
    "/admin/order", "/admin/customer",
  ],
  uday: [
    "/", "/courses", "/lessons",
    "/admin", "/admin/overview", "/admin/course", "/admin/lesson",
    "/admin/quiz",
  ],
};

// Routes that are EXPECTED to show the not-found state.
const NOT_FOUND = new Set(["/definitely-missing"]);

const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map((s) => s.split("="))
  : DEFAULTS;

const browser = await chromium.launch();
let fail = 0;

for (const [port, name] of targets) {
  const routes = ROUTES[name] ?? ["/", "/admin"];
  for (const route of routes) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 200)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 150));
    });
    page.on("response", (r) => {
      if (r.status() >= 400 && !NOT_FOUND.has(route))
        errors.push(`HTTP ${r.status()} ${r.url().replace(/http:\/\/[^/]+/, "")}`);
    });
    try {
      await page.goto(`http://localhost:${port}${route}`, {
        waitUntil: "networkidle",
        timeout: 25000,
      });
      await page.waitForTimeout(1200);
      const text = (await page.textContent("body"))?.trim() || "";
      let ok;
      if (NOT_FOUND.has(route)) {
        ok = /not found|404/i.test(text);
      } else {
        ok = text.length > 20 && !text.includes("Configuration Error") && errors.length === 0;
      }
      console.log(
        `${ok ? "PASS" : "FAIL"} :${port} ${name}${route}  ${text.slice(0, 70) || "(empty)"}`,
      );
      if (!ok) fail++;
      if (errors.length) console.log("   errors:", errors.slice(0, 4).join(" | "));
    } catch (e) {
      console.log(`FAIL :${port} ${name}${route}  NAV: ${e.message.slice(0, 120)}`);
      fail++;
    }
    await page.close();
  }
}
await browser.close();
console.log(fail ? `\n${fail} route(s) failed` : "\nall routes pass");
process.exit(fail ? 1 : 0);

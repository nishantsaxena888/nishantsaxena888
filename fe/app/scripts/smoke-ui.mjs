// Headless UI smoke — renders each client site + admin in a real browser
// and reports console/page errors. Requires dev servers running:
//   VITE_CLIENT=<c> VITE_BACKEND_URL=http://localhost:810x npm run dev -- --port 517x
// Run: node scripts/smoke-ui.mjs [port=client ...]
//      node scripts/smoke-ui.mjs            (defaults below)
import { chromium } from "playwright";

const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map((s) => s.split("="))
  : [
      [5173, "hello"],
      [5174, "grocery"],
      [5175, "uday"],
    ];

const routes = ["/", "/admin"];
const browser = await chromium.launch();
let fail = 0;

for (const [port, name] of targets) {
  for (const route of routes) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 200)));
    page.on("response", (r) => {
      if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`);
    });
    try {
      await page.goto(`http://localhost:${port}${route}`, {
        waitUntil: "networkidle",
        timeout: 20000,
      });
      await page.waitForTimeout(1500);
      const text = (await page.textContent("body"))?.trim();
      const ok = text && text.length > 20 && !text.includes("Configuration Error");
      console.log(
        `${ok ? "PASS" : "FAIL"} :${port} ${name}${route}  ${(text || "(empty)").slice(0, 80)}`,
      );
      if (!ok) fail++;
      if (errors.length) console.log("   errors:", errors.join(" | "));
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

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
  skillom: [
    "/", "/courses", "/courses/2", "/learn/1", "/my-learning",
    "/admin", "/admin/overview", "/admin/course", "/admin/revision",
    "/admin/review-queue",
  ],
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

// skillom — course catalog → detail → md reader → quiz + progress session
{
  const { ctx, page, errors } = await newClientPage("skillom");
  try {
    await goto(page, "/courses");
    const cards = await page.locator(".course-card").count();
    check(cards > 0, "skillom /courses cards render", `${cards} cards`);

    // parameterized detail route → ordered chapter list
    await goto(page, "/courses/5");
    const rows = await page.locator(".chapter-row").count();
    check(rows > 0, "skillom course detail → chapters", `${rows} chapters`);

    // reader: md_content → parsed sections, Quiz directive → widget
    await goto(page, "/learn/1");
    const reader = await page.locator(".chapter-reader").count();
    const quiz = await page.locator(".quiz-card").count();
    check(
      reader > 0 && quiz > 0,
      "skillom reader: md → sections + quiz widget",
      `${quiz} quiz`,
    );

    // answer the quiz → correctness state
    if (quiz) {
      await page.locator(".quiz-option").nth(1).click();
      await page.waitForTimeout(200);
      const feedback = (await page.locator(".quiz-card").textContent()) || "";
      check(/correct/i.test(feedback), "quiz answer → feedback");
    }

    // mark complete → writes the "progress" session (localStorage)
    const markBtn = page.locator(".chapter-reader .sf-action-btn");
    if (await markBtn.count()) await markBtn.click();
    await page.waitForTimeout(300);
    const prog = await page.evaluate(() =>
      window.localStorage.getItem("skillom_gs_progress"),
    );
    check(
      !!prog && JSON.parse(prog).length > 0,
      "mark complete → progress session persist",
    );

    // review board: status columns + lazy write actions (PUT transition
    // fires only on click — the mock answers {ok:true}, list reloads)
    await goto(page, "/admin/review-queue");
    const cols = await page.locator(".revision-pipeline .grid > div").count();
    check(cols === 4, "skillom review-queue → 4 status columns", `${cols} cols`);
    const approve = page
      .locator("button")
      .filter({ hasText: /^Approve$/ })
      .first();
    if (await approve.count()) {
      await approve.click();
      await page.waitForTimeout(400);
      const board = (await page.textContent("body")) || "";
      check(!board.includes("crashed"), "approve transition no crash");
    }
  } catch (e) {
    check(false, "skillom flow", e.message.slice(0, 120));
  }
  check(errors.length === 0, "skillom flow: no page errors", errors[0] || "");
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

// ---- 3. admin auth + CRUD (grocery) --------------------------------------
// The login form POSTs the configured endpoint; when the mock doesn't
// return a token a signed dev JWT is minted and stored under "token".
{
  const { ctx, page, errors } = await newClientPage("grocery");
  try {
    // Login form → token stored → lands on the admin surface
    await goto(page, "/login");
    await page.locator("input").first().fill("admin@nishify.com");
    await page.locator('input[type="password"]').fill("secret");
    const submit = page
      .locator("button")
      .filter({ hasText: /sign in|log in|submit|continue/i })
      .first();
    if (await submit.count()) await submit.click();
    else await page.locator('input[type="password"]').press("Enter");
    await page.waitForTimeout(1500);
    const token = await page.evaluate(() =>
      window.localStorage.getItem("token"),
    );
    check(!!token, "login → token stored");
    const url = await page.evaluate(() => location.pathname);
    check(url.startsWith("/admin"), "login → redirected to admin", url);

    // Edit flow — regression for the InputDate string-value crash:
    // the date field must coerce "2024-04-10" instead of throwing.
    await goto(page, "/admin/order");
    await page
      .locator("tbody tr td:last-child button")
      .first()
      .click();
    await page.waitForTimeout(1200);
    const editText = (await page.textContent("body")) || "";
    check(
      !editText.includes("crashed") && /edit|submit|cancel/i.test(editText),
      "order edit form renders (date field safe)",
    );
    await page
      .locator("button")
      .filter({ hasText: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(1200);
    const afterEdit = (await page.textContent("body")) || "";
    check(
      /order id|customer/i.test(afterEdit) && !afterEdit.includes("crashed"),
      "order edit submit → back to table",
    );

    // Add form opens and cancels cleanly
    await goto(page, "/admin/order");
    await page
      .locator("button")
      .filter({ hasText: /add/i })
      .first()
      .click();
    await page.waitForTimeout(1000);
    const addText = (await page.textContent("body")) || "";
    check(
      !addText.includes("crashed") && /submit|cancel/i.test(addText),
      "order add form renders",
    );

    // Delete → confirm dialog → row action completes without crash
    await goto(page, "/admin/order");
    const delBtn = page.locator("tbody tr td:last-child button").last();
    if (await delBtn.count()) {
      await delBtn.click();
      await page.waitForTimeout(800);
      const dlg = (await page.textContent("body")) || "";
      const confirmBtn = page
        .locator("button")
        .filter({ hasText: /confirm|delete|yes|ok/i })
        .last();
      if (await confirmBtn.count()) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      }
      const afterDel = (await page.textContent("body")) || "";
      check(!afterDel.includes("crashed"), "order delete flow no crash");
    }
  } catch (e) {
    check(false, "grocery admin flow", e.message.slice(0, 120));
  }
  check(errors.length === 0, "admin flow: no page errors", errors[0] || "");
  await ctx.close();
}

await browser.close();
server?.kill();
console.log(fail ? `\n${fail} check(s) failed` : "\nALL E2E PASS");
process.exit(fail ? 1 : 0);

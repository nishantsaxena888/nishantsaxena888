// Electron main process — the web bundle IS the desktop app.
// Build with ELECTRON=1 (vite.config sets base:"./" so dist loads over
// file://), then point this at the output:
//
//   ELECTRON=1 npm run build:grocery        # → dist/grocery/
//   ELECTRON_DIST=dist/grocery npx electron electron/main.cjs
//
// The shared src needs nothing else — storage/navigation/host all
// resolve to the web impls (Chromium is the host).
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const DIST = process.env.ELECTRON_DIST || "dist";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // External links open in the OS browser, not a new Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const index = path.resolve(__dirname, "..", DIST, "index.html");

  // SPA fallback — a reload on a history route (file:///login) 404s
  // because no such file exists; serve index.html instead. (The app
  // uses hash routing under file://, so this is a safety net.)
  win.webContents.on(
    "did-fail-load",
    (_e, _code, _desc, url, isMainFrame) => {
      if (isMainFrame && !url.endsWith("index.html")) {
        win.loadFile(index);
      }
    },
  );

  console.log("[electron] loading", index);
  win.loadFile(index);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

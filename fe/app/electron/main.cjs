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

  win.loadFile(path.join(__dirname, "..", DIST, "index.html"));
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

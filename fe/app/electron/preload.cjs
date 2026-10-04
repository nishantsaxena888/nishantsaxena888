// Electron preload — the bridge seam for future native capabilities
// (file dialogs, tray, auto-updater, secure storage). Shared code never
// touches this directly; when a capability is needed, add a typed
// platform/<capability>.electron.ts adapter behind the same contract
// the web impl already exposes.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  platform: "electron",
  versions: process.versions.electron,
});

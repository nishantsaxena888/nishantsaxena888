import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import babel from "@rolldown/plugin-babel";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  // ELECTRON=1 → relative base so the bundle loads over file:// inside
  // Electron's BrowserWindow; web builds stay root-absolute.
  base: process.env.ELECTRON ? "./" : "/",
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Stable vendor split — framework/runtime deps cache independently
        // of app code, so a client-content-only deploy doesn't invalidate
        // the browser's vendor cache. (Rolldown: function form only.)
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || /node_modules\/react\//.test(id) || id.includes("scheduler"))
            return "vendor-react";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("zustand")) return "vendor-state";
          if (id.includes("lucide-react")) return "vendor-icons";
        },
      },
    },
  },
  resolve: {
    alias: {
      "react": path.resolve(import.meta.dirname, "node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
      // Public seam for fe/client — stable even though platform/ lives
      // inside src/common/. Order matters: before the generic "@" alias.
      "@/platform": path.resolve(import.meta.dirname, "./src/common/platform"),
      "@": path.resolve(import.meta.dirname, "./src"),
      "nishify": path.resolve(import.meta.dirname, "./src/nishify.ts"),
      "@clients": path.resolve(import.meta.dirname, "../client"),
    },
    dedupe: ["react", "react-dom", "zustand"],
  },
  server: {
    port: 5173,
    strictPort: false,
    fs: { allow: [".."] },
    proxy: {
      // Per-client dev servers point at their own backend:
      //   VITE_BACKEND_URL=http://localhost:8101 npm run dev -- --port 5174
      "/api": process.env.VITE_BACKEND_URL || "http://localhost:8100",
    },
  },
});


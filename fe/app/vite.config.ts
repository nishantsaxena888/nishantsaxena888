import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import babel from "@rolldown/plugin-babel";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "@": path.resolve(__dirname, "./src"),
      "nishify": path.resolve(__dirname, "./src/nishify.ts"),
      "@clients": path.resolve(__dirname, "../client"),
    },
    dedupe: ["react", "react-dom", "zustand"],
  },
  server: {
    port: 5173,
    strictPort: false,
    fs: { allow: [".."] },
    proxy: {
      "/api": "http://localhost:8100",
    },
  },
});


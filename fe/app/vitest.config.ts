import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Test environments by file convention — this split is what makes the
// suite portable:
//   *.test.ts   → node (pure logic; runs identically under React Native /
//                 desktop stacks — no DOM assumption anywhere)
//   *.test.tsx  → jsdom (view layer only; swap for RN's renderer later,
//                 hook/logic tests don't change)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "@": path.resolve(__dirname, "./src"),
      nishify: path.resolve(__dirname, "./src/nishify.ts"),
      "@clients": path.resolve(__dirname, "../client"),
    },
    dedupe: ["react", "react-dom", "zustand"],
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    environmentMatchGlobs: [
      ["src/**/*.test.tsx", "jsdom"],
      ["src/**/*.test.ts", "node"],
    ],
  },
});

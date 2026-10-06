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
      "@/platform": path.resolve(__dirname, "./src/common/platform"),
      "@/tenants": path.resolve(__dirname, "./src/common/tenants"),
      "@": path.resolve(__dirname, "./src"),
      nishify: path.resolve(__dirname, "./src/nishify.ts"),
      "@clients": path.resolve(__dirname, "../client"),
      // *.native.* files get their real modules under Metro; in tests they
      // resolve to react-native-web + in-memory stubs so the adapters are
      // actually rendered and exercised, not just type-checked.
      "react-native": path.resolve(__dirname, "src/common/test/react-native-stub.ts"),
      "@react-navigation/native": path.resolve(
        __dirname,
        "src/common/test/react-navigation-stub.ts",
      ),
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "src/common/test/async-storage-stub.ts",
      ),
    },
    dedupe: ["react", "react-dom", "zustand"],
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "../client/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/common/test/setup.ts"],
    environmentMatchGlobs: [
      ["src/**/*.test.tsx", "jsdom"],
      ["../client/**/*.test.tsx", "jsdom"],
      ["src/**/*.test.ts", "node"],
      ["../client/**/*.test.ts", "node"],
    ],
  },
});

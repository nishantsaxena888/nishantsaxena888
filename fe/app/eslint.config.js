import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const base = [
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
];

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: base,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Tenancy boundary, app side: engine code never imports client folders.
      // Only the generated binding files (below) may reach @clients/*.
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@clients/*", "../../client/*", "../../../client/*"],
              message:
                "Engine code must not import client folders — clients are " +
                "bound through the generated src/tenants/{active,dev-all,mock-active}.ts files.",
            },
          ],
        },
      ],
    },
  },
  {
    // Generated bindings are the ONLY files allowed to touch @clients/*.
    files: [
      "src/tenants/active.ts",
      "src/tenants/dev-all.ts",
      "src/tenants/mock-active.ts",
    ],
    rules: { "@typescript-eslint/no-restricted-imports": "off" },
  },
]);

// Client-side tenancy boundary, run via fe/eslint.config.js (see
// `npm run lint` in fe/app — eslint cannot lint outside its base path,
// so this block is exported for the fe/-level wrapper config whose file
// patterns are relative to fe/).
export const clientConfig = defineConfig([
  {
    files: ["client/**/*.{ts,tsx}"],
    extends: base,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // fe/client/** is dumb — React + own-folder relative imports only.
      // @/* reaches the engine; ../* / ../../* reach other clients or
      // fe/app. The engine contract (RenderComponentProps) is reachable
      // only as a type import.
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "../*", "../../*", "../../../*"],
              allowTypeImports: true,
              message:
                "Client code must not import the engine or other clients — " +
                "receive props (RenderComponentProps) and export a tenant map only.",
            },
          ],
        },
      ],
    },
  },
]);

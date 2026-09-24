import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { architectureRule } from "./scripts/eslint-architecture.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ["{app,features,entities,infrastructure,shared}/**/*.{ts,tsx,js,mjs}"],
    ignores: ["**/*.test.*"],
    plugins: { architecture: { rules: { boundaries: architectureRule } } },
    rules: { "architecture/boundaries": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".agents/**",
    ".codex/**",
    "test-results/**",
    "playwright-report/**",
    "public/sw.js",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

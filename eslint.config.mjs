import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js", "**/*.mjs"],
    ignores: ["dist/**", "node_modules/**", "coverage/**", "public/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
        URL: "readonly",
        fetch: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
    },
  },
]);

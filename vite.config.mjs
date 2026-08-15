import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

function collectHtmlEntries(directory, entries = {}) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "public"].includes(item.name))
      continue;
    const itemPath = resolve(directory, item.name);
    if (item.isDirectory()) collectHtmlEntries(itemPath, entries);
    if (item.isFile() && item.name === "index.html") {
      const name =
        itemPath
          .replace(import.meta.dirname, "")
          .replace(/[\\/]+index\.html$/, "")
          .replace(/^[\\/]+/, "")
          .replace(/[\\/]+/g, "-") || "home";
      entries[name] = itemPath;
    }
  }
  return entries;
}

const input = collectHtmlEntries(import.meta.dirname);

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: false,
      },
    },
  },
  build: {
    rollupOptions: {
      input,
      output: {
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});

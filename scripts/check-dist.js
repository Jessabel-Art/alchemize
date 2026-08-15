import fs from "node:fs";
import path from "node:path";

import { discoverRoutes } from "./lib/routes.js";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

if (!fs.existsSync(distDir)) {
  console.error("Build output not found at dist/. Run npm run build first.");
  process.exit(1);
}

const builtHtmlFiles = walk(distDir).filter((file) => file.endsWith(".html"));
const routes = discoverRoutes(rootDir);
const expectedRoutes = new Set(
  routes.map((route) => {
    const routeSlug =
      route.path === "/"
        ? "index.html"
        : `${route.path.replace(/^\/+|\/+$/g, "")}/index.html`;
    return path.join(distDir, routeSlug.replace(/\//g, path.sep));
  }),
);

const missingPages = [...expectedRoutes].filter(
  (expectedPath) => !fs.existsSync(expectedPath),
);

const problems = [];

if (missingPages.length > 0) {
  for (const page of missingPages) {
    problems.push({
      path: path.relative(rootDir, page).replace(/\\/g, "/"),
      reason: "missing from dist output",
    });
  }
}

const unexpectedPages = builtHtmlFiles.filter(
  (file) => ![...expectedRoutes].includes(file),
);

for (const file of unexpectedPages) {
  problems.push({
    path: path.relative(rootDir, file).replace(/\\/g, "/"),
    reason: "not mapped to a known source route",
  });
}

const buildAssetPaths = walk(distDir).filter(
  (file) => !file.endsWith(".html") && fs.statSync(file).size === 0,
);

for (const file of buildAssetPaths) {
  problems.push({
    path: path.relative(rootDir, file).replace(/\\/g, "/"),
    reason: "zero-byte asset in dist",
  });
}

if (problems.length > 0) {
  console.error("Production output check failed:");
  for (const problem of problems) {
    console.error(`- ${problem.path} (${problem.reason})`);
  }
  process.exit(1);
}

console.log(
  `Production artifact check passed. ${builtHtmlFiles.length} HTML files in dist match ${routes.length} discovered routes.`,
);

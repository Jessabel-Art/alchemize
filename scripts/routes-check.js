import fs from "node:fs";
import path from "node:path";
import { discoverRoutes, validateSlug } from "./lib/routes.js";

const rootDir = process.cwd();
const routes = discoverRoutes(rootDir);
const seenPaths = new Map();
const issues = [];

for (const route of routes) {
  if (seenPaths.has(route.path)) {
    issues.push(`Duplicate route: ${route.path}`);
  }
  seenPaths.set(route.path, true);

  const sourcePath = path.join(rootDir, route.sourceFile);
  if (!fs.existsSync(sourcePath)) {
    issues.push(`Missing route source: ${route.sourceFile}`);
  }

  const directoryName = route.sourceFile.split("/").slice(0, -1).at(-1) || "";
  if (directoryName && !validateSlug(directoryName)) {
    issues.push(`Invalid slug in route directory: ${directoryName}`);
  }

  if (route.path !== "/" && !route.path.endsWith("/")) {
    issues.push(`Route missing trailing slash: ${route.path}`);
  }
}

const rootPageIndex = path.join(rootDir, "index.html");
if (!fs.existsSync(rootPageIndex)) {
  issues.push("Missing root index.html");
}

if (issues.length > 0) {
  console.error("Route check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Route check passed for ${routes.length} discovered routes.`);

import { discoverRoutes } from "./lib/routes.js";
import { execSync } from "node:child_process";

const routes = discoverRoutes(process.cwd());
const resourceCount = routes.filter(
  (route) => route.type === "resource",
).length;

console.log(`Resources: ${resourceCount}`);
console.log(`Total route entries: ${routes.length}`);

try {
  execSync("node scripts/routes-check.js", { stdio: "inherit" });
  execSync("node scripts/check-metadata.js", { stdio: "inherit" });
  execSync("node scripts/check-links.js", { stdio: "inherit" });
} catch (error) {
  process.exit(error.status || 1);
}

console.log("Content checks passed.");

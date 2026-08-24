import { discoverRoutes } from "./lib/routes.js";

const rootDir = process.cwd();
const routes = discoverRoutes(rootDir).filter(
  (route) => route.type === "resource",
);

const resourceRoutes = routes.filter((route) => route.type === "resource");

console.log("RESOURCES");
if (resourceRoutes.length === 0) {
  console.log("- None found");
} else {
  for (const route of resourceRoutes) {
    console.log(`${route.title || "Untitled resource"}`);
    console.log(`${route.path}`);
    console.log();
  }
}

import { discoverRoutes } from "./lib/routes.js";

const rootDir = process.cwd();
const routes = discoverRoutes(rootDir);

for (const route of routes) {
  console.log(`${route.path} | ${route.type} | ${route.sourceFile}`);
}

console.log(`\nDiscovered ${routes.length} valid public routes.`);

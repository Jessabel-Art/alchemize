import { APP_ROUTE_PATHS } from "./lib/react-routes.js";

const routes = APP_ROUTE_PATHS;
const seenPaths = new Set();
const issues = [];

for (const route of routes) {
  if (!route || !route.startsWith("/")) {
    issues.push(`Invalid route path: ${route}`);
    continue;
  }

  if (seenPaths.has(route)) {
    issues.push(`Duplicate route: ${route}`);
  }
  seenPaths.add(route);
}

if (issues.length > 0) {
  console.error("Route check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Route check passed for ${routes.length} React routes.`);

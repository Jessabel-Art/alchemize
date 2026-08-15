import fs from "node:fs";
import path from "node:path";
import { discoverRoutes } from "./lib/routes.js";

const rootDir = process.cwd();
const baseUrl = "https://getalchemize.com";
const routes = discoverRoutes(rootDir).filter(
  (route) => !["application", "admin", "auth"].includes(route.type),
);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map(
      (route) => `
  <url>
    <loc>${baseUrl}${route.path}</loc>
  </url>`,
    )
    .join("")}
</urlset>
`;

const publicDir = path.join(rootDir, "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(
  path.join(publicDir, "sitemap.xml"),
  xml.trim() + "\n",
  "utf8",
);
console.log(`Generated sitemap.xml with ${routes.length} routes.`);

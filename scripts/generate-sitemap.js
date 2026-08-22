import fs from "node:fs";
import path from "node:path";
import { getSitemapRoutes } from "./lib/react-routes.js";

const rootDir = process.cwd();
const baseUrl = "https://getalchemize.com";
const routes = getSitemapRoutes();

function renderRoute(route) {
  const alternates = route.alternates
    ? `\n    ${Object.entries(route.alternates)
        .map(
          ([language, alternatePath]) =>
            `<xhtml:link rel="alternate" hreflang="${language}" href="${baseUrl}${alternatePath}" />`,
        )
        .join("\n    ")}`
    : "";
  return `<url>\n    <loc>${baseUrl}${route.path}</loc>${alternates}\n  </url>`;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${routes.map(renderRoute).join("\n  ")}
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

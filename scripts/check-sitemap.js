import fs from "node:fs";
import path from "node:path";
import { getSitemapRoutes, PUBLIC_SITEMAP_ROUTES } from "./lib/react-routes.js";
import { SITE_URL } from "../src/seo/siteSchema.js";
import { serviceCatalog } from "../src/pages/services/serviceCatalog.js";
import { resources as resourceLibrary } from "../src/pages/resources/resourcesData.js";

const rootDir = process.cwd();
const issues = [];

const FORBIDDEN_PREFIXES = [
  "/admin",
  "/client-portal",
  "/login",
  "/register",
  "/set-password",
  "/appointment/schedule",
];

for (const route of PUBLIC_SITEMAP_ROUTES) {
  if (FORBIDDEN_PREFIXES.some((prefix) => route.startsWith(prefix))) {
    issues.push(
      `Private/application route leaked into sitemap source: ${route}`,
    );
  }
}

// Every real service detail page in the catalog must be reachable through the
// sitemap's authoritative route list, so a new/renamed service is never
// silently omitted the way translation/apostille/bookkeeping/payroll were.
for (const service of serviceCatalog) {
  const servicePath = `/services/${service.audience}/${service.slug}`;
  if (!PUBLIC_SITEMAP_ROUTES.includes(servicePath)) {
    issues.push(
      `Service catalog entry missing from sitemap routes: ${servicePath}`,
    );
  }
}

// Every sitemap "service detail" path must correspond to a real catalog
// entry, so a redirect-only slug (e.g. a legacy alias) never reappears as a
// duplicate canonical URL.
for (const route of PUBLIC_SITEMAP_ROUTES) {
  const match = route.match(/^\/services\/(individuals|businesses)\/([^/]+)$/);
  if (!match) continue;
  const [, audience, slug] = match;
  const exists = serviceCatalog.some(
    (service) => service.audience === audience && service.slug === slug,
  );
  if (!exists) {
    issues.push(
      `Sitemap references a service path with no catalog entry: ${route}`,
    );
  }
}

// Every English resource route in the sitemap must correspond to a real
// resource entry.
for (const route of PUBLIC_SITEMAP_ROUTES) {
  const match = route.match(/^\/resources\/([^/]+)$/);
  if (!match) continue;
  const slug = match[1];
  if (slug === "meet-the-founder") continue;
  const exists = resourceLibrary.some((resource) => resource.slug === slug);
  if (!exists) {
    issues.push(
      `Sitemap references a resource path with no resource entry: ${route}`,
    );
  }
}

const routes = getSitemapRoutes();
if (routes.length === 0) {
  issues.push("getSitemapRoutes() returned zero routes.");
}

for (const route of routes) {
  if (!route.path.startsWith("/")) {
    issues.push(`Sitemap route is not an absolute path: ${route.path}`);
  }
  for (const alternatePath of Object.values(route.alternates || {})) {
    if (!alternatePath.startsWith("/")) {
      issues.push(
        `Alternate path for ${route.path} is not absolute: ${alternatePath}`,
      );
    }
  }
}

if (!SITE_URL.startsWith("https://") || SITE_URL.includes("localhost")) {
  issues.push(`SITE_URL is not a production https URL: ${SITE_URL}`);
}

const sitemapPath = path.join(rootDir, "public", "sitemap.xml");
if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locMatches) {
    if (!loc.startsWith(SITE_URL)) {
      issues.push(`sitemap.xml contains a URL not on ${SITE_URL}: ${loc}`);
    }
    const host = loc.replace(/^https?:\/\//, "").split(/[/?#]/)[0];
    if (host.includes("localhost") || host.includes("hostinger")) {
      issues.push(`sitemap.xml contains a non-production URL: ${loc}`);
    }
    for (const prefix of FORBIDDEN_PREFIXES) {
      const routePath = loc.slice(SITE_URL.length);
      if (routePath.startsWith(prefix)) {
        issues.push(`sitemap.xml contains a private/application URL: ${loc}`);
      }
    }
  }
}

const robotsPath = path.join(rootDir, "public", "robots.txt");
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, "utf8");
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
    issues.push(
      `robots.txt Sitemap directive does not reference ${SITE_URL}/sitemap.xml`,
    );
  }
  if (/Disallow:\s*\/login\/(\s|$)/.test(robots)) {
    issues.push(
      "robots.txt disallows /login/ with a trailing slash, which does not match the real /login route.",
    );
  }
  if (/Disallow:\s*\/register\/(\s|$)/.test(robots)) {
    issues.push(
      "robots.txt disallows /register/ with a trailing slash, which does not match the real /register route.",
    );
  }
  if (!/Disallow:\s*\/login(\s|$)/.test(robots)) {
    issues.push("robots.txt is missing a Disallow rule that matches /login.");
  }
  if (!/Disallow:\s*\/register(\s|$)/.test(robots)) {
    issues.push(
      "robots.txt is missing a Disallow rule that matches /register.",
    );
  }
}

if (issues.length > 0) {
  console.error("Sitemap check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Sitemap check passed for ${routes.length} sitemap routes.`);

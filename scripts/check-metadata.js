import fs from "node:fs";
import path from "node:path";
import { discoverRoutes } from "./lib/routes.js";

const rootDir = process.cwd();
const routes = discoverRoutes(rootDir).filter(
  (route) => !["application", "admin", "auth"].includes(route.type),
);
const issues = [];
const titles = new Map();
const descriptions = new Map();

function getHtmlTag(html, tagName) {
  const regex = new RegExp(
    `<${tagName}\\s*[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "i",
  );
  const match = html.match(regex);
  return match
    ? match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

for (const route of routes) {
  const fullPath = path.join(rootDir, route.sourceFile);
  const html = fs.readFileSync(fullPath, "utf8");

  const title = getHtmlTag(html, "title");
  const description =
    html.match(
      /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    )?.[1] ||
    html.match(
      /<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i,
    )?.[1] ||
    "";

  const h1Count = (html.match(/<h1\b/gi) || []).length;

  if (!title) {
    issues.push(`${route.path} missing <title>`);
  }

  if (!description) {
    issues.push(`${route.path} missing meta description`);
  }

  if (h1Count !== 1) {
    issues.push(`${route.path} has ${h1Count} H1 tags`);
  }

  if (title) {
    const titleKey = title.trim();
    if (!titles.has(titleKey)) {
      titles.set(titleKey, [route.path]);
    } else {
      titles.get(titleKey).push(route.path);
    }
  }

  if (description) {
    const descriptionKey = description.trim();
    if (!descriptions.has(descriptionKey)) {
      descriptions.set(descriptionKey, [route.path]);
    } else {
      descriptions.get(descriptionKey).push(route.path);
    }
  }

  const canonicalMatch = html.match(
    /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  );
  if (canonicalMatch) {
    const canonicalUrl = canonicalMatch[1];
    if (canonicalUrl !== `https://getalchemize.com${route.path}`) {
      issues.push(`${route.path} canonical mismatch: ${canonicalUrl}`);
    }
  }
}

for (const [title, paths] of titles.entries()) {
  if (paths.length > 1) {
    issues.push(`Duplicate title: "${title}" on ${paths.join(", ")}`);
  }
}

for (const [description, paths] of descriptions.entries()) {
  if (paths.length > 1) {
    issues.push(
      `Duplicate meta description: "${description}" on ${paths.join(", ")}`,
    );
  }
}

if (issues.length > 0) {
  console.error("Metadata check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Metadata check passed for ${routes.length} routes.`);

import fs from "node:fs";
import path from "node:path";

export const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  ".git",
  "public",
  ".github",
  "docs",
  "tests",
  "coverage",
  ".vite",
  "tmp",
  "output",
  "generated",
  "deploy-output",
  "artifacts",
  "vendor",
]);

export function normalizeRoutePath(filePath, rootDir) {
  const relativeDir = path.relative(rootDir, path.dirname(filePath));
  if (!relativeDir || relativeDir === ".") {
    return "/";
  }

  return `/${relativeDir.replace(/\\/g, "/")}/`;
}

export function classifyRoute(routePath) {
  if (routePath === "/") {
    return "page";
  }

  if (routePath.startsWith("/client-portal/")) {
    return "application";
  }

  if (routePath.startsWith("/admin/")) {
    return "admin";
  }

  if (routePath.startsWith("/login/") || routePath.startsWith("/register/")) {
    return "auth";
  }

  if (routePath.startsWith("/resources/")) {
    return "resource";
  }

  if (routePath.startsWith("/services/")) {
    return "service";
  }

  if (routePath.startsWith("/privacy/") || routePath.startsWith("/terms/")) {
    return "legal";
  }

  return "page";
}

function readHtmlMetadata(htmlText) {
  const titleMatch = htmlText.match(/<title\s*[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch =
    htmlText.match(
      /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    ) ||
    htmlText.match(
      /<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i,
    );

  return {
    title: titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "",
    description: descriptionMatch ? descriptionMatch[1].trim() : "",
  };
}

export function discoverRoutes(rootDir = process.cwd()) {
  const routes = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === "index.html") {
        const routePath = normalizeRoutePath(fullPath, rootDir);
        const html = fs.readFileSync(fullPath, "utf8");
        const { title, description } = readHtmlMetadata(html);

        routes.push({
          path: routePath,
          type: classifyRoute(routePath),
          sourceFile: path.relative(rootDir, fullPath).replace(/\\/g, "/"),
          title,
          description,
        });
      }
    }
  }

  walk(rootDir);

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

export function validateSlug(slug) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return false;
  }

  return true;
}

export function buildContentIndex(routes) {
  return routes
    .filter((route) => route.type === "resource")
    .map((route) => ({
      type: route.type,
      title: route.title,
      path: route.path,
      description: route.description,
      category: route.title.includes("Tax")
        ? "Taxes"
        : route.title.includes("Insurance")
          ? "Insurance"
          : route.title.includes("Business")
            ? "Business"
            : route.title.includes("Consultation")
              ? "Getting Started"
              : "General",
    }));
}

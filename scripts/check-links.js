import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const pageExtensions = [".html"];

const htmlFiles = [];

function collectHtmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === ".git"
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath);
      continue;
    }

    if (entry.isFile() && pageExtensions.includes(path.extname(entry.name))) {
      htmlFiles.push(fullPath);
    }
  }
}

function normalizeHref(href) {
  if (
    !href ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("#") ||
    href.startsWith("data:")
  ) {
    return null;
  }

  return href.split("#")[0].split("?")[0];
}

function isLikelyStaticAsset(href) {
  return /\.(png|jpe?g|gif|svg|webp|avif|ico|css|js|pdf|docx?|xlsx?|mp4|webm|mp3|woff2?|ttf)(?:$|[?#])/i.test(
    href,
  );
}

function resolveLink(filePath, href) {
  const relativePath = href.replace(/\\/g, "/");
  const candidate = path.resolve(path.dirname(filePath), relativePath);

  if (relativePath === "/") {
    return path.resolve(rootDir, "index.html");
  }

  if (relativePath.startsWith("/")) {
    return path.resolve(rootDir, relativePath.replace(/^\//, ""));
  }

  return candidate;
}

function existsAtProjectOrPublic(resolved, href) {
  if (fs.existsSync(resolved)) return true;
  if (!href.startsWith("/")) return false;
  return fs.existsSync(path.resolve(rootDir, "public", href.slice(1)));
}

collectHtmlFiles(rootDir);

const failures = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, "utf8");
  const hrefPattern = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefPattern.exec(content)) !== null) {
    const href = normalizeHref(match[1]);

    if (!href) {
      continue;
    }

    if (href === "./" || href === ".") {
      continue;
    }

    if (href.startsWith("//")) {
      continue;
    }

    if (isLikelyStaticAsset(href)) {
      const resolved = resolveLink(file, href);
      if (!existsAtProjectOrPublic(resolved, href)) {
        failures.push({ file, href, reason: "missing asset or local file" });
      }
      continue;
    }

    const resolved = resolveLink(file, href);
    const hasIndex = fs.existsSync(path.join(resolved, "index.html"));
    const directFile = fs.existsSync(resolved);

    if (!directFile && !hasIndex) {
      failures.push({ file, href, reason: "broken internal link" });
    }
  }
}

if (failures.length > 0) {
  console.error("Broken internal links found:");
  for (const failure of failures) {
    const relativeFile = path
      .relative(rootDir, failure.file)
      .replace(/\\/g, "/");
    console.error(`- ${relativeFile} -> ${failure.href} (${failure.reason})`);
  }
  process.exit(1);
}

console.log(
  `Checked ${htmlFiles.length} HTML files. No broken local internal links detected.`,
);

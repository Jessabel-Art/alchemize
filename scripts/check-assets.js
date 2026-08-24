import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const assetPatterns = /(?:src|href)\s*=\s*['"]([^'"]+)['"]/gi;
const seen = new Map();
const ignoredDirs = new Set([
  "node_modules",
  "dist",
  ".git",
  "docs",
  "tests",
  "tmp",
  "api",
  "server",
  "migrations",
  "generated",
  "content",
  "public",
  "scripts",
]);

function walk(dir, results) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) {
      continue;
    }

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
      continue;
    }

    if (entry.isFile()) {
      results.push(full);
    }
  }
}

function normalizeReference(ref) {
  return ref.split("#")[0].split("?")[0];
}

function resolveReference(fromFile, ref) {
  const normalized = normalizeReference(ref).replace(/\\/g, "/");
  if (!normalized || normalized === ".") {
    return null;
  }

  if (normalized.startsWith("/")) {
    return path.resolve(rootDir, normalized.slice(1));
  }

  return path.resolve(path.dirname(fromFile), normalized);
}

function resolveExistingReference(fromFile, ref) {
  const normalized = normalizeReference(ref).replace(/\\/g, "/");
  const directCandidate = resolveReference(fromFile, ref);
  if (!directCandidate) return null;

  const candidates = [directCandidate];
  if (normalized.startsWith("/")) {
    candidates.push(path.resolve(rootDir, "public", normalized.slice(1)));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

const files = [];
walk(rootDir, files);
const activeFiles = files.filter((file) => {
  const relative = path.relative(rootDir, file).replace(/\\/g, "/");
  return (
    (relative.startsWith("src/") ||
      relative.startsWith("public/") ||
      file === path.join(rootDir, "index.html")) &&
    (file.endsWith(".js") || file.endsWith(".css") || file.endsWith(".html"))
  );
});

const localRefs = [];
for (const file of activeFiles) {
  const content = fs.readFileSync(file, "utf8");
  assetPatterns.lastIndex = 0;
  let match;

  while ((match = assetPatterns.exec(content)) !== null) {
    const ref = match[1];
    if (!ref || ref.includes("${") || /^(?:[a-z]+:|#|data:|\/\/)/i.test(ref)) {
      continue;
    }

    const normalized = normalizeReference(ref);
    if (!normalized || normalized === ".") {
      continue;
    }

    if (!/[.]/.test(normalized) && !normalized.endsWith("/")) {
      continue;
    }

    localRefs.push({ from: file, ref: normalized });
  }
}

const problems = [];
for (const { from, ref } of localRefs) {
  const candidate = resolveExistingReference(from, ref);
  if (!candidate || !fs.existsSync(candidate)) {
    problems.push({ from, ref, reason: "missing local asset" });
    continue;
  }

  const stats = fs.statSync(candidate);
  if (stats.isDirectory()) continue;
  if (stats.size === 0) {
    problems.push({ from, ref, reason: "zero-byte file" });
    continue;
  }

  if (/\.(png|jpe?g|svg|webp|avif|gif|ico)$/i.test(candidate)) {
    const key = candidate.replace(/\\/g, "/");
    seen.set(key, (seen.get(key) || 0) + 1);
  }
}

const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
for (const [asset, count] of duplicates) {
  problems.push({
    from: "asset audit",
    ref: asset,
    reason: `duplicate reference (${count} times)`,
  });
}

if (problems.length > 0) {
  console.error("Asset issues found:");
  for (const issue of problems) {
    const relativeFrom = path.relative(rootDir, issue.from).replace(/\\/g, "/");
    console.error(`- ${relativeFrom} -> ${issue.ref} (${issue.reason})`);
  }
  process.exit(1);
}

console.log(
  `Checked ${activeFiles.length} active frontend files. No missing or zero-byte local assets detected.`,
);

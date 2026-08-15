import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const scanPaths = [
  "index.html",
  "styles.css",
  "portal-styles.css",
  "js",
  "scripts",
  "client-portal",
  "admin",
  "login",
  "register",
  "docs",
];

const suspiciousPatterns = [
  /\b(?:password|passwd|pwd)\s*[:=]\s*["'][^"']+/i,
  /sk_live_[A-Za-z0-9]+/i,
  /pk_live_[A-Za-z0-9]+/i,
  /(?:\b\d{9}\b|\b\d{3}-\d{2}-\d{4}\b)/,
  /(?:\b\d{16}\b|\b(?:\d[ -]?){13,19}\b)/,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /(?:Bearer\s+[A-Za-z0-9._-]+)/i,
];

const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
      walk(fullPath);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (![".html", ".css", ".js", ".md"].includes(ext)) continue;

    const content = fs.readFileSync(fullPath, "utf8");
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        findings.push(
          `Possible sensitive pattern in ${path.relative(rootDir, fullPath)}`,
        );
      }
    }
  }
}

for (const target of scanPaths) {
  const fullTarget = path.join(rootDir, target);
  if (!fs.existsSync(fullTarget)) continue;

  if (fs.statSync(fullTarget).isDirectory()) {
    walk(fullTarget);
  } else {
    const content = fs.readFileSync(fullTarget, "utf8");
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        findings.push(`Possible sensitive pattern in ${target}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Security scan found potential sensitive content:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(
  "Security scan passed. No obvious insecure patterns found in current static workspace.",
);

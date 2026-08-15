import { readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["api", "server", "tests/php"];
const files = [];

function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (extname(entry.name) === ".php") files.push(path);
  }
}

roots.forEach(collect);
let failed = false;
for (const file of files) {
  const result = spawnSync("php", ["-l", file], {
    encoding: "utf8",
    shell: false,
  });
  if (result.error?.code === "ENOENT") {
    console.error("PHP is not installed or is not available on PATH.");
    process.exit(1);
  }
  if (result.status !== 0) {
    failed = true;
    console.error(result.stderr || result.stdout);
  }
}

if (failed) process.exit(1);
console.log(`Syntax-checked ${files.length} PHP files.`);

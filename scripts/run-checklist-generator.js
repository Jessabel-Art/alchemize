import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const script = join(process.cwd(), "scripts", "generate-checklists.py");
const bundled = process.env.USERPROFILE
  ? join(
      process.env.USERPROFILE,
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "python",
      "python.exe",
    )
  : null;
const candidates = [
  process.env.PYTHON,
  bundled && existsSync(bundled) ? bundled : null,
  "python3",
  "python",
  "py",
].filter(Boolean);

for (const command of candidates) {
  const prefix = command === "py" ? ["-3"] : [];
  const result = spawnSync(
    command,
    [...prefix, script, ...process.argv.slice(2)],
    {
      stdio: "inherit",
    },
  );
  if (!result.error) process.exit(result.status ?? 1);
}

console.error(
  "Python 3 with ReportLab and Pillow is required to generate checklists.",
);
process.exit(1);

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const legacyCodexPython =
  "C:/Users/Jessa/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const python =
  process.env.CODEX_PYTHON ||
  (existsSync(legacyCodexPython) ? legacyCodexPython : "python");
const script = path.join(
  process.cwd(),
  "scripts",
  "generate-downloadable-resources.py",
);
const result = spawnSync(python, [script], { stdio: "inherit" });
process.exit(result.status ?? 1);

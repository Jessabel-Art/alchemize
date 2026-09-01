import { spawnSync } from "node:child_process";
import path from "node:path";

const python =
  process.env.CODEX_PYTHON ||
  "C:/Users/Jessa/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const script = path.join(
  process.cwd(),
  "scripts",
  "generate-downloadable-resources.py",
);
const result = spawnSync(python, [script], { stdio: "inherit" });
process.exit(result.status ?? 1);

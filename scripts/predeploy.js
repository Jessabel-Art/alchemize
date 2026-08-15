import { execSync } from "node:child_process";

console.log("Running production build...");
execSync("npm run build", { stdio: "inherit" });

console.log("Verifying built output for Hostinger deployment...");
execSync("node scripts/check-dist.js", { stdio: "inherit" });

console.log(
  "Deployment check passed. The dist directory is ready to be uploaded to Hostinger as the site root.",
);

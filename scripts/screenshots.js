import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

import { discoverRoutes } from "./lib/routes.js";

const rootDir = process.cwd();
const baseUrl =
  process.env.BASE_URL || process.argv[2] || "http://127.0.0.1:4173";
const outputDir = path.join(rootDir, "artifacts", "screenshots");

fs.mkdirSync(outputDir, { recursive: true });

const routes = discoverRoutes(rootDir);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });

for (const route of routes) {
  const targetUrl = new URL(route.path, baseUrl).toString();
  const slug =
    route.path === "/"
      ? "home"
      : route.path.replace(/^\/+|\/+$/g, "").replace(/\//g, "-");

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.screenshot({
    path: path.join(outputDir, `${slug || "root"}.png`),
    fullPage: true,
  });
}

await browser.close();

console.log(`Captured screenshots for ${routes.length} routes in ${outputDir}`);

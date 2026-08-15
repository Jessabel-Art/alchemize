import fs from "node:fs";
import path from "node:path";
import { validateSlug } from "./lib/routes.js";

const rootDir = process.cwd();
const resourceDir = path.join(rootDir, "resources");
const templatePath = path.join(rootDir, "templates", "resource.html");

function prompt(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdin.resume();
    stdout.write(`${question} `);
    stdin.once("data", (chunk) => resolve(String(chunk).toString().trim()));
  });
}

async function main() {
  const title = await prompt("Title:");
  const slug = await prompt("Slug:");
  const category = await prompt("Category:");
  const description = await prompt("Meta description:");

  if (!title.trim()) {
    console.error("Title cannot be empty.");
    process.exit(1);
  }

  if (!validateSlug(slug)) {
    console.error(
      "Slug must use lowercase letters, numbers, and hyphens only.",
    );
    process.exit(1);
  }

  if (!description.trim()) {
    console.error("Meta description cannot be empty.");
    process.exit(1);
  }

  if (slug.includes("../") || slug.startsWith("/")) {
    console.error("Invalid slug path.");
    process.exit(1);
  }

  const targetDir = path.join(resourceDir, slug);
  if (fs.existsSync(targetDir)) {
    console.error(`Resource route already exists: /resources/${slug}/`);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, "utf8");
  const pageHtml = template
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{CATEGORY\}\}/g, category || "General")
    .replace(/\{\{META_DESCRIPTION\}\}/g, description)
    .replace(
      /\{\{BODY\}\}/g,
      `
      <section class="article-content">
        <h2>Overview</h2>
        <p>Content to be developed.</p>
      </section>
    `,
    );

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, "index.html"), pageHtml, "utf8");
  console.log(`Created /resources/${slug}/`);
}

main();

import { existsSync, readFileSync } from "node:fs";

const required = [
  "migrations/001_create_leads.sql",
  "migrations/002_create_activity_events.sql",
];
const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`Missing migrations:\n${missing.join("\n")}`);
  process.exit(1);
}

for (const file of required) {
  const sql = readFileSync(file, "utf8");
  if (!/CREATE TABLE/i.test(sql) || !/ENGINE=InnoDB/i.test(sql)) {
    console.error(
      `${file} does not contain the expected InnoDB table definition.`,
    );
    process.exit(1);
  }

  const destructivePatterns = [
    /\bDROP\s+(?:DATABASE|SCHEMA|TABLE|COLUMN|INDEX)\b/i,
    /\bTRUNCATE\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bRENAME\s+TABLE\b/i,
    /\bUPDATE\s+\S+\s+SET\b/i,
    /\bINSERT\s+INTO\b/i,
  ];
  const unsafe = destructivePatterns.find((pattern) => pattern.test(sql));
  if (unsafe) {
    console.error(`${file} contains disallowed migration SQL: ${unsafe}`);
    process.exit(1);
  }
}

const expectedTables = new Map([
  [required[0], "leads"],
  [required[1], "activity_events"],
]);
for (const [file, table] of expectedTables) {
  const sql = readFileSync(file, "utf8");
  if (!new RegExp(`CREATE\\s+TABLE\\s+${table}\\b`, "i").test(sql)) {
    console.error(`${file} does not create the expected ${table} table.`);
    process.exit(1);
  }
  if (!/DEFAULT\s+CHARSET=utf8mb4/i.test(sql)) {
    console.error(`${file} must use utf8mb4.`);
    process.exit(1);
  }
}

console.log(
  `Verified ${required.length} ordered, create-only InnoDB/utf8mb4 migrations.`,
);

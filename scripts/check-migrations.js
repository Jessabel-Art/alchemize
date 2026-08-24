import { readdirSync, readFileSync } from "node:fs";

const files = readdirSync("migrations")
  .filter((file) => /^\d{3}_[a-z0-9_]+\.sql$/i.test(file))
  .sort();

if (!files.length) {
  console.error("No ordered migrations were found.");
  process.exit(1);
}

const failures = [];
files.forEach((file, index) => {
  const expectedPrefix = String(index + 1).padStart(3, "0");
  if (!file.startsWith(`${expectedPrefix}_`)) {
    failures.push(
      `${file} is out of sequence; expected migration ${expectedPrefix}.`,
    );
  }
  const sql = readFileSync(`migrations/${file}`, "utf8");
  if (!/\b(?:CREATE|ALTER|INSERT)\b/i.test(sql)) {
    failures.push(`${file} contains no forward migration statement.`);
  }
  const destructive = [
    /\bDROP\s+(?:DATABASE|SCHEMA|TABLE|COLUMN)\b/i,
    /\bTRUNCATE\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bRENAME\s+TABLE\b/i,
  ].find((pattern) => pattern.test(sql));
  if (destructive)
    failures.push(`${file} contains destructive SQL: ${destructive}`);
  if (/CREATE\s+TABLE/i.test(sql) && !/ENGINE=InnoDB/i.test(sql)) {
    failures.push(`${file} creates a table without an InnoDB declaration.`);
  }
  if (/CREATE\s+TABLE/i.test(sql) && !/utf8mb4/i.test(sql)) {
    failures.push(`${file} creates a table without utf8mb4.`);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Verified ${files.length} ordered, forward-only migrations through ${files.at(-1)}.`,
);

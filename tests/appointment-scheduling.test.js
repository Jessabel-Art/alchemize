import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("admin appointment controls use direct scheduling, scheduling link, and availability actions", () => {
  const page = read("src/pages/admin/AdminOperationalPages.jsx");
  const api = read("src/services/admin-api.js");
  const endpoint = read("api/v1/appointments/index.php");

  assert.match(page, /Send Scheduling Link/i);
  assert.match(page, /Manage Availability/i);
  assert.doesNotMatch(
    page,
    /\+ Schedule Appointment[\s\S]*\+ Schedule Appointment/,
  );
  assert.match(api, /createSchedulingLink|listAvailability|createAvailability/);
  assert.match(endpoint, /scheduling-link|availability/);
});

test("appointment metadata and availability persist through the backend schema", () => {
  const repository = read("server/repositories/appointment-repository.php");
  const migration = read(
    "migrations/026_add_appointment_availability_and_scheduling_links.sql",
  );

  assert.match(
    repository,
    /appointment_availability|appointment_scheduling_links|meeting_method|meeting_url|duration_minutes/,
  );
  assert.match(
    migration,
    /appointment_availability|appointment_scheduling_links|meeting_method|meeting_url|duration_minutes/,
  );
  assert.doesNotMatch(migration, /ADD COLUMN IF NOT EXISTS/i);
});

test("migration and deploy runtime scripts resolve local and deployed bootstrap paths", () => {
  const runMigrations = read("scripts/run-migrations.php");
  const verifyRuntime = read("scripts/verify-deployment-runtime.php");

  assert.match(runMigrations, /\$scriptDir\s*\.\s*'\/bootstrap\.php'/);
  assert.match(
    runMigrations,
    /\$projectRoot\s*\.\s*'\/server\/bootstrap\.php'/,
  );
  assert.match(runMigrations, /\$scriptDir\s*\.\s*'\/migrations'/);
  assert.match(runMigrations, /\$projectRoot\s*\.\s*'\/migrations'/);
  assert.match(runMigrations, /alchemize_schema_migrations/);
  assert.match(
    runMigrations,
    /MIGRATION_BASELINED|MIGRATION_SKIPPED|MIGRATION_APPLYING|MIGRATION_APPLIED/,
  );
  assert.match(runMigrations, /BASELINE_ABORT/);
  assert.match(verifyRuntime, /public_html|public/);
});

test("migration ledger is authoritative for fresh, legacy, and inconsistent databases", () => {
  const script = read("scripts/run-migrations.php");

  assert.match(script, /alchemize_schema_migrations/);
  assert.match(script, /\$number\s*>=\s*1\s*&&\s*\$number\s*<=\s*25/);
  assert.doesNotMatch(script, /\$number\s*>=\s*1\s*&&\s*\$number\s*<=\s*26/);
  assert.match(
    script,
    /BASELINE_ABORT=Legacy Alchemize schema could not be verified/,
  );
  assert.match(
    script,
    /MIGRATION_SKIPPED=|MIGRATION_APPLYING=|MIGRATION_APPLIED=/,
  );
});

test("DDL migrations are executed without an invalid transaction wrapper", () => {
  const script = read("scripts/run-migrations.php");

  assert.doesNotMatch(
    script,
    /beginTransaction\(\);\s*\$database->exec\(\$sql\)/s,
  );
  assert.match(
    script,
    /\$database->exec\(\$sql\);\s*\$insert\s*=\s*\$database->prepare\(/,
  );
  assert.match(
    script,
    /if \(\$database->inTransaction\(\)\) \{\s*\$database->commit\(\);\s*\}/s,
  );
  assert.match(
    script,
    /if \(\$database->inTransaction\(\)\) \{\s*\$database->rollBack\(\);\s*\}/s,
  );
  assert.match(script, /MIGRATION_FAILED=\{\$name\}/);
  assert.doesNotMatch(script, /There is no active transaction/);
});

test("appointment type and meeting method are canonicalized in the admin modal", () => {
  const page = read("src/pages/admin/AdminOperationalPages.jsx");
  assert.match(page, /Appointment type/i);
  assert.match(page, /Meeting method/i);
  assert.match(page, /Phone Call|Google Meet|Microsoft Teams|In Person/);
  assert.match(
    page,
    /Consultation|Follow-Up|Client Meeting|Document Review|Service Discussion|General Call/,
  );
});

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
  assert.doesNotMatch(page, /\+ Schedule Appointment[\s\S]*\+ Schedule Appointment/);
  assert.match(api, /createSchedulingLink|listAvailability|createAvailability/);
  assert.match(endpoint, /scheduling-link|availability/);
});

test("appointment metadata and availability persist through the backend schema", () => {
  const repository = read("server/repositories/appointment-repository.php");
  const migration = read("migrations/026_add_appointment_availability_and_scheduling_links.sql");

  assert.match(repository, /appointment_availability|appointment_scheduling_links|meeting_method|meeting_url|duration_minutes/);
  assert.match(migration, /appointment_availability|appointment_scheduling_links|meeting_method|meeting_url|duration_minutes/);
});

test("appointment type and meeting method are canonicalized in the admin modal", () => {
  const page = read("src/pages/admin/AdminOperationalPages.jsx");
  assert.match(page, /Appointment type/i);
  assert.match(page, /Meeting method/i);
  assert.match(page, /Phone Call|Google Meet|Microsoft Teams|In Person/);
  assert.match(page, /Consultation|Follow-Up|Client Meeting|Document Review|Service Discussion|General Call/);
});

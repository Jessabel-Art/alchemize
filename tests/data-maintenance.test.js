import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("settings data maintenance exposes a reviewable, guarded maintenance workflow", () => {
  const page = read("src/pages/admin/AdminSettingsPage.jsx");
  const settingsApi = read("api/v1/settings/index.php");

  assert.match(page, /data-maintenance/);
  assert.match(page, /Review inactive prospects/i);
  assert.match(page, /Review completed engagements/i);
  assert.match(page, /Review expired scheduling links/i);
  assert.match(page, /Review expired invitations/i);
  assert.match(page, /Maintenance history/i);
  assert.match(settingsApi, /maintenance/i);
  assert.match(settingsApi, /preview|scan|execute/i);
});

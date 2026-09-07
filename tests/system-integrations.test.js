import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("system integrations exposes safe status cards and backend health contract", () => {
  const page = read("src/pages/admin/AdminSettingsPage.jsx");
  const settingsApi = read("api/v1/settings/index.php");
  const bootstrap = read("server/bootstrap.php");

  assert.match(page, /System & Integrations/i);
  assert.match(page, /Resend/i);
  assert.match(page, /Stripe/i);
  assert.match(page, /Google Calendar/i);
  assert.match(page, /Google Drive/i);
  assert.match(page, /Google Calendar/i);
  assert.match(page, /Google Drive/i);
  assert.match(page, /Database/i);
  assert.match(page, /Application Version/i);
  assert.match(settingsApi, /integrations/i);
  assert.match(settingsApi, /Check connection|Refresh status|status/i);
  assert.match(bootstrap, /system-integrations-service/i);
});

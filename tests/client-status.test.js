import test from "node:test";
import assert from "node:assert/strict";

import { normalizeStatus, isActiveClient } from "../src/utils/client-status.js";

test("normalizes active client statuses across casing and labels", () => {
  assert.equal(normalizeStatus("Active"), "active");
  assert.equal(normalizeStatus("active"), "active");
  assert.equal(normalizeStatus("ACTIVE"), "active");
  assert.equal(normalizeStatus("Onboarding"), "onboarding");
});

test("counts active clients even when the API returns lowercase DB values", () => {
  assert.equal(isActiveClient({ status: "active" }), true);
  assert.equal(isActiveClient({ status: "Active" }), true);
  assert.equal(isActiveClient({ status: "inactive" }), false);
  assert.equal(isActiveClient({ status: "prospective" }), false);
});

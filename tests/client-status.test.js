import test from "node:test";
import assert from "node:assert/strict";

import { normalizeStatus, isActiveClient } from "../src/utils/client-status.js";
import {
  getInvoiceRemainingBalance,
  getOpenInvoiceBalance,
} from "../src/utils/admin-metrics.js";

test("normalizes active client statuses across casing and labels", () => {
  assert.equal(normalizeStatus("Active"), "active");
  assert.equal(normalizeStatus("active"), "active");
  assert.equal(normalizeStatus("ACTIVE"), "active");
  assert.equal(normalizeStatus("Active Client"), "active client");
  assert.equal(normalizeStatus("Onboarding"), "onboarding");
});

test("counts active clients even when the API returns lowercase DB values or status labels", () => {
  assert.equal(isActiveClient({ status: "active" }), true);
  assert.equal(isActiveClient({ status: "Active" }), true);
  assert.equal(isActiveClient({ status: "Active Client" }), true);
  assert.equal(isActiveClient({ portalStatus: "Active" }), true);
  assert.equal(isActiveClient({ status: "inactive" }), false);
  assert.equal(isActiveClient({ status: "prospective" }), false);
});

test("uses remaining invoice balance instead of gross invoice amount for summary totals", () => {
  assert.equal(
    getInvoiceRemainingBalance({ amount: 200, paidAmount: 50 }),
    150,
  );
  assert.equal(
    getOpenInvoiceBalance([
      { amount: 200, paidAmount: 50, status: "Open" },
      { amount: 100, paidAmount: 100, status: "Paid" },
      { amount: 50, paidAmount: 0, status: "Cancelled" },
    ]),
    150,
  );
});

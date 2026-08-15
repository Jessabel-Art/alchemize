import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalServiceKeys,
  normalizeServiceKey,
} from "../js/contact-form.js";

test("exposes exactly the nine canonical service keys", () => {
  assert.deepEqual(
    [...canonicalServiceKeys],
    [
      "individual-tax",
      "individual-insurance",
      "individual-notary",
      "business-formation",
      "business-operations",
      "business-tax",
      "business-advisory",
      "business-insurance",
      "business-notary",
    ],
  );
});

test("normalizes documented legacy service aliases", () => {
  assert.equal(
    normalizeServiceKey("business-administration-operations"),
    "business-operations",
  );
  assert.equal(
    normalizeServiceKey("individual-notary-documents"),
    "individual-notary",
  );
});

test("rejects unknown service values", () => {
  assert.equal(normalizeServiceKey("invented-service"), "");
});

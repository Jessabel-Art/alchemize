import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalServiceKeys,
  normalizeServiceKey,
} from "../js/contact-form.js";
import { getSitemapRoutes } from "../scripts/lib/react-routes.js";

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
  assert.equal(normalizeServiceKey("business-digital"), "business-operations");
  assert.equal(normalizeServiceKey("business-readiness"), "business-formation");
  assert.equal(normalizeServiceKey("business-financial"), "business-tax");
});

test("rejects unknown service values", () => {
  assert.equal(normalizeServiceKey("invented-service"), "");
});

test("uses the canonical React sitemap routes for the migrated app", () => {
  const routes = getSitemapRoutes().map((route) => route.path);
  assert.ok(routes.includes("/"));
  assert.ok(routes.includes("/services"));
  assert.ok(routes.includes("/resources/preparing-for-tax-season"));
  assert.ok(routes.includes("/contact"));
  assert.ok(routes.includes("/faq"));
  assert.ok(routes.length >= 18);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  canonicalServiceKeys,
  normalizeServiceKey,
} from "../js/contact-form.js";
import { businessContact, contactRouting } from "../src/data/contactInfo.js";
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

test("uses the official Alchemize business contact routing", () => {
  assert.equal(businessContact.phone.display, "(910) 644-0207");
  assert.equal(businessContact.phone.tel, "tel:+19106440207");
  assert.equal(contactRouting.general.email, "hello@getalchemize.com");
  assert.equal(contactRouting.newClients.email, "start@getalchemize.com");
  assert.equal(contactRouting.support.email, "support@getalchemize.com");
  assert.equal(contactRouting.documents.email, "documents@getalchemize.com");
  assert.equal(contactRouting.billing.email, "billing@getalchemize.com");
  assert.equal(contactRouting.founder.email, "founder@getalchemize.com");
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

test("submits only to the persisted lead API without creating a local demo lead", () => {
  const source = fs.readFileSync(
    new URL("../js/contact-form.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /\/alchemize-api\.php\?route=leads/);
  assert.doesNotMatch(
    source,
    /adminStore|createLeadFromContact|alchemize:lead-created/,
  );
  assert.match(source, /language_preference/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  canonicalServiceKeys,
  contactServiceGroups,
  normalizeServiceKey,
} from "../js/contact-form.js";
import { businessContact, contactRouting } from "../src/data/contactInfo.js";
import { getSitemapRoutes } from "../scripts/lib/react-routes.js";

test("derives the complete public selector from canonical service-page keys", () => {
  assert.deepEqual(
    [...canonicalServiceKeys],
    [
      "individual-tax",
      "individual-notary",
      "individual-translation",
      "business-advisory",
      "business-operations",
      "business-digital",
      "business-readiness",
      "business-bookkeeping",
      "business-payroll",
      "business-financial",
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
  assert.equal(normalizeServiceKey("business-digital"), "business-digital");
  assert.equal(normalizeServiceKey("business-formation"), "business-readiness");
  assert.equal(normalizeServiceKey("business-tax"), "business-financial");
});

test("contact selector groups are accessible and contain no duplicate values", () => {
  assert.deepEqual(
    contactServiceGroups.map(({ audience, label }) => ({ audience, label })),
    [
      { audience: "individual", label: "Individual Services" },
      { audience: "business", label: "Business Services" },
    ],
  );
  const values = contactServiceGroups.flatMap((group) =>
    group.items.map((item) => item.value),
  );
  assert.equal(values.length, new Set(values).size);
  assert.ok(values.includes("individual-tax"));
  assert.ok(values.includes("individual-notary"));
  assert.ok(values.includes("business-readiness"));
  assert.ok(values.includes("business-operations"));
  assert.ok(values.includes("business-financial"));
  assert.ok(values.includes("business-advisory"));
  assert.ok(values.includes("business-digital"));
});

test("Contact page renders a neutral option and labelled optgroups", () => {
  const source = fs.readFileSync(
    new URL("../src/pages/contact/ContactPage.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /<option value="">\{content\.form\.unsure\}<\/option>/);
  assert.match(source, /<optgroup/);
  assert.match(source, /label=\{content\.serviceGroups\[group\.audience\]\}/);
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

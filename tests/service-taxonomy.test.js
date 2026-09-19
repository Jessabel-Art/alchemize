import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

import {
  categoryByServiceKey,
  serviceCategories,
} from "../src/data/serviceTaxonomy.js";
import { serviceCatalog } from "../src/pages/services/serviceCatalog.js";
import { serviceGroupsEs } from "../src/pages/services/serviceCatalog.es.js";
import {
  getCategoryForService,
  getContactServiceGroups,
  getServiceCategories,
  getServiceDisplayName,
} from "../src/pages/services/publicServiceIndex.js";
import { webDigitalSummary } from "../src/pages/web-digital/webDigitalSummary.js";

const esCatalog = Object.values(serviceGroupsEs).flat();

test("the approved taxonomy names and order are exact", () => {
  const names = (audience) =>
    getServiceCategories(audience, "en").map((category) => category.name);
  assert.deepEqual(names("individuals"), [
    "Tax Preparation",
    "Notary & Document Services",
    "Translation & Apostille Support",
    "Digital Support",
  ]);
  assert.deepEqual(names("businesses"), [
    "Business Foundation",
    "Business Advisory",
    "Operations & Administration",
    "Tax & Financial Organization",
    "Bookkeeping & Payroll Support",
    "Web & Digital Solutions",
  ]);
});

test("every catalog service belongs to exactly one category of its own audience", () => {
  const claimed = serviceCategories.flatMap((category) => category.serviceKeys);
  assert.equal(
    new Set(claimed).size,
    claimed.length,
    "a service is listed twice",
  );
  for (const service of serviceCatalog) {
    const category = categoryByServiceKey.get(service.serviceKey);
    assert.ok(category, `${service.serviceKey} has no category`);
    assert.equal(category.audience, service.audience, service.serviceKey);
  }
  // Web & Digital Solutions is a business category served by /web-digital.
  assert.equal(
    categoryByServiceKey.get("business-digital").audience,
    "businesses",
  );
});

test("Preparation & Organization is not a public category", () => {
  assert.equal(
    serviceCategories.some((entry) => entry.key === "preparation-organization"),
    false,
  );
  for (const language of ["en", "es"]) {
    for (const audience of ["individuals", "businesses"]) {
      for (const category of getServiceCategories(audience, language)) {
        assert.ok(category.services.length > 0, category.key);
        assert.ok(category.route, category.key);
      }
    }
  }
});

test("Individual Digital Support is a path to the canonical Web & Digital service, not a second service", () => {
  const digitalSupport = serviceCategories.find(
    (c) => c.key === "digital-support",
  );
  const web = serviceCategories.find((c) => c.key === "web-digital-solutions");
  assert.equal(digitalSupport.audience, "individuals");
  assert.equal(web.audience, "businesses");
  // the service (and its backend key) is owned once, by the business category
  assert.deepEqual(digitalSupport.serviceKeys, []);
  assert.equal(digitalSupport.sharedWith, "business-digital");
  assert.deepEqual(web.serviceKeys, ["business-digital"]);
  for (const language of ["en", "es"]) {
    const individual = getServiceCategories("individuals", language).find(
      (c) => c.key === "digital-support",
    );
    const business = getServiceCategories("businesses", language).find(
      (c) => c.key === "web-digital-solutions",
    );
    assert.equal(individual.route, "/web-digital");
    assert.equal(business.route, "/web-digital");
    assert.equal(individual.services.length, 1);
    assert.notEqual(individual.name, business.name);
  }
});

test("the Digital Support wording is copy the Web & Digital page already publishes", () => {
  // the page and its detail module (the capability panels) together are the
  // copy the page publishes
  const source = ["WebDigitalPage.jsx", "webDigitalDetail.js"]
    .map((file) =>
      fs.readFileSync(
        new URL(`../src/pages/web-digital/${file}`, import.meta.url),
        "utf8",
      ),
    )
    .join(" ");
  for (const language of ["en", "es"]) {
    const { statement, capabilities } = webDigitalSummary[language].individual;
    assert.ok(source.includes(statement), `${language} statement`);
    for (const item of capabilities) {
      assert.ok(source.includes(`"${item}"`), `${language} ${item}`);
    }
  }
});

test("contact options list every public service once per audience, with canonical keys in both languages", () => {
  const values = (language) =>
    getContactServiceGroups(language).map((group) => [
      group.audience,
      group.items.map((item) => item.value),
    ]);
  assert.deepEqual(values("en"), values("es"));
  const [individual, business] = getContactServiceGroups("en");
  assert.deepEqual(
    individual.items.map((item) => item.value),
    [
      "individual-tax",
      "individual-notary",
      "individual-translation",
      "individual-apostille",
      "business-digital",
    ],
  );
  assert.deepEqual(
    business.items.map((item) => item.value),
    [
      "business-readiness",
      "business-advisory",
      "business-operations",
      "business-financial",
      "business-bookkeeping",
      "business-payroll",
      "business-digital",
    ],
  );
  // Translation and Apostille, Bookkeeping and Payroll are separate options.
  assert.equal(
    individual.items.find((i) => i.value === "individual-apostille").label,
    "North Carolina Apostille Facilitation & Support",
  );
  // The only shared key is the documented Digital Support alias.
  const alias = individual.items.filter((item) => item.alias);
  assert.deepEqual(
    alias.map((item) => [item.value, item.label]),
    [["business-digital", "Digital Support"]],
  );
  assert.equal(
    business.items.some((item) => item.alias),
    false,
  );
});

test("a category served by one page is named after the category, in both languages", () => {
  for (const [language, catalog] of [
    ["en", serviceCatalog],
    ["es", esCatalog],
  ]) {
    for (const service of catalog) {
      const category = getCategoryForService(service.serviceKey, language);
      if (!category.multiService) {
        assert.equal(
          service.title,
          category.name,
          `${language} ${service.serviceKey}`,
        );
      }
    }
  }
});

test("related-service labels always match the destination's own title", () => {
  for (const [language, catalog] of [
    ["en", serviceCatalog],
    ["es", esCatalog],
  ]) {
    const titleByRoute = new Map(
      catalog.map((s) => [`/services/${s.audience}/${s.slug}`, s.title]),
    );
    titleByRoute.set(
      "/web-digital",
      getServiceDisplayName("business-digital", language),
    );
    for (const service of catalog) {
      for (const [label, route] of service.related) {
        assert.ok(
          titleByRoute.has(route),
          `${language} ${service.serviceKey} -> ${route}`,
        );
        assert.equal(
          label,
          titleByRoute.get(route),
          `${language} ${service.serviceKey} -> ${route}`,
        );
      }
    }
  }
});

test("multi-service categories link to their category; single ones to the service", () => {
  const routes = Object.fromEntries(
    getServiceCategories("businesses", "en").map((c) => [c.key, c.route]),
  );
  assert.equal(
    routes["bookkeeping-payroll-support"],
    "/services/#bookkeeping-payroll-support",
  );
  assert.equal(routes["web-digital-solutions"], "/web-digital");
  assert.equal(
    routes["business-advisory"],
    "/services/businesses/advisory-optimization",
  );
});

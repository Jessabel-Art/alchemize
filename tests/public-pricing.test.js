import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  pricingServiceMap,
  publicPricingFallback,
} from "../src/data/publicPricingCatalog.js";

const service = (code) =>
  publicPricingFallback.find((item) => item.serviceCode === code);
const tier = (code, key) =>
  service(code).tiers.find((item) => item.tierKey === key);

test("approved fixed, starting-at, formula, and Custom SOW prices are preserved", () => {
  assert.equal(tier("website-design", "launch").basePrice, 1250);
  assert.equal(tier("website-design", "growth").basePrice, 1850);
  assert.equal(tier("website-design", "custom").pricingType, "CUSTOM_SOW");
  assert.equal(
    tier("financial-reporting", "reporting-forecast").pricingType,
    "STARTING_AT",
  );
  assert.equal(
    tier("financial-reporting", "reporting-forecast").minimumPrice,
    599,
  );
  assert.equal(tier("bookkeeping", "cleanup").pricingType, "FORMULA");
  assert.match(tier("bookkeeping", "cleanup").displayPrice, /\$250.*\$125/);
  const custom = publicPricingFallback
    .flatMap((item) => item.tiers)
    .filter((item) => item.pricingType === "CUSTOM_SOW");
  assert.ok(custom.length > 0);
  assert.ok(custom.every((item) => item.basePrice == null));
});

test("bookkeeping and payroll tiers retain approved thresholds", () => {
  assert.deepEqual(tier("bookkeeping", "essentials").limits, {
    max_transactions: 100,
    max_accounts: 2,
  });
  assert.deepEqual(tier("bookkeeping", "growth").limits, {
    min_transactions: 101,
    max_transactions: 300,
    max_accounts: 4,
  });
  assert.deepEqual(tier("bookkeeping", "operations").limits, {
    min_transactions: 301,
    max_transactions: 600,
    max_accounts: 6,
  });
  assert.equal(tier("payroll", "setup").basePrice, 199);
  assert.equal(tier("payroll", "1-5-employees").basePrice, 99);
  assert.equal(tier("payroll", "6-15-employees").basePrice, 149);
  assert.equal(tier("payroll", "16-30-employees").basePrice, 199);
  assert.equal(tier("payroll", "31-plus").pricingType, "CUSTOM_SOW");
});

test("apostille remains pending and states approved facilitation pricing", () => {
  const apostille = service("apostille");
  assert.equal(apostille.status, "PENDING_AUTHORIZATION");
  assert.equal(apostille.active, false);
  assert.equal(apostille.tiers[0].basePrice, 149);
  assert.equal(apostille.addOns[0].price, 40);
  assert.match(apostille.serviceName, /Facilitation & Support/);
});

test("every public service-page family maps to centralized pricing groups", () => {
  for (const key of [
    "individual-translation",
    "individual-apostille",
    "business-advisory",
    "business-operations",
    "business-digital",
    "business-readiness",
    "business-bookkeeping",
    "business-payroll",
  ])
    assert.ok(pricingServiceMap[key]?.length, key);
});

test("public service details do not mount the pricing renderer", () => {
  const source = fs.readFileSync(
    new URL("../src/pages/services/ServiceDetailPage.jsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /PublicPricing|publicPricingCatalog|public-catalog-api/,
  );
});

test("public API projection excludes internal fields and unavailable services", () => {
  const repository = fs.readFileSync(
    new URL("../server/repositories/service-repository.php", import.meta.url),
    "utf8",
  );
  const endpoint = fs.readFileSync(
    new URL("../api/v1/services/index.php", import.meta.url),
    "utf8",
  );
  assert.match(endpoint, /\$parts === \['public'\]/);
  assert.match(repository, /listPublic/);
  assert.match(repository, /NOT_OFFERED.*FUTURE_EXPANSION/);
  assert.match(repository, /unset\(\$service\['id'\]\)/);
  assert.match(repository, /unset\(\$limits\['implementation_hours'\]/);
  const projection = repository.slice(
    repository.indexOf("public function listPublic"),
    repository.indexOf("public function findTier"),
  );
  assert.doesNotMatch(
    projection,
    /internal_notes|internal_pricing_notes|price_locked/,
  );
  assert.doesNotMatch(projection, /public_id/);
});

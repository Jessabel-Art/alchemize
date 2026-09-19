import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  PRICED_SERVICE_KEYS,
  describeTier,
  formatPercent,
  publicServicePricing,
} from "../src/data/publicServicePricing.js";
import { serviceDetailEn } from "../src/pages/services/serviceDetail.en.js";
import { serviceDetailEs } from "../src/pages/services/serviceDetail.es.js";
import { webDigitalDetail } from "../src/pages/web-digital/webDigitalDetail.js";
import { serviceCatalog } from "../src/pages/services/serviceCatalog.js";
import { findServiceEs } from "../src/pages/services/serviceCatalog.es.js";

const root = (...parts) => new URL(`../${parts.join("/")}`, import.meta.url);

// Structure only: same keys, same array lengths, same routes and ids. Text
// differs by language; shape and links must not.
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, shape(inner)]),
    );
  if (typeof value === "string" && value.startsWith("/")) return value; // routes
  return typeof value === "boolean" ? value : "text";
}
const ids = (detail) => ({
  tiers: detail.pricing?.tiers?.map((tier) => tier.id),
  current: detail.compare?.rows?.map((row) => Boolean(row.current)),
  links: detail.compare?.rows?.map((row) => row.to ?? null),
  optionLinks: detail.options?.items?.map((item) => item.to ?? null),
  related: detail.related?.map(([route]) => route),
});

test("the approved public prices are exactly the Translation and Apostille prices", () => {
  assert.deepEqual(PRICED_SERVICE_KEYS, [
    "individual-translation",
    "individual-apostille",
  ]);
  const t = publicServicePricing["individual-translation"];
  assert.equal(t.tiers.standard.amount, 35);
  assert.equal(t.tiers.standard.sourceWords, 250);
  assert.equal(t.tiers.general.amount, 0.15);
  assert.equal(t.tiers.general.minimum, 35);
  assert.equal(t.tiers.certified.amount, 45);
  assert.equal(t.tiers.certified.sourceWords, 250);
  assert.equal(formatPercent(t.rushSurcharge), "50%");
  const a = publicServicePricing["individual-apostille"];
  assert.equal(a.tiers.first.amount, 149);
  assert.equal(a.tiers.additional.amount, 40);
  assert.equal(a.tiers.additional.additive, true);
  // rendered values in both languages
  assert.deepEqual(describeTier("individual-translation", "general", "en"), {
    price: "$0.15",
    unit: "per source word",
    limit: null,
    minimum: "$35 minimum",
    additive: false,
  });
  assert.equal(
    describeTier("individual-translation", "general", "es").unit,
    "por palabra de origen",
  );
  assert.equal(
    describeTier("individual-apostille", "additional", "en").price,
    "$40",
  );
  assert.equal(describeTier("individual-tax", "first", "en"), null);
});

test("no dollar amount is authored in service content; prices come only from the pricing module", () => {
  for (const file of [
    "src/pages/services/serviceDetail.en.js",
    "src/pages/services/serviceDetail.es.js",
    "src/pages/web-digital/webDigitalDetail.js",
  ]) {
    const source = fs.readFileSync(root(file), "utf8");
    assert.doesNotMatch(source, /\$\s?\d/, file);
    assert.doesNotMatch(
      source,
      /estimating|benchmark|labor ceiling|upgrade trigger|Master Pricing/i,
      file,
    );
  }
  // the catalogs, which predate this pass, stay price-free too
  for (const file of [
    "src/pages/services/serviceCatalog.js",
    "src/pages/services/serviceCatalog.es.js",
  ])
    assert.doesNotMatch(fs.readFileSync(root(file), "utf8"), /\$\s?\d/, file);
});

test("Spanish service-detail content mirrors the English structure exactly", () => {
  assert.deepEqual(Object.keys(serviceDetailEs), Object.keys(serviceDetailEn));
  for (const key of Object.keys(serviceDetailEn)) {
    assert.deepEqual(
      shape(serviceDetailEs[key]),
      shape(serviceDetailEn[key]),
      key,
    );
    assert.deepEqual(ids(serviceDetailEs[key]), ids(serviceDetailEn[key]), key);
  }
  // only the two approved services carry a pricing module
  const priced = Object.entries(serviceDetailEn)
    .filter(([, detail]) => detail.pricing)
    .map(([key]) => key);
  assert.deepEqual(priced, PRICED_SERVICE_KEYS);
  assert.deepEqual(
    Object.entries(serviceDetailEs)
      .filter(([, detail]) => detail.pricing)
      .map(([key]) => key),
    PRICED_SERVICE_KEYS,
  );
});

test("Web & Digital detail mirrors across languages and stays price-free", () => {
  const { en, es } = webDigitalDetail;
  assert.deepEqual(shape(es), shape(en));
  assert.equal(en.panels.length, 3);
  assert.equal(en.panels.flat().length, 6);
  assert.deepEqual(
    en.lifecycle.stages.map(([label]) => label),
    ["Build", "Maintain", "Optimize", "Automate"],
  );
});

test("every catalog service carries its detail modules, and related links resolve to canonical routes", () => {
  const routes = new Set(
    serviceCatalog.map((s) => `/services/${s.audience}/${s.slug}`),
  );
  routes.add("/web-digital");
  for (const service of serviceCatalog) {
    assert.ok(service.detail, service.serviceKey);
    assert.ok(findServiceEs(service.audience, service.slug).detail);
    for (const [label, route, note] of service.related) {
      assert.ok(routes.has(route), `${service.serviceKey} -> ${route}`);
      assert.ok(label && note, `${service.serviceKey} related ${route}`);
    }
    assert.ok(service.detail.cta?.hero && service.detail.cta?.close);
    assert.ok(service.detail.faq.items.length >= 4, service.serviceKey);
  }
});

test("notary is requestable now: no pricing module, no commission claim, request CTA present", () => {
  const notary = serviceDetailEn["individual-notary"];
  assert.equal(notary.pricing, undefined);
  assert.match(notary.cta.hero, /Request a Notary Appointment/);
  const text = JSON.stringify([
    serviceDetailEn["individual-notary"],
    serviceDetailEs["individual-notary"],
  ]);
  assert.doesNotMatch(text, /commissioned|comisionad|statutory|estatutari/i);
});

test("policy statements that must stay in place are present in the content", () => {
  const en = JSON.stringify(serviceDetailEn);
  assert.match(en, /does not issue|Alchemize does not issue apostilles/i);
  assert.match(en, /cannot guarantee acceptance/);
  assert.match(en, /does not match lenders/);
  assert.match(en, /does not advise employees|does not advise on it/);
  assert.match(en, /not audited, reviewed, compiled, certified, or attested/);
  assert.match(
    en,
    /Platform and software charges are separate|platform and software charges are separate/i,
  );
  assert.match(
    JSON.stringify(webDigitalDetail.en),
    /does not guarantee rankings, traffic, leads, or revenue/,
  );
});

// If a production build exists, no internal pricing data may have reached it.
test("the built bundle contains no internal pricing catalog or estimating figure", (t) => {
  const assets = new URL("../dist/assets/", import.meta.url);
  let files;
  try {
    files = fs.readdirSync(assets).filter((name) => name.endsWith(".js"));
  } catch {
    t.skip("no production build present");
    return;
  }
  for (const name of files) {
    const code = fs.readFileSync(new URL(name, assets), "utf8");
    for (const forbidden of [
      "Master Pricing",
      "estimating benchmark",
      "Connected Business Automation",
      "Advanced Digital Business Solution",
      "Website Launch",
      "Website Growth",
      "Managed Website",
      "Half-Day Business Intensive",
      "Full-Day Business Intensive",
    ])
      assert.ok(!code.includes(forbidden), `${name} contains "${forbidden}"`);
  }
});

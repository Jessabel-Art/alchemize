import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { homeContent } from "../src/pages/home/homeContent.js";
import { whyContent } from "../src/pages/why-alchemize/whyContent.js";
import { contactContent } from "../src/pages/contact/contactContent.js";
import { servicesContent } from "../src/pages/services/servicesContent.js";
import { serviceCategories } from "../src/data/serviceTaxonomy.js";
import { resourceServiceKey } from "../src/pages/resources/resourceServicePaths.js";
import { resourceBySlug } from "../src/pages/resources/resourcesData.js";
import { resourceBySlugEs } from "../src/pages/resources/resourcesData.es.js";
import { getServiceLink } from "../src/pages/services/publicServiceIndex.js";

const file = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// same keys and array lengths in both languages; text differs, structure must not
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, shape(inner)]),
    );
  return typeof value === "string" && value.startsWith("/") ? value : "text";
}

test("English and Spanish credibility content have the same structure", () => {
  assert.deepEqual(shape(homeContent.es.trust), shape(homeContent.en.trust));
  assert.equal(homeContent.en.trust.signals.length, 4);
  for (const key of ["hero", "problem", "approach", "principles", "final"])
    assert.deepEqual(
      shape(whyContent.es[key]),
      shape(whyContent.en[key]),
      `why.${key}`,
    );
  assert.equal(whyContent.en.approach.items.length, 4);
  assert.equal(whyContent.en.principles.items.length, 2);
  assert.deepEqual(
    shape(contactContent.es.aside),
    shape(contactContent.en.aside),
  );
});

test("15+ years is attributed to Jessy's professional experience in every content source", () => {
  const sources = [
    "src/pages/home/homeContent.js",
    "src/pages/why-alchemize/whyContent.js",
    "src/pages/resources/MeetTheFounderPage.jsx",
    "src/pages/services/serviceDetail.en.js",
    "src/pages/services/serviceDetail.es.js",
    "src/pages/web-digital/WebDigitalPage.jsx",
  ];
  for (const path of sources) {
    const source = file(path);
    // every string that mentions 15+ years must name Jessy or the professional
    // experience it belongs to (short labels such as "15+ years" are exempt)
    for (const [, literal] of source.matchAll(
      /"([^"\n]*(?:15\+|más de 15|more than 15)[^"\n]*)"/gi,
    )) {
      if (literal.split(/\s+/).length <= 4) continue;
      assert.match(
        literal,
        /Jessy|professional experience|experiencia profesional/i,
        `${path}: ${literal.slice(0, 90)}`,
      );
    }
    // never the company's own history
    assert.doesNotMatch(
      source,
      /Alchemize (has|have|ha) (been )?(operating|in business|serving)|for (over |more than )?15 years, Alchemize|since 20\d\d/i,
      path,
    );
  }
});

test("prior work is described with conservative verbs and no invented results", () => {
  const sources = [
    "src/pages/home/homeContent.js",
    "src/pages/why-alchemize/whyContent.js",
    "src/pages/resources/MeetTheFounderPage.jsx",
    "src/pages/services/serviceDetail.en.js",
    "src/pages/services/serviceDetail.es.js",
    "src/pages/web-digital/WebDigitalPage.jsx",
    "src/pages/web-digital/webDigitalDetail.js",
  ];
  for (const path of sources) {
    const source = file(path);
    assert.doesNotMatch(
      source,
      /\barchitected\b|enterprise[- ](level|grade|crm|system|software|commerce)|led (the |a )?(team|transformation)|spearhead|\bROI\b|\d+\s?%\s+(increase|improvement|faster)|saved \$|testimonial|case stud|client logos?/i,
      path,
    );
  }
});

test("no portfolio, case-study, testimonial or review route exists", () => {
  const app = file("src/app/App.jsx");
  assert.doesNotMatch(
    app,
    /path="\/?(es\/)?(portfolio|case-stud|testimonial|reviews|selected-work)/i,
  );
});

test("generic scheduling language is gone from public labels", () => {
  for (const path of [
    "src/pages/home/homeContent.js",
    "src/pages/why-alchemize/whyContent.js",
    "src/pages/services/servicesContent.js",
    "src/pages/contact/contactContent.js",
    "src/pages/resources/resourcesContent.js",
    "src/components/site/Header.jsx",
    "src/pages/resources/MeetTheFounderPage.jsx",
  ]) {
    assert.doesNotMatch(
      file(path),
      /Schedule a [Cc]onsultation|Programar una [Cc]onsulta|within 24 hours|dentro de 24 horas/,
      path,
    );
  }
  assert.doesNotMatch(
    contactContent.en.aside.note + contactContent.es.aside.note,
    /24|schedule|programar/i,
  );
  assert.equal(homeContent.en.hero.primary, "Tell Us What You Need");
  assert.equal(homeContent.es.hero.primary, "Cuéntenos qué necesita");
  assert.equal(servicesContent.en.close.cta, "Tell Us What You Need");
});

test("every resource leads to a real public service, in both languages", () => {
  const serviceKeys = new Set(
    serviceCategories.flatMap((category) => [
      ...category.serviceKeys,
      ...(category.sharedWith ? [category.sharedWith] : []),
    ]),
  );
  for (const slug of resourceBySlug.keys()) {
    const key = resourceServiceKey[slug];
    assert.ok(key, `no service path for resource ${slug}`);
    assert.ok(serviceKeys.has(key), `${slug} -> unknown service ${key}`);
    for (const language of ["en", "es"]) {
      const link = getServiceLink(key, language);
      assert.ok(link?.route && link?.title, `${slug} ${language}`);
    }
  }
  assert.deepEqual(
    [...resourceBySlugEs.keys()].sort(),
    [...resourceBySlug.keys()].sort(),
  );
});

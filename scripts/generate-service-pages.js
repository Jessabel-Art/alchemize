import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const services = JSON.parse(
  fs.readFileSync(path.join(root, "content/service-details.json"), "utf8"),
);
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const list = (items) =>
  `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
const faqAnchor = (label) =>
  label.toLowerCase().includes("tax")
    ? "tax"
    : label.toLowerCase().includes("insurance")
      ? "insurance"
      : label.toLowerCase().includes("notary") ||
          label.toLowerCase().includes("identification")
        ? "notary"
        : label.toLowerCase().includes("consultation")
          ? "consultations"
          : "business";

for (const service of services) {
  const business = service.audience === "Businesses";
  const audienceHash = business ? "businesses" : "individuals";
  const title = `${service.label} | Alchemize Business Services`;
  const downloadHref = "/assets" + "/downloads/" + service.pdf;
  const ownerReview = service.ownerReview
    ? `<!-- OWNER REVIEW: ${service.ownerReview} -->`
    : "";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(service.description)}"><title>${esc(title)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"></head>
<body class="interior service-full-page ${business ? "business-service-full" : "individual-service-full"}"><a class="skip" href="#main">Skip to content</a><header id="site-header"></header>
<main id="main">
  ${ownerReview}
  <header class="service-full-hero"><div class="service-full-inner"><nav class="service-breadcrumbs" aria-label="Breadcrumb"><a href="/services/">Services</a><span>/</span><a href="/services/#${audienceHash}">${service.audience}</a><span>/</span><span aria-current="page">${esc(service.label)}</span></nav><p class="eyebrow">${esc(service.audience)} / ${esc(service.label)}</p><h1>${esc(service.title)}</h1><p class="service-full-deck">${esc(service.description)}</p><div class="service-hero-actions"><a class="button gold" href="/contact/?service=${service.slug}">Schedule a Consultation</a><a class="text-link light-link" href="${downloadHref}" download>Download the Checklist ↓</a></div></div></header>
  <section class="service-overview-band"><div class="service-full-inner service-overview-grid"><div><p class="eyebrow">The service</p><h2>${esc(service.label)}</h2></div><p>${esc(service.overview)}</p></div></section>
  <section class="service-full-section"><div class="service-full-inner"><div class="service-split-heading"><div><p class="eyebrow">Designed around the situation</p><h2>Who this service is for.</h2></div><p>A service conversation begins with what is happening—not with forcing every need into a template.</p></div><div class="service-audience-grid"><article><h3>Often a fit for</h3>${list(service.for)}</article><article><h3>Common reasons to reach out</h3>${list(service.situations)}</article></div></div></section>
  <section class="service-capability-section"><div class="service-full-inner service-capability-grid"><div><p class="eyebrow">Practical support</p><h2>What Alchemize can help with.</h2><p>The exact scope is confirmed before work begins.</p></div>${list(service.helps)}</div></section>
  <section class="service-process-section"><div class="service-full-inner"><p class="eyebrow">What the process looks like</p><h2>A clear path from question to next step.</h2><ol class="service-process">${service.process.map((step, i) => `<li><span>0${i + 1}</span><h3>${esc(step[0])}</h3><p>${esc(step[1])}</p></li>`).join("")}</ol></div></section>
  <section class="service-prepare-section"><div class="service-full-inner service-prepare-grid"><div><p class="eyebrow">Before we begin</p><h2>What to prepare.</h2><p>Bring context first. Sensitive records should be transmitted only through an approved method when Alchemize instructs you to do so.</p></div><div>${list(service.prepare)}</div></div></section>
  <section class="checklist-download"><div class="service-full-inner checklist-download-grid"><div class="checklist-preview" aria-hidden="true"><span>PDF</span><strong>${esc(service.checklist)}</strong><i>ALCHEMIZE<br>BUSINESS SERVICES</i></div><div><p class="eyebrow">Prepare before we meet</p><h2>${esc(service.checklist)}</h2><p>${esc(service.checkPurpose)}</p><ul class="download-meta"><li>Branded printable PDF</li><li>US Letter format</li><li>Version 1.0 / August 2026</li></ul><a class="button gold" href="${downloadHref}" download>Download the ${esc(service.checklist)}</a></div></div></section>
  <section class="service-scope-section"><div class="service-full-inner service-scope-grid"><div><p class="eyebrow">Important considerations</p><h2>Clear professional boundaries.</h2></div><p>${esc(service.scope)}</p></div></section>
  <section class="service-full-section"><div class="service-full-inner"><div class="service-split-heading"><div><p class="eyebrow">Questions and preparation</p><h2>Continue with useful context.</h2></div><a class="text-link" href="/faq/#${faqAnchor(service.faq[0])}">View the complete FAQ ↗</a></div><div class="service-content-columns"><div><h3>Frequently asked</h3>${service.faq.map((q) => `<a href="/faq/#${faqAnchor(q)}">${esc(q)} <span>↗</span></a>`).join("")}</div><div><h3>Related resources</h3>${service.resources.map(([label, href]) => `<a href="${href}">${esc(label)} <span>↗</span></a>`).join("")}</div></div></div></section>
  <section class="related-support"><div class="service-full-inner"><p class="eyebrow">Related support</p><h2>Responsibilities that often connect.</h2><div class="related-support-links">${service.related.map(([label, href]) => `<a href="${href}"><span>${esc(label)}</span><i>Explore ↗</i></a>`).join("")}</div><a class="return-audience" href="/services/#${audienceHash}">View all ${service.audience.toLowerCase()} services</a></div></section>
  <section class="service-final-cta"><div class="service-full-inner"><p class="eyebrow">Start with what is in front of you</p><h2>${esc(service.cta)}</h2><p>Tell us what you are preparing for or trying to organize. A request does not create a client relationship; the first step is confirming whether the service fits.</p><a class="button gold" href="/contact/?service=${service.slug}">Schedule a Consultation</a></div></section>
</main><footer id="site-footer"></footer><script type="module" src="/script.js"></script></body></html>`;
  const output = path.join(root, service.route, "index.html");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${html}\n`);
}
console.log(`Generated ${services.length} service pages.`);

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Service-detail content + conversion refinement:
//  - public pricing exists for Translation and Apostille ONLY, at the approved
//    amounts, and no internal pricing or estimating figure reaches any page;
//  - Notary stays visible and requestable, with no pricing and no commission claim;
//  - every service page carries the shared content modules, in both languages,
//    with the same structure;
//  - CTAs and related links keep pointing at canonical routes and services.

const pages = [
  ["individuals/tax-preparation", "individual-tax"],
  ["individuals/notary-document-services", "individual-notary"],
  ["individuals/translation-services", "individual-translation"],
  ["individuals/apostille-services", "individual-apostille"],
  ["businesses/advisory-optimization", "business-advisory"],
  ["businesses/operations-implementation", "business-operations"],
  ["businesses/readiness-growth", "business-readiness"],
  ["businesses/bookkeeping-financial-reporting", "business-bookkeeping"],
  ["businesses/payroll-processing", "business-payroll"],
  ["businesses/business-tax-support", "business-financial"],
];
const priced = new Set([
  "individuals/translation-services",
  "individuals/apostille-services",
]);
const languages = [
  { code: "en", prefix: "" },
  { code: "es", prefix: "/es" },
];

// Internal-only commercial information that must never appear on the site.
const internalTerms =
  /(\/\s?hr\b|per hour|hourly|an hour\b|estimating|benchmark|labor ceiling|upgrade trigger|internal rate|master pricing|\bSOW\b|change order)/i;
const dollarAmounts = (text) =>
  [...text.matchAll(/\$\s?(\d[\d,]*(?:\.\d+)?)/g)].map((match) => match[1]);

const routeSet = new Set([
  ...pages.map(([slug]) => `/services/${slug}`),
  "/web-digital",
]);
const withPrefix = (prefix, path) => `${prefix}${path}`;

// textContent, so answers inside collapsed FAQ items are scanned too
const bodyText = (page) =>
  page
    .locator("article")
    .first()
    .evaluate((el) => el.textContent);

for (const { code, prefix } of languages) {
  test(`${code}: Translation publishes exactly its approved prices`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/individuals/translation-services`);
    const text = await bodyText(page);
    expect(dollarAmounts(text).sort()).toEqual(["0.15", "35", "35", "45"]);
    const expected =
      code === "en"
        ? [
            "per page",
            "per source word",
            "$35 minimum",
            "up to 250 source words",
            "+50%",
            "subject to availability",
            "Certificate of Translation Accuracy",
            "One correction round",
          ]
        : [
            "por página",
            "por palabra de origen",
            "mínimo de $35",
            "hasta 250 palabras de origen",
            "+50%",
            "según disponibilidad",
            "certificado de exactitud",
            "una ronda de corrección",
          ];
    for (const phrase of expected)
      expect(text.toLowerCase()).toContain(phrase.toLowerCase());
    // three priced types, each with its own card
    await expect(page.locator(".editorial-service-price-card")).toHaveCount(3);
    await expect(page.locator(".editorial-service-price strong")).toHaveText([
      "$35",
      "$0.15",
      "$45",
    ]);
    // complex/specialized material is quoted, not priced
    expect(text).not.toMatch(internalTerms);
  });

  test(`${code}: Translation does not advertise interpretation or invent a turnaround`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/individuals/translation-services`);
    const text = await bodyText(page);
    expect(text).not.toMatch(/interpret|intérprete|interpretación/i);
    expect(text).not.toMatch(
      /within \d+|dentro de \d+|\d+\s*(business |hábiles )?(hours|days|horas|días)|same[- ]day|next[- ]day|mismo día/i,
    );
    // acceptance is never promised
    await expect(page.locator(".editorial-service-faq-list")).toContainText(
      code === "en" ? "cannot guarantee acceptance" : "no puede garantizar",
    );
  });

  test(`${code}: Apostille publishes exactly its approved prices and separates third-party costs`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/individuals/apostille-services`);
    const text = await bodyText(page);
    expect(dollarAmounts(text).sort()).toEqual(["149", "40"]);
    await expect(page.locator(".editorial-service-price strong")).toHaveText([
      "$149",
      "$40",
    ]);
    await expect(page.locator(".editorial-service-price").nth(1)).toContainText(
      "+",
    );
    const lower = text.toLowerCase();
    for (const phrase of code === "en"
      ? [
          "government fees",
          "shipping and courier",
          "expedited and international",
          "other third-party costs",
          "north carolina documents only",
          "does not issue apostilles",
          "cannot guarantee",
        ]
      : [
          "tarifas del gobierno",
          "envío y mensajería",
          "urgente e internacional",
          "otros costos de terceros",
          "solo documentos de carolina del norte",
          "no emite apostillas",
          "no puede garantizar",
        ])
      expect(lower).toContain(phrase);
    expect(text).not.toMatch(internalTerms);
  });

  test(`${code}: Notary stays visible and requestable, with no pricing and no commission claim`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/individuals/notary-document-services`);
    const text = await bodyText(page);
    expect(dollarAmounts(text)).toEqual([]);
    expect(text).not.toMatch(
      /statutory|estatutari|per signature|por firma|mileage|millaje|\bcommissioned\b|comisionad/i,
    );
    expect(text).not.toMatch(internalTerms);
    const hero = page.locator(".editorial-service-actions a.button").first();
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute(
      "href",
      `${prefix}/contact?service=individual-notary`,
    );
    // the request path works end to end: Contact opens with Notary selected
    await hero.click();
    await expect(page.locator("#service")).toHaveValue("individual-notary");
    await expect(page.locator("#audience")).toHaveValue("individual");
  });

  test(`${code}: every non-priced service page shows no price and no internal figure`, async ({
    page,
  }) => {
    for (const [slug] of pages) {
      if (priced.has(slug)) continue;
      await page.goto(`${prefix}/services/${slug}`);
      const text = await bodyText(page);
      expect(dollarAmounts(text), slug).toEqual([]);
      expect(text, slug).not.toMatch(internalTerms);
      // internal tier limits and package names stay internal
      expect(text, slug).not.toMatch(
        /\b(100|300|600) transactions|\bEssentials\b|Website Launch|Website Growth|Managed Website|Website Care|Connected Business Automation|Half-Day Business Intensive|Operational Transformation package/i,
      );
    }
    await page.goto(`${prefix}/web-digital`);
    const web = await bodyText(page);
    expect(dollarAmounts(web)).toEqual([]);
    expect(web).not.toMatch(internalTerms);
    expect(web).not.toMatch(
      /Website Launch|Website Growth|Managed Website|Website Care|Connected Business Automation|Advanced Digital Business Solution/i,
    );
  });

  test(`${code}: every service page carries the shared content modules`, async ({
    page,
  }) => {
    for (const [slug] of pages) {
      await page.goto(`${prefix}/services/${slug}`);
      await expect(page.locator(".editorial-service-fit li")).not.toHaveCount(
        0,
      );
      expect(
        await page.locator(".editorial-service-fit li").count(),
        slug,
      ).toBeGreaterThanOrEqual(4);
      expect(
        await page.locator(".editorial-service-scope-group").count(),
        slug,
      ).toBeGreaterThanOrEqual(2);
      expect(
        await page.locator(".editorial-service-compare-list li").count(),
        slug,
      ).toBeGreaterThanOrEqual(3);
      expect(
        await page.locator(".editorial-service-faq-list details").count(),
        slug,
      ).toBeGreaterThanOrEqual(4);
      expect(
        await page.locator(".editorial-service-links--noted a").count(),
        slug,
      ).toBeGreaterThanOrEqual(2);
      // exactly one current-service marker per comparison (Operations covers two roles)
      expect(
        await page
          .locator(".editorial-service-compare-list li.is-current")
          .count(),
        slug,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  test(`${code}: internal links and CTAs use canonical routes and service keys`, async ({
    page,
  }) => {
    for (const [slug, key] of pages) {
      await page.goto(`${prefix}/services/${slug}`);
      const hrefs = await page
        .locator(
          ".editorial-service-compare-list a, .editorial-service-links--noted a, .editorial-service-option a",
        )
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      expect(hrefs.length, slug).toBeGreaterThan(0);
      for (const href of hrefs) {
        const path = href.replace(/^\/es(?=\/)/, "");
        expect(routeSet.has(path), `${slug} -> ${href}`).toBe(true);
        if (prefix) expect(href.startsWith("/es/")).toBe(true);
      }
      // every inquiry CTA carries this page's service key
      const contact = await page
        .locator('article a[href*="/contact"]')
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      expect(contact.length, slug).toBeGreaterThanOrEqual(3);
      for (const href of contact)
        expect(href, slug).toBe(`${prefix}/contact?service=${key}`);
    }
  });

  test(`${code}: Web & Digital has the build, maintain, optimize, automate stack and no pricing`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/web-digital`);
    await expect(page.locator(".webx-lifecycle-stages li")).toHaveCount(4);
    await expect(page.locator(".webx-panel")).toHaveCount(6);
    expect(
      await page.locator(".webx-faq-list details").count(),
    ).toBeGreaterThanOrEqual(8);
    const text = await bodyText(page);
    expect(text.toLowerCase()).toContain(
      code === "en" ? "does not guarantee rankings" : "no garantiza posiciones",
    );
    // still exactly two proposal CTAs, both routed through service preselection
    const label =
      code === "en"
        ? "Request a Project Proposal"
        : "Solicitar una propuesta de proyecto";
    const ctas = page.getByRole("link", { name: label });
    await expect(ctas).toHaveCount(2);
    for (const href of await ctas.evaluateAll((links) =>
      links.map((a) => a.getAttribute("href")),
    ))
      expect(href).toBe(
        `${prefix}/contact?service=business-digital&audience=business`,
      );
  });

  test(`${code}: no horizontal overflow at 390, 834 and 1440 on any service page`, async ({
    page,
  }) => {
    const all = [...pages.map(([slug]) => `/services/${slug}`), "/web-digital"];
    for (const width of [390, 834, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of all) {
        await page.goto(withPrefix(prefix, path));
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow, `${path} @${width}`).toBe(false);
      }
    }
  });

  test(`${code}: service pages have no serious accessibility violations`, async ({
    page,
  }) => {
    const all = [...pages.map(([slug]) => `/services/${slug}`), "/web-digital"];
    for (const path of all) {
      await page.goto(withPrefix(prefix, path));
      // axe measures colour mid-transition otherwise (flaky under parallel load)
      await page.addStyleTag({
        content:
          ".reveal{transition:none!important;opacity:1!important;transform:none!important}",
      });
      await page.waitForTimeout(150);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations
          .filter(({ impact }) => impact === "serious" || impact === "critical")
          .map(({ id }) => id),
        path,
      ).toEqual([]);
    }
  });
}

test("EN and ES service pages have the same module structure", async ({
  page,
}) => {
  const selectors = [
    ".editorial-service-fit li",
    ".editorial-service-scope-group",
    ".editorial-service-scope-group li",
    ".editorial-service-option",
    ".editorial-service-price-card",
    ".editorial-service-process li",
    ".editorial-service-compare-list li",
    ".editorial-service-faq-list details",
    ".editorial-service-links--noted a",
  ];
  const measure = async (prefix, slug) => {
    await page.goto(`${prefix}/services/${slug}`);
    return page.evaluate(
      (list) =>
        list.map((selector) => document.querySelectorAll(selector).length),
      selectors,
    );
  };
  for (const [slug] of pages)
    expect(await measure("/es", slug), slug).toEqual(await measure("", slug));
  // Web & Digital parity
  const web = async (prefix) => {
    await page.goto(`${prefix}/web-digital`);
    return page.evaluate(() =>
      [
        ".webx-lifecycle-stages li",
        ".webx-panel",
        ".webx-panel li",
        ".webx-faq-list details",
      ].map((s) => document.querySelectorAll(s).length),
    );
  };
  expect(await web("/es")).toEqual(await web(""));
});

test("Translation's See pricing link lands on the pricing section", async ({
  page,
}) => {
  await page.goto("/services/individuals/translation-services");
  const link = page.locator('.editorial-service-actions a[href="#pricing"]');
  await expect(link).toHaveText(/See pricing/);
  await link.click();
  await expect(page.locator("#pricing")).toBeInViewport();
});

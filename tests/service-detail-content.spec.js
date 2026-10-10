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
// Notary shows dollar figures too, but they are North Carolina's published
// notarial fee schedule, not an Alchemize commercial price -- kept distinct
// from `priced` above so the two policies stay separately testable.
const governmentFeeSchedule = new Set(["individuals/notary-document-services"]);
// Notary folds "is this for you" and "what the service supports" into one
// section, and relates other services through one compact list.
const consolidated = new Set(["individuals/notary-document-services"]);
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

  test(`${code}: Notary publishes the North Carolina fee schedule as a table, not an Alchemize price`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/individuals/notary-document-services`);
    const text = await bodyText(page);
    // four $10 acts in the fee table (acknowledgment, jurat, verification,
    // oath), plus the same acknowledgment fee restated in the hero summary;
    // no charge and the mileage rate carry no dollar figure of their own
    expect(dollarAmounts(text).sort()).toEqual(["10", "10", "10", "10", "10"]);
    // never presented as individual pricing cards/boxes (that is Apostille's
    // presentation, not Notary's)
    await expect(page.locator(".editorial-service-price-card")).toHaveCount(0);
    // the fee table is not explained twice: its note carries the travel terms
    await expect(page.locator(".fee-schedule-note")).toHaveCount(1);
    // the hero states the service, the price anchor, and availability --
    // replacing the generic icon + three-word mark other services still use
    const heroSummary = page.locator(".editorial-service-hero-summary");
    await expect(heroSummary).toContainText("$10");
    await expect(heroSummary).toContainText(
      code === "en" ? "North Carolina" : "Carolina del Norte",
    );
    await expect(page.locator(".editorial-service-mark-words")).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name:
          code === "en"
            ? "North Carolina Notary Services"
            : "Servicios Notariales de Carolina del Norte",
      }),
    ).toBeVisible();
    const table = page.locator(".fee-schedule-table");
    await expect(table).toBeVisible();
    await expect(table.locator("tbody tr")).toHaveCount(6);
    await expect(table.locator("tbody tr").nth(4)).toContainText(
      code === "en" ? "No Charge" : "Sin costo",
    );
    // mobile travel is a mileage-based charge, never a flat number in the fee cell
    const travelFeeCell = table.locator("tbody tr").nth(5).locator("td");
    await expect(travelFeeCell).toContainText(
      code === "en" ? "mileage rate" : "millaje",
    );
    await expect(travelFeeCell).not.toContainText("$");
    await expect(page.locator(".fee-schedule-note")).toContainText(
      code === "en" ? "in writing" : "por escrito",
    );
    // no proprietary rate, and no claim of a current commission
    expect(text).not.toMatch(internalTerms);
    expect(text).not.toMatch(/\bcommissioned\b|comisionad/i);
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

  test(`${code}: Notary keeps the appointment preparation checklist, the related-service links, and a strong closing CTA`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/individuals/notary-document-services`);
    // preparation requirements stay in one accessible, actionable checklist
    const prepItems = page.locator(".editorial-service-prepare-panel li");
    await expect(prepItems).toHaveCount(5);
    await expect(prepItems.first()).toBeVisible();
    await expect(page.locator(".editorial-service-specific h2")).toHaveText(
      code === "en"
        ? "What to Bring to Your Appointment"
        : "Qué llevar a su cita",
    );
    // the workbook is offered here, as the section's secondary action, and
    // no longer in the hero
    await expect(
      page.locator(".editorial-service-specific a[href$='.pdf']"),
    ).toHaveCount(1);
    await expect(
      page.locator(".editorial-service-hero a[href$='.pdf']"),
    ).toHaveCount(0);
    // related-service links (translation, apostille) remain functional, in one
    // compact list rather than a comparison plus a second related list
    const related = page.locator(".editorial-service-compare-list a");
    await expect(related).toHaveCount(2);
    await expect(page.locator(".editorial-service-compare h2")).toHaveText(
      code === "en"
        ? "Related Document Services"
        : "Servicios documentales relacionados",
    );
    const hrefs = await related.evaluateAll((links) =>
      links.map((a) => a.getAttribute("href")),
    );
    expect(hrefs).toEqual([
      `${prefix}/services/individuals/translation-services`,
      `${prefix}/services/individuals/apostille-services`,
    ]);
    await expect(page.locator(".editorial-service-related a")).toHaveCount(0);
    // redundant sections are gone: no context band, no second scope band
    await expect(page.locator(".editorial-service-context")).toHaveCount(0);
    await expect(page.locator(".editorial-service-scope")).toHaveCount(0);
    await expect(page.locator(".editorial-service-boundary")).toHaveCount(0);
    // one consolidated section with the two distinct groups
    await expect(page.locator(".editorial-service-needs-group")).toHaveCount(2);
    await expect(
      page.locator(".editorial-service-needs-group").nth(1),
    ).toContainText(
      code === "en"
        ? "not part of the notarial fee"
        : "no forma parte de la tarifa notarial",
    );
    // the process heading and the four steps
    await expect(page.locator(".editorial-service-steps h2")).toHaveText(
      code === "en"
        ? "How Your Notary Appointment Works"
        : "Cómo funciona su cita notarial",
    );
    await expect(page.locator(".editorial-service-process li")).toHaveCount(4);
    // scope sits once, beside the closing request
    await expect(page.locator(".editorial-service-scope-aside")).toHaveCount(1);
    // the final section is a clear, substantial conversion point, not a
    // second copy of the generic template close
    await expect(page.locator(".editorial-service-close h2")).toHaveText(
      code === "en"
        ? "Ready to Get Your Document Notarized?"
        : "¿Listo para notarizar su documento?",
    );
    const closeCta = page
      .locator(".editorial-service-close-grid a.button")
      .first();
    await expect(closeCta).toHaveAttribute(
      "href",
      `${prefix}/contact?service=individual-notary`,
    );
  });

  test(`${code}: every non-priced service page shows no price and no internal figure`, async ({
    page,
  }) => {
    for (const [slug] of pages) {
      if (priced.has(slug) || governmentFeeSchedule.has(slug)) continue;
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
      /Website Launch|Website Growth|Managed Website(?!s)|Website Care|Connected Business Automation|Advanced Digital Business Solution/,
    );
  });

  test(`${code}: every service page carries the shared content modules`, async ({
    page,
  }) => {
    for (const [slug] of pages) {
      await page.goto(`${prefix}/services/${slug}`);
      if (consolidated.has(slug)) continue; // covered by the Notary tests
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
      code === "en" ? "Discuss Your Project" : "Converse sobre su proyecto";
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
    // 11 pages x 3 widths: allow for a loaded runner
    test.setTimeout(90_000);
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
    // one axe scan per page across every service page: allow for a loaded runner
    test.setTimeout(120_000);
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

test("the hero-summary treatment is scoped to Notary; other services keep their icon and mark", async ({
  page,
}) => {
  for (const slug of [
    "individuals/tax-preparation",
    "individuals/translation-services",
    "individuals/apostille-services",
    "businesses/advisory-optimization",
  ]) {
    await page.goto(`/services/${slug}`);
    await expect(page.locator(".editorial-service-mark-words")).toHaveCount(1);
    await expect(page.locator(".editorial-service-hero-summary")).toHaveCount(
      0,
    );
  }
});

for (const { code, prefix } of languages) {
  test(`${code}: Notary FAQ answers distinct questions and its accordions work`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/individuals/notary-document-services`);
    const items = page.locator(".editorial-service-faq-list details");
    await expect(items).toHaveCount(6);
    const questions = await page
      .locator(".editorial-service-faq-list summary")
      .allTextContents();
    expect(new Set(questions).size).toBe(questions.length);
    // the process and the checklist are not asked about a second time
    for (const question of questions)
      expect(question).not.toMatch(
        /what should I bring|what happens after|qué debo llevar|qué pasa después/i,
      );
    // each accordion opens and closes
    const first = items.first();
    await expect(first).not.toHaveAttribute("open", "");
    await first.locator("summary").click();
    await expect(first).toHaveAttribute("open", "");
    await expect(first.locator("p")).toBeVisible();
    await first.locator("summary").click();
    await expect(first).not.toHaveAttribute("open", "");
    // answers do not make blanket claims about who must appear for a vehicle
    // document: the document and receiving agency decide
    const vehicle = items.nth(1);
    await vehicle.locator("summary").click();
    await expect(vehicle.locator("p")).toContainText(
      code === "en" ? "depends on the document" : "Depende del documento",
    );
  });

  test(`${code}: Notary page has no horizontal overflow and a compact fee table at phone width`, async ({
    page,
  }) => {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(
        `${prefix}/services/individuals/notary-document-services`,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        `${width}px`,
      ).toBe(false);
    }
    // a real table remains at phone width, with the fee column still beside
    // its service name
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${prefix}/services/individuals/notary-document-services`);
    const row = page.locator(".fee-schedule-table tbody tr").first();
    const label = await row.locator("th").boundingBox();
    const fee = await row.locator("td").boundingBox();
    expect(fee.x).toBeGreaterThan(label.x + label.width - 1);
    expect(fee.x + fee.width).toBeLessThanOrEqual(390);
  });
}

test("Notary's See pricing link lands on the fee schedule, not a pricing-card section", async ({
  page,
}) => {
  await page.goto("/services/individuals/notary-document-services");
  const link = page.locator('.editorial-service-actions a[href="#pricing"]');
  await expect(link).toHaveText(/See pricing/);
  await link.click();
  await expect(page.locator("#pricing")).toBeInViewport();
  await expect(page.locator("#pricing .fee-schedule-table")).toBeVisible();
  await expect(
    page.locator("#pricing .editorial-service-price-card"),
  ).toHaveCount(0);
});

// No public service page offers direct card/checkout payment -- every public
// service, priced or not, routes through the Contact request flow. This is
// the one payment-adjacent surface a marketing page could carry; the
// authenticated Client Portal's own Stripe/PayPal checkout is unrelated and
// untouched by this pass.
test("no public service page offers a direct Stripe or card checkout", async ({
  page,
}) => {
  for (const prefix of ["", "/es"]) {
    const routes = [
      ...pages.map(([slug]) => `/services/${slug}`),
      "/web-digital",
    ];
    for (const path of routes) {
      await page.goto(prefix + path);
      await expect(
        page.locator('a[href*="stripe" i], a[href*="checkout" i]'),
      ).toHaveCount(0);
      await expect(page.getByText(/pay with stripe/i)).toHaveCount(0);
    }
  }
});

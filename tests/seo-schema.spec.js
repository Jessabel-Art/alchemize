import { test, expect } from "@playwright/test";

const routeExpectations = [
  {
    route: "/",
    check: ["WebSite", "Organization"],
    metaChecks: ['meta[property="og:title"]', 'meta[name="twitter:card"]'],
  },
  {
    route: "/faq",
    check: ["FAQPage"],
  },
  {
    route: "/resources/meet-the-founder",
    check: ["Person"],
  },
  {
    route: "/services/individuals/tax-preparation",
    check: ["Service", "BreadcrumbList"],
    metaChecks: ['meta[property="og:title"]', 'meta[name="twitter:card"]'],
  },
  {
    route: "/services/businesses/business-tax-support",
    check: ["Service", "BreadcrumbList"],
    metaChecks: ['meta[property="og:title"]', 'meta[name="twitter:card"]'],
  },
  {
    route: "/services/individuals/translation-services",
    check: ["Service", "BreadcrumbList"],
    metaChecks: ['meta[property="og:title"]', 'meta[name="twitter:card"]'],
  },
  {
    route: "/services/individuals/apostille-services",
    check: ["Service", "BreadcrumbList"],
    metaChecks: ['meta[property="og:title"]', 'meta[name="twitter:card"]'],
  },
  {
    route: "/services/businesses/bookkeeping-financial-reporting",
    check: ["Service", "BreadcrumbList"],
    metaChecks: ['meta[property="og:title"]', 'meta[name="twitter:card"]'],
  },
  {
    route: "/services/businesses/payroll-processing",
    check: ["Service", "BreadcrumbList"],
    metaChecks: ['meta[property="og:title"]', 'meta[name="twitter:card"]'],
  },
  {
    route: "/es",
    check: ["WebSite", "Organization"],
    metaChecks: ['meta[property="og:title"]', 'meta[name="twitter:card"]'],
  },
  {
    route: "/es/faq",
    check: ["FAQPage"],
  },
  {
    route: "/es/resources/meet-the-founder",
    check: ["Person"],
  },
];

function readJsonLd(page) {
  return page.evaluate(() => {
    const scripts = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ];
    return scripts
      .map((script) => {
        try {
          return JSON.parse(script.textContent || "{}");
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  });
}

function schemaIds(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("script[data-schema-id]")].map(
      (script) => script.dataset.schemaId,
    ),
  );
}

test.describe("SEO schema coverage", () => {
  for (const { route, check, metaChecks = [] } of routeExpectations) {
    test(`${route} includes required schema metadata`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(600);
      const jsonLd = await readJsonLd(page);
      const flattened = jsonLd.flatMap((entry) => {
        const values = [];
        if (entry["@type"]) values.push(entry["@type"]);
        if (Array.isArray(entry["@graph"])) {
          for (const item of entry["@graph"]) {
            if (item["@type"]) values.push(item["@type"]);
          }
        }
        return values;
      });

      for (const expectation of check) {
        expect(flattened.some((value) => value === expectation)).toBeTruthy();
      }

      const titleTag = await page.title();
      expect(titleTag).toBeTruthy();

      for (const selector of metaChecks) {
        expect(await page.locator(selector).count()).toBeGreaterThan(0);
      }
    });
  }
});

test.describe("No duplicate structured data", () => {
  const routesToCheck = [
    "/",
    "/services",
    "/faq",
    "/privacy",
    "/terms",
    "/services/individuals/tax-preparation",
  ];

  for (const route of routesToCheck) {
    test(`${route} does not inject duplicate Organization/WebSite schema`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForTimeout(600);
      const ids = await schemaIds(page);
      const counts = ids.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});
      for (const [id, count] of Object.entries(counts)) {
        expect(
          count,
          `duplicate script[data-schema-id="${id}"] on ${route}`,
        ).toBe(1);
      }
      expect(ids).toContain("alchemize-organization-schema");
    });
  }
});

test.describe("Legal pages carry full metadata parity", () => {
  for (const route of ["/privacy", "/terms"]) {
    test(`${route} has OG/Twitter tags and canonical URL`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(300);
      expect(
        await page.locator('meta[property="og:title"]').count(),
      ).toBeGreaterThan(0);
      expect(
        await page.locator('meta[property="og:description"]').count(),
      ).toBeGreaterThan(0);
      expect(
        await page.locator('meta[name="twitter:card"]').count(),
      ).toBeGreaterThan(0);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(canonical).toBe(`https://getalchemize.com${route}`);
    });
  }
});

test.describe("Private/token-gated surfaces are not presented as indexable", () => {
  test("public scheduling page carries a noindex directive", async ({
    page,
  }) => {
    await page.goto("/appointment/schedule/seo-test-token");
    await page.waitForTimeout(300);
    const robotsContent = await page
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(robotsContent).toContain("noindex");
  });
});

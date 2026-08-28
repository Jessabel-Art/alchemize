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
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
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

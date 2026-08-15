import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const routes = [
  "/services/individuals/tax-preparation/",
  "/services/individuals/insurance/",
  "/services/individuals/notary-document-services/",
  "/services/businesses/business-formation/",
  "/services/businesses/administration-operations/",
  "/services/businesses/business-tax/",
  "/services/businesses/business-advisory/",
  "/services/businesses/business-insurance/",
  "/services/businesses/notary-administrative-services/",
];

test.describe("Service detail accessibility checks", () => {
  for (const route of routes) {
    test(`no serious accessibility issues on ${route}`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(
          ({ impact }) => impact === "serious" || impact === "critical",
        ),
      ).toEqual([]);
    });
  }
});

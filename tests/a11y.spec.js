import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/about/",
  "/services/",
  "/resources/",
  "/contact/",
  "/privacy/",
  "/terms/",
];

test.describe("Accessibility smoke checks", () => {
  for (const route of routes) {
    test(`no serious accessibility issues on ${route}`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();

      const seriousViolations = results.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      );

      expect(seriousViolations).toEqual([]);
    });
  }
});

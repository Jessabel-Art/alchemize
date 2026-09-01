import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const routes = [
  "/services/individuals/tax-preparation/",
  "/services/individuals/insurance/",
  "/services/individuals/notary-document-services/",
  "/services/individuals/translation-services/",
  "/services/individuals/apostille-services/",
  "/services/businesses/advisory-optimization/",
  "/services/businesses/operations-implementation/",
  "/services/businesses/digital-business-technology/",
  "/services/businesses/readiness-growth/",
  "/services/businesses/bookkeeping-financial-reporting/",
  "/services/businesses/payroll-processing/",
  "/services/businesses/business-tax-support/",
];

test.describe("Service detail accessibility checks", () => {
  for (const route of routes) {
    test(`no serious accessibility issues on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(850);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(
          ({ impact }) => impact === "serious" || impact === "critical",
        ),
      ).toEqual([]);
    });
  }
});

test("service index exposes one audience catalog at a time", async ({
  page,
}) => {
  await page.goto("/services/#businesses");
  await expect(
    page.getByRole("heading", { name: "Business Advisory & Optimization" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tax Preparation" }),
  ).toHaveCount(0);
  const individualTab = page.getByRole("tab", {
    name: /Individual Services/,
  });
  await individualTab.click();
  await expect(individualTab).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("heading", { name: "Tax Preparation" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#individuals$/);
  await individualTab.focus();
  const businessTab = page.getByRole("tab", { name: /Business Services/ });
  await page.keyboard.press("ArrowRight");
  await expect(businessTab).toBeFocused();
  await expect(businessTab).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(individualTab).toBeFocused();
  await expect(individualTab).toHaveAttribute("aria-selected", "true");
});

test("legacy business route redirects to its canonical service", async ({
  page,
}) => {
  await page.goto("/services/businesses/business-advisory/");
  await expect(page).toHaveURL(
    /\/services\/businesses\/advisory-optimization\/?$/,
  );
});

test("consultation links preselect the service family", async ({ page }) => {
  await page.goto("/services/businesses/digital-business-technology/");
  await page
    .locator(".editorial-service-actions")
    .getByRole("link", { name: "Schedule a Consultation" })
    .click();
  await expect(page.locator("select[name=service]")).toHaveValue(
    "business-digital",
  );
  await expect(page.locator("select[name=audience]")).toHaveValue("business");
});

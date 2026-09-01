import { expect, test } from "@playwright/test";

const affectedRoutes = [
  "/services/individuals/tax-preparation/",
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

for (const route of affectedRoutes) {
  test(`${route} uses the editorial service layout without public pricing`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".public-pricing")).toHaveCount(0);
    await expect(
      page.getByText("Compare standardized service options."),
    ).toHaveCount(0);
    await expect(page.getByText(/\$\d[\d,]*(?:\.\d{2})?/)).toHaveCount(0);
    await expect(
      page.getByText("Who this is for", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Defined work. Practical output." }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: "When this service becomes useful.",
      }),
    ).toHaveCount(0);
  });
}

test("service detail layout does not overflow at tablet or mobile widths", async ({
  page,
}) => {
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/services/businesses/bookkeeping-financial-reporting/");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  }
});

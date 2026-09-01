import { expect, test } from "@playwright/test";

const capabilityTargets = [
  ["Business Consulting", "/services/businesses/advisory-optimization"],
  ["Business Operations", "/services/businesses/operations-implementation"],
  ["Web & Digital Solutions", "/web-digital"],
  ["Business Readiness", "/services/businesses/readiness-growth"],
  ["Bookkeeping", "/services/businesses/bookkeeping-financial-reporting"],
  ["Payroll", "/services/businesses/payroll-processing"],
  ["Business Tax", "/services/businesses/business-tax-support"],
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("homepage capability rows reach their matching business service families", async ({
  page,
}) => {
  for (const [label, target] of capabilityTargets) {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: `Explore ${label}` }).click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(target)}/?$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("homepage preserves canonical resources without unavailable downloads", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("link", { name: "Explore All Resources" }),
  ).toHaveAttribute("href", "/resources");

  await expect(page.locator(".home-resource-list > div")).toHaveCount(3);
  await expect(page.locator('.home-resource-list a[href$=".pdf"]')).toHaveCount(
    0,
  );
  await expect(page.getByText("In development")).toHaveCount(3);
});

test("homepage refinement remains composed without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  for (const width of [1440, 1024, 768, 430, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(".home-connect-process")).toBeVisible();
    await expect(page.locator(".home-resource-item")).toHaveCount(3);
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows).toBeFalsy();
    if ([1440, 768, 390].includes(width)) {
      await page.screenshot({
        path: testInfo.outputPath(`home-${width}.png`),
        fullPage: true,
      });
      for (const section of [
        "home-connect",
        "home-capabilities",
        "home-resources",
      ]) {
        const target = page.locator(`.${section}`);
        await target.scrollIntoViewIfNeeded();
        await target.screenshot({
          path: testInfo.outputPath(`${section}-${width}.png`),
        });
      }
    }
  }
});

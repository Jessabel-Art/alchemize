import { expect, test } from "@playwright/test";

test("bookkeeping page compares approved tiers and exclusions", async ({
  page,
}) => {
  await page.goto("/services/businesses/bookkeeping-financial-reporting/");
  const pricing = page.locator(".public-pricing");
  await expect(
    pricing.getByRole("heading", { name: "Essentials" }),
  ).toBeVisible();
  await expect(pricing).toContainText("$249");
  await expect(pricing).toContainText("max transactions: 100");
  await expect(pricing).toContainText(
    "$250 first month + $125 each additional month",
  );
  await expect(pricing).toContainText("Tax preparation is a separate service");
  await expect(pricing).not.toContainText("$0");
});

test("digital page distinguishes fixed, starting-at, and Custom SOW pricing", async ({
  page,
}) => {
  await page.goto("/services/businesses/digital-business-technology/");
  await expect(page.getByText("$1,250", { exact: true })).toBeVisible();
  await expect(page.getByText("$1,850", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Custom SOW", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Starting at", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".public-pricing")).not.toContainText("$0");
});

test("apostille pricing is visibly pending and never positioned as issuance", async ({
  page,
}) => {
  await page.goto("/services/individuals/apostille-services/");
  await expect(
    page
      .getByRole("heading", {
        name: "North Carolina Apostille Facilitation & Support",
      })
      .first(),
  ).toBeVisible();
  await expect(page.locator(".public-pricing")).toContainText("$149");
  await expect(page.locator(".public-pricing")).toContainText("+$40");
  await expect(page.locator(".public-pricing")).toContainText(
    "Availability pending authorization",
  );
  await expect(page.locator(".public-pricing")).toContainText(
    "issued by the appropriate government authority, not Alchemize",
  );
});

test("pricing cards stack without horizontal overflow on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/services/businesses/payroll-processing/");
  await expect(
    page.getByRole("heading", { name: "Payroll Setup" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await expect(page.locator(".public-pricing")).toContainText(
    "does not advise employees",
  );
});

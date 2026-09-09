import { expect, test } from "@playwright/test";

const capabilityGroupTargets = [
  ["Business Foundation", "/services/businesses/advisory-optimization"],
  [
    "Operations & Administration",
    "/services/businesses/operations-implementation",
  ],
  ["Financial Organization", "/services/businesses/business-tax-support"],
  ["Web & Digital Solutions", "/web-digital"],
];

test("homepage capability groups reach their matching business service families", async ({
  page,
}) => {
  for (const [label, target] of capabilityGroupTargets) {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator(".home-capability-group", { hasText: label }).click();
    await expect(page).toHaveURL(new RegExp(`${target}/?$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("homepage hero and service CTAs retain correct destinations", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("link", { name: "Schedule a Consultation" }).first(),
  ).toHaveAttribute("href", "/contact");
  await expect(
    page.getByRole("link", { name: "Explore Services" }),
  ).toHaveAttribute("href", "/services");
  await expect(
    page.getByRole("link", { name: "Explore individual services" }),
  ).toHaveAttribute("href", "/services/#individuals");
  await expect(
    page.getByRole("link", { name: "Explore business services" }),
  ).toHaveAttribute("href", "/services/#businesses");
  await expect(
    page.getByRole("link", { name: "Explore All Services" }),
  ).toHaveAttribute("href", "/services");
});

test("homepage Why Alchemize CTA retains correct destination", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.locator(".home-trust").getByRole("link", { name: "Why Alchemize" }),
  ).toHaveAttribute("href", "/why-alchemize");
});

test("homepage resource cards use existing valid resource routes", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("link", { name: "Explore All Resources" }),
  ).toHaveAttribute("href", "/resources");

  const cards = page.locator(".home-resource-card");
  await expect(cards).toHaveCount(3);

  await expect(
    page.locator('a[href="/resources/preparing-for-tax-season"]'),
  ).toHaveCount(1);
  await expect(
    page.locator(
      'a[href="/resources/starting-a-business-organization-checklist"]',
    ),
  ).toHaveCount(1);
  await expect(
    page.locator(
      'a[href="/assets/downloads/consultation-preparation-workbook.pdf"]',
    ),
  ).toHaveCount(1);
});

test("homepage final consultation CTA works", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const finalCta = page.locator(".home-final").getByRole("link", {
    name: "Schedule a Consultation",
  });
  await expect(finalCta).toHaveAttribute("href", "/contact");
  await finalCta.click();
  await expect(page).toHaveURL(/\/contact\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("homepage refinement remains composed without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  for (const width of [1440, 1024, 768, 430, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(".home-connect-process")).toBeVisible();
    await expect(page.locator(".home-resource-card")).toHaveCount(3);
    await expect(page.locator(".home-capability-group")).toHaveCount(4);
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

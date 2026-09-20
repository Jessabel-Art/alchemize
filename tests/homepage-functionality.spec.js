import { expect, test } from "@playwright/test";

test("homepage capability grid describes capabilities and is not a second service menu", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const tiles = page.locator(".home-capability-group");
  await expect(tiles).toHaveCount(6);
  await expect(tiles.locator("a")).toHaveCount(0);
  const titles = await tiles.locator("h3").allTextContents();
  expect(titles).toEqual([
    "Operations & Structure",
    "Administration & Organization",
    "Client Service & Coordination",
    "Financial & Operational Responsibility",
    "Digital Business & E-Commerce",
    "UX & Web Development",
  ]);
  // none of them repeats a canonical service category name
  const categories = await page
    .locator(".home-business-panel .home-path-list li")
    .allTextContents();
  expect(categories.length).toBe(6);
  for (const title of titles) expect(categories).not.toContain(title);
});

test("homepage service discovery lists the canonical categories", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const panels = page.locator(".home-path-grid article");
  await expect(panels.nth(0).locator("li")).toHaveText([
    "Tax Preparation",
    "Notary & Document Services",
    "Translation & Apostille Support",
    "Digital Support",
  ]);
  await expect(panels.nth(1).locator("li")).toHaveText([
    "Business Foundation",
    "Business Advisory",
    "Operations & Administration",
    "Tax & Financial Organization",
    "Bookkeeping & Payroll Support",
    "Web & Digital Solutions",
  ]);
});

test("homepage hero and service CTAs retain correct destinations", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("link", { name: "Tell Us What You Need" }).first(),
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

test("homepage credibility section leads to the Founder page", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.locator(".home-trust").getByRole("link", { name: "Meet the Founder" }),
  ).toHaveAttribute("href", "/resources/meet-the-founder");
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
    name: "Tell Us What You Need",
  });
  await expect(finalCta).toHaveAttribute("href", "/contact");
  await finalCta.click();
  await expect(page).toHaveURL(/\/contact\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("consultation workbook image loads with matching resource-card treatment", async ({
  page,
  request,
}, testInfo) => {
  const asset = "/assets/images/home/seo-metadata-resource.png";
  const response = await request.get(asset);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("image/png");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const cards = page.locator(".home-resource-card");
    const card = cards.filter({ hasText: "Consultation Preparation Workbook" });
    const image = card.locator("img");
    await card.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute("src", asset);
    await expect(image).toHaveJSProperty("complete", true);
    expect(
      await image.evaluate((element) => element.naturalWidth),
    ).toBeGreaterThan(0);
    await expect(image).toHaveCSS("object-fit", "cover");
    const adjacentBox = await cards
      .nth(1)
      .locator(".home-resource-card-media")
      .boundingBox();
    const imageBox = await image.boundingBox();
    expect(imageBox.width).toBeCloseTo(adjacentBox.width, 0);
    expect(imageBox.height).toBeCloseTo(adjacentBox.height, 0);
    await card.screenshot({
      path: testInfo.outputPath(`workbook-${width}.png`),
    });
  }
});

test("homepage refinement remains composed without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  for (const width of [1440, 1024, 768, 430, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(".home-connect-process")).toBeVisible();
    await expect(page.locator(".home-resource-card")).toHaveCount(3);
    await expect(page.locator(".home-capability-group")).toHaveCount(6);
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

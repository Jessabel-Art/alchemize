import { expect, test } from "@playwright/test";

const serviceRoutes = [
  ["/services/individuals/tax-preparation/", "Prepare before filing."],
  [
    "/services/individuals/notary-document-services/",
    "Prepare the document first.",
  ],
  ["/services/individuals/translation-services/", "Make the document clear."],
  [
    "/services/individuals/apostille-services/",
    "Prepare it for its destination.",
  ],
  [
    "/services/businesses/advisory-optimization/",
    "Turn friction into direction.",
  ],
  [
    "/services/businesses/operations-implementation/",
    "Make the business easier to run.",
  ],
  ["/services/businesses/readiness-growth/", "Build the foundation first."],
  [
    "/services/businesses/bookkeeping-financial-reporting/",
    "Know where the business stands.",
  ],
  ["/services/businesses/payroll-processing/", "Keep payroll moving reliably."],
  [
    "/services/businesses/business-tax-support/",
    "Prepare before filing season.",
  ],
];

for (const [route, headline] of serviceRoutes) {
  test(`${route} uses the editorial service system`, async ({ page }) => {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { level: 1, name: headline }),
    ).toBeVisible();
    await expect(page.locator(".editorial-service-context")).toBeVisible();
    await expect(page.locator(".editorial-service-scope")).toBeVisible();
    await expect(page.locator(".editorial-service-close")).toBeVisible();
    await expect(
      page.getByText("Who this is for", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Defined work. Practical output.", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("When this service becomes useful.", { exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(".public-pricing")).toHaveCount(0);
    await expect(page.getByText(/\$\d[\d,]*(?:\.\d{2})?/)).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Schedule a Consultation" }).first(),
    ).toBeVisible();
  });
}

test("legacy digital route redirects to the consolidated web & digital page", async ({
  page,
}) => {
  await page.goto("/services/businesses/digital-business-technology/");
  await expect(page).toHaveURL(/\/web-digital(?:\/)?$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Professional digital presence/i,
    }),
  ).toBeVisible();
});

test("public navigation shows only one digital service family", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "Web & Digital Solutions" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Web & Digital Solutions" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Digital Business & Technology" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Digital Business & Tech" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Business Consulting" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Business Operations" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Bookkeeping" })).toBeVisible();
});

test("merged web & digital content is visible beyond a website-only landing page", async ({
  page,
}) => {
  await page.goto("/web-digital");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Professional digital presence|digital presence/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/SEO|Local SEO|Google Business Profile|automation/i),
  ).toBeVisible();
  await expect(
    page.getByText(/website maintenance|ongoing support|workflow automation/i),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Request a Project Proposal" }),
  ).toHaveCount(2);
  await expect(
    page
      .locator(".webx-actions")
      .getByRole("link", { name: "Request a Project Proposal" }),
  ).toHaveCount(1);
});

const responsiveRoutes = [
  "/services/businesses/advisory-optimization/",
  "/services/businesses/bookkeeping-financial-reporting/",
  "/services/individuals/translation-services/",
];

for (const route of responsiveRoutes) {
  for (const width of [
    1920, 1600, 1440, 1280, 1100, 1024, 900, 768, 600, 430, 390,
  ]) {
    test(`${route} does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
    });
  }
}

for (const zoom of [0.8, 0.9, 1, 1.1, 1.25]) {
  test(`editorial composition remains stable at ${zoom * 100}% zoom`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/services/businesses/operations-implementation/");
    await page.evaluate((value) => {
      document.documentElement.style.zoom = String(value);
    }, zoom);
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

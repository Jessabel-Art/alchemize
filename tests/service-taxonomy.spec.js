import { expect, test } from "@playwright/test";

// What visitors see must agree with the canonical taxonomy and methodology.

test("Services page lists the canonical categories for each audience", async ({
  page,
}) => {
  await page.goto("/services");
  const individuals = page.locator("#individuals-panel h3");
  await expect(individuals).toHaveText([
    "Tax Preparation",
    "Notary & Document Services",
    "Translation & Apostille Support",
    "Digital Support",
  ]);
  await page.goto("/services/#businesses");
  await expect(page.locator("#businesses-panel h3")).toHaveText([
    "Business Foundation",
    "Business Advisory",
    "Operations & Administration",
    "Tax & Financial Organization",
    "Bookkeeping & Payroll Support",
    "Web & Digital Solutions",
  ]);
  // Multi-service categories list their existing service pages together.
  await expect(
    page.locator("#bookkeeping-payroll-support .service-child h4"),
  ).toHaveText(["Bookkeeping", "Payroll"]);
});

test("category deep links open the right audience, including from another page", async ({
  page,
}) => {
  await page.goto("/services/#bookkeeping-payroll-support");
  await expect(page.locator("#bookkeeping-payroll-support")).toBeVisible();
  await expect(
    page.getByRole("tab", { name: /Business Services/ }),
  ).toHaveAttribute("aria-selected", "true");
  // Client-side navigation while the individuals tab is showing.
  await page.goto("/services");
  await expect(page.locator("#individuals-panel")).toBeVisible();
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Bookkeeping & Payroll Support" })
    .click();
  await expect(page.locator("#bookkeeping-payroll-support")).toBeVisible();
  await expect(page.locator("#businesses-panel")).toBeVisible();
});

test("breadcrumbs show a category level only when the category groups several pages", async ({
  page,
}) => {
  await page.goto("/services/businesses/payroll-processing");
  const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(
    crumbs.getByRole("link", { name: "Bookkeeping & Payroll Support" }),
  ).toHaveAttribute("href", "/services/#bookkeeping-payroll-support");
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText("Payroll");

  await page.goto("/services/businesses/advisory-optimization");
  await expect(crumbs.locator("a")).toHaveCount(2);
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText(
    "Business Advisory",
  );
});

test("footer lists the canonical categories and the approved contact details", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const name of [
    "Tax Preparation",
    "Notary & Document Services",
    "Translation & Apostille Support",
    "Digital Support",
    "Business Foundation",
    "Operations & Administration",
    "Bookkeeping & Payroll Support",
    "Tax & Financial Organization",
    "Web & Digital Solutions",
    "Business Advisory",
  ]) {
    await expect(footer.getByRole("link", { name })).toHaveCount(1);
  }
  await expect(
    footer.getByRole("link", { name: "910-644-0207" }),
  ).toHaveAttribute("href", "tel:+19106440207");
  await expect(
    footer.getByRole("link", { name: "hello@getalchemize.com" }),
  ).toHaveAttribute("href", "mailto:hello@getalchemize.com");
  await expect(footer).toContainText("Fayetteville, NC");
  await expect(footer).toContainText("Virtual services available nationwide.");
  // Nationwide applies to virtual services only.
  await expect(footer).not.toContainText(
    /all services (are )?available nationwide/i,
  );
});

test("Spanish footer keeps the same contact details and category structure", async ({
  page,
}) => {
  await page.goto("/es");
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("link", { name: "910-644-0207" }),
  ).toHaveAttribute("href", "tel:+19106440207");
  await expect(footer).toContainText("Fayetteville, NC");
  await expect(footer).toContainText(
    "Servicios virtuales disponibles a nivel nacional.",
  );
  await expect(footer.locator(".footer-group").nth(0).locator("a")).toHaveCount(
    4,
  );
  await expect(footer.locator(".footer-group").nth(1).locator("a")).toHaveCount(
    6,
  );
});

test("footer contact details stay usable and inside the viewport on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const phone = page
    .getByRole("contentinfo")
    .getByRole("link", { name: "910-644-0207" });
  await phone.scrollIntoViewIfNeeded();
  const box = await phone.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(30);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("the canonical methodology is Assess, Identify, Implement", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".home-hero-image figcaption")).toHaveText(
    "Assess. Identify. Implement.",
  );
  await expect(page.locator(".home-connect-stage strong")).toHaveText([
    "Assess",
    "Identify",
    "Implement",
  ]);
  // Why Alchemize no longer restates the methodology; it explains the four
  // roles (advice vs. implementation) and three connected-business examples
  await page.goto("/why-alchemize");
  await expect(page.locator(".why-approach-steps h3")).toHaveText([
    "Advisory",
    "Operations",
    "Administrative support",
    "Digital",
  ]);
  await expect(page.locator(".why-sequence li")).toHaveCount(3);
});

test("specialised workflows are labelled as theirs, not as the company methodology", async ({
  page,
}) => {
  await page.goto("/web-digital");
  await expect(page.locator(".webx-process .eyebrow")).toHaveText(
    "Web project workflow",
  );
  await expect(page.locator(".webx-process-grid article h3")).toHaveText([
    "Discover",
    "Scope",
    "Design",
    "Build",
    "Review",
    "Launch",
  ]);
  await page.goto("/resources");
  await expect(
    page.getByRole("heading", { name: "Follow the preparation journey." }),
  ).toBeVisible();
  await page.goto("/services/businesses/advisory-optimization");
  await expect(
    page.locator(".editorial-service-specific-heading .eyebrow"),
  ).toHaveText("How this service works");
});

test("contact form options use canonical service names", async ({ page }) => {
  await page.goto("/contact");
  const business = page.locator('optgroup[label="Business Services"] option');
  await expect(business).toHaveText([
    "Business Foundation",
    "Business Advisory",
    "Operations & Administration",
    "Tax & Financial Organization",
    "Bookkeeping",
    "Payroll",
    "Web & Digital Solutions",
  ]);
});

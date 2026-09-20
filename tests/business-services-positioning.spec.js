import { expect, test } from "@playwright/test";

// Business Services: canonical order, Services-page positioning copy and
// summaries. Individual Services and the service pages are unchanged.

const order = [
  "Business Foundation",
  "Business Advisory",
  "Operations & Administration",
  "Tax & Financial Organization",
  "Bookkeeping & Payroll Support",
  "Web & Digital Solutions",
];
const orderEs = [
  "Bases del negocio",
  "Asesoría empresarial",
  "Operaciones y administración",
  "Impuestos y organización financiera",
  "Apoyo en teneduría de libros y nómina",
  "Web y soluciones digitales",
];

test("Services page opens Business Services with the new positioning and nothing above the list", async ({
  page,
}) => {
  await page.goto("/services#businesses");
  const panel = page.locator("#businesses-panel");
  await expect(panel.locator(".services-catalog-intro h2")).toHaveText(
    "Build the business. Strengthen the systems behind it.",
  );
  await expect(panel.locator(".services-catalog-intro p")).toHaveText(
    "From establishing the foundation to improving operations, organizing financial responsibilities, and building the systems customers interact with, Alchemize connects business guidance with practical implementation.",
  );
  // no orientation paragraph: the panel is the intro and the list, only
  const inner = panel.locator(".services-catalog-inner > *");
  await expect(inner).toHaveCount(2);
  await expect(inner.nth(0)).toHaveClass(/services-catalog-intro/);
  await expect(inner.nth(1)).toHaveClass(/services-list/);
});

test("the six Business Services follow the canonical order with need-based summaries", async ({
  page,
}) => {
  await page.goto("/services#businesses");
  const panel = page.locator("#businesses-panel");
  await expect(panel.locator(".services-list > * h3")).toHaveText(order);

  const summary = (name) =>
    panel
      .locator(".services-list > *")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
  for (const [name, text] of [
    [
      "Business Foundation",
      "Starting, formalizing, or reorganizing a business? Assess the foundation, plan the next stage, and get the records in order.",
    ],
    [
      "Business Advisory",
      "Need clarity before making a business decision? Assess the situation, identify gaps, and establish practical priorities.",
    ],
    [
      "Operations & Administration",
      "When the work is harder than it should be. Improve workflows, systems, documentation, and the way work moves through the business.",
    ],
    [
      "Web & Digital Solutions",
      "Need technology to work as part of the business? Build and improve websites, visibility, automation, and connected digital systems.",
    ],
  ]) {
    await expect(summary(name).locator("p").first()).toHaveText(text);
  }
  // Tax & Financial Organization keeps its current scope and wording
  const tax = summary("Tax & Financial Organization");
  await expect(tax.locator("p").first()).toHaveText(
    "Need business tax records ready before filing season? Organize records, deadlines, and documents ahead of time.",
  );
  await expect(tax.locator("li")).toHaveText([
    "Business tax preparation",
    "Tax document organization",
    "Year-end tax readiness",
    "Estimated tax planning support",
  ]);
  // Bookkeeping & Payroll: parent descriptor, both services kept as children
  const group = panel.locator("#bookkeeping-payroll-support");
  await expect(group.locator(".service-group-descriptor")).toHaveText(
    "Need reliable books instead of financial catch-up? Recurring bookkeeping and payroll administration organized around the day-to-day needs of the business.",
  );
  await expect(group.locator(".service-child h4")).toHaveText([
    "Bookkeeping",
    "Payroll",
  ]);
  // destinations preserved
  await expect(summary("Web & Digital Solutions")).toHaveAttribute(
    "href",
    "/web-digital",
  );
});

test("every surface that consumes the taxonomy shows Business Services in the same order", async ({
  page,
}) => {
  // Services page
  await page.goto("/services#businesses");
  expect(
    await page
      .locator("#businesses-panel .services-list > * h3")
      .allTextContents(),
  ).toEqual(order);

  // Homepage discovery panel and footer
  await page.goto("/");
  expect(
    await page
      .locator(".home-path-grid article")
      .nth(1)
      .locator("li")
      .allTextContents(),
  ).toEqual(order);
  expect(
    await page
      .getByRole("contentinfo")
      .locator(".footer-group")
      .nth(1)
      .locator("a")
      .allTextContents(),
  ).toEqual(order);

  // Why Alchemize pathway
  await page.goto("/why-alchemize");
  expect(
    await page
      .locator(".why-pathway--businesses .why-pathway-stage")
      .allTextContents(),
  ).toEqual(order);

  // Contact form: bookkeeping and payroll are separate options, in category order
  await page.goto("/contact");
  await page.selectOption("#audience", "business");
  expect(
    await page
      .locator("#service option")
      .evaluateAll((o) => o.map((x) => x.value).filter(Boolean)),
  ).toEqual([
    "business-readiness",
    "business-advisory",
    "business-operations",
    "business-financial",
    "business-bookkeeping",
    "business-payroll",
    "business-digital",
  ]);
});

test("Spanish uses the same order, structure and positioning", async ({
  page,
}) => {
  await page.goto("/es/services#businesses");
  const panel = page.locator("#businesses-panel");
  await expect(panel.locator(".services-list > * h3")).toHaveText(orderEs);
  await expect(panel.locator(".services-catalog-intro h2")).toHaveText(
    "Construya el negocio. Fortalezca los sistemas que lo respaldan.",
  );
  await expect(panel.locator(".service-group-descriptor")).toHaveCount(1);
  await expect(panel.locator(".service-child h4")).toHaveCount(2);
  await page.goto("/es");
  expect(
    await page
      .getByRole("contentinfo")
      .locator(".footer-group")
      .nth(1)
      .locator("a")
      .allTextContents(),
  ).toEqual(orderEs);
});

test("Individual Services and the service pages are unchanged", async ({
  page,
}) => {
  await page.goto("/services");
  const panel = page.locator("#individuals-panel");
  await expect(panel.locator(".services-catalog-intro h2")).toHaveText(
    "Support for the responsibilities that affect you and your family.",
  );
  await expect(panel.locator(".services-list > * h3")).toHaveText([
    "Tax Preparation",
    "Notary & Document Services",
    "Translation & Apostille Support",
    "Digital Support",
  ]);
  await expect(panel.locator(".service-group-descriptor")).toHaveCount(0);
  await expect(
    panel.locator("a.service-row").first().locator("p").first(),
  ).toHaveText(
    "Need a return prepared without the last-minute document search? Organize records, confirm scope, and prepare the return.",
  );
  // the service pages keep their own statements (the summaries are Services-page only)
  await page.goto("/services/businesses/readiness-growth");
  await expect(page.locator(".editorial-service-context")).toContainText(
    "Prepare the business for formation, organized operations, strategic planning, and the next stage of growth.",
  );
  await page.goto("/services/businesses/advisory-optimization");
  await expect(page.locator(".editorial-service-context")).toContainText(
    "Identify what is not working, what is slowing the business down, and what should happen next.",
  );
});

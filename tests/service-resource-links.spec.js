import { expect, test } from "@playwright/test";

// SERVICE -> RESOURCE -> FILE. Every service page links to the PDF that
// actually exists for it, in the visitor's language, and never shows an
// "In development" placeholder.
const serviceResources = [
  ["individuals/tax-preparation", "individual-tax-preparation-organizer"],
  ["individuals/notary-document-services", "consultation-preparation-workbook"],
  ["individuals/translation-services", "consultation-preparation-workbook"],
  ["individuals/apostille-services", "consultation-preparation-workbook"],
  ["businesses/advisory-optimization", "consultation-preparation-workbook"],
  [
    "businesses/operations-implementation",
    "business-operations-systems-workbook",
  ],
  ["businesses/readiness-growth", "business-startup-formation-workbook"],
  [
    "businesses/bookkeeping-financial-reporting",
    "business-tax-preparation-organizer",
  ],
  ["businesses/payroll-processing", "business-tax-preparation-organizer"],
  ["businesses/business-tax-support", "business-tax-preparation-organizer"],
];

for (const [locale, prefix, suffix, label] of [
  ["en", "", ".pdf", "Download PDF"],
  ["es", "/es", "-es.pdf", "Descargar PDF"],
]) {
  for (const [service, file] of serviceResources) {
    test(`${locale}: ${service} links to ${file}${suffix}`, async ({
      page,
      request,
    }) => {
      await page.goto(`${prefix}/services/${service}`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("body")).not.toContainText(
        /in development|en desarrollo/i,
      );

      const href = `/assets/downloads/${locale === "es" ? "es/" : ""}${file}${suffix}`;
      const link = page.locator(`a[href="${href}"]`).first();
      await expect(link).toBeVisible();
      await expect(link).toContainText(label);

      const response = await request.get(href);
      expect(response.status()).toBe(200);
      expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
    });
  }
}

test("only the two articles that are PDFs offer a download", async ({
  page,
}) => {
  for (const [slug, file] of [
    ["preparing-for-tax-season", "individual-tax-preparation-organizer.pdf"],
    [
      "starting-a-business-organization-checklist",
      "business-startup-formation-workbook.pdf",
    ],
  ]) {
    await page.goto(`/resources/${slug}`);
    await expect(
      page.locator(`a[href="/assets/downloads/${file}"]`),
    ).toHaveCount(1);
  }
  await page.goto("/resources/tax-records-what-to-keep");
  await expect(page.locator('a[href$=".pdf"]')).toHaveCount(0);
});

test("homepage PDF card says download; article cards still say read", async ({
  page,
}) => {
  await page.goto("/");
  const pdfCard = page.locator('a[href$=".pdf"].home-resource-card-link');
  await expect(pdfCard).toContainText("Download the workbook");
  await expect(pdfCard).not.toContainText("Read the guide");
  await expect(
    page.locator('a[href^="/resources/"].home-resource-card-link').first(),
  ).toContainText("Read the guide");
});

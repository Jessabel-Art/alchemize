import { expect, test } from "@playwright/test";

const capabilityTargets = [
  ["Advisory & Optimization", "advisory-optimization"],
  ["Operations & Implementation", "operations-implementation"],
  ["Digital Business & Technology", "digital-business-technology"],
  ["Business Readiness & Growth", "readiness-growth"],
  ["Business Tax Support", "business-tax-support"],
];

const resourceFiles = [
  "alchemize-preparing-for-tax-season.pdf",
  "alchemize-starting-a-business-organization-checklist.pdf",
  "alchemize-consultation-document-checklist.pdf",
];

test("homepage capability rows reach their matching business service families", async ({
  page,
}) => {
  for (const [label, target] of capabilityTargets) {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: `Explore ${label}` }).click();
    await expect(page).toHaveURL(
      new RegExp(`/services/businesses/${target}/?$`),
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("homepage resource links deliver branded PDF files", async ({
  page,
  request,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("link", { name: "Explore All Resources" }),
  ).toHaveAttribute("href", "/resources");

  for (const filename of resourceFiles) {
    const link = page.locator(`a[href$="${filename}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("target", "_blank");
    const response = await request.get(`/assets/downloads/${filename}`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect((await response.body()).length).toBeGreaterThan(10000);
  }
});

test("homepage refinement remains composed without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  for (const width of [1440, 1024, 768, 430, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(".home-connect-process")).toBeVisible();
    await expect(page.locator(".home-resource-list a")).toHaveCount(3);
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

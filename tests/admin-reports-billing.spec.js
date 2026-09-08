import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const apiRoute = new URL(route.request().url()).searchParams.get("route");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data:
          apiRoute === "auth/session"
            ? {
                authenticated: true,
                user: { user_id: 1, role_slug: "owner-admin" },
                csrf_token: "ui-test",
              }
            : apiRoute === "leads"
              ? [
                  {
                    id: 8,
                    full_name: "Cedar Services",
                    email: "cedar@example.test",
                    status: "new",
                    created_at: new Date().toISOString(),
                  },
                ]
              : [],
      }),
    });
  });
});

test("Reports presets, results and reset have explicit states", async ({
  page,
}) => {
  await page.goto("/admin/reports/");
  await expect(page.getByText("Your report starts here")).toBeVisible();
  const preset = page.getByRole("button", {
    name: "Leads This Month",
    exact: true,
  });
  await preset.click();
  await expect(preset).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Run Report", exact: true }).click();
  await expect(page.locator(".report-results-card")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await expect(page.getByRole("button", { name: "CSV Export" })).toBeVisible();
  await expect(page.locator(".report-result-meta")).toContainText("records");
  await expect(page.locator(".report-table")).toContainText("Cedar Services");
  await page.screenshot({
    path: "test-results/reports-refinement.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reset Report" }).click();
  await expect(preset).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("Your report starts here")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save report unavailable" }),
  ).toBeDisabled();
});

for (const width of [1440, 1024, 768]) {
  test(`Billing creation and line totals at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/admin/billing/");
    await page
      .getByRole("button", { name: "+ Create Invoice", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Create invoice" });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    const row = dialog.locator(".invoice-line-row").first();
    await row.getByLabel("Quantity", { exact: true }).fill("2");
    await row.getByLabel("Rate", { exact: true }).fill("125");
    await expect(row.getByLabel("Line total", { exact: true })).toHaveValue(
      "250",
    );
    await expect(dialog.locator(".payment-totals-box")).toContainText("$250");
    await dialog.getByRole("button", { name: "+ Add Line Item" }).click();
    await expect(dialog.locator(".invoice-line-row")).toHaveCount(2);
    await dialog
      .getByRole("button", { name: "Remove", exact: true })
      .last()
      .click();
    await expect(dialog.locator(".invoice-line-row")).toHaveCount(1);
    await expect(
      dialog.getByRole("button", { name: "Save draft" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Issue invoice" }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/billing-create-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
}

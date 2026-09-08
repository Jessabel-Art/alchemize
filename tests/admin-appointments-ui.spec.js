import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const key = new URL(route.request().url()).searchParams.get("route");
    const today = new Date().toLocaleDateString("en-CA");
    const records = {
      "auth/session": {
        authenticated: true,
        user: { user_id: 1, role_slug: "owner-admin" },
        csrf_token: "ui-test",
      },
      clients: [{ id: 1, display_name: "Cedar Studio", status: "active" }],
      appointments: [
        {
          id: 9,
          client_id: 1,
          appointment_type: "Consultation",
          scheduled_at: `${today} 10:00:00`,
          duration_minutes: 60,
          status: "scheduled",
          location_type: "virtual",
          internal_notes: "Review the planning notes.",
        },
      ],
    };
    await route.fulfill({ json: { data: records[key] || [] } });
  });
});

for (const width of [1440, 1024, 768]) {
  test(`Appointments calendar and detail at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/admin/appointments/");
    const switcher = page.locator(".scheduler-view-switcher");
    await expect(
      switcher.getByRole("button", { name: "Month", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".month-grid")).toBeVisible();
    await page.locator(".calendar-event").first().click();
    await expect(page.locator(".calendar-event").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".scheduler-modal-backdrop")).toHaveCount(0);
    const detail = page.getByRole("complementary", {
      name: "Appointment detail",
    });
    await expect(detail).toContainText("Cedar Studio");
    await expect(detail).toContainText("Preparation required");
    for (const action of [
      "Edit details",
      "Reschedule",
      "Cancel",
      "Mark Confirmed",
      "Mark Completed",
    ]) {
      await expect(
        detail.getByRole("button", { name: action, exact: true }),
      ).toBeVisible();
    }
    await expect(page.locator('[aria-current="date"]')).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/appointments-${width}.png`,
      fullPage: true,
    });
    for (const [name, selector] of [
      ["Week", ".week-schedule"],
      ["Day", ".day-schedule"],
      ["Agenda", ".agenda-schedule"],
      ["Month", ".month-grid"],
    ]) {
      await switcher.getByRole("button", { name, exact: true }).click();
      await expect(
        switcher.getByRole("button", { name, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(selector)).toBeVisible();
      await expect(switcher.locator('[aria-pressed="true"]')).toHaveCount(1);
    }
  });
}

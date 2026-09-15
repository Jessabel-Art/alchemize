import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const key = new URL(route.request().url()).searchParams.get("route");
    let data = [];
    if (key === "auth/session")
      data = {
        authenticated: true,
        user: { user_id: 1, role_slug: "owner-admin" },
        csrf_token: "availability-test-token",
      };
    if (key === "settings") data = { timezone: "America/New_York" };
    await route.fulfill({ json: { data } });
  });
});

async function openException(page) {
  await page.goto("/admin/appointments/");
  await page
    .getByRole("button", { name: "Availability Exceptions", exact: true })
    .click();
  const modal = page.locator(".scheduler-modal");
  await modal.getByLabel("Exception Type").selectOption("blocked_time");
  await modal.getByLabel("Date", { exact: true }).fill("2026-09-17");
  await modal.getByLabel("Start Time", { exact: true }).fill("08:00");
  await modal.getByLabel("End Time", { exact: true }).fill("17:00");
  await modal.getByLabel("Timezone").fill("America/New_York");
  await modal.getByLabel("Notes").fill("test");
  return modal;
}

test("blocked exception sends populated canonical times and reloads saved values", async ({
  page,
}) => {
  const records = [];
  await page.route(
    "**/alchemize-api.php?route=appointments%2Favailability",
    async (route) => {
      if (route.request().method() === "POST") {
        const payload = route.request().postDataJSON();
        expect(payload).toMatchObject({
          kind: "blocked",
          date_override: "2026-09-17",
          start_time: "08:00",
          end_time: "17:00",
          timezone: "America/New_York",
          notes: "test",
        });
        records.push({ ...payload, id: 71 });
        await route.fulfill({
          status: 201,
          json: { data: { id: 71, created: true } },
        });
      } else await route.fulfill({ json: { data: records } });
    },
  );
  let modal = await openException(page);
  await modal
    .getByRole("button", { name: "Save exception", exact: true })
    .click();
  await expect(
    modal.getByRole("row").filter({ hasText: "test" }),
  ).toContainText("8:00 AM");
  expect(records).toHaveLength(1);
  await expect(modal).not.toContainText("start and end times are required");
  await page.reload();
  await page
    .getByRole("button", { name: "Availability Exceptions", exact: true })
    .click();
  modal = page.locator(".scheduler-modal");
  await modal
    .getByRole("row")
    .filter({ hasText: "test" })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await expect(modal.getByLabel("Start Time", { exact: true })).toHaveValue(
    "08:00",
  );
  await expect(modal.getByLabel("End Time", { exact: true })).toHaveValue(
    "17:00",
  );
  await expect(modal.getByLabel("Date", { exact: true })).toHaveValue(
    "2026-09-17",
  );
  await expect(modal.getByLabel("Timezone")).toHaveValue("America/New_York");
});

for (const [field, value, error] of [
  [
    "Start Time",
    "",
    "Start and end times are required for this exception type.",
  ],
  ["End Time", "", "Start and end times are required for this exception type."],
  ["End Time", "08:00", "End time must be after start time."],
  ["End Time", "07:00", "End time must be after start time."],
]) {
  test(`${field}=${value || "missing"} prevents submission`, async ({
    page,
  }) => {
    let writes = 0;
    page.on("request", (request) => {
      if (request.method() === "POST") writes++;
    });
    const modal = await openException(page);
    await modal.getByLabel(field, { exact: true }).fill(value);
    await modal
      .getByRole("button", { name: "Save exception", exact: true })
      .click();
    await expect(modal).toContainText(error);
    expect(writes).toBe(0);
  });
}

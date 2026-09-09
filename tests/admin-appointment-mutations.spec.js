import { test, expect } from "@playwright/test";

let records, writes;
const date = (offset = 1) => {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  return day.toLocaleDateString("en-CA");
};
test.beforeEach(async ({ page }) => {
  writes = [];
  records = [
    {
      id: 9,
      public_id: "appointment-9",
      client_id: 1,
      engagement_id: 3,
      service_id: 2,
      appointment_type: "consultation",
      scheduled_at: `${date()} 10:00:00`,
      end_at: `${date()} 11:00:00`,
      timezone: "America/New_York",
      duration_minutes: 60,
      status: "confirmed",
      meeting_method: "phone",
      location_type: "virtual",
      internal_notes: "Original notes",
      follow_up_required: 1,
      preparation_required: 1,
    },
  ];
  await page.route("**/alchemize-api.php?*", async (route) => {
    const request = route.request();
    const key = new URL(request.url()).searchParams.get("route");
    let data = [];
    if (key === "auth/session")
      data = {
        authenticated: true,
        user: { user_id: 1, role_slug: "owner-admin" },
        csrf_token: "appointment-test-token",
      };
    if (key === "clients")
      data = [
        {
          id: 1,
          display_name: "Cedar Studio",
          status: "active",
          primary_email: "cedar@example.test",
        },
      ];
    if (key === "services")
      data = [
        {
          id: 2,
          service_name: "Advisory",
          catalog_status: "ACTIVE",
          active_flag: 1,
        },
      ];
    if (key === "settings")
      data = { timezone: "America/New_York", appointment_default_duration: 60 };
    if (key === "appointments" && request.method() === "GET") data = records;
    if (key === "appointments" && request.method() === "POST") {
      const payload = request.postDataJSON();
      writes.push({ key, method: request.method(), payload });
      expect(request.headers()["x-csrf-token"]).toBe("appointment-test-token");
      const row = {
        ...payload,
        id: 10,
        public_id: "appointment-10",
        calendar_sync_status: "synchronized",
      };
      records.push(row);
      await route.fulfill({
        status: 201,
        json: {
          data: {
            id: row.id,
            appointment: row,
            calendar_sync: "synchronized",
            email_delivery: "sent",
          },
        },
      });
      return;
    }
    if (key === "appointments/9" && request.method() === "PUT") {
      const payload = request.postDataJSON();
      writes.push({ key, method: request.method(), payload });
      expect(request.headers()["x-csrf-token"]).toBe("appointment-test-token");
      expect(
        !payload.status ||
          [
            "requested",
            "scheduled",
            "confirmed",
            "completed",
            "cancelled",
          ].includes(payload.status),
      ).toBe(true);
      records[0] = {
        ...records[0],
        ...payload,
        calendar_sync_status: "synchronized",
      };
      data = records[0];
    }
    await route.fulfill({ json: { data } });
  });
});
const detail = (page) =>
  page.getByRole("complementary", { name: "Appointment detail" });
const modal = (page) => page.locator(".scheduler-modal");

test("create uses POST and displays saved values after refresh", async ({
  page,
}) => {
  records = [];
  await page.goto("/admin/appointments/");
  await page
    .getByRole("button", { name: "+ Schedule Appointment", exact: true })
    .click();
  await modal(page).getByLabel("Client", { exact: true }).selectOption("1");
  await modal(page).getByLabel("Date", { exact: true }).fill(date());
  await modal(page).getByLabel("Start time", { exact: true }).fill("14:00");
  await modal(page).getByLabel("Duration", { exact: true }).fill("75");
  await modal(page)
    .getByLabel("Status", { exact: true })
    .selectOption("Confirmed");
  await modal(page)
    .getByLabel("Internal notes", { exact: true })
    .fill("Creation notes");
  await modal(page)
    .getByRole("button", { name: "Create Appointment", exact: true })
    .click();
  await expect(modal(page)).toHaveCount(0);
  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatchObject({
    key: "appointments",
    method: "POST",
    payload: {
      client_id: 1,
      scheduled_at: `${date()} 14:00:00`,
      duration_minutes: 75,
      status: "confirmed",
      meeting_method: "phone",
    },
  });
  await page.reload();
  await expect(detail(page)).toContainText("Creation notes");
  expect(records).toHaveLength(1);
});
for (const action of ["Edit details", "Reschedule"]) {
  test(`${action} persists all exposed values without duplication`, async ({
    page,
  }) => {
    await page.goto("/admin/appointments/");
    await detail(page)
      .getByRole("button", { name: action, exact: true })
      .click();
    await modal(page).getByLabel("Date", { exact: true }).fill(date(2));
    await modal(page).getByLabel("Start time", { exact: true }).fill("13:30");
    await modal(page).getByLabel("Duration", { exact: true }).fill("90");
    await modal(page)
      .getByLabel("Meeting method", { exact: true })
      .selectOption("Google Meet");
    await modal(page)
      .getByLabel("Internal notes", { exact: true })
      .fill("Updated notes");
    await modal(page)
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(modal(page)).toHaveCount(0);
    expect(writes[0]).toMatchObject({
      key: "appointments/9",
      method: "PUT",
      payload: {
        scheduled_at: `${date(2)} 13:30:00`,
        duration_minutes: 90,
        meeting_method: "google_meet",
        status: "confirmed",
        engagement_id: 3,
        timezone: "America/New_York",
      },
    });
    await page.reload();
    await expect(detail(page)).toContainText("Updated notes");
    await detail(page)
      .getByRole("button", { name: action, exact: true })
      .click();
    await expect(
      modal(page).getByLabel("Duration", { exact: true }),
    ).toHaveValue("90");
    await expect(modal(page).getByLabel("Date", { exact: true })).toHaveValue(
      date(2),
    );
    await expect(
      modal(page).getByLabel("Start time", { exact: true }),
    ).toHaveValue("13:30");
    expect(records).toHaveLength(1);
    expect(writes).toHaveLength(1);
  });
}
test("Confirm Cancellation persists cancelled state after refresh", async ({
  page,
}) => {
  await page.goto("/admin/appointments/");
  await detail(page)
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await modal(page)
    .getByRole("button", { name: "Confirm Cancellation", exact: true })
    .click();
  await expect(modal(page)).toHaveCount(0);
  expect(writes[0].payload).toEqual({
    status: "cancelled",
    cancellation_reason: "Client requested",
  });
  await page.reload();
  await expect(detail(page)).toContainText("Cancelled");
  expect(records).toHaveLength(1);
});
test("follow-up completion clears the persisted flag without changing status", async ({
  page,
}) => {
  await page.goto("/admin/appointments/");
  await detail(page)
    .getByRole("button", { name: "Mark Follow-Up Complete" })
    .click();
  await expect(
    detail(page).getByRole("button", { name: "Mark Follow-Up Complete" }),
  ).toHaveCount(0);
  expect(writes[0].payload).toEqual({ follow_up_required: false });
  await page.reload();
  await expect(
    detail(page).getByRole("button", { name: "Mark Follow-Up Complete" }),
  ).toHaveCount(0);
  await expect(detail(page)).toContainText("Confirmed");
  expect(records).toHaveLength(1);
});

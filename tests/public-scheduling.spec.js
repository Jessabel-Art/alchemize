import { expect, test } from "@playwright/test";

const token = "valid-public-token";

test("public scheduling route resolves without authentication and loads context", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const requestUrl = new URL(route.request().url());
    const apiRoute = requestUrl.searchParams.get("route");
    if (apiRoute === `appointments/scheduling-links/${token}`) {
      return route.fulfill({
        json: {
          data: {
            recipient_name: "Jordan",
            recipient_email: "jordan@example.com",
            appointment_type: "Consultation",
            meeting_method: "google_meet",
            duration_minutes: 60,
            timezone: "America/New_York",
          },
        },
      });
    }
    return route.fulfill({
      status: 404,
      json: { error: { message: "Not found" } },
    });
  });
  await page.goto(`/appointment/schedule/${token}`);
  await expect(
    page.getByRole("heading", { name: "Select an appointment time." }),
  ).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveValue(
    "jordan@example.com",
  );
  await expect(page).not.toHaveURL(/login/);
});

test("invalid public scheduling token renders a safe rejection", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?*", (route) =>
    route.fulfill({
      status: 404,
      json: {
        error: {
          code: "INVALID_SCHEDULING_LINK",
          message:
            "This scheduling link is invalid, expired, revoked, or no longer available.",
        },
      },
    }),
  );
  await page.goto("/appointment/schedule/invalid-token");
  await expect(
    page.getByRole("heading", { name: "Scheduling link unavailable" }),
  ).toBeVisible();
});

test("public scheduler uses backend slots and books the selected time", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const requestUrl = new URL(route.request().url());
    const apiRoute = requestUrl.searchParams.get("route");
    if (apiRoute === `appointments/scheduling-links/${token}`)
      return route.fulfill({
        json: {
          data: {
            recipient_name: "Jordan",
            recipient_email: "jordan@example.com",
            appointment_type: "Consultation",
            meeting_method: "phone",
            duration_minutes: 60,
            timezone: "America/New_York",
          },
        },
      });
    if (apiRoute?.endsWith("/availability"))
      return route.fulfill({
        json: {
          data: {
            slots: [
              {
                start: "2030-09-10T10:00:00-04:00",
                end: "2030-09-10T11:00:00-04:00",
                label: "10:00 AM",
              },
            ],
          },
        },
      });
    if (apiRoute?.endsWith("/book"))
      return route.fulfill({
        status: 201,
        json: {
          data: {
            appointment_created: true,
            calendar_sync: "synchronized",
            email_delivery: "sent",
            appointment: {
              type: "Consultation",
              start: "2030-09-10T10:00:00-04:00",
              timezone: "America/New_York",
            },
          },
        },
      });
    return route.abort();
  });
  await page.goto(`/appointment/schedule/${token}`);
  await page.locator('input[type="date"]').fill("2030-09-10");
  await page.getByRole("button", { name: "10:00 AM" }).click();
  await page.getByRole("button", { name: "Confirm Appointment" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re scheduled with Alchemize." }),
  ).toBeVisible();
});

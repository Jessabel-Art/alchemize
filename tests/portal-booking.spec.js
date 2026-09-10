import { test, expect } from "@playwright/test";

async function setup(
  page,
  { calendarFail = false, occupied = false, services = null } = {},
) {
  const requests = [];
  let attempts = 0;
  const types = [
    { key: "follow_up", label: "Follow-up appointment", duration_minutes: 30 },
    { key: "service_review", label: "Service review", duration_minutes: 30 },
    {
      key: "document_review",
      label: "Document / information review",
      duration_minutes: 30,
    },
    {
      key: "consultation",
      label: "General consultation",
      duration_minutes: 75,
    },
  ];
  const config = {
    services: services ?? [{ id: "own", title: "Business Consulting" }],
    types,
    methods: [
      { key: "phone", label: "Phone" },
      { key: "google_meet", label: "Virtual (Google Meet)" },
    ],
    default_method: "phone",
    timezone: "America/New_York",
    can_book: true,
  };
  const items = [
    {
      id: "past",
      appointment_type: "Service review",
      engagement_title: "Business Consulting",
      status: "completed",
      scheduled_start: "2020-09-03T10:00:00-04:00",
      timezone: config.timezone,
      duration_minutes: 30,
      meeting_method: "phone",
    },
    {
      id: "cancelled",
      appointment_type: "General consultation",
      status: "cancelled",
      scheduled_start: "2020-09-04T10:00:00-04:00",
      timezone: config.timezone,
    },
  ];
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const path = url.searchParams.get("route");
    let data = {};
    if (path === "auth/session")
      data = {
        authenticated: true,
        user: { role_slug: "client" },
        csrf_token: "csrf",
      };
    if (path === "portal/appointments/booking") data = config;
    if (path === "portal/appointments") data = { items };
    if (path === "portal/services") data = { items: [] };
    if (path?.endsWith("/availability")) {
      requests.push({
        path,
        date: url.searchParams.get("date"),
        type: url.searchParams.get("type"),
        engagement_id: url.searchParams.get("engagement_id"),
        meeting_method: url.searchParams.get("meeting_method"),
      });
      const date = url.searchParams.get("date");
      data = {
        slots: [
          {
            start: date + "T10:00:00-04:00",
            end: date + "T10:30:00-04:00",
            label: "10:00 AM",
          },
        ],
        timezone: config.timezone,
      };
    }
    if (path === "portal/appointments/book") {
      const body = route.request().postDataJSON();
      requests.push({
        path,
        body,
        csrf: route.request().headers()["x-csrf-token"],
      });
      attempts++;
      if (attempts === 1 && (calendarFail || occupied)) {
        await route.fulfill({
          status: calendarFail ? 503 : 409,
          json: {
            error: {
              code: calendarFail ? "CALENDAR_UNAVAILABLE" : "SLOT_UNAVAILABLE",
              message: calendarFail
                ? "Calendar confirmation failed. Retry this booking."
                : "That time was just booked. Please choose another available time.",
            },
          },
        });
        return;
      }
      if (!items.some((item) => item.id === "new"))
        items.push({
          id: "new",
          appointment_type: "Follow-up appointment",
          engagement_id: "own",
          engagement_title: "Business Consulting",
          status: "confirmed",
          scheduled_start: body.selected_start,
          scheduled_end: body.selected_start.replace("10:00", "10:30"),
          duration_minutes: 30,
          timezone: config.timezone,
          meeting_method: body.meeting_method,
        });
      data = { id: "new", status: "confirmed" };
    }
    if (
      path?.includes("request-reschedule") ||
      path?.includes("request-cancellation") ||
      path?.endsWith("/confirm")
    ) {
      requests.push({ path, body: route.request().postDataJSON() });
      data = { status: "confirmed" };
    }
    if (path === "portal/appointments/request") {
      requests.push({ path, body: route.request().postDataJSON() });
      data = { status: "requested" };
    }
    await route.fulfill({ json: { data } });
  });
  return { requests, items };
}

// The booking calendar always opens on the current month, so tests select a
// date in the following month (one deterministic "Next month" click) rather
// than depending on the real-world date to land on a specific visible day.
function nextMonthDate(day = 10) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return {
    label: target.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

async function choose(page, scope = page) {
  const { label } = nextMonthDate(10);
  await scope.getByRole("button", { name: "Next month" }).click();
  await scope.getByRole("button", { name: label, exact: true }).click();
  await scope.getByRole("button", { name: "10:00 AM", exact: true }).click();
}

test("active service, server duration, slots, booking, upcoming and history", async ({
  page,
}) => {
  const { requests } = await setup(page);
  await page.goto("/client-portal/appointments?engagement=own");
  await expect(page.getByLabel("Related service")).toHaveValue("own");
  await expect(
    page.getByRole("radio", { name: "Follow-up appointment" }),
  ).toBeChecked();
  await expect(
    page
      .locator(".appt-type-card")
      .filter({ hasText: "Follow-up appointment" })
      .getByText("30 minutes", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".appt-type-card")
    .filter({ hasText: "General consultation" })
    .click();
  await expect(
    page
      .locator(".appt-type-card")
      .filter({ hasText: "General consultation" })
      .getByText("75 minutes", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".appt-type-card")
    .filter({ hasText: "Follow-up appointment" })
    .click();
  await expect(
    page.getByText("No upcoming appointments.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Past appointments" }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Select a date" }),
  ).toBeVisible();
  await choose(page);
  await page.getByRole("button", { name: "Review appointment" }).click();
  await expect(
    page.getByText("Confirm your appointment", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(
    page.getByText("Your appointment is confirmed.", { exact: true }),
  ).toBeVisible();
  const booking = requests.find((item) => item.path.endsWith("/book"));
  expect(booking.body.engagement_id).toBe("own");
  expect(booking.body).not.toHaveProperty("duration_minutes");
  expect(booking.csrf).toBe("csrf");
  await expect(
    page
      .locator(".appointment-row")
      .filter({ hasText: "Follow-up appointment" }),
  ).toBeVisible();
});

test("general (non-service-specific) availability sends an empty engagement_id and still returns slots", async ({
  page,
}) => {
  const { requests } = await setup(page, {
    services: [
      { id: "own", title: "Business Consulting" },
      { id: "other", title: "Website Maintenance" },
    ],
  });
  await page.goto("/client-portal/appointments");
  // With more than one service, nothing is auto-selected — "General /
  // Not service-specific" is the real default a client sees.
  await expect(page.getByLabel("Related service")).toHaveValue("");
  await choose(page);
  const availabilityRequests = requests.filter((item) =>
    item.path.endsWith("/availability"),
  );
  expect(availabilityRequests.length).toBeGreaterThan(0);
  for (const request of availabilityRequests) {
    expect(request.engagement_id).toBe("");
  }
  await expect(
    page.getByRole("button", { name: "Review appointment" }),
  ).toBeEnabled();
});

test("selecting a meeting method is reflected in the availability request", async ({
  page,
}) => {
  const { requests } = await setup(page);
  await page.goto("/client-portal/appointments?engagement=own");
  await expect(page.getByLabel("Related service")).toHaveValue("own");
  await page.getByLabel("Meeting method").selectOption("google_meet");
  await choose(page);
  const availabilityRequests = requests.filter((item) =>
    item.path.endsWith("/availability"),
  );
  expect(availabilityRequests.length).toBeGreaterThan(0);
  expect(
    availabilityRequests[availabilityRequests.length - 1].meeting_method,
  ).toBe("google_meet");
});

test("calendar retry reuses booking key and does not claim success", async ({
  page,
}) => {
  const { requests } = await setup(page, { calendarFail: true });
  await page.goto("/client-portal/appointments");
  await choose(page);
  await page.getByRole("button", { name: "Review appointment" }).click();
  await page
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Calendar confirmation failed",
  );
  await expect(page.getByText("Your appointment is confirmed.")).toHaveCount(0);
  await page.getByRole("button", { name: "Retry this booking" }).click();
  await expect(page.getByText("Your appointment is confirmed.")).toBeVisible();
  const bookings = requests.filter((item) => item.path.endsWith("/book"));
  expect(bookings).toHaveLength(2);
  expect(bookings[0].body.booking_key).toBe(bookings[1].body.booking_key);
});

test("occupied-slot rejection returns to refreshed availability", async ({
  page,
}) => {
  const { requests } = await setup(page, { occupied: true });
  await page.goto("/client-portal/appointments");
  await choose(page);
  await page.getByRole("button", { name: "Review appointment" }).click();
  const before = requests.filter((item) =>
    item.path.endsWith("availability"),
  ).length;
  await page
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("just booked");
  await expect(
    page.getByRole("group", { name: "Select a date" }),
  ).toBeVisible();
  await expect
    .poll(
      () =>
        requests.filter((item) => item.path.endsWith("availability")).length,
    )
    .toBeGreaterThan(before);
});

test("details, reschedule availability, and cancellation request confirmation", async ({
  page,
}) => {
  const { items, requests } = await setup(page);
  items.push({
    id: "future",
    appointment_type: "Follow-up appointment",
    engagement_id: "own",
    engagement_title: "Business Consulting",
    scheduled_start: "2030-09-09T10:00:00-04:00",
    timezone: "America/New_York",
    status: "confirmed",
    duration_minutes: 30,
    meeting_method: "google_meet",
    meeting_url: "https://meet.google.com/example",
  });
  await page.goto("/client-portal/appointments?appointment=future");
  await expect(page.getByRole("link", { name: "Join meeting" })).toBeVisible();
  const row = page
    .locator("article.appointment-row")
    .filter({ hasText: "Follow-up appointment" })
    .filter({ hasText: "Business Consulting" });
  await row.getByRole("button", { name: "Reschedule", exact: true }).click();
  const details = row.locator(".appointment-details");
  await choose(page, details);
  await details
    .getByRole("button", { name: "Send reschedule request" })
    .click();
  await expect(row.getByRole("status")).toContainText("remains unchanged");
  expect(
    requests.some(
      (item) => item.path === "portal/appointments/future/availability",
    ),
  ).toBe(true);
  await row.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    row.getByRole("button", { name: "Keep appointment" }),
  ).toBeVisible();
  expect(
    requests.some((item) => item.path.endsWith("request-cancellation")),
  ).toBe(false);
  await row.getByRole("button", { name: "Send cancellation request" }).click();
  await expect
    .poll(() =>
      requests.some((item) => item.path.endsWith("request-cancellation")),
    )
    .toBe(true);
});

test("appointment-specific availability for another client's appointment is rejected, not silently treated as success", async ({
  page,
}) => {
  const { items } = await setup(page);
  items.push({
    id: "not-mine",
    appointment_type: "Follow-up appointment",
    engagement_id: "own",
    engagement_title: "Business Consulting",
    scheduled_start: "2030-09-09T10:00:00-04:00",
    timezone: "America/New_York",
    status: "confirmed",
    duration_minutes: 30,
    meeting_method: "phone",
  });
  await page.route(
    (url) =>
      url.searchParams.get("route") ===
      "portal/appointments/not-mine/availability",
    (route) =>
      route.fulfill({
        status: 404,
        json: {
          error: { code: "NOT_FOUND", message: "Appointment was not found." },
        },
      }),
  );
  await page.goto("/client-portal/appointments?appointment=not-mine");
  const row = page
    .locator("article.appointment-row")
    .filter({ hasText: "Follow-up appointment" });
  await row.getByRole("button", { name: "Reschedule", exact: true }).click();
  const details = row.locator(".appointment-details");
  await expect(
    details.getByText("Appointment was not found.", { exact: true }),
  ).toBeVisible();
  await expect(details.locator(".appointment-slots")).toHaveCount(0);
});

test("client can confirm an admin-requested pending appointment", async ({
  page,
}) => {
  const { items, requests } = await setup(page);
  items.push({
    id: "pending-one",
    appointment_type: "Follow-up appointment",
    engagement_id: "own",
    engagement_title: "Business Consulting",
    scheduled_start: "2030-09-09T10:00:00-04:00",
    timezone: "America/New_York",
    status: "requested",
    duration_minutes: 30,
    meeting_method: "phone",
  });
  await page.goto("/client-portal/appointments");
  const row = page
    .locator("article.appointment-row")
    .filter({ hasText: "Follow-up appointment" })
    .filter({ hasText: "Business Consulting" });
  await expect(row.getByText("Pending confirmation")).toBeVisible();
  await row.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(row.getByRole("status")).toContainText("Appointment confirmed.");
  expect(
    requests.some(
      (item) => item.path === "portal/appointments/pending-one/confirm",
    ),
  ).toBe(true);
});

for (const width of [1440, 834, 390])
  test(`booking responsive layout at ${width}px`, async ({ page }) => {
    await setup(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/client-portal/appointments");
    await expect(
      page.getByRole("radiogroup", { name: "Appointment type" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/portal-booking-${width}.png`,
      fullPage: true,
    });
  });

test("fallback only opens intentionally", async ({ page }) => {
  await setup(page);
  await page.goto("/client-portal/appointments");
  await page.getByRole("button", { name: "Request another time" }).click();
  await expect(page.locator('input[type="datetime-local"]')).toBeVisible();
});

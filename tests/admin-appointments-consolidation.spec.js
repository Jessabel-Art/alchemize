import { test, expect } from "@playwright/test";

// Focused coverage for the Blocked Time / Extended Availability
// consolidation and primary-calendar integration pass: the single
// "Blocked Time" exception type (all day vs specific hours), backward
// compatibility with legacy time_off/full_day/blocked records, calendar
// rendering of exceptions and appointment statuses, cancelled-appointment
// visibility rules, and booking-conflict safety warnings.

const dateStr = (offset = 0) => {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  return day.toLocaleDateString("en-CA");
};

function mockRoutes(
  page,
  { appointments = [], availability = [], writes = [] },
) {
  return page.route("**/alchemize-api.php?*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const key = url.searchParams.get("route");
    if (key === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "consolidation-test",
          },
        },
      });
    }
    if (key === "appointments" && request.method() === "GET") {
      return route.fulfill({ json: { data: appointments } });
    }
    if (key === "appointments/availability") {
      if (request.method() === "GET") {
        return route.fulfill({ json: { data: availability } });
      }
      if (request.method() === "POST") {
        const payload = request.postDataJSON();
        writes.push({ method: "POST", payload });
        const row = { ...payload, id: 900 + availability.length };
        availability.push(row);
        return route.fulfill({
          status: 201,
          json: { data: { id: row.id, created: true } },
        });
      }
    }
    if (key && key.startsWith("appointments/availability/")) {
      const id = key.split("/").pop();
      if (request.method() === "PATCH") {
        const payload = request.postDataJSON();
        writes.push({ method: "PATCH", id, payload });
        const index = availability.findIndex((row) => String(row.id) === id);
        if (index >= 0)
          availability[index] = { ...availability[index], ...payload };
        return route.fulfill({ json: { data: { updated: true } } });
      }
      if (request.method() === "DELETE") {
        writes.push({ method: "DELETE", id });
        return route.fulfill({ json: { data: { deleted: true } } });
      }
    }
    if (key && /^appointments\/\d+$/.test(key) && request.method() === "PUT") {
      const payload = request.postDataJSON();
      writes.push({ method: "PUT", key, payload });
      return route.fulfill({ json: { data: {} } });
    }
    if (key === "clients") {
      return route.fulfill({
        json: {
          data: [{ id: 1, display_name: "Jordan Rivera", status: "active" }],
        },
      });
    }
    await route.fulfill({ json: { data: [] } });
  });
}

const modal = (page) => page.locator(".scheduler-modal");

test.describe("Blocked Time: All day vs specific hours", () => {
  test("All day Blocked Time saves without times and persists as kind=time_off", async ({
    page,
  }) => {
    const writes = [];
    await mockRoutes(page, { writes });
    await page.goto("/admin/appointments/");
    await page
      .getByRole("button", { name: "Availability Exceptions", exact: true })
      .click();
    const dialog = modal(page);
    await dialog.getByLabel("Exception Type").selectOption("blocked_time");
    await dialog.getByLabel("Date", { exact: true }).fill(dateStr(3));
    await dialog.getByLabel("Notes", { exact: true }).fill("Full day out");
    await dialog.getByRole("checkbox", { name: "All day" }).check();
    await expect(dialog.getByLabel("Start Time", { exact: true })).toHaveCount(
      0,
    );
    await expect(dialog.getByLabel("End Time", { exact: true })).toHaveCount(0);
    await dialog
      .getByRole("button", { name: "Save exception", exact: true })
      .click();
    await expect(dialog).not.toContainText("Start and end times are required");
    expect(writes).toHaveLength(1);
    expect(writes[0].payload).toMatchObject({
      kind: "time_off",
      date_override: dateStr(3),
      start_time: "",
      end_time: "",
    });
    await expect(
      dialog.getByRole("row").filter({ hasText: "Full day out" }),
    ).toContainText("All day");
  });

  test("Partial Blocked Time still requires start and end times", async ({
    page,
  }) => {
    const writes = [];
    await mockRoutes(page, { writes });
    await page.goto("/admin/appointments/");
    await page
      .getByRole("button", { name: "Availability Exceptions", exact: true })
      .click();
    const dialog = modal(page);
    await dialog.getByLabel("Exception Type").selectOption("blocked_time");
    await dialog.getByLabel("Date", { exact: true }).fill(dateStr(3));
    await dialog.getByLabel("Start Time", { exact: true }).fill("");
    await dialog.getByLabel("End Time", { exact: true }).fill("");
    await dialog
      .getByRole("button", { name: "Save exception", exact: true })
      .click();
    await expect(dialog).toContainText(
      "Start and end times are required for this exception type.",
    );
    expect(writes).toHaveLength(0);
  });

  test("Unchecking All day on an existing record re-requires times before saving", async ({
    page,
  }) => {
    const writes = [];
    const availability = [
      {
        id: 501,
        weekday: null,
        date_override: dateStr(2),
        end_date: null,
        start_time: null,
        end_time: null,
        is_available: 0,
        kind: "time_off",
        notes: "Out of office",
        timezone: "America/New_York",
      },
    ];
    await mockRoutes(page, { availability, writes });
    await page.goto("/admin/appointments/");
    await page
      .getByRole("button", { name: "Availability Exceptions", exact: true })
      .click();
    const dialog = modal(page);
    await dialog
      .getByRole("row")
      .filter({ hasText: "Out of office" })
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    await expect(
      dialog.getByRole("checkbox", { name: "All day" }),
    ).toBeChecked();
    await dialog.getByRole("checkbox", { name: "All day" }).uncheck();
    await dialog.getByLabel("Start Time", { exact: true }).fill("");
    await dialog.getByLabel("End Time", { exact: true }).fill("");
    await dialog
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(dialog).toContainText(
      "Start and end times are required for this exception type.",
    );
    expect(writes).toHaveLength(0);
  });
});

test.describe("Backward compatibility with legacy exception records", () => {
  test("Legacy time_off, full_day, and partial blocked rows render as consolidated Blocked Time", async ({
    page,
  }) => {
    const availability = [
      {
        id: 1,
        date_override: dateStr(1),
        start_time: null,
        end_time: null,
        is_available: 0,
        kind: "time_off",
        notes: "Legacy time off",
        timezone: "America/New_York",
      },
      {
        id: 2,
        date_override: dateStr(2),
        start_time: null,
        end_time: null,
        is_available: 0,
        kind: "full_day",
        notes: "Legacy blocked day",
        timezone: "America/New_York",
      },
      {
        id: 3,
        date_override: dateStr(3),
        start_time: "13:00",
        end_time: "15:00",
        is_available: 0,
        kind: "blocked",
        notes: "Legacy partial block",
        timezone: "America/New_York",
      },
    ];
    await mockRoutes(page, { availability });
    await page.goto("/admin/appointments/");
    await page
      .getByRole("button", { name: "Availability Exceptions", exact: true })
      .click();
    const dialog = modal(page);
    for (const [notes, timeText] of [
      ["Legacy time off", "All day"],
      ["Legacy blocked day", "All day"],
      ["Legacy partial block", "1:00 PM–3:00 PM"],
    ]) {
      const row = dialog.getByRole("row").filter({ hasText: notes });
      await expect(row).toContainText("Blocked Time");
      await expect(row).toContainText(timeText);
    }
    await dialog.getByRole("button", { name: "Close", exact: true }).click();

    // The same records, sourced from the same API, must also render
    // directly on the primary calendar -- no separate frontend store.
    await expect(
      page.getByRole("button", { name: /^Blocked, All day/ }),
    ).toHaveCount(2);
    await expect(
      page.getByRole("button", { name: /^Blocked, 1:00 PM.3:00 PM/ }),
    ).toHaveCount(1);
  });
});

test.describe("Calendar integration", () => {
  const appointments = [
    {
      id: 1,
      public_id: "appt-1",
      client_id: 1,
      appointment_type: "consultation",
      scheduled_at: `${dateStr(0)} 09:00:00`,
      status: "confirmed",
      duration_minutes: 60,
      location_type: "virtual",
    },
    {
      id: 2,
      public_id: "appt-2",
      client_id: 1,
      appointment_type: "follow_up",
      scheduled_at: `${dateStr(1)} 11:00:00`,
      status: "requested",
      duration_minutes: 30,
      location_type: "virtual",
    },
    {
      id: 3,
      public_id: "appt-3",
      client_id: 1,
      appointment_type: "consultation",
      scheduled_at: `${dateStr(2)} 13:00:00`,
      status: "completed",
      duration_minutes: 60,
      location_type: "virtual",
    },
    {
      id: 4,
      public_id: "appt-4",
      client_id: 1,
      appointment_type: "consultation",
      scheduled_at: `${dateStr(3)} 15:00:00`,
      status: "cancelled",
      duration_minutes: 60,
      location_type: "virtual",
    },
  ];

  test("Cancelled appointments are hidden from Month/Week/Day but remain in the Appointment list", async ({
    page,
  }) => {
    // The week view shows one Monday-Sunday week, so this test pins the clock
    // to a Wednesday and dates its appointments from it; against the real
    // date it fails whenever the four days cross a week or month boundary.
    const today = new Date("2026-03-04T12:00:00");
    await page.clock.setFixedTime(today);
    const onDay = (offset) => {
      const day = new Date(today);
      day.setDate(day.getDate() + offset);
      return day.toLocaleDateString("en-CA");
    };
    const pinned = appointments.map((appointment, index) => ({
      ...appointment,
      scheduled_at: `${onDay(index)} ${appointment.scheduled_at.split(" ")[1]}`,
    }));
    await mockRoutes(page, { appointments: pinned });
    await page.goto("/admin/appointments/");

    await expect(page.locator(".calendar-event.cancelled")).toHaveCount(0);
    await expect(page.locator(".calendar-event.confirmed")).toHaveCount(1);
    await expect(page.locator(".calendar-event.requested")).toHaveCount(1);
    await expect(page.locator(".calendar-event.completed")).toHaveCount(1);

    const switcher = page.locator(".scheduler-view-switcher");
    await switcher.getByRole("button", { name: "Week", exact: true }).click();
    await expect(page.locator(".week-event.cancelled")).toHaveCount(0);
    await expect(page.locator(".week-event.confirmed")).toHaveCount(1);
    await expect(page.locator(".week-event.requested")).toHaveCount(1);
    await expect(page.locator(".week-event.completed")).toHaveCount(1);

    await switcher.getByRole("button", { name: "Day", exact: true }).click();
    await expect(page.locator(".day-event.confirmed")).toHaveCount(1);
    // Navigate to the cancelled appointment's own date: it must not
    // render there even though nothing else is scheduled that day.
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole("button", { name: "Next", exact: true }).click();
    }
    await expect(page.locator(".day-event.cancelled")).toHaveCount(0);
    await expect(page.locator(".day-event")).toHaveCount(0);

    const list = page.locator(".admin-table-wrap").last();
    await expect(list).toContainText("Cancelled");
  });

  test("Calendar legend shows the active statuses and omits Cancelled", async ({
    page,
  }) => {
    await mockRoutes(page, { appointments: [...appointments] });
    await page.goto("/admin/appointments/");
    const legend = page.locator(".calendar-legend");
    await expect(legend).toContainText("Confirmed");
    await expect(legend).toContainText("Requested");
    await expect(legend).toContainText("Extended availability");
    await expect(legend).toContainText("Blocked time");
    await expect(legend).toContainText("Completed");
    await expect(legend).not.toContainText("Cancelled");
  });

  test("Creating, editing, and deleting an exception updates the calendar immediately", async ({
    page,
  }) => {
    const availability = [];
    await mockRoutes(page, { availability });
    await page.goto("/admin/appointments/");
    await expect(page.locator(".calendar-event.exception")).toHaveCount(0);

    await page
      .getByRole("button", { name: "Availability Exceptions", exact: true })
      .click();
    let dialog = modal(page);
    await dialog.getByLabel("Exception Type").selectOption("blocked_time");
    await dialog.getByLabel("Date", { exact: true }).fill(dateStr(0));
    await dialog.getByLabel("Start Time", { exact: true }).fill("13:00");
    await dialog.getByLabel("End Time", { exact: true }).fill("15:00");
    await dialog
      .getByRole("button", { name: "Save exception", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();

    await expect(page.locator(".calendar-event.exception")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: /^Blocked, 1:00 PM.3:00 PM/ }),
    ).toHaveCount(1);

    await page
      .getByRole("button", { name: /^Blocked, 1:00 PM.3:00 PM/ })
      .click();
    dialog = modal(page);
    await expect(dialog.getByLabel("Exception Type")).toHaveValue(
      "blocked_time",
    );
    // The delete confirmation uses window.confirm; accept it.
    page.once("dialog", (nativeDialog) => nativeDialog.accept());
    await dialog
      .getByRole("row")
      .filter({ hasText: "1:00 PM" })
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(
      dialog.getByRole("row").filter({ hasText: "1:00 PM" }),
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.locator(".calendar-event.exception")).toHaveCount(0);
  });
});

test.describe("Booking conflict safety", () => {
  const conflictingAppointment = [
    {
      id: 5,
      public_id: "appt-5",
      client_id: 1,
      appointment_type: "consultation",
      scheduled_at: `${dateStr(2)} 10:00:00`,
      status: "confirmed",
      duration_minutes: 60,
      location_type: "virtual",
    },
  ];

  test("Warns before creating a Blocked Time exception that overlaps an active appointment, and leaves it untouched when dismissed", async ({
    page,
  }) => {
    const writes = [];
    await mockRoutes(page, {
      appointments: [...conflictingAppointment],
      writes,
    });
    await page.goto("/admin/appointments/");

    let dialogMessage = "";
    page.once("dialog", (dialog) => {
      dialogMessage = dialog.message();
      dialog.dismiss();
    });
    await page
      .getByRole("button", { name: "Availability Exceptions", exact: true })
      .click();
    const dialog = modal(page);
    await dialog.getByLabel("Exception Type").selectOption("blocked_time");
    await dialog.getByLabel("Date", { exact: true }).fill(dateStr(2));
    await dialog.getByRole("checkbox", { name: "All day" }).check();
    await dialog
      .getByRole("button", { name: "Save exception", exact: true })
      .click();
    await expect.poll(() => dialogMessage).toContain("Jordan Rivera");
    expect(dialogMessage).toContain("existing appointment");
    // Dismissed: nothing was written, and the appointment was never touched.
    expect(writes).toHaveLength(0);
  });

  test("Confirming the conflict warning saves the exception without modifying the appointment", async ({
    page,
  }) => {
    const writes = [];
    await mockRoutes(page, {
      appointments: [...conflictingAppointment],
      writes,
    });
    await page.goto("/admin/appointments/");

    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Availability Exceptions", exact: true })
      .click();
    const dialog = modal(page);
    await dialog.getByLabel("Exception Type").selectOption("blocked_time");
    await dialog.getByLabel("Date", { exact: true }).fill(dateStr(2));
    await dialog.getByRole("checkbox", { name: "All day" }).check();
    await dialog
      .getByRole("button", { name: "Save exception", exact: true })
      .click();
    await expect(dialog).not.toContainText("Start and end times are required");
    expect(writes).toHaveLength(1);
    expect(writes[0].method).toBe("POST");
    // The appointment itself must never be auto-cancelled or rescheduled --
    // only the Admin's own appointment controls may change it.
    expect(writes.some((write) => write.method === "PUT")).toBe(false);
  });
});

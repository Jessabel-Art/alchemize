import { test, expect } from "@playwright/test";

const portalPayloads = {
  dashboard: {
    client: {
      id: "client-public-a",
      type: "business",
      display_name: "North Harbor Studio",
      preferred_name: "North Harbor",
    },
    summary: {
      active_services: 1,
      tasks_requiring_action: 1,
      documents_needed: 1,
      unread_messages: 0,
      upcoming_appointments: 0,
      open_balance: "450.00",
      has_past_due: false,
    },
    next_task: {
      id: "task-a",
      title: "Review formation details",
      description: "Confirm the client-facing information.",
      due_date: "2026-09-10",
    },
    next_appointment: null,
    next_invoice: null,
    recent_activity: [],
  },
  services: {
    items: [
      {
        id: "eng-a",
        title: "Business formation",
        description: "Formation and setup support.",
        status: "in_progress",
        start_date: "2026-08-01",
        service_names: ["Business Formation"],
      },
    ],
  },
  tasks: {
    items: [
      {
        id: "task-a",
        title: "Review formation details",
        description: "Confirm the client-facing information.",
        status: "waiting_on_client",
        due_date: "2026-09-10",
      },
    ],
  },
  intakes: { items: [] },
  documents: { items: [], file_access: "metadata_only" },
  appointments: { items: [] },
  messages: {
    items: [],
    available: true,
  },
  billing: { invoices: [], payments: [], summary: { open_balance: "0.00" } },
  profile: {
    client: {
      id: "client-public-a",
      client_type: "business",
      display_name: "North Harbor Studio",
      primary_email: "client@example.com",
    },
    authorized_contacts: [],
    pending_changes: [],
    access_role: "primary_contact",
  },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const requestUrl = new URL(route.request().url());
    const apiRoute = requestUrl.searchParams.get("route");
    if (apiRoute === "auth/session") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            authenticated: true,
            user: { user_id: 7, role_slug: "client" },
            csrf_token: "test-token",
          },
        }),
      });
      return;
    }
    if (apiRoute === "auth/logout") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { authenticated: false, csrf_token: "" },
        }),
      });
      return;
    }
    if (apiRoute?.startsWith("portal/")) {
      const resource = apiRoute.split("/")[1];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: portalPayloads[resource] }),
      });
      return;
    }
    await route.continue();
  });
});

test("the portal root resolves to the one canonical service workspace", async ({
  page,
}) => {
  await page.goto("/client-portal/");
  await expect(page).toHaveURL(/\/client-portal\/dashboard\/?$/);
  // The dashboard headline is now the dynamic time-of-day greeting rather
  // than a static "Your service workspace" title (deliberate redesign).
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Good (morning|afternoon|evening), North Harbor/,
    }),
  ).toBeVisible();
  await expect(page.getByText("Your business workspace")).toHaveCount(0);
});

test("the dashboard renders authenticated client summaries and intentional empty states", async ({
  page,
}) => {
  await page.goto("/client-portal/dashboard/");
  await expect(page.getByText(/North Harbor/)).toBeVisible();
  await expect(page.getByText("Review formation details")).toBeVisible();
  await expect(page.getByText("No upcoming appointments.")).toBeVisible();
  await expect(page.getByText("No open invoices.")).toBeVisible();
});

test("client portal surfaces a future requested appointment and next-appointment summary", async ({
  page,
}) => {
  const requestedFuture = {
    id: "appt-requested",
    appointment_type: "Consultation",
    engagement_title: "Business Consulting",
    status: "requested",
    scheduled_start: "2030-09-14T10:00:00-04:00",
    scheduled_end: "2030-09-14T11:00:00-04:00",
    timezone: "America/New_York",
    duration_minutes: 60,
    meeting_method: "phone",
  };

  await page.route("**/alchemize-api.php?route=portal%2Fdashboard", (route) =>
    route.fulfill({
      json: {
        data: {
          ...portalPayloads.dashboard,
          summary: {
            ...portalPayloads.dashboard.summary,
            upcoming_appointments: 1,
          },
          next_appointment: requestedFuture,
        },
      },
    }),
  );
  await page.route(
    "**/alchemize-api.php?route=portal%2Fappointments",
    (route) =>
      route.fulfill({
        json: {
          data: {
            items: [
              requestedFuture,
              {
                ...requestedFuture,
                id: "appt-confirmed",
                status: "confirmed",
                scheduled_start: "2030-09-15T12:00:00-04:00",
                scheduled_end: "2030-09-15T13:00:00-04:00",
              },
              {
                ...requestedFuture,
                id: "appt-cancelled",
                status: "cancelled",
                scheduled_start: "2030-09-16T10:00:00-04:00",
              },
              {
                ...requestedFuture,
                id: "appt-past",
                status: "completed",
                scheduled_start: "2020-09-15T10:00:00-04:00",
              },
            ],
          },
        },
      }),
  );

  await page.goto("/client-portal/dashboard/");
  await expect(page.getByText("Consultation")).toBeVisible();
  await expect(page.getByText("No upcoming appointments.")).toHaveCount(0);

  await page.goto("/client-portal/appointments");
  await expect(
    page.getByRole("heading", { name: "Upcoming appointments" }),
  ).toBeVisible();
  await expect(page.getByText("Consultation").first()).toBeVisible();
  await expect(page.getByText("No upcoming appointments.")).toHaveCount(0);
});

test("dashboard redesign renders action required and quick actions without duplicates", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?route=portal%2Fdashboard", (route) =>
    route.fulfill({
      json: {
        data: {
          ...portalPayloads.dashboard,
          attention: [
            {
              kind: "document",
              title: "Identification document",
              detail: "Requested Sep 3, 2026",
              priority: 2,
              to: "/client-portal/tasks-and-documents",
            },
            {
              kind: "task",
              title: "Review service update",
              detail: "Action needed",
              priority: 2,
              to: "/client-portal/tasks-and-documents",
            },
          ],
          onboarding: {
            dismissed: false,
            steps: [
              {
                key: "profile",
                label: "Confirm profile information",
                complete: true,
                to: "/client-portal/profile",
              },
              {
                key: "service",
                label: "Review active service",
                complete: false,
                to: "/client-portal/services",
              },
            ],
          },
          recent_activity: [
            {
              id: "a1",
              summary: "Logo files uploaded.",
              created_at: "2026-09-04T18:00:00",
            },
            {
              id: "a2",
              summary: "Business Consulting intake submitted for review.",
              created_at: "2026-09-02T12:00:00",
            },
          ],
        },
      },
    }),
  );

  await page.goto("/client-portal/dashboard/");
  // The Action Required heading now reads as a direct sentence rather
  // than repeating the "Action required" section kicker (deliberate
  // redesign); the kicker text itself is asserted separately below.
  await expect(
    page.getByRole("heading", { name: "We need something from you." }),
  ).toBeVisible();
  await expect(page.locator(".portal-action-hero .section-kicker")).toHaveText(
    "Action required",
  );
  await expect(page.getByText("Identification document")).toBeVisible();
  await expect(page.getByText("Review service update")).toBeVisible();
  await expect(page.getByText("Documents needed")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Quick actions" }),
  ).toBeVisible();
  await expect(page.locator(".portal-quick-action-tile")).toHaveCount(4);
  await expect(page.locator(".portal-onboarding")).toBeVisible();
  await expect(page.getByText("âœ“")).toHaveCount(0);

  await page.goto("/client-portal/tasks/");
  await expect(page).toHaveURL(/\/client-portal\/tasks-and-documents\/?$/);
  await expect(
    page.getByRole("heading", { name: "Tasks & Documents" }),
  ).toBeVisible();
});

test("service landing page shows active and past services with collapsed request flow", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?route=portal%2Fservices", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "eng-a",
              title: "Business formation",
              description: "Formation and setup support.",
              status: "in_progress",
              start_date: "2026-08-01",
              target_date: "2026-09-30",
              service_names: ["Business Formation"],
            },
            {
              id: "eng-b",
              title: "Annual tax review",
              description: "Prior year filing guidance.",
              status: "completed",
              start_date: "2025-12-02",
              service_names: ["Business Tax"],
            },
          ],
        },
      },
    }),
  );

  await page.goto("/client-portal/services/");
  await expect(
    page.getByRole("heading", { name: "Services", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Active services", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Business formation")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Past services", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Annual tax review")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request a service" }),
  ).toBeVisible();
  await expect(
    page.getByRole("form", { name: /request a service/i }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Request a service" }).click();
  await expect(
    page.getByRole("form", { name: /request a service/i }),
  ).toBeVisible();
});

test("service cards route to the engagement detail workspace and scope records to that engagement", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?route=portal%2Fservices", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "eng-a",
              title: "Business formation",
              description: "Formation and setup support.",
              status: "in_progress",
              start_date: "2026-08-01",
              target_date: "2026-09-30",
              service_names: ["Business Formation"],
            },
            {
              id: "eng-b",
              title: "Annual tax review",
              description: "Prior year filing guidance.",
              status: "completed",
              start_date: "2025-12-02",
              service_names: ["Business Tax"],
            },
          ],
        },
      },
    }),
  );
  await page.route(
    "**/alchemize-api.php?route=portal%2Fservices%2Feng-a",
    (route) =>
      route.fulfill({
        json: {
          data: {
            item: {
              id: "eng-a",
              title: "Business formation",
              description: "Formation and setup support.",
              status: "in_progress",
              start_date: "2026-08-01",
              target_date: "2026-09-30",
              service_names: ["Business Formation"],
            },
            tasks: [
              {
                id: "task-a",
                title: "Review formation details",
                description: "Confirm the client-facing information.",
                status: "waiting_on_client",
                due_date: "2026-09-10",
              },
            ],
            documents: [],
            appointments: [],
            intakes: [],
            activity: [],
          },
        },
      }),
  );

  await page.goto("/client-portal/services/");
  await page.getByRole("link", { name: "View service" }).first().click();
  await expect(page).toHaveURL(/\/client-portal\/services\/eng-a\/?$/);
  await expect(
    page.getByRole("heading", { name: "Business formation" }),
  ).toBeVisible();
  await expect(page.getByText("Review formation details")).toBeVisible();
  await expect(page.getByText("Annual tax review")).toHaveCount(0);
});

test("service detail handles invalid appointment timezones without the generic unavailable state", async ({
  page,
}) => {
  await page.route(
    "**/alchemize-api.php?route=portal%2Fservices%2Feng-a",
    (route) =>
      route.fulfill({
        json: {
          data: {
            item: {
              id: "eng-a",
              title: "Business formation",
              description: "Formation and setup support.",
              status: "in_progress",
              start_date: "2026-08-01",
              target_date: "2026-09-30",
              service_names: ["Business Formation"],
            },
            tasks: [
              {
                id: "task-a",
                title: "Review formation details",
                description: "Confirm the client-facing information.",
                status: "waiting_on_client",
                due_date: "2026-09-10",
              },
            ],
            documents: [],
            appointments: [
              {
                id: "appt-a",
                appointment_type: "Consultation",
                scheduled_at: "2026-09-10T10:00:00",
                end_at: "2026-09-10T11:00:00",
                timezone: "Not/AZone",
                status: "scheduled",
                client_instructions: "Follow up with the client.",
              },
            ],
            activity: [],
          },
        },
      }),
  );

  await page.goto("/client-portal/services/eng-a");
  await expect(
    page.getByRole("heading", { name: "Business formation", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Review formation details")).toBeVisible();
  await expect(
    page.getByText("The client portal is temporarily unavailable.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

test("service and task pages render only API records", async ({ page }) => {
  await page.goto("/client-portal/services/");
  await expect(
    page.getByRole("strong").filter({ hasText: "Business formation" }),
  ).toBeVisible();
  await expect(page.getByText("Insurance guidance")).toHaveCount(0);

  await page.goto("/client-portal/tasks/");
  await expect(
    page.getByRole("heading", { name: "Tasks & Intake" }),
  ).toBeVisible();
  await expect(
    page.getByText("Review formation details").first(),
  ).toBeVisible();
});

test("billing route loads real invoice data without the generic portal unavailable state", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?route=portal%2Fbilling", (route) =>
    route.fulfill({
      json: {
        data: {
          invoices: [
            {
              id: "inv-1042",
              invoice_number: "INV-1042",
              invoice_date: "2026-09-01",
              due_date: "2026-09-15",
              status: "open",
              currency: "USD",
              subtotal: 1250,
              adjustment_total: 0,
              credit_deposit_total: 0,
              paid_total: 0,
              outstanding_balance: 1250,
              client_facing_notes: "Formation setup balance",
              engagement_title: "Business formation",
            },
          ],
          payments: [],
          summary: { open_balance: "1250.00" },
        },
      },
    }),
  );

  await page.goto("/client-portal/billing/");
  await expect(page).toHaveURL(/\/client-portal\/billing\/?$/);
  await expect(
    page.getByRole("heading", { name: "Billing", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Current balance", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("section")
      .filter({ hasText: "Current balance" })
      .getByRole("strong")
      .first(),
  ).toHaveText("$1,250.00");
  await expect(page.getByText("INV-1042", { exact: true })).toBeVisible();
  await expect(
    page.getByText("The client portal is temporarily unavailable.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

test("messages has no admin templates or fabricated records", async ({
  page,
}) => {
  await page.goto("/client-portal/messages/");
  await expect(
    page.getByRole("heading", { name: "Send a message to Alchemize" }),
  ).toBeVisible();
  await expect(
    page.getByText("No messages are currently listed."),
  ).toBeVisible();
  await expect(page.getByText("Templates", { exact: true })).toHaveCount(0);
});

test("client portal navigation remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/client-portal/dashboard/");
  const toggle = page.getByRole("button", {
    name: "Toggle client portal navigation",
  });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(
    page.getByRole("navigation", { name: "Portal navigation" }),
  ).toBeVisible();
});

test("task actions use authenticated CSRF-protected portal mutations", async ({
  page,
}) => {
  await page.goto("/client-portal/tasks/");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const requestPromise = page.waitForRequest((request) =>
    request.url().includes("route=portal%2Ftasks%2Ftask-a%2Fcomplete"),
  );
  await page.getByRole("button", { name: "Mark complete" }).click();
  const request = await requestPromise;
  expect(request.method()).toBe("POST");
  expect(request.headers()["x-csrf-token"]).toBe("test-token");
  expect(request.postDataJSON()).toEqual({ response: "" });
});

test("profile defaults to a review-first display and requires explicit edit mode", async ({
  page,
}) => {
  await page.goto("/client-portal/profile/");

  await expect(
    page.getByRole("heading", { name: "North Harbor Studio" }),
  ).toBeVisible();
  await expect(page.getByText("client@example.com")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit profile" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save profile changes" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Edit profile" }).click();
  await expect(page.getByLabel("Phone", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save profile changes" }),
  ).toBeVisible();
});

test("client sidebar logout triggers a session logout and redirects to login", async ({
  page,
}) => {
  await page.goto("/client-portal/dashboard/");
  const logoutRequestPromise = page.waitForRequest((request) =>
    request.url().includes("route=auth%2Flogout"),
  );

  await page.getByRole("button", { name: "Log out" }).click();
  const request = await logoutRequestPromise;

  expect(request.method()).toBe("POST");
  expect(request.headers()["x-csrf-token"]).toBe("test-token");
  await expect(page).toHaveURL(/\/login\/?$/);
});

test("profile updates preserve internal field names and use a PUT mutation", async ({
  page,
}) => {
  await page.goto("/client-portal/profile/");
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Phone", { exact: true }).fill("(910) 555-0110");
  const requestPromise = page.waitForRequest((request) =>
    request.url().includes("route=portal%2Fprofile"),
  );
  await page.getByRole("button", { name: "Save profile changes" }).click();
  const request = await requestPromise;
  expect(request.method()).toBe("PUT");
  expect(request.headers()["x-csrf-token"]).toBe("test-token");
  expect(request.postDataJSON().primary_phone).toBe("(910) 555-0110");
});

for (const width of [1440, 834, 390]) {
  test(`client workspace composition and overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const resource of [
      "dashboard",
      "services",
      "documents",
      "appointments",
      "messages",
      "billing",
      "profile",
      "tasks",
    ]) {
      await page.goto(`/client-portal/${resource}/`);
      await expect(page.locator(".portal-page h1")).toBeVisible();
      await expect(page.getByText(/^Loading /)).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (["services", "appointments", "messages"].includes(resource)) {
        const main = await page
          .locator(".portal-workspace-primary")
          .boundingBox();
        const utility = await page
          .locator(".portal-workspace-utility")
          .boundingBox();
        if (width > 800) expect(utility.x).toBeGreaterThan(main.x + main.width);
        else expect(utility.y).toBeGreaterThanOrEqual(main.y + main.height);
      }
      if (resource === "dashboard" && width === 1440) {
        expect(
          (await page.locator(".portal-dashboard-grid").boundingBox()).y,
        ).toBeLessThan(400);
      }
      await page.screenshot({
        path: `artifacts/client-ui-${resource}-${width}.png`,
        fullPage: true,
      });
    }
  });
}

test("populated setup and action queue stay compact", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/alchemize-api.php?route=portal%2Fdashboard", (route) =>
    route.fulfill({
      json: {
        data: {
          ...portalPayloads.dashboard,
          onboarding: {
            dismissed: false,
            steps: [
              {
                key: "profile",
                label: "Confirm profile information",
                complete: true,
                to: "/client-portal/profile",
              },
              {
                key: "service",
                label: "Review active service",
                complete: false,
                to: "/client-portal/services",
              },
              {
                key: "task",
                label: "Complete your first task",
                complete: false,
                to: "/client-portal/tasks",
              },
              {
                key: "documents",
                label: "Provide requested documents",
                complete: true,
                to: "/client-portal/documents",
              },
            ],
          },
          attention: [
            {
              kind: "task",
              title: "Review formation details",
              detail: "Due Sep 10, 2026",
              priority: 2,
              to: "/client-portal/tasks",
            },
          ],
          recent_activity: Array.from({ length: 8 }, (_, i) => ({
            id: i,
            summary: "Service information updated",
            created_at: "2026-09-05T12:00:00",
          })),
        },
      },
    }),
  );
  await page.goto("/client-portal/dashboard/");
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "2");
  expect(
    (await page.locator(".portal-onboarding").boundingBox()).height,
  ).toBeLessThan(250);
  await expect(page.locator(".portal-activity li")).toHaveCount(5);
  await page.screenshot({
    path: "artifacts/client-ui-dashboard-populated.png",
    fullPage: true,
  });
});

test("compact status strip reflects real service, action, and balance counts", async ({
  page,
}) => {
  await page.goto("/client-portal/dashboard/");
  const strip = page.locator(".portal-status-strip");
  await expect(strip).toBeVisible();
  await expect(strip).toContainText("Active Service");
  await expect(strip).toContainText("Action Needed");
  await expect(strip).toContainText("Balance Due");
  // Fixture: 1 active service, 1 attention item (from next_task fallback),
  // and open_balance "450.00" — the strip must reflect these real values,
  // not mockup placeholders.
  await expect(
    strip.locator(".portal-status-item", { hasText: "Active Service" }),
  ).toContainText("1");
  await expect(
    strip.locator(".portal-status-item", { hasText: "Balance Due" }),
  ).toContainText("$450.00");
});

test("onboarding collapses to a compact banner once nearly complete, and preserves dismiss", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?route=portal%2Fdashboard", (route) =>
    route.fulfill({
      json: {
        data: {
          ...portalPayloads.dashboard,
          onboarding: {
            dismissed: false,
            steps: [
              {
                key: "profile",
                label: "Confirm profile information",
                complete: true,
                to: "/client-portal/profile",
              },
              {
                key: "service",
                label: "Review active service",
                complete: true,
                to: "/client-portal/services",
              },
              {
                key: "task",
                label: "Complete your first task",
                complete: true,
                to: "/client-portal/tasks",
              },
              {
                key: "documents",
                label: "Provide requested documents",
                complete: false,
                to: "/client-portal/tasks-and-documents",
              },
            ],
          },
        },
      },
    }),
  );
  await page.goto("/client-portal/dashboard/");
  await expect(page.locator(".portal-onboarding")).toHaveCount(0);
  const banner = page.locator(".portal-onboarding-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("3 of 4 complete");
  await expect(
    banner.getByRole("link", { name: /Provide requested documents/ }),
  ).toBeVisible();
  await banner.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.locator(".portal-onboarding-banner")).toHaveCount(0);
});

test("multiple service cards render side by side on desktop and stack cleanly on mobile without text corruption", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?route=portal%2Fservices", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "eng-a",
              title: "Business Consulting",
              description: "Professional business consulting services.",
              status: "in_progress",
              start_date: "2026-09-03",
              service_names: ["Business Consulting"],
            },
            {
              id: "eng-b",
              title: "Website Maintenance",
              description: "Ongoing site updates and support.",
              status: "in_progress",
              start_date: "2026-09-03",
              service_names: ["Website Maintenance"],
            },
          ],
        },
      },
    }),
  );

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/client-portal/dashboard/");
  const cards = page.locator(".portal-dashboard-service-card");
  await expect(cards).toHaveCount(2);
  const [firstBox, secondBox] = await Promise.all([
    cards.nth(0).boundingBox(),
    cards.nth(1).boundingBox(),
  ]);
  // Side by side at desktop width, not stacked.
  expect(secondBox.x).toBeGreaterThan(firstBox.x + firstBox.width - 5);

  await page.setViewportSize({ width: 390, height: 1400 });
  await page.waitForTimeout(50);
  const mobileFirstBox = await cards.nth(0).boundingBox();
  const description = cards
    .nth(0)
    .getByText("Professional business consulting services.");
  await expect(description).toBeVisible();
  const descriptionBox = await description.boundingBox();
  // Regression guard: this exact scenario previously collapsed to a
  // near-zero-width column (a shared .portal-service-card class name
  // collided with the Services-list page's 2-column row layout),
  // wrapping the description one character per line.
  expect(descriptionBox.width).toBeGreaterThan(mobileFirstBox.width * 0.5);
  const overflows = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflows).toBeFalsy();
});

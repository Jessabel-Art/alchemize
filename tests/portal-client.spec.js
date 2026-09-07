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
  await expect(
    page.getByRole("heading", { level: 1, name: "Your service workspace" }),
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
  await expect(
    page.getByRole("heading", { name: "Action required" }),
  ).toBeVisible();
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
  await expect(page.getByText("Review formation details")).toBeVisible();
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
  await expect(page.getByText("Open balance", { exact: true })).toBeVisible();
  await expect(
    page
      .locator("section")
      .filter({ hasText: "Open balance" })
      .getByRole("strong")
      .first(),
  ).toHaveText("$1,250.00");
  await expect(
    page.getByRole("heading", { name: "INV-1042", exact: true }),
  ).toBeVisible();
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

test("profile updates preserve internal field names and use a PUT mutation", async ({
  page,
}) => {
  await page.goto("/client-portal/profile/");
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

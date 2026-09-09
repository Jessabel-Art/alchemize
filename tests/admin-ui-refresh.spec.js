import { test, expect } from "@playwright/test";

const records = {
  clients: [
    {
      id: 1,
      display_name: "North Harbor Studio",
      client_type: "business",
      primary_email: "hello@example.test",
      status: "active",
      portal_status: "active",
      updated_at: "2026-09-05",
    },
  ],
  services: [
    {
      id: 2,
      service_name: "Business advisory",
      service_code: "business-advisory",
      category: "Advisory",
      audience: "business",
      catalog_status: "ACTIVE",
      active_flag: 1,
      description: "Review business operations and prepare a delivery plan.",
      tiers: [
        {
          id: 1,
          tier_name: "Standard",
          base_price: 450,
          pricing_type: "FIXED",
          status: "ACTIVE",
          active_flag: 1,
          billing_frequency: "ONE_TIME",
          limits_metadata: "One review per engagement",
        },
      ],
    },
  ],
  engagements: [
    {
      id: 3,
      client_id: 1,
      service_id: 2,
      title: "Business advisory",
      status: "in_progress",
      start_date: "2026-09-01",
      target_date: "2026-10-01",
    },
  ],
  tasks: [
    {
      id: 4,
      client_id: 1,
      engagement_id: 3,
      title: "Review operating plan",
      status: "waiting_on_client",
      due_date: "2020-01-01",
      priority: "high",
    },
  ],
  documents: [
    {
      id: 5,
      client_id: 1,
      engagement_id: 3,
      document_name: "Operating agreement",
      status: "received",
      visibility: "shared",
      requested_date: "2026-09-01",
    },
  ],
  invoices: [
    {
      id: 6,
      client_id: 1,
      engagement_id: 3,
      invoice_number: "INV-1006",
      invoice_date: "2026-09-01",
      due_date: "2026-09-03",
      status: "past_due",
      currency: "USD",
      subtotal: 450,
      paid_total: 100,
    },
  ],
  payments: [],
  leads: [
    {
      id: 8,
      full_name: "Cedar Services",
      email: "cedar@example.test",
      status: "new",
      audience: "business",
      created_at: "2026-09-01",
      service_key: "business-advisory",
    },
  ],
  appointments: [
    {
      id: 9,
      client_id: 1,
      service_id: 2,
      appointment_type: "Consultation",
      scheduled_at: "2026-09-20 10:00:00",
      duration_minutes: 60,
      status: "scheduled",
      location_type: "virtual",
    },
  ],
};
const thread = {
  id: 10,
  subject: "Planning next steps",
  client_name: "North Harbor Studio",
  status: "waiting_on_alchemize",
  unread_count: 1,
  last_message_at: "2026-09-05T12:00:00",
};

async function mockAdmin(page, empty = false) {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const key = new URL(route.request().url()).searchParams.get("route");
    let data = [];
    if (key === "auth/session")
      data = {
        authenticated: true,
        user: { user_id: 1, role_slug: "owner-admin" },
        csrf_token: "ui-test-token",
      };
    else if (key === "portal-admin/attention") data = { items: [] };
    else if (key === "portal-admin/messages")
      data = { items: empty ? [] : [thread] };
    else if (key === "portal-admin/messages/10")
      data = {
        thread,
        messages: [
          {
            id: 11,
            sender_name: "North Harbor Studio",
            sender_type: "client",
            message_body:
              "Please review the operating plan before our meeting.",
            created_at: "2026-09-05T12:00:00",
          },
        ],
      };
    else if (records[key]) data = empty ? [] : records[key];
    await route.fulfill({ json: { data } });
  });
}

for (const width of [1440, 1024, 768]) {
  test(`Dashboard is responsive and shows honest visualizations at ${width}px`, async ({
    page,
  }) => {
    await mockAdmin(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/admin/dashboard/");
    await expect(page.locator(".portal-page-header h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.locator(".dashboard-distribution-bar").first(),
    ).toBeVisible();
  });
}

test("Dashboard operational modules and quick actions stay compact and accessible", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  await expect(
    page.locator(".dashboard-summary-strip .dashboard-summary-item").first(),
  ).toBeVisible();
  for (const heading of [
    "Upcoming schedule",
    "Active service work",
    "Billing watch",
    "Quick actions",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  const quickActions = page.locator(".dashboard-quick-actions");
  await expect(quickActions).toBeVisible();
  expect((await quickActions.boundingBox()).height).toBeLessThan(80);
  await expect(
    quickActions.getByRole("link", { name: "Client management" }),
  ).toHaveAttribute("href", "/admin/clients");
  await expect(
    quickActions.getByRole("link", { name: "Billing" }),
  ).toHaveAttribute("href", "/admin/billing");
});

for (const width of [1440, 1024, 768]) {
  test(`Clients page stays usable and toned at ${width}px`, async ({
    page,
  }) => {
    await mockAdmin(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/admin/clients/");
    await expect(page.locator(".portal-page-header h1")).toBeVisible();
    await expect(page.locator(".client-row-link").first()).toBeVisible();
    await expect(
      page.locator(".admin-metric-card.tone-positive").first(),
    ).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("Service catalog renders grouped, collapsible sections", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/services/");
  const group = page.locator(".service-catalog-group").first();
  await expect(group).toBeVisible();
  await expect(group).toHaveAttribute("open", "");
  await expect(page.locator(".service-category-heading").first()).toHaveText(
    "Advisory",
  );
  await expect(page.getByText("Business advisory")).toBeVisible();
  await group.locator("> summary").click();
  await expect(group).not.toHaveAttribute("open", "");
});

test("Add Service modal shows grouped sections and a reachable footer", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/services/");
  await page
    .getByRole("button", { name: "+ New Service", exact: true })
    .click();
  for (const heading of [
    "Service Identity",
    "Delivery",
    "Billing",
    "Descriptions",
  ]) {
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  for (const width of [1440, 834]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("button", { name: "Create service", exact: true }),
    ).toBeInViewport();
  }
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator(".service-editor-drawer")).toHaveCount(0);
});

test("Client Requests shows toned metrics, styled overdue cells, and an empty state", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await expect(
    page.getByRole("heading", { name: "Client Requests" }),
  ).toBeVisible();
  await expect(
    page.locator(".admin-metric-card.tone-danger").first(),
  ).toHaveCount(1);
  const overdueCell = page.locator(".admin-overdue").first();
  await expect(overdueCell).toContainText("Overdue");
  const reviewButton = page.getByRole("button", { name: "Review" }).first();
  await expect(reviewButton).toBeVisible();

  await mockAdmin(page, true);
  await page.goto("/admin/client-requests/");
  await expect(
    page.getByText("No requests match the selected filters."),
  ).toBeVisible();
});

for (const width of [1440, 1024, 768, 390]) {
  test(`Communications collapses gracefully at ${width}px`, async ({
    page,
  }) => {
    await mockAdmin(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/admin/communications/");
    await page.getByRole("button", { name: /Planning next steps/ }).click();
    await expect(page.locator(".admin-conversation-panel")).toBeVisible();
    if (width >= 1024) {
      const [listBox, threadBox, contextBox] = await Promise.all([
        page.locator(".admin-list-panel").boundingBox(),
        page.locator(".admin-conversation-panel").boundingBox(),
        page.locator(".admin-context-panel").boundingBox(),
      ]);
      expect(listBox.width).toBeGreaterThan(0);
      expect(threadBox.width).toBeGreaterThan(0);
      expect(contextBox.width).toBeGreaterThan(0);
      expect(threadBox.x).toBeGreaterThanOrEqual(listBox.x + listBox.width);
      expect(contextBox.x).toBeGreaterThanOrEqual(
        threadBox.x + threadBox.width,
      );
    } else {
      const [listBox, contextBox] = await Promise.all([
        page.locator(".admin-list-panel").boundingBox(),
        page.locator(".admin-context-panel").boundingBox(),
      ]);
      expect(contextBox.y).toBeGreaterThanOrEqual(listBox.y + listBox.height);
    }
  });
}

test("Communications preserves compose width and empty-grid height", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await page
    .getByRole("button", { name: "+ New Conversation", exact: true })
    .click();
  expect(
    (await page.locator(".admin-compose-panel").boundingBox()).width,
  ).toBeLessThanOrEqual(720);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();

  await mockAdmin(page, true);
  await page.goto("/admin/communications/");
  await expect(
    page.getByText("No conversations match this view."),
  ).toBeVisible();
  expect(
    (await page.locator(".admin-workspace-grid").boundingBox()).height,
  ).toBeLessThan(180);
});

test("Communications no-selection state avoids a permanent actions panel", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await expect(
    page.getByRole("button", { name: /Planning next steps/ }),
  ).toBeVisible();
  await expect(page.locator(".admin-context-panel")).toHaveCount(0);
  await expect(page.locator(".admin-conversation-panel")).toHaveCount(0);
  await expect(
    page.getByText("Select a conversation from the list to view its history"),
  ).toBeVisible();
  expect(
    (await page.locator(".admin-workspace-grid").boundingBox()).height,
  ).toBeLessThan(220);
});

test("Selected conversation renders a compact message timeline, composer, and actions", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await page.getByRole("button", { name: /Planning next steps/ }).click();

  const message = page.locator(".portal-thread li").first();
  await expect(message.locator(".portal-thread-meta strong")).toHaveText(
    "North Harbor Studio",
  );
  await expect(message.locator(".portal-thread-meta small")).not.toBeEmpty();
  await expect(
    page.getByText("Please review the operating plan before our meeting."),
  ).toBeVisible();

  await expect(page.getByRole("textbox", { name: "Reply" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();

  const context = page.locator(".admin-context-panel");
  await expect(context).toBeVisible();
  await expect(
    context.getByRole("combobox", { name: "Related record type" }),
  ).toBeVisible();
  await expect(
    context.getByRole("button", { name: "Link record", exact: true }),
  ).toBeVisible();
  await expect(
    context.getByRole("button", { name: "Waiting on client", exact: true }),
  ).toBeVisible();
  await expect(
    context.getByRole("button", { name: "Mark resolved", exact: true }),
  ).toBeVisible();
  await expect(
    context.getByRole("button", { name: "Archive", exact: true }),
  ).toBeVisible();
});

test("Nav labels, routes, and primary actions remain intact across refreshed pages", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  const nav = page.getByRole("navigation", { name: "Portal navigation" });
  for (const label of [
    "Dashboard",
    "Clients",
    "Services",
    "Client Requests",
    "Communications",
    "Appointments",
    "Billing",
    "Reports",
    "Settings",
  ]) {
    await expect(
      nav.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  }

  await page.goto("/admin/clients/");
  await expect(
    page.getByRole("button", { name: "+ Client or Prospect", exact: true }),
  ).toBeVisible();

  await page.goto("/admin/services/");
  await expect(
    page.getByRole("button", { name: "+ New Service", exact: true }),
  ).toBeVisible();

  await page.goto("/admin/client-requests/");
  await expect(
    page.getByRole("button", { name: "New Request", exact: true }),
  ).toBeVisible();

  await page.goto("/admin/communications/");
  await expect(
    page.getByRole("button", { name: "+ New Conversation", exact: true }),
  ).toBeVisible();
});

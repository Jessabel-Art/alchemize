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
      // Kept relative to "now" so the appointment always falls inside the
      // dashboard's "next 7 days" window regardless of when tests run.
      scheduled_at: `${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} 10:00:00`,
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

for (const width of [1440, 1280, 1024, 834, 768, 390]) {
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

test("Dashboard KPI strip renders the five primary summaries", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  const kpis = page.locator(".dashboard-kpi-strip .dashboard-kpi-card");
  await expect(kpis).toHaveCount(5);
  for (const label of [
    "Open Leads",
    "Needs Attention",
    "Active Clients",
    "Open Invoices",
    "Upcoming",
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  // Open Invoices KPI must show a real dollar figure derived from the
  // mocked invoice, not an invented trend.
  await expect(
    kpis.filter({ hasText: "Open Invoices" }).getByText(/\$\d/),
  ).toBeVisible();
});

test("Today's focus renders a summarized breakdown, not the full raw attention list", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  const focusPanel = page.locator("#attention");
  await expect(
    focusPanel.getByRole("heading", { name: /Today.s focus/ }),
  ).toBeVisible();
  await expect(focusPanel.locator(".dashboard-distribution-bar")).toBeVisible();
  await expect(
    focusPanel.locator(".dashboard-distribution-legend"),
  ).toBeVisible();
  // The old per-record attention list must be gone from the summary panel.
  await expect(focusPanel.locator(".attention-list")).toHaveCount(0);
});

test("Dashboard renders four compact operational focus cards linking to existing routes", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  const cards = page.locator(".dashboard-focus-cards .dashboard-focus-card");
  await expect(cards).toHaveCount(4);
  // Client portal activity has no dedicated route of its own, so it drills
  // into an on-demand detail drawer rather than a link.
  await expect(
    cards.filter({ hasText: "Client portal activity" }),
  ).toHaveJSProperty("tagName", "BUTTON");
  await expect(cards.filter({ hasText: "Prospect follow-up" })).toHaveAttribute(
    "href",
    "/admin/leads",
  );
  await expect(
    cards.filter({ hasText: "Documents requiring action" }),
  ).toHaveAttribute("href", "/admin/documents");
  await expect(
    cards.filter({ hasText: "Active service work" }),
  ).toHaveAttribute("href", "/admin/services");
  // Each card exposes an explicit "View details" affordance and no inline
  // record list.
  await expect(cards.getByText("View details")).toHaveCount(4);
  await expect(page.locator(".dashboard-focus-cards ul")).toHaveCount(0);
});

test("Client portal activity queue is no longer rendered on the dashboard by default, and opens on demand", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  // The legacy always-visible record queue and its heading must be gone.
  await expect(page.getByText("items awaiting review")).toHaveCount(0);
  await expect(page.locator("#portal-activity")).toHaveCount(0);
  await expect(page.locator(".portal-client-attention")).toHaveCount(0);

  const card = page
    .locator(".dashboard-focus-card")
    .filter({ hasText: "Client portal activity" });
  await card.click();
  await expect(
    page.getByRole("heading", { name: /items awaiting review/ }),
  ).toBeVisible();
  await expect(page.locator(".portal-client-attention")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator(".portal-client-attention")).toHaveCount(0);
});

test("No other legacy raw record queue remains below the dashboard panels", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  // The dashboard should end after the KPI strip, focus panels, and lower
  // row/right rail — nothing else should render at the page root level.
  const topLevelSections = page.locator(
    ".admin-dashboard > .dashboard-kpi-strip, .admin-dashboard > .dashboard-command-grid, .admin-dashboard > header",
  );
  await expect(topLevelSections).toHaveCount(3);
});

test("Upcoming schedule shows a limited preview and links to Appointments", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  const panel = page
    .locator(".dashboard-panel")
    .filter({ has: page.getByRole("heading", { name: "Upcoming schedule" }) });
  await expect(panel.locator(".schedule-item")).toHaveCount(1);
  await expect(
    panel.getByRole("link", { name: "View calendar" }),
  ).toHaveAttribute("href", "/admin/appointments");
});

test("Recent activity shows a limited preview rather than an unlimited list", async ({
  page,
}) => {
  await mockAdmin(page);
  // The dashboard's activity log is populated by adminStore mutations, not
  // by the initial API load, so seed more than the display cap (5) via the
  // same window.adminStore handle admin-workflows.spec.js uses, then route
  // to the dashboard client-side so the fresh mount picks up the seeded
  // state on its first render.
  await page.goto("/admin/clients/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page.evaluate(() => {
    for (let i = 0; i < 6; i += 1) {
      window.adminStore.createTask({
        title: `Seeded follow-up ${i}`,
        clientId: "1",
        status: "Not Started",
      });
    }
  });
  await page
    .getByRole("navigation", { name: "Portal navigation" })
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  const panel = page
    .locator(".dashboard-panel")
    .filter({ has: page.getByRole("heading", { name: "Recent activity" }) });
  await expect(panel.locator(".activity-list li")).toHaveCount(5);
  await expect(panel.locator(".activity-icon").first()).toBeVisible();
});

test("Invoices at a glance uses real invoice data for the donut and legend", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  const panel = page.locator(".dashboard-panel").filter({
    has: page.getByRole("heading", { name: "Invoices at a glance" }),
  });
  await expect(panel.locator(".invoice-donut")).toBeVisible();
  const overdueRow = panel.locator(".invoice-legend li", {
    hasText: "Overdue",
  });
  await expect(overdueRow.locator(".invoice-legend-count")).toHaveText("1");
  await expect(
    panel.getByRole("link", { name: /View billing/ }),
  ).toHaveAttribute("href", "/admin/billing");
});

test("Quick actions point to valid existing admin routes", async ({ page }) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  const quickActions = page.locator(".dashboard-quick-actions");
  await expect(quickActions).toBeVisible();
  const expectedRoutes = {
    "Add client": "/admin/clients",
    "New appointment": "/admin/appointments",
    "Create invoice": "/admin/billing",
    "Client requests": "/admin/client-requests",
    "Manage services": "/admin/services",
    "Compose message": "/admin/communications",
  };
  for (const [label, href] of Object.entries(expectedRoutes)) {
    await expect(
      quickActions.getByRole("link", { name: label }),
    ).toHaveAttribute("href", href);
  }
});

test("Dashboard empty states stay clean and intentional with no data", async ({
  page,
}) => {
  await mockAdmin(page, true);
  await page.goto("/admin/dashboard/");
  await expect(page.locator(".dashboard-kpi-strip")).toBeVisible();
  await expect(
    page.getByText("Nothing currently requires immediate action."),
  ).toBeVisible();
  await expect(
    page.getByText("No appointments in the next 7 days."),
  ).toBeVisible();
  const activityPanel = page
    .locator(".dashboard-panel")
    .filter({ has: page.getByRole("heading", { name: "Recent activity" }) });
  await expect(
    activityPanel.getByText("No recent operational activity."),
  ).toBeVisible();
  // An empty populated-vs-empty panel should not stretch to match its
  // (potentially taller) row-mate.
  const invoicesPanel = page.locator(".dashboard-panel").filter({
    has: page.getByRole("heading", { name: "Invoices at a glance" }),
  });
  const [activityBox, invoicesBox] = await Promise.all([
    activityPanel.boundingBox(),
    invoicesPanel.boundingBox(),
  ]);
  expect(activityBox.height).toBeLessThan(invoicesBox.height);
  await expect(page.getByText("No open invoices right now.")).toBeVisible();

  // The client portal activity queue stays closed by default even when
  // empty — opening it must still show its own clean empty state.
  await page
    .locator(".dashboard-focus-card")
    .filter({ hasText: "Client portal activity" })
    .click();
  await expect(
    page.getByText("No client portal actions need review."),
  ).toBeVisible();
});

for (const width of [1440, 1280, 1024, 834, 768, 390]) {
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

test("Dashboard polish preserves fixture values and calendar navigation", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  for (const label of [
    "Open Leads",
    "Active Clients",
    "Open Invoices",
    "Upcoming",
  ]) {
    await expect(
      page
        .locator(".dashboard-kpi-card")
        .filter({ hasText: label })
        .locator("strong"),
    ).toHaveText("1");
  }
  await expect(page.locator(".invoice-donut-center strong")).toHaveText("$350");
  await expect(page.locator(".invoice-preview")).toContainText("INV-1006");
  await expect(page.locator(".schedule-date-block strong")).toHaveText(
    String(
      new Date(
        records.appointments[0].scheduled_at.replace(" ", "T"),
      ).getDate(),
    ),
  );
  await expect(page.locator(".schedule-item")).toContainText(
    "North Harbor Studio",
  );
  await page.getByRole("link", { name: "View full calendar" }).click();
  await expect(page).toHaveURL(/\/admin\/appointments\/?$/);
});

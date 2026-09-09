import { test, expect } from "@playwright/test";

const now = new Date();
const monthsAgo = (n) => {
  const d = new Date(now.getFullYear(), now.getMonth() - n, 5);
  return d.toISOString().slice(0, 10);
};

const records = {
  clients: [
    {
      id: 1,
      display_name: "North Harbor Studio",
      client_type: "business",
      primary_email: "hello@example.test",
      status: "active",
      portal_status: "active",
      updated_at: "2026-09-01",
      created_at: "2025-10-15",
    },
    {
      id: 2,
      display_name: "Cedar Consulting",
      client_type: "business",
      primary_email: "cedar@example.test",
      status: "active",
      portal_status: "active",
      updated_at: "2026-08-01",
      created_at: "2026-01-20",
    },
  ],
  services: [],
  engagements: [
    {
      id: 1,
      client_id: 1,
      service_id: 1,
      title: "Business Consulting",
      status: "in_progress",
      start_date: "2026-01-01",
    },
    {
      id: 2,
      client_id: 2,
      service_id: 1,
      title: "Business Consulting",
      status: "active",
      start_date: "2026-02-01",
    },
    {
      id: 3,
      client_id: 2,
      service_id: 2,
      title: "Process Improvement",
      status: "in_progress",
      start_date: "2026-03-01",
    },
  ],
  tasks: [],
  documents: [],
  appointments: [],
  invoices: [
    {
      id: 101,
      client_id: 1,
      invoice_number: "INV-101",
      invoice_date: monthsAgo(1),
      due_date: monthsAgo(1),
      status: "paid",
      currency: "USD",
      subtotal: 900,
      paid_total: 900,
    },
    {
      id: 102,
      client_id: 2,
      invoice_number: "INV-102",
      invoice_date: monthsAgo(0),
      due_date: monthsAgo(0),
      status: "open",
      currency: "USD",
      subtotal: 400,
      paid_total: 0,
    },
  ],
  payments: [],
  leads: [
    {
      id: 8,
      full_name: "Cedar Services",
      email: "cedar@example.test",
      status: "new",
      created_at: now.toISOString(),
    },
  ],
};

async function mockAdmin(page, { savedReports = [] } = {}) {
  const store = [...savedReports];
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const key = url.searchParams.get("route");
    const method = route.request().method();

    if (key === "auth/session") {
      await route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "ui-test-token",
          },
        },
      });
      return;
    }
    if (key === "reports") {
      if (method === "GET") {
        await route.fulfill({ json: { data: store } });
        return;
      }
      if (method === "POST") {
        const payload = route.request().postDataJSON();
        const report = {
          id: store.length + 1,
          name: payload.name,
          report_type: payload.report_type,
          config: payload.config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        store.push(report);
        await route.fulfill({ json: { data: report }, status: 201 });
        return;
      }
    }
    const data = records[key] ?? [];
    await route.fulfill({ json: { data } });
  });
}

test("Reports page renders with the header and category navigation", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/reports/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Reports & insights" }),
  ).toBeVisible();
  const nav = page.locator(".report-category-nav");
  await expect(nav).toBeVisible();
  for (const label of [
    "Overview",
    "Clients",
    "Leads",
    "Appointments",
    "Services",
    "Billing",
    "Tasks",
    "Documents",
  ]) {
    await expect(
      nav.getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
  }
});

test("visual summary modules render real data derived from the current snapshot", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/reports/");
  const summaries = page.locator(".report-visual-summaries");
  await expect(summaries).toBeVisible();

  // Client growth: total clients on record right now (real, from fixture).
  await expect(
    page.locator(".report-visual-module", { hasText: "Client growth" }),
  ).toContainText("2");

  // Service distribution: real engagement counts and labels from the fixture.
  const distribution = page.locator(".report-visual-module", {
    hasText: "Service distribution",
  });
  await expect(distribution).toContainText("Business Consulting");
  await expect(distribution).toContainText("Process Improvement");
  await expect(distribution.locator(".invoice-donut-center strong")).toHaveText(
    "3",
  );

  // Revenue by month: real invoice totals, not mockup placeholder numbers.
  const revenue = page.locator(".report-visual-module", {
    hasText: "Revenue by month",
  });
  await expect(revenue).toContainText("$900");
  await expect(revenue).toContainText("$400");
});

test("switching category navigation updates the builder's report type", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/reports/");
  await page
    .locator(".report-category-nav")
    .getByRole("button", { name: "Billing", exact: true })
    .click();
  await expect(page.locator(".report-control select").first()).toHaveValue(
    "Billing",
  );
  await expect(page.locator(".report-visual-summaries")).toHaveCount(0);
});

test("common report presets still populate the existing report builder", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/reports/");
  const preset = page.getByRole("button", {
    name: "Past Due Invoices",
    exact: true,
  });
  await preset.click();
  await expect(preset).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".report-control select").first()).toHaveValue(
    "Billing",
  );
});

test("Run Report populates results through the existing frontend contract", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/reports/");
  await expect(page.getByText("Your report starts here")).toBeVisible();
  await page.getByRole("button", { name: "Run Report", exact: true }).click();
  await expect(page.locator(".report-results-card")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await expect(page.locator(".report-result-meta")).toContainText("records");
  await expect(page.getByRole("button", { name: "CSV Export" })).toBeVisible();
});

test("results empty state renders when no records match", async ({ page }) => {
  await mockAdmin(page);
  await page.goto("/admin/reports/");
  await page
    .locator(".report-category-nav")
    .getByRole("button", { name: "Billing", exact: true })
    .click();
  await page
    .locator(".report-filter-grid")
    .getByLabel("Client")
    .fill("Nobody Real");
  await page.getByRole("button", { name: "Run Report", exact: true }).click();
  await expect(
    page.getByText("No records match the current report filters."),
  ).toBeVisible();
});

test("Saved reports section renders against the current API state, with no localStorage use", async ({
  page,
}) => {
  await mockAdmin(page, {
    savedReports: [
      {
        id: 1,
        name: "Monthly Billing Summary",
        report_type: "Billing",
        config: { datePreset: "30" },
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-15T00:00:00Z",
      },
    ],
  });
  await page.goto("/admin/reports/");
  await expect(page.getByText("Monthly Billing Summary")).toBeVisible();
  await expect(
    page.locator(".saved-report-info").getByText(/Billing.*Last 30 days/),
  ).toBeVisible();

  // The site's unrelated language-preference key ("alchemize-language")
  // is expected in localStorage app-wide; assert only that Saved Reports
  // itself never persists report data there instead of via reportsApi.
  const storageUsage = await page.evaluate(() => {
    try {
      return {
        localStorageKeys: Object.keys(window.localStorage),
        sessionStorageLength: window.sessionStorage.length,
      };
    } catch {
      return { localStorageKeys: [], sessionStorageLength: 0 };
    }
  });
  const reportRelatedKeys = storageUsage.localStorageKeys.filter((key) =>
    key.toLowerCase().includes("report"),
  );
  expect(reportRelatedKeys).toEqual([]);
  expect(storageUsage.sessionStorageLength).toBe(0);
});

test("saving a report uses the existing reports API and appears in the list", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/reports/");
  await expect(page.getByText("No saved reports yet.")).toBeVisible();
  await page.getByRole("button", { name: "Save report" }).click();
  await expect(page.locator(".report-feedback")).toContainText("Saved report");
  await expect(
    page.locator(".saved-report-info").getByText("Overview report"),
  ).toBeVisible();
});

for (const width of [1440, 1280, 1024, 834, 390]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await mockAdmin(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/admin/reports/");
    await expect(page.locator(".report-category-nav")).toBeVisible();
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows).toBeFalsy();
  });
}

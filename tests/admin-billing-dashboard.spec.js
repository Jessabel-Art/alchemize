import { test, expect } from "@playwright/test";

// Fixture is deliberately dated around the repo's treated "today" of
// 2026-09-09 so past-due / open / paid derivations resolve predictably.
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
    {
      id: 2,
      display_name: "Cedar Consulting",
      client_type: "business",
      primary_email: "cedar@example.test",
      status: "active",
      portal_status: "active",
      updated_at: "2026-09-05",
    },
  ],
  services: [],
  engagements: [],
  tasks: [],
  documents: [],
  invoices: [
    {
      id: 101,
      client_id: 1,
      invoice_number: "INV-2001",
      invoice_date: "2026-08-01",
      due_date: "2026-08-15",
      status: "paid",
      currency: "USD",
      subtotal: 500,
      paid_total: 500,
    },
    {
      id: 102,
      client_id: 2,
      invoice_number: "INV-2002",
      invoice_date: "2026-09-01",
      due_date: "2026-10-01",
      status: "open",
      currency: "USD",
      subtotal: 300,
      paid_total: 0,
    },
    {
      id: 103,
      client_id: 1,
      invoice_number: "INV-2003",
      invoice_date: "2026-07-01",
      due_date: "2026-07-15",
      status: "issued",
      currency: "USD",
      subtotal: 400,
      paid_total: 0,
    },
    {
      id: 104,
      client_id: 2,
      invoice_number: "INV-2004",
      invoice_date: "2026-09-05",
      due_date: "2026-09-25",
      status: "draft",
      currency: "USD",
      subtotal: 250,
      paid_total: 0,
    },
  ],
  payments: [
    {
      id: 201,
      client_id: 1,
      invoice_id: 101,
      amount: 500,
      payment_date: "2026-09-02",
      payment_method: "manual",
    },
  ],
  leads: [],
  appointments: [],
};

async function mockAdmin(page) {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const key = new URL(route.request().url()).searchParams.get("route");
    let data = [];
    if (key === "auth/session") {
      data = {
        authenticated: true,
        user: { user_id: 1, role_slug: "owner-admin" },
        csrf_token: "ui-test-token",
      };
    } else if (records[key]) {
      data = records[key];
    }
    await route.fulfill({ json: { data } });
  });
}

// The Status/Client/Sort selects are all implicit-label-wrapped <select>s
// rendered in a fixed order (Status, Client, Sort by). getByLabel/hasText
// resolve ambiguously here because a <select>'s accessible name/text
// includes ALL of its option labels — and the Sort options include
// "Client (A–Z)", so text-based queries for "Client" match both selects.
// Index into the fixed render order instead.
const FILTER_INDEX = { Status: 0, Client: 1, "Sort by": 2 };
const filterSelect = (page, label) =>
  page.locator(".admin-filter select").nth(FILTER_INDEX[label]);
// AdminTabs renders each tab as a <button role="tab">, so it must be
// queried with the "tab" role, not "button".
const statusTab = (page, label) =>
  page.getByRole("tab", { name: label, exact: true });

test.beforeEach(async ({ page }) => {
  await mockAdmin(page);
});

test("billing page renders with real invoice data", async ({ page }) => {
  await page.goto("/admin/billing/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Billing" }),
  ).toBeVisible();
  await expect(
    page.getByText("Invoices, payments & receivables"),
  ).toBeVisible();
  await expect(page.getByText("INV-2001")).toBeVisible();
  await expect(page.getByText("INV-2002")).toBeVisible();
  await expect(page.getByText("INV-2003")).toBeVisible();
  await expect(page.getByText("INV-2004")).toBeVisible();
});

test("financial summary derives from actual invoice and payment data", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  const metrics = page.locator(".admin-metric-card");
  await expect(metrics.filter({ hasText: "Open Balance" })).toContainText(
    "$950",
  );
  const pastDueCard = metrics.filter({ hasText: "Past Due" });
  await expect(pastDueCard).toContainText("$400");
  await expect(pastDueCard).toContainText("1 invoice");
  await expect(pastDueCard).toHaveClass(/tone-attention/);
  const paidCard = metrics.filter({ hasText: "Paid This Period" });
  await expect(paidCard).toContainText("$500");
  await expect(paidCard).toContainText("1 payment");
  await expect(metrics.filter({ hasText: "Draft Invoices" })).toContainText(
    "Awaiting review",
  );
});

test("Create Invoice remains available", async ({ page }) => {
  await page.goto("/admin/billing/");
  await page.getByRole("button", { name: "+ Create Invoice" }).click();
  await expect(
    page.getByRole("dialog", { name: "Create invoice" }),
  ).toBeVisible();
});

test("search filters the invoice tracker", async ({ page }) => {
  await page.goto("/admin/billing/");
  await page.locator(".admin-search input").fill("2002");
  await expect(page.getByText("INV-2002")).toBeVisible();
  await expect(page.getByText("INV-2001")).toHaveCount(0);
  await expect(page.locator(".billing-status-nav-count")).toContainText(
    "1 invoice",
  );
});

test("status filter narrows the tracker to the selected status", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  await filterSelect(page, "Status").selectOption("Paid");
  await expect(page.getByText("INV-2001")).toBeVisible();
  await expect(page.getByText("INV-2002")).toHaveCount(0);
  await expect(page.getByText("INV-2003")).toHaveCount(0);
  await expect(page.getByText("INV-2004")).toHaveCount(0);
});

test("client filter narrows the tracker to the selected client", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  await filterSelect(page, "Client").selectOption("Cedar Consulting");
  await expect(page.getByText("INV-2002")).toBeVisible();
  await expect(page.getByText("INV-2004")).toBeVisible();
  await expect(page.getByText("INV-2001")).toHaveCount(0);
  await expect(page.getByText("INV-2003")).toHaveCount(0);
});

test("sort control reorders the tracker using existing invoice data", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  await filterSelect(page, "Sort by").selectOption("balance");
  const firstRowInvoiceNumber = page
    .locator("tbody tr")
    .first()
    .locator(".billing-invoice-link");
  // Highest balance among the fixture invoices is INV-2003 ($400).
  await expect(firstRowInvoiceNumber).toHaveText("INV-2003");
});

test("status tabs filter the tracker and update the result count", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  await statusTab(page, "Past Due").click();
  await expect(page.getByText("INV-2003")).toBeVisible();
  await expect(page.getByText("INV-2001")).toHaveCount(0);
  await expect(page.locator(".billing-status-nav-count")).toContainText(
    "1 invoice",
  );

  await statusTab(page, "Drafts").click();
  await expect(page.getByText("INV-2004")).toBeVisible();
  await expect(page.getByText("INV-2003")).toHaveCount(0);
});

test("Clear resets search, filters, sort, and the active tab", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  await page.locator(".admin-search input").fill("2002");
  await filterSelect(page, "Status").selectOption("Issued");
  await filterSelect(page, "Client").selectOption("Cedar Consulting");
  await statusTab(page, "Past Due").click();
  await page.getByRole("button", { name: "Clear" }).click();

  await expect(page.locator(".admin-search input")).toHaveValue("");
  await expect(filterSelect(page, "Status")).toHaveValue("All");
  await expect(filterSelect(page, "Client")).toHaveValue("All");
  await expect(statusTab(page, "All Invoices")).toHaveClass(/active/);
  await expect(page.getByText("INV-2001")).toBeVisible();
  await expect(page.getByText("INV-2002")).toBeVisible();
  await expect(page.getByText("INV-2003")).toBeVisible();
  await expect(page.getByText("INV-2004")).toBeVisible();
});

test("invoice View action routes to the invoice detail page", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  await page
    .locator("tr", { hasText: "INV-2001" })
    .getByRole("button", { name: "View" })
    .click();
  await expect(page).toHaveURL(/\/admin\/billing\/invoices\/101\/?$/);
});

test("invoice number link also routes to the invoice detail page", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  await page.getByRole("button", { name: "INV-2003", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/billing\/invoices\/103\/?$/);
});

test("existing Print/Export action remains accessible from the row overflow menu", async ({
  page,
}) => {
  await page.goto("/admin/billing/");
  const row = page.locator("tr", { hasText: "INV-2001" });
  await row.getByLabel(/More actions for invoice/).click();
  const printAction = page.getByRole("menuitem", { name: "Print / Export" });
  await expect(printAction).toBeVisible();
  await printAction.click();
  await expect(page).toHaveURL(/\/admin\/billing\/invoices\/101\/?$/);
});

test("responsive structure keeps critical Billing controls available at narrow widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/admin/billing/");
  await expect(
    page.getByRole("button", { name: "+ Create Invoice" }),
  ).toBeVisible();
  await expect(page.locator(".admin-search input")).toBeVisible();
  await expect(statusTab(page, "All Invoices")).toBeVisible();
  await expect(
    page.locator("tr", { hasText: "INV-2001" }).getByRole("button", {
      name: "View",
    }),
  ).toBeVisible();
  const overflows = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflows).toBeFalsy();
});

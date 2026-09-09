import { test, expect } from "@playwright/test";

// Fixture dated around the repo's treated "today" of 2026-09-09 so
// due-date / partially-paid derivations resolve predictably.
const baseRecords = {
  clients: [
    {
      id: 1,
      display_name: "North Harbor Studio",
      legal_name: "North Harbor Studio LLC",
      client_type: "business",
      primary_email: "hello@example.test",
      primary_phone: "555-0100",
      status: "active",
      portal_status: "active",
      updated_at: "2026-09-05",
    },
  ],
  services: [],
  engagements: [
    {
      id: 11,
      client_id: 1,
      title: "Business Consulting",
      status: "active",
      start_date: "2026-06-01",
    },
  ],
  tasks: [],
  documents: [],
  invoices: [
    {
      id: 301,
      public_id: "inv-301",
      invoice_number: "INV-3001",
      client_id: 1,
      engagement_id: 11,
      invoice_date: "2026-08-20",
      due_date: "2026-09-25",
      status: "partially_paid",
      currency: "USD",
      subtotal: 1200,
      adjustment_total: 0,
      credit_deposit_total: 0,
      paid_total: 500,
      client_facing_notes: "Thank you for your business.",
      internal_notes: "Client requested extended terms.",
      line_items: [
        {
          id: "li-1",
          service_code: "BOOK-100",
          description: "Bookkeeping - August",
          quantity: 1,
          unit_price: 1200,
          amount: 1200,
        },
      ],
    },
    {
      id: 302,
      public_id: "inv-302",
      invoice_number: "INV-3002",
      client_id: 1,
      engagement_id: 11,
      invoice_date: "2026-09-01",
      due_date: "2026-09-30",
      status: "open",
      currency: "USD",
      subtotal: 600,
      adjustment_total: 0,
      credit_deposit_total: 0,
      paid_total: 0,
      client_facing_notes: "",
      internal_notes: "",
      line_items: [
        {
          id: "li-2",
          service_code: "",
          description: "Consulting session",
          quantity: 2,
          unit_price: 300,
          amount: 600,
        },
      ],
    },
  ],
  payments: [
    {
      id: 501,
      invoice_id: 301,
      client_id: 1,
      payment_date: "2026-08-25",
      amount: 500,
      payment_method: "ach",
      external_reference: "REF-1200",
    },
  ],
  leads: [],
  appointments: [],
};

async function mockAdmin(page, { records = baseRecords, onPayment } = {}) {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const key = url.searchParams.get("route");
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
    if (key === "payments" && route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      onPayment?.(body);
      await route.fulfill({
        json: { data: { id: 999, amount: body.amount, duplicate: false } },
        status: 201,
      });
      return;
    }
    const data = records[key] ?? [];
    await route.fulfill({ json: { data } });
  });
}

test("invoice detail loads real invoice, client, and engagement data", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/billing/invoices/301");
  await expect(
    page.getByRole("heading", { level: 1, name: "Invoice INV-3001" }),
  ).toBeVisible();
  await expect(
    page.getByText("North Harbor Studio · Business Consulting"),
  ).toBeVisible();
});

test("financial overview and metadata render calculated, non-fabricated values", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/billing/invoices/301");
  const metrics = page.locator(".admin-metric-card");
  await expect(metrics.filter({ hasText: "Invoice total" })).toContainText(
    "$1,200",
  );
  await expect(metrics.filter({ hasText: "Paid" })).toContainText("$500");
  await expect(metrics.filter({ hasText: "Balance due" })).toContainText(
    "$700",
  );
  await expect(metrics.filter({ hasText: "Balance due" })).toHaveClass(
    /tone-attention/,
  );
  await expect(
    page.locator(".status-pill", { hasText: "Partially Paid" }),
  ).toBeVisible();
  const metaPanel = page.locator(".invoice-meta-panel");
  await expect(metaPanel.getByText("North Harbor Studio LLC")).toBeVisible();
  await expect(metaPanel.getByText("Business Consulting")).toBeVisible();
});

test("line items table renders description-first columns with real amounts", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/billing/invoices/301");
  const lineItemsPanel = page.locator(".invoice-line-items-panel");
  const headerRow = lineItemsPanel.locator("thead tr");
  await expect(headerRow.getByRole("columnheader")).toHaveText([
    "Description",
    "Qty",
    "Rate",
    "Amount",
    "Service code",
  ]);
  const row = lineItemsPanel.locator("tbody tr", {
    hasText: "Bookkeeping - August",
  });
  await expect(row).toContainText("$1,200");
  await expect(row).toContainText("BOOK-100");
});

test("payment history lists existing payments and an empty invoice shows an intentional empty state", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/billing/invoices/301");
  const historyPanel = page.locator(".invoice-payment-panel", {
    hasText: "Payment history",
  });
  await expect(historyPanel.getByText("REF-1200")).toBeVisible();
  await expect(historyPanel.getByText("$500")).toBeVisible();

  await page.goto("/admin/billing/invoices/302");
  await expect(page.getByText("No payments recorded yet.")).toBeVisible();
});

test("Record payment opens as an on-demand panel and Cancel closes it without submitting", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/billing/invoices/301");
  await expect(page.getByLabel("Amount")).toHaveCount(0);

  await page.getByRole("button", { name: "+ Record payment" }).click();
  const amountInput = page.getByLabel("Amount");
  await expect(amountInput).toBeVisible();
  await expect(amountInput).toBeFocused();
  await expect(page.getByLabel("Payment date")).toBeVisible();
  await expect(page.getByLabel("Method")).toBeVisible();
  await expect(page.getByLabel("Reference")).toBeVisible();
  await expect(page.getByLabel("Internal note")).toBeVisible();

  await amountInput.fill("50");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByLabel("Amount")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "+ Record payment" }),
  ).toBeVisible();
});

test("invalid payment amount is rejected client-side without a request", async ({
  page,
}) => {
  await mockAdmin(page);
  let called = false;
  await page.route("**/alchemize-api.php?route=payments", async (route) => {
    if (route.request().method() === "POST") called = true;
    await route.fallback();
  });
  await page.goto("/admin/billing/invoices/301");
  await page.getByRole("button", { name: "+ Record payment" }).click();
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Enter a valid payment amount.")).toBeVisible();
  expect(called).toBe(false);
});

test("recording a payment sends the correct payload and updates totals, history, and status from the response", async ({
  page,
}) => {
  let payload = null;
  await mockAdmin(page, {
    onPayment: (body) => {
      payload = body;
    },
  });
  await page.goto("/admin/billing/invoices/301");
  await page.getByRole("button", { name: "+ Record payment" }).click();
  await page.getByLabel("Amount").fill("700");
  await page.getByLabel("Reference").fill("REF-FINAL");
  await page.getByRole("button", { name: "Record payment" }).click();

  await expect(page.getByText("Payment of $700 recorded.")).toBeVisible();
  await expect(page.getByLabel("Amount")).toHaveCount(0);

  expect(payload.invoice_id).toBe(301);
  expect(payload.client_id).toBe(1);
  expect(payload.amount).toBe(700);
  expect(payload.external_reference).toBe("REF-FINAL");

  const metrics = page.locator(".admin-metric-card");
  await expect(metrics.filter({ hasText: "Balance due" })).toContainText("$0");
  await expect(page.locator(".status-pill")).toContainText("Paid");
  await expect(page.getByText("REF-FINAL")).toBeVisible();
});

test("backend validation errors are surfaced verbatim", async ({ page }) => {
  await mockAdmin(page);
  await page.route("**/alchemize-api.php?route=payments", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 422,
      json: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Payment exceeds the remaining balance on this invoice.",
        },
      },
    });
  });
  await page.goto("/admin/billing/invoices/301");
  await page.getByRole("button", { name: "+ Record payment" }).click();
  await page.getByLabel("Amount").fill("5000");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(
    page.getByText("Payment exceeds the remaining balance on this invoice."),
  ).toBeVisible();
});

test("notes and activity separates client-facing notes from the internal memo", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/billing/invoices/301");
  const notesBody = page.locator(".invoice-notes-body");
  await expect(
    notesBody.getByText("Thank you for your business."),
  ).toBeVisible();
  await expect(page.getByText("Client requested extended terms.")).toHaveCount(
    0,
  );

  await page.getByRole("tab", { name: "Internal memo" }).click();
  await expect(
    notesBody.getByText("Client requested extended terms."),
  ).toBeVisible();
  await expect(page.getByText("Internal only")).toBeVisible();
});

test("Print/Export remains available and the print stylesheet reveals the branded invoice", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/billing/invoices/301");
  const printButton = page.getByRole("button", { name: "Print / Export" });
  await expect(printButton).toBeVisible();

  await expect(page.locator(".invoice-print-sheet")).toBeHidden();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".invoice-print-sheet")).toBeVisible();
  await expect(page.locator(".invoice-print-sheet")).toContainText(
    "Alchemize Business Services",
  );
  await expect(page.locator(".invoice-print-sheet")).toContainText("INV-3001");
  await expect(page.locator(".portal-sidebar")).toBeHidden();
  await page.emulateMedia({ media: "screen" });
});

test("invoice not found shows a friendly message instead of crashing", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/billing/invoices/9999");
  await expect(
    page.getByRole("heading", { level: 1, name: "Invoice not found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "← Back to billing" }).click();
  await expect(page).toHaveURL(/\/admin\/billing\/?$/);
});

test("responsive layout keeps status, totals, and actions available at narrow widths", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/admin/billing/invoices/301");
  await expect(
    page.getByRole("heading", { level: 1, name: "Invoice INV-3001" }),
  ).toBeVisible();
  await expect(
    page.locator(".status-pill", { hasText: "Partially Paid" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Print / Export" }),
  ).toBeVisible();
  await expect(
    page.locator(".admin-metric-card").filter({ hasText: "Balance due" }),
  ).toBeVisible();
  const overflows = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflows).toBeFalsy();
});

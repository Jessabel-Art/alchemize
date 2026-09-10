import { test, expect } from "@playwright/test";

function invoiceFixture(overrides = {}) {
  return {
    id: "inv-301",
    invoice_number: "INV-3001",
    invoice_date: "2026-08-20",
    due_date: "2026-09-25",
    status: "partially_paid",
    currency: "USD",
    subtotal: "1200.00",
    adjustment_total: "0.00",
    credit_deposit_total: "0.00",
    paid_total: "500.00",
    outstanding_balance: "700.00",
    client_facing_notes: "Thank you for your business.",
    issued_at: "2026-08-20 00:00:00",
    engagement_id: "eng-1",
    engagement_title: "Business Consulting",
    client_display_name: "North Harbor Studio",
    client_email: "hello@example.test",
    client_phone: "555-0100",
    line_items: [
      {
        id: "li-1",
        description: "Bookkeeping - August",
        quantity: "1.00",
        unit_price: "1200.00",
        amount: "1200.00",
      },
    ],
    payments: [
      {
        id: "pay-501",
        payment_date: "2026-08-25",
        amount: "500.00",
        payment_method: "ach",
        receipt_url: null,
      },
    ],
    ...overrides,
  };
}

async function setup(
  page,
  { invoiceDetail = invoiceFixture(), status = 200 } = {},
) {
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
    if (path === "portal/billing")
      data = {
        invoices: [invoiceFixture()],
        payments: [],
        summary: { open_balance: "700.00" },
      };
    if (path === `portal/billing/${invoiceFixture().id}`) {
      if (status !== 200) {
        await route.fulfill({
          status,
          json: {
            error: { code: "NOT_FOUND", message: "The invoice was not found." },
          },
        });
        return;
      }
      data = { invoice: invoiceDetail };
    }
    await route.fulfill({ json: { data } });
  });
}

test("clicking View invoice on Billing navigates to the invoice route instead of printing the Billing page", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/client-portal/billing/");
  await page.evaluate(() => {
    window.__printCalls = 0;
    window.print = () => {
      window.__printCalls += 1;
    };
  });
  await page.getByRole("link", { name: "View invoice", exact: true }).click();
  await expect(page).toHaveURL(
    /\/client-portal\/billing\/invoices\/inv-301\/?$/,
  );
  const printCalls = await page.evaluate(() => window.__printCalls);
  expect(printCalls).toBe(0);
});

// Computed the same way InvoiceDocument's formatDate() renders it (mirrors
// the identical helper in tests/admin-invoice-detail.spec.js), so date
// assertions are not tied to the test runner's local timezone offset.
const dateLabel = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

test("client invoice detail renders the shared canonical invoice document with real data", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/client-portal/billing/invoices/inv-301");
  const sheet = page.locator(".invoice-print-sheet");
  await expect(sheet).toBeVisible();
  // The same structural classes the Admin invoice document uses — proof
  // both surfaces render through the one shared component, not a second
  // hand-built template.
  await expect(sheet.locator(".invoice-print-header")).toBeVisible();
  await expect(sheet.locator(".invoice-print-parties")).toBeVisible();
  await expect(sheet.locator(".invoice-print-table")).toBeVisible();
  await expect(sheet.locator(".invoice-print-balance")).toBeVisible();
  await expect(sheet.locator(".invoice-print-footer")).toBeVisible();

  await expect(sheet.getByText("INV-3001")).toBeVisible();
  await expect(sheet).toContainText(dateLabel("2026-08-20")); // issue date
  await expect(sheet).toContainText(dateLabel("2026-09-25")); // due date
  await expect(sheet.getByText("Bill To")).toBeVisible();
  await expect(sheet.getByText("North Harbor Studio")).toBeVisible();
  await expect(sheet.getByText("From")).toBeVisible();
  await expect(
    sheet.getByText("Alchemize Business Services").first(),
  ).toBeVisible();
  await expect(sheet.getByText("Bookkeeping - August")).toBeVisible();
  await expect(
    sheet.getByText("Thank you for your business.", { exact: true }),
  ).toBeVisible();
});

test("invoice totals and line items match the same canonical figures Admin renders for this fixture", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/client-portal/billing/invoices/inv-301");
  const sheet = page.locator(".invoice-print-sheet");
  const totals = sheet.locator(".invoice-print-totals");
  await expect(totals).toContainText("$1,200.00"); // subtotal
  await expect(totals).toContainText("-$500.00"); // payments reduce the total
  await expect(sheet.locator(".invoice-print-balance")).toContainText(
    "$700.00",
  ); // balance due = 1200 - 500, identical to the Admin fixture's own totals
});

test("client invoice detail excludes admin-only fields and controls even if the API response carried them", async ({
  page,
}) => {
  // Simulates a backend regression that accidentally includes admin-only
  // columns in the response, proving the frontend mapping never reads or
  // renders them regardless (defense in depth beyond the backend's own
  // column-level exclusion, already covered by tests/php/portal-invoice-detail.php).
  await setup(page, {
    invoiceDetail: invoiceFixture({
      internal_notes: "Client requested extended terms.",
      internal_memo: "Staff-only collections memo.",
      reconciliation_status: "unreconciled",
    }),
  });
  await page.goto("/client-portal/billing/invoices/inv-301");
  await expect(page.locator(".invoice-print-sheet")).toBeVisible();
  await expect(page.getByText("Client requested extended terms.")).toHaveCount(
    0,
  );
  await expect(page.getByText("Staff-only collections memo.")).toHaveCount(0);
  await expect(page.getByText("unreconciled")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Record payment" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Acknowledge" })).toHaveCount(
    0,
  );
});

test("a client cannot open another client's invoice", async ({ page }) => {
  await setup(page, { status: 404 });
  await page.goto("/client-portal/billing/invoices/inv-301");
  await expect(
    page.getByText("The invoice was not found.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".invoice-print-sheet")).toHaveCount(0);
});

test("printing hides portal navigation/header chrome and shows only the invoice document", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/client-portal/billing/invoices/inv-301");
  await expect(page.locator(".invoice-print-sheet")).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".portal-sidebar")).toBeHidden();
  await expect(page.locator(".portal-page-header")).toBeHidden();
  await expect(page.locator(".portal-action-group")).toBeHidden();
  await expect(page.locator(".invoice-print-sheet")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
});

for (const width of [1440, 834, 390])
  test(`invoice document has no horizontal overflow at ${width}px in print layout`, async ({
    page,
  }) => {
    await setup(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/client-portal/billing/invoices/inv-301");
    await page.emulateMedia({ media: "print" });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.emulateMedia({ media: "screen" });
  });

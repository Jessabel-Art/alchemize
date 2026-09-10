import { test, expect } from "@playwright/test";

// Node's global timer, used only to simulate network latency for the
// "only the clicked button is busy" test.
// eslint-disable-next-line no-undef
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A minimal stand-in for the real https://www.paypal.com/sdk/js Smart
// Buttons SDK: it renders one real, clickable button that, on click, runs
// the same createOrder -> onApprove/onError contract the real SDK drives,
// so the app's own PayPal wiring (not PayPal's UI) is what's under test.
const FAKE_PAYPAL_SDK = `
window.paypal = {
  Buttons: function (config) {
    return {
      render: function (container) {
        var button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-testid", "paypal-sdk-button");
        button.textContent = "PayPal (test)";
        button.addEventListener("click", function () {
          Promise.resolve()
            .then(function () { return config.createOrder(); })
            .then(function (orderId) {
              return config.onApprove({ orderID: orderId });
            })
            .catch(function (error) {
              if (config.onError) config.onError(error);
            });
        });
        container.appendChild(button);
        return Promise.resolve();
      },
    };
  },
};
`;

async function mockPaypalSdk(page) {
  await page.route("https://www.paypal.com/sdk/js**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: FAKE_PAYPAL_SDK,
    }),
  );
}

async function setup(
  page,
  {
    invoices = [],
    payments = [],
    checkoutResponse = null,
    paypalClientId = "",
    paypalOrderResponse = null,
    paypalCaptureResponse = null,
    paypalOrderDelayMs = 0,
    checkoutDelayMs = 0,
  } = {},
) {
  const requests = [];
  const paypalRequests = [];
  const openBalance = invoices
    .filter((item) =>
      ["open", "partially_paid", "past_due"].includes(item.status),
    )
    .reduce((sum, item) => sum + Number(item.outstanding_balance || 0), 0);
  if (paypalClientId) await mockPaypalSdk(page);
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const path = url.searchParams.get("route");
    const request = route.request();
    let data = {};
    if (path === "auth/session")
      data = {
        authenticated: true,
        user: { role_slug: "client" },
        csrf_token: "csrf",
      };
    if (path === "portal/billing")
      data = {
        invoices,
        payments,
        summary: { open_balance: openBalance.toFixed(2) },
        paypal_client_id: paypalClientId,
      };
    if (path?.match(/^portal\/billing\/.+\/checkout$/)) {
      const contentType = request.headers()["content-type"] || "";
      requests.push({
        path,
        method: request.method(),
        contentType,
        csrf: request.headers()["x-csrf-token"],
        body: request.postData(),
      });
      // Mirror the real backend's alchemize_decode_json_request() contract:
      // every non-GET request must carry Content-Type: application/json,
      // regardless of whether the route itself reads the body.
      if (!contentType.startsWith("application/json")) {
        await route.fulfill({
          status: 415,
          json: {
            error: {
              code: "UNSUPPORTED_MEDIA_TYPE",
              message: "Content-Type must be application/json.",
            },
          },
        });
        return;
      }
      if (checkoutDelayMs) await delay(checkoutDelayMs);
      if (checkoutResponse) {
        await route.fulfill(checkoutResponse);
        return;
      }
      data = { checkout_url: "https://checkout.example/session-123" };
    }
    if (path?.match(/^portal\/billing\/.+\/paypal\/order$/)) {
      const contentType = request.headers()["content-type"] || "";
      paypalRequests.push({
        kind: "order",
        path,
        method: request.method(),
        contentType,
        csrf: request.headers()["x-csrf-token"],
        body: request.postData(),
      });
      if (!contentType.startsWith("application/json")) {
        await route.fulfill({
          status: 415,
          json: {
            error: {
              code: "UNSUPPORTED_MEDIA_TYPE",
              message: "Content-Type must be application/json.",
            },
          },
        });
        return;
      }
      if (paypalOrderDelayMs) await delay(paypalOrderDelayMs);
      if (paypalOrderResponse) {
        await route.fulfill(paypalOrderResponse);
        return;
      }
      data = { order_id: "PAYPAL-ORDER-1", status: "created" };
    }
    if (path?.match(/^portal\/billing\/.+\/paypal\/capture$/)) {
      const contentType = request.headers()["content-type"] || "";
      paypalRequests.push({
        kind: "capture",
        path,
        method: request.method(),
        contentType,
        csrf: request.headers()["x-csrf-token"],
        body: request.postData(),
      });
      if (paypalCaptureResponse) {
        await route.fulfill(paypalCaptureResponse);
        return;
      }
      data = {
        order_id: "PAYPAL-ORDER-1",
        capture_id: "PAYPAL-CAPTURE-1",
        status: "completed",
      };
    }
    await route.fulfill({ json: { data } });
  });
  return { requests, paypalRequests };
}

function invoiceFixture(overrides = {}) {
  return {
    id: "inv-1",
    invoice_number: "INV-1788541713348",
    invoice_date: "2026-09-03",
    due_date: "2026-09-17",
    status: "partially_paid",
    currency: "USD",
    subtotal: "199.00",
    adjustment_total: "0.00",
    credit_deposit_total: "0.00",
    paid_total: "20.00",
    outstanding_balance: "179.00",
    engagement_title: "Business Consulting",
    ...overrides,
  };
}

function paymentFixture(overrides = {}) {
  return {
    id: "pay-1",
    payment_date: "2026-09-03",
    amount: "20.00",
    payment_method: "cash",
    receipt_url: null,
    invoice_id: "inv-1",
    invoice_number: "INV-1788541713348",
    ...overrides,
  };
}

test("billing summary metrics are derived from live invoice and payment data", async ({
  page,
}) => {
  await setup(page, {
    invoices: [invoiceFixture()],
    payments: [paymentFixture()],
  });
  await page.goto("/client-portal/billing/");
  await expect(
    page.getByRole("heading", { name: "Billing", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Current balance")).toBeVisible();
  await expect(
    page
      .locator("section")
      .filter({ hasText: "Current balance" })
      .getByText("$179.00", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("1 invoice partially paid", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Total invoices")).toBeVisible();
  await expect(page.getByText("Payments made")).toBeVisible();
  await expect(
    page.getByText("Total payments: $20.00", { exact: true }),
  ).toBeVisible();
});

test("open invoice renders real balance, paid, and remaining amounts with a status badge", async ({
  page,
}) => {
  await setup(page, { invoices: [invoiceFixture()], payments: [] });
  await page.goto("/client-portal/billing/");
  const card = page
    .locator(".bill-invoice-card")
    .filter({ hasText: "INV-1788541713348" });
  await expect(card).toBeVisible();
  await expect(card.getByText("Partially paid")).toBeVisible();
  await expect(card).toContainText("Business Consulting");
  await expect(card).toContainText("Issued Sep 3, 2026");
  await expect(card).toContainText("Due Sep 17, 2026");
  await expect(card.getByText("$179.00", { exact: true })).toBeVisible();
  await expect(card.getByText("$20.00 paid", { exact: true })).toBeVisible();
  await expect(
    card.getByText("$179.00 remaining", { exact: true }),
  ).toBeVisible();
});

test("pay with Stripe sends a well-formed POST + JSON body and redirects to the real checkout URL", async ({
  page,
}) => {
  const { requests } = await setup(page, {
    invoices: [invoiceFixture()],
    payments: [],
  });
  await page.route("https://checkout.example/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html><body>checkout</body></html>",
    }),
  );
  await page.goto("/client-portal/billing/");
  const payButton = page.getByRole("button", {
    name: "Pay with Stripe",
    exact: true,
  });
  await expect(payButton).toBeVisible();
  await Promise.all([
    page.waitForURL("https://checkout.example/session-123"),
    payButton.click(),
  ]);
  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe("POST");
  expect(requests[0].contentType).toContain("application/json");
  expect(requests[0].body).toBe("{}");
  expect(requests[0].csrf).toBe("csrf");
});

test("a Stripe checkout failure (e.g. another client's invoice, or a provider error) is surfaced, not silently swallowed", async ({
  page,
}) => {
  await setup(page, {
    invoices: [invoiceFixture()],
    payments: [],
    checkoutResponse: {
      status: 404,
      json: {
        error: {
          code: "NOT_FOUND",
          message: "The payable invoice was not found.",
        },
      },
    },
  });
  await page.goto("/client-portal/billing/");
  const payButton = page.getByRole("button", {
    name: "Pay with Stripe",
    exact: true,
  });
  await payButton.click();
  await expect(
    page.getByText("The payable invoice was not found.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/client-portal\/billing\/?$/);
  // The invoice and its other payment option remain usable after a failure.
  await expect(payButton).toBeEnabled();
});

test("an unpaid/partially-paid invoice shows both Stripe and PayPal payment options", async ({
  page,
}) => {
  await setup(page, {
    invoices: [invoiceFixture()],
    payments: [],
    paypalClientId: "sb-client-id",
  });
  await page.goto("/client-portal/billing/");
  const card = page
    .locator(".bill-invoice-card")
    .filter({ hasText: "INV-1788541713348" });
  await expect(
    card.getByRole("button", { name: "Pay with Stripe", exact: true }),
  ).toBeVisible();
  await expect(card.getByText("Pay with PayPal")).toBeVisible();
  await expect(card.getByTestId("paypal-sdk-button")).toBeVisible();
});

test("a fully-paid invoice shows neither payment button", async ({ page }) => {
  await setup(page, {
    invoices: [invoiceFixture({ status: "paid", outstanding_balance: "0.00" })],
    payments: [],
    paypalClientId: "sb-client-id",
  });
  await page.goto("/client-portal/billing/");
  await expect(
    page.getByRole("button", { name: "Pay with Stripe" }),
  ).toHaveCount(0);
  await expect(page.getByText("Pay with PayPal")).toHaveCount(0);
});

test("the PayPal button creates an order at the correct endpoint using the remaining balance, and approval captures the payment", async ({
  page,
}) => {
  const { paypalRequests } = await setup(page, {
    invoices: [invoiceFixture()],
    payments: [],
    paypalClientId: "sb-client-id",
  });
  await page.goto("/client-portal/billing/");
  const card = page
    .locator(".bill-invoice-card")
    .filter({ hasText: "INV-1788541713348" });
  await card.getByTestId("paypal-sdk-button").click();
  await expect(page.getByText("PayPal payment completed.")).toBeVisible();

  expect(paypalRequests).toHaveLength(2);
  const [orderRequest, captureRequest] = paypalRequests;
  expect(orderRequest.kind).toBe("order");
  expect(orderRequest.path).toBe("portal/billing/inv-1/paypal/order");
  expect(orderRequest.method).toBe("POST");
  expect(orderRequest.contentType).toContain("application/json");
  expect(orderRequest.csrf).toBe("csrf");
  expect(captureRequest.kind).toBe("capture");
  expect(captureRequest.path).toBe("portal/billing/inv-1/paypal/capture");
  expect(JSON.parse(captureRequest.body)).toEqual({
    order_id: "PAYPAL-ORDER-1",
  });
});

test("a PayPal order-creation failure is surfaced without breaking the Billing page, and Stripe remains available", async ({
  page,
}) => {
  await setup(page, {
    invoices: [invoiceFixture()],
    payments: [],
    paypalClientId: "sb-client-id",
    paypalOrderResponse: {
      status: 503,
      json: {
        error: {
          code: "INTEGRATION_UNAVAILABLE",
          message: "PayPal payment is temporarily unavailable.",
        },
      },
    },
  });
  await page.goto("/client-portal/billing/");
  const card = page
    .locator(".bill-invoice-card")
    .filter({ hasText: "INV-1788541713348" });
  await card.getByTestId("paypal-sdk-button").click();
  await expect(
    page.getByText("PayPal payment is temporarily unavailable.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/client-portal\/billing\/?$/);
  await expect(
    card.getByRole("button", { name: "Pay with Stripe", exact: true }),
  ).toBeEnabled();
});

test("only the clicked payment button enters a loading state", async ({
  page,
}) => {
  await setup(page, {
    invoices: [invoiceFixture()],
    payments: [],
    paypalClientId: "sb-client-id",
    paypalOrderDelayMs: 600,
  });
  await page.goto("/client-portal/billing/");
  const card = page
    .locator(".bill-invoice-card")
    .filter({ hasText: "INV-1788541713348" });
  const stripeButton = card.getByRole("button", {
    name: "Pay with Stripe",
    exact: true,
  });
  await card.getByTestId("paypal-sdk-button").click();
  await expect(card.getByText("Opening PayPal…")).toBeVisible();
  // The Stripe option is disabled while PayPal checkout is being created,
  // but PayPal's own busy state doesn't relabel the Stripe button.
  await expect(stripeButton).toBeDisabled();
  await expect(stripeButton).toHaveText("Pay with Stripe");
});

test("payment history table renders real records, a receipt link when present, and a computed total", async ({
  page,
}) => {
  const payments = [
    paymentFixture({
      id: "pay-1",
      amount: "20.00",
      payment_method: "cash",
      receipt_url: null,
    }),
    paymentFixture({
      id: "pay-2",
      amount: "30.50",
      payment_method: "card",
      receipt_url: "https://receipts.example/pay-2.pdf",
      invoice_number: "INV-2",
    }),
  ];
  await setup(page, { invoices: [invoiceFixture()], payments });
  await page.goto("/client-portal/billing/");
  const table = page.locator(".bill-payment-table");
  await expect(table).toBeVisible();
  const rows = table.locator("tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("$20.00");
  await expect(rows.nth(0)).toContainText("Cash");
  await expect(rows.nth(0)).toContainText("—");
  await expect(rows.nth(1)).toContainText("$30.50");
  await expect(
    rows.nth(1).getByRole("link", { name: "Receipt" }),
  ).toHaveAttribute("href", "https://receipts.example/pay-2.pdf");
  await expect(table.locator(".bill-total-label")).toHaveText("Total payments");
  await expect(table.locator(".bill-total-value")).toHaveText("$50.50");
});

test("empty states render for no open invoices and no payment history without oversized blank cards", async ({
  page,
}) => {
  await setup(page, {
    invoices: [invoiceFixture({ status: "paid", outstanding_balance: "0.00" })],
    payments: [],
  });
  await page.goto("/client-portal/billing/");
  await expect(
    page.getByText("There is currently no outstanding balance."),
  ).toBeVisible();
  await expect(
    page.getByText("Recorded payments will appear here."),
  ).toBeVisible();
  await expect(page.locator(".bill-invoice-card")).toHaveCount(0);
  await expect(page.locator(".bill-payment-table")).toHaveCount(0);
});

test("right rail shows billing at a glance and payment methods without fabricated stored cards", async ({
  page,
}) => {
  await setup(page, { invoices: [invoiceFixture()], payments: [] });
  await page.goto("/client-portal/billing/");
  await expect(page.getByText("Billing at a glance")).toBeVisible();
  await expect(page.getByText("Payment methods")).toBeVisible();
  await expect(
    page.getByText(/redirected to a secure checkout page/i),
  ).toBeVisible();
  await expect(page.getByText(/\*{4}\s*\d{4}/)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Contact billing/ }).first(),
  ).toHaveAttribute("href", /^mailto:billing@getalchemize\.com/);
});

for (const width of [1440, 834, 390])
  test(`billing responsive layout at ${width}px`, async ({ page }) => {
    await setup(page, {
      invoices: [
        invoiceFixture(),
        invoiceFixture({
          id: "inv-2",
          invoice_number: "INV-2",
          status: "past_due",
        }),
      ],
      payments: [
        paymentFixture(),
        paymentFixture({ id: "pay-2", invoice_number: "INV-2" }),
      ],
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/client-portal/billing/");
    await expect(
      page.getByRole("heading", { name: "Billing", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

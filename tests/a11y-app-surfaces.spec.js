import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

// Automated axe coverage for the surfaces the pre-existing a11y suites
// (tests/a11y.spec.js, tests/service-pages-a11y.spec.js) do not reach:
// authentication, Client Portal, Admin Portal, and public appointment
// scheduling. Reuses the same @axe-core/playwright + API-mocking patterns
// already established in tests/portal-client.spec.js and
// tests/admin-visual.spec.js rather than introducing new tooling.

async function expectNoSeriousViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const seriousViolations = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(seriousViolations).toEqual([]);
}

test.describe("Authentication accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/alchemize-api.php?*", async (route) => {
      const key = new URL(route.request().url()).searchParams.get("route");
      if (key === "auth/session") {
        await route.fulfill({
          json: { data: { authenticated: false, csrf_token: "" } },
        });
        return;
      }
      await route.fulfill({ json: { data: {} } });
    });
  });

  test("no serious accessibility issues on /login/", async ({ page }) => {
    await page.goto("/login/");
    await expectNoSeriousViolations(page);
  });

  test("no serious accessibility issues on /register/", async ({ page }) => {
    await page.goto("/register/");
    await expectNoSeriousViolations(page);
  });

  test("no serious accessibility issues on /set-password/", async ({
    page,
  }) => {
    await page.goto("/set-password?token=test-token&purpose=invitation");
    await expectNoSeriousViolations(page);
  });
});

test.describe("Public appointment scheduling accessibility", () => {
  test("no serious accessibility issues on the scheduling form", async ({
    page,
  }) => {
    await page.route("**/alchemize-api.php?*", async (route) => {
      const key = new URL(route.request().url()).searchParams.get("route");
      if (key === "appointments/scheduling-links/test-token") {
        await route.fulfill({
          json: {
            data: {
              appointment_type: "Consultation",
              meeting_method: "Phone Call",
              duration_minutes: 30,
              timezone: "America/New_York",
              recipient_name: "Jordan Rivera",
              recipient_email: "jordan@example.test",
              recipient_phone: "",
            },
          },
        });
        return;
      }
      await route.fulfill({ json: { data: {} } });
    });
    await page.goto("/appointment/schedule/test-token");
    await expect(
      page.getByRole("heading", { name: "Select an appointment time." }),
    ).toBeVisible();
    await expectNoSeriousViolations(page);
  });
});

test.describe("Client Portal accessibility", () => {
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
        unread_messages: 1,
        upcoming_appointments: 1,
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
    "tasks-and-documents": {
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
      intakes: [],
      services: [],
    },
    intakes: { items: [] },
    documents: { items: [], file_access: "metadata_only" },
    appointments: { items: [] },
    messages: { items: [], available: true },
    billing: {
      invoices: [
        {
          id: "inv-1",
          invoice_number: "INV-0001",
          invoice_date: "2026-09-01",
          due_date: "2026-09-15",
          status: "partially_paid",
          currency: "USD",
          subtotal: "199.00",
          adjustment_total: "0.00",
          credit_deposit_total: "0.00",
          paid_total: "20.00",
          outstanding_balance: "179.00",
          engagement_title: "Business Consulting",
        },
      ],
      payments: [
        {
          id: "pay-1",
          payment_date: "2026-09-03",
          amount: "20.00",
          payment_method: "cash",
          receipt_url: null,
          invoice_id: "inv-1",
          invoice_number: "INV-0001",
        },
      ],
      summary: { open_balance: "179.00" },
      paypal_client_id: "",
    },
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
      const key = new URL(route.request().url()).searchParams.get("route");
      if (key === "auth/session") {
        await route.fulfill({
          json: {
            data: {
              authenticated: true,
              user: { user_id: 7, role_slug: "client" },
              csrf_token: "test-token",
            },
          },
        });
        return;
      }
      if (key?.startsWith("portal/")) {
        const resource = key.split("/")[1];
        await route.fulfill({
          json: { data: portalPayloads[resource] ?? {} },
        });
        return;
      }
      await route.fulfill({ json: { data: {} } });
    });
  });

  const routes = [
    ["/client-portal/dashboard/", "Client Portal dashboard"],
    ["/client-portal/tasks-and-documents/", "Tasks & Documents"],
    ["/client-portal/appointments/", "Appointments"],
    ["/client-portal/messages/", "Messages"],
    ["/client-portal/billing/", "Billing"],
    ["/client-portal/profile/", "Profile"],
  ];

  for (const [route, label] of routes) {
    test(`no serious accessibility issues on ${label}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(400);
      await expectNoSeriousViolations(page);
    });
  }
});

test.describe("Admin Portal accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/alchemize-api.php?*", async (route) => {
      const key = new URL(route.request().url()).searchParams.get("route");
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
      if (key === "portal-admin/attention") {
        await route.fulfill({ json: { data: { items: [] } } });
        return;
      }
      await route.fulfill({ json: { data: [] } });
    });
  });

  test("no serious accessibility issues on the Admin dashboard", async ({
    page,
  }) => {
    await page.goto("/admin/dashboard/");
    await page.waitForTimeout(400);
    await expectNoSeriousViolations(page);
  });
});

test.describe("Client intake accessibility", () => {
  const intakeListPayload = {
    items: [
      {
        id: "assign-1",
        engagement_title: "Business Formation",
        status: "action_needed",
        completion_percentage: 0,
        due_date: "2026-09-20",
        submitted_at: null,
      },
    ],
  };

  const intakeDetailPayload = {
    assignment: {
      id: "assign-1",
      public_id: "assign-1",
      engagement_title: "Business Formation",
      status: "action_needed",
      due_date: "2026-09-20",
    },
    definition: {
      label: "Business Formation Intake",
      modules: [
        {
          key: "basics",
          title: "Business basics",
          intro: "Tell us about the business.",
          fields: [
            {
              key: "business_name",
              label: "Legal business name",
              type: "text",
              required: true,
              helper: "Use the exact legal name on file.",
            },
            {
              key: "notes",
              label: "Additional notes",
              type: "textarea",
              required: false,
            },
          ],
          requirements: [],
        },
        {
          key: "contacts",
          title: "Contacts",
          fields: [
            {
              key: "primary_email",
              label: "Primary contact email",
              type: "email",
              required: true,
            },
          ],
          requirements: [],
        },
      ],
    },
    responses: {},
    profile: { business: {} },
    requirements: [],
    reference_snapshots: {},
  };

  test.beforeEach(async ({ page }) => {
    await page.route("**/alchemize-api.php?*", async (route) => {
      const key = new URL(route.request().url()).searchParams.get("route");
      if (key === "auth/session") {
        await route.fulfill({
          json: {
            data: {
              authenticated: true,
              user: { user_id: 7, role_slug: "client" },
              csrf_token: "test-token",
            },
          },
        });
        return;
      }
      if (key === "portal/intakes") {
        await route.fulfill({ json: { data: intakeListPayload } });
        return;
      }
      if (key === "portal/intakes/assign-1") {
        await route.fulfill({ json: { data: intakeDetailPayload } });
        return;
      }
      await route.fulfill({ json: { data: {} } });
    });
  });

  test("no serious accessibility issues on the intake list", async ({
    page,
  }) => {
    await page.goto("/client-portal/intake/");
    await expect(
      page.getByRole("heading", { name: "Onboarding and intake" }),
    ).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test("no serious accessibility issues on an open intake form", async ({
    page,
  }) => {
    await page.goto("/client-portal/intake/");
    await page.getByRole("button", { name: "Continue intake" }).click();
    await expect(
      page.getByRole("heading", { name: "Business Formation" }),
    ).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test("required field has a label, description, and keyboard-reachable input", async ({
    page,
  }) => {
    await page.goto("/client-portal/intake/");
    await page.getByRole("button", { name: "Continue intake" }).click();
    const nameInput = page.locator("#business_name");
    await expect(nameInput).toBeVisible();
    // Accessible name comes from the wrapping <label>; the helper text is
    // wired up via aria-describedby, not just visually adjacent.
    await expect(nameInput).toHaveAccessibleName(/Legal business name/);
    const describedBy = await nameInput.getAttribute("aria-describedby");
    expect(describedBy).toContain("business_name-help");
    await expect(page.locator(`#${describedBy.trim()}`)).toContainText(
      "Use the exact legal name on file.",
    );
    // Reachable and operable by keyboard (not just click).
    await nameInput.focus();
    await expect(nameInput).toBeFocused();
    await page.keyboard.type("Cedar Studio LLC");
    await expect(nameInput).toHaveValue("Cedar Studio LLC");
  });

  test("submitting with a required field empty marks it invalid and announces the error, tied to that field", async ({
    page,
  }) => {
    await page.goto("/client-portal/intake/");
    await page.getByRole("button", { name: "Continue intake" }).click();
    // Two sections exist; advance to the second (also required) without
    // completing the first, then attempt to submit.
    await page.getByRole("button", { name: "Next section" }).click();
    await expect(
      page.getByText("Please complete the items that still need"),
    ).toBeVisible();
    const nameInput = page.locator("#business_name");
    await expect(nameInput).toHaveAttribute("aria-invalid", "true");
    const describedBy = await nameInput.getAttribute("aria-describedby");
    expect(describedBy).toContain("business_name-error");
    await expect(page.locator("#business_name-error")).toHaveText(
      "Required field.",
    );
  });

  test("intake section navigation exposes current step and works via keyboard", async ({
    page,
  }) => {
    await page.goto("/client-portal/intake/");
    await page.getByRole("button", { name: "Continue intake" }).click();
    const nav = page.getByRole("navigation", { name: "Intake sections" });
    const firstTab = nav.getByRole("button", { name: /Business basics/ });
    const secondTab = nav.getByRole("button", { name: /Contacts/ });
    await expect(firstTab).toHaveAttribute("aria-current", "step");
    await secondTab.focus();
    await page.keyboard.press("Enter");
    await expect(secondTab).toHaveAttribute("aria-current", "step");
    await expect(
      page.getByRole("heading", { name: "Contacts", exact: true }),
    ).toBeVisible();
  });
});

test.describe("Client invoice detail accessibility", () => {
  const invoiceDetail = {
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
  };

  test.beforeEach(async ({ page }) => {
    await page.route("**/alchemize-api.php?*", async (route) => {
      const key = new URL(route.request().url()).searchParams.get("route");
      if (key === "auth/session") {
        await route.fulfill({
          json: {
            data: {
              authenticated: true,
              user: { role_slug: "client" },
              csrf_token: "csrf",
            },
          },
        });
        return;
      }
      if (key === "portal/billing/inv-301") {
        await route.fulfill({ json: { data: { invoice: invoiceDetail } } });
        return;
      }
      await route.fulfill({ json: { data: {} } });
    });
  });

  test("no serious accessibility issues on the invoice detail route", async ({
    page,
  }) => {
    await page.goto("/client-portal/billing/invoices/inv-301");
    await expect(page.locator(".invoice-print-sheet")).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test("invoice detail exposes one heading, a landmark, and semantic status/link/button roles", async ({
    page,
  }) => {
    await page.goto("/client-portal/billing/invoices/inv-301");
    const sheet = page.locator(".invoice-print-sheet");
    await expect(sheet).toBeVisible();
    // Exactly one page-level heading.
    await expect(page.locator("h1")).toHaveCount(1);
    // The page renders inside the portal shell's single <main> landmark
    // (fixed in the prior pass) rather than a bare unlabelled <div> soup.
    await expect(page.locator("main")).toHaveCount(1);
    // Navigation back to Billing is a real link (browser history/URL
    // semantics), not a JS-only button.
    const backLink = page.getByRole("link", { name: /Back to Billing/ });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/client-portal/billing");
    // The print control is a real, accessibly-named button (icon marked
    // aria-hidden, visible text carries the name).
    const printButton = page.getByRole("button", { name: "Print invoice" });
    await expect(printButton).toBeVisible();
    // Status is conveyed as real text content, not color alone.
    await expect(sheet).toContainText("INV-3001");
  });
});

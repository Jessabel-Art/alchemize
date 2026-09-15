import { test, expect } from "@playwright/test";

const ENGAGEMENT_ID = "eng-business-consulting";

function baseDetail(overrides = {}) {
  return {
    item: {
      id: ENGAGEMENT_ID,
      engagement_number: "ABC123",
      title: "Business Consulting",
      description: "Ongoing advisory support for your business.",
      status: "preparing",
      start_date: "2026-09-02",
      target_date: "2026-10-01",
      completion_date: null,
      assigned_contact: "Jordan Alchemize",
      service_names: ["Business Advisory"],
    },
    client: { id: "client-1", display_name: "Jordan Rivera" },
    tasks: [],
    documents: [],
    appointments: [],
    invoices: [],
    intake: [],
    activity: [],
    ...overrides,
  };
}

async function mockAdmin(page, { detail, onCreateThread } = {}) {
  const calls = { createThread: [] };
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const key = url.searchParams.get("route");
    const method = route.request().method();
    if (key === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "client" },
            csrf_token: "engagement-dashboard-test",
          },
        },
      });
    }
    if (key === "portal/services" && method === "GET") {
      return route.fulfill({
        json: {
          data: {
            items: [
              {
                id: ENGAGEMENT_ID,
                title: "Business Consulting",
                status: "preparing",
              },
            ],
          },
        },
      });
    }
    if (key === `portal/services/${ENGAGEMENT_ID}` && method === "GET") {
      return route.fulfill({ json: { data: detail || baseDetail() } });
    }
    if (key === "portal/messages" && method === "POST") {
      const payload = route.request().postDataJSON();
      calls.createThread.push(payload);
      onCreateThread?.(payload);
      return route.fulfill({
        status: 201,
        json: { data: { thread_id: "thread-1", message_id: "message-1" } },
      });
    }
    await route.fulfill({ json: { data: [] } });
  });
  return calls;
}

test("owned engagement dashboard loads with real header, snapshot, and no unrelated data", async ({
  page,
}) => {
  await mockAdmin(page, {
    detail: baseDetail({
      documents: [
        { id: "d1", document_name: "Identification", status: "requested" },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  await expect(
    page.getByRole("heading", { name: "Business Consulting" }),
  ).toBeVisible();
  await expect(page.locator(".portal-status-pill")).toHaveText("Preparing");
  await expect(page.locator(".engagement-header-meta")).toContainText(
    "Started Sep",
  );
  await expect(page.getByText("Engagement #ABC123")).toBeVisible();
  // No hardcoded/other-engagement text.
  await expect(page.getByText("Website Maintenance")).toHaveCount(0);
  const snapshot = page.locator(".engagement-snapshot");
  await expect(snapshot).toContainText("Preparing");
  await expect(snapshot).toContainText("1"); // documents count
});

test("Action Required shows outstanding items with the correct contextual action, and omits completed/non-actionable records", async ({
  page,
}) => {
  await mockAdmin(page, {
    detail: baseDetail({
      documents: [
        {
          id: "d1",
          document_name: "Identification",
          status: "requested",
          client_instructions: "Please submit your government-issued ID.",
          due_date: "2026-09-20",
        },
        { id: "d2", document_name: "Signed contract", status: "accepted" },
      ],
      tasks: [
        { id: "t1", title: "Review proposal", status: "not_started" },
        {
          id: "t2",
          title: "Kickoff call",
          status: "completed",
          completed_at: "2026-09-01",
        },
      ],
      invoices: [
        {
          id: "inv-1",
          invoice_number: "INV-1042",
          status: "open",
          outstanding_balance: "250.00",
          due_date: "2026-09-20",
          currency: "USD",
        },
        {
          id: "inv-2",
          invoice_number: "INV-1000",
          status: "paid",
          outstanding_balance: "0.00",
          due_date: "2026-08-01",
          currency: "USD",
        },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  const actionSection = page.getByLabel("Action required");
  await expect(actionSection.getByText("Identification")).toBeVisible();
  await expect(
    actionSection.getByRole("link", { name: "Upload document" }),
  ).toHaveAttribute("href", "/client-portal/tasks-and-documents?upload=d1");
  await expect(actionSection.getByText("Review proposal")).toBeVisible();
  await expect(actionSection.getByText("Invoice INV-1042")).toBeVisible();
  await expect(
    actionSection.getByRole("link", { name: "View invoice" }),
  ).toHaveAttribute("href", "/client-portal/billing/invoices/inv-1");
  // Completed task, accepted document, and paid invoice never appear as
  // outstanding action items.
  await expect(actionSection.getByText("Kickoff call")).toHaveCount(0);
  await expect(actionSection.getByText("Signed contract")).toHaveCount(0);
  await expect(actionSection.getByText("INV-1000")).toHaveCount(0);
});

test("a clear engagement shows a restrained no-action state instead of an empty card", async ({
  page,
}) => {
  await mockAdmin(page, {
    detail: baseDetail({
      tasks: [
        {
          id: "t1",
          title: "Kickoff call",
          status: "completed",
          completed_at: "2026-09-01",
        },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  await expect(page.getByText("No action needed right now.")).toBeVisible();
  await expect(page.getByLabel("Action required")).toHaveCount(0);
});

test("Tasks & milestones render real statuses without inventing a workflow", async ({
  page,
}) => {
  await mockAdmin(page, {
    detail: baseDetail({
      tasks: [
        {
          id: "t1",
          title: "Initial information received",
          status: "completed",
          completed_at: "2026-09-03",
        },
        { id: "t2", title: "Business review", status: "in_progress" },
        { id: "t3", title: "Recommendations", status: "not_started" },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  const milestones = page.getByLabel("Tasks and milestones");
  await expect(milestones).toContainText("1 of 3 milestones completed");
  await expect(milestones.locator("li.milestone-done")).toHaveCount(1);
  await expect(milestones.locator("li.milestone-current")).toHaveCount(1);
  await expect(milestones.locator("li.milestone-upcoming")).toHaveCount(1);
  await expect(milestones.locator("li.milestone-done")).toContainText(
    "Completed Sep",
  );
});

test("the next appointment excludes cancelled appointments and shows Join Google Meet only with a real link", async ({
  page,
}) => {
  const future = new Date();
  future.setDate(future.getDate() + 5);
  const soonerCancelled = new Date();
  soonerCancelled.setDate(soonerCancelled.getDate() + 1);
  await mockAdmin(page, {
    detail: baseDetail({
      appointments: [
        {
          id: "a1",
          appointment_type: "Business Consultation",
          scheduled_start: future.toISOString(),
          scheduled_at: future.toISOString(),
          status: "confirmed",
          meeting_method: "google_meet",
          meeting_url: "https://meet.google.com/abc-defg-hij",
        },
        {
          id: "a2",
          appointment_type: "Sooner but cancelled",
          scheduled_start: soonerCancelled.toISOString(),
          scheduled_at: soonerCancelled.toISOString(),
          status: "cancelled",
        },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  const nextAppt = page.getByLabel("Next appointment");
  await expect(nextAppt).toContainText("Business Consultation");
  await expect(nextAppt).not.toContainText("Sooner but cancelled");
  await expect(
    nextAppt.getByRole("link", { name: "Join Google Meet" }),
  ).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
});

test("no Join Google Meet link appears when the appointment is not Google Meet or has no URL yet", async ({
  page,
}) => {
  const future = new Date();
  future.setDate(future.getDate() + 5);
  await mockAdmin(page, {
    detail: baseDetail({
      appointments: [
        {
          id: "a1",
          appointment_type: "Phone check-in",
          scheduled_start: future.toISOString(),
          scheduled_at: future.toISOString(),
          status: "confirmed",
          meeting_method: "phone",
        },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  const nextAppt = page.getByLabel("Next appointment");
  await expect(nextAppt).toContainText("Phone check-in");
  await expect(
    nextAppt.getByRole("link", { name: "Join Google Meet" }),
  ).toHaveCount(0);
});

test("no scheduled appointment shows a restrained state with Book appointment", async ({
  page,
}) => {
  await mockAdmin(page, { detail: baseDetail() });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  const nextAppt = page.getByLabel("Next appointment");
  await expect(nextAppt).toContainText("No appointment scheduled");
  await expect(
    nextAppt.getByRole("link", { name: "Book appointment" }),
  ).toHaveAttribute(
    "href",
    `/client-portal/appointments?engagement=${ENGAGEMENT_ID}`,
  );
});

test("Book appointment in the header carries the engagement context", async ({
  page,
}) => {
  await mockAdmin(page, { detail: baseDetail() });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  await expect(
    page
      .locator(".engagement-header-actions")
      .getByRole("link", { name: "Book appointment" }),
  ).toHaveAttribute(
    "href",
    `/client-portal/appointments?engagement=${ENGAGEMENT_ID}`,
  );
});

test("Engagement activity normalizes raw event keys and suppresses meaningless repeats, without losing distinct events", async ({
  page,
}) => {
  await mockAdmin(page, {
    detail: baseDetail({
      activity: [
        {
          id: "e1",
          event_type: "appointment.cancelled",
          entity_id: "appt-1",
          summary: "cancelled",
          created_at: "2026-09-13T10:00:00Z",
        },
        {
          id: "e2",
          event_type: "appointment.cancelled",
          entity_id: "appt-1",
          summary: "cancelled",
          created_at: "2026-09-13T09:59:00Z",
        },
        {
          id: "e3",
          event_type: "appointment.cancelled",
          entity_id: "appt-1",
          summary: "cancelled",
          created_at: "2026-09-13T09:58:00Z",
        },
        {
          id: "e4",
          event_type: "client.document.uploaded",
          entity_id: "d1",
          summary: "uploaded",
          created_at: "2026-09-12T10:00:00Z",
        },
        {
          id: "e5",
          event_type: "client.intake.submitted",
          entity_id: "i1",
          summary: "submitted",
          created_at: "2026-09-08T10:00:00Z",
        },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  const activity = page.getByLabel("Engagement activity");
  await expect(activity.getByText("cancelled", { exact: true })).toHaveCount(0);
  await expect(activity.locator("li")).toHaveCount(3);
  await expect(activity).toContainText("Appointment cancelled");
  await expect(activity).toContainText("Document submitted");
  await expect(activity).toContainText("Intake submitted");
});

test("Billing context shows only this engagement's open invoice, with unaltered financial values", async ({
  page,
}) => {
  await mockAdmin(page, {
    detail: baseDetail({
      invoices: [
        {
          id: "inv-1",
          invoice_number: "INV-1042",
          status: "open",
          outstanding_balance: "250.00",
          due_date: "2026-09-20",
          currency: "USD",
        },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  const billing = page.getByLabel("Billing");
  await expect(billing).toContainText("INV-1042");
  await expect(billing).toContainText("$250.00");
  await expect(
    billing.getByRole("link", { name: "View invoice" }),
  ).toHaveAttribute("href", "/client-portal/billing/invoices/inv-1");
});

test("Message Alchemize sends through the existing messaging system, linked to this engagement", async ({
  page,
}) => {
  const calls = await mockAdmin(page, { detail: baseDetail() });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  await page.getByRole("button", { name: "Message Alchemize" }).click();
  const dialog = page.getByRole("dialog", { name: "Message Alchemize" });
  await dialog
    .getByLabel("Message", { exact: true })
    .fill("Quick question about this engagement.");
  await dialog.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Message sent to Alchemize.")).toBeVisible();
  expect(calls.createThread).toHaveLength(1);
  expect(calls.createThread[0]).toMatchObject({
    related_entity_type: "engagement",
    related_entity_id: ENGAGEMENT_ID,
    message: "Quick question about this engagement.",
  });
});

test("Download service file opens a branded, print-ready record scoped to this engagement", async ({
  page,
}) => {
  await mockAdmin(page, {
    detail: baseDetail({
      tasks: [
        {
          id: "t1",
          title: "Kickoff call",
          status: "completed",
          completed_at: "2026-09-01",
        },
      ],
      invoices: [
        {
          id: "inv-1",
          invoice_number: "INV-1042",
          status: "open",
          outstanding_balance: "250.00",
          subtotal: "250.00",
          adjustment_total: "0.00",
          credit_deposit_total: "0.00",
          paid_total: "0.00",
          invoice_date: "2026-09-01",
          due_date: "2026-09-20",
          currency: "USD",
        },
      ],
    }),
  });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  await page.getByRole("button", { name: "Download service file" }).click();
  const viewer = page.getByRole("dialog", { name: "Service File" });
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText("Jordan Rivera");
  await expect(viewer).toContainText("Business Consulting");
  await expect(viewer).toContainText("ABC123");
  await expect(viewer).toContainText("Kickoff call");
  await expect(viewer).toContainText("INV-1042");
  await expect(
    viewer.getByRole("button", { name: "Print / Save PDF" }),
  ).toBeVisible();
  await viewer.getByRole("button", { name: "Close" }).click();
  await expect(viewer).toHaveCount(0);
});

test("no client-facing engagement text renders a raw internal error state for a normally-empty engagement", async ({
  page,
}) => {
  await mockAdmin(page, { detail: baseDetail() });
  await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
  await expect(
    page.getByText("The client portal is temporarily unavailable.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

for (const width of [1440, 834, 390]) {
  test(`engagement dashboard is responsive at ${width}px with no horizontal overflow`, async ({
    page,
  }) => {
    await mockAdmin(page, {
      detail: baseDetail({
        documents: [
          { id: "d1", document_name: "Identification", status: "requested" },
        ],
        tasks: [{ id: "t1", title: "Review proposal", status: "not_started" }],
        invoices: [
          {
            id: "inv-1",
            invoice_number: "INV-1042",
            status: "open",
            outstanding_balance: "250.00",
            due_date: "2026-09-20",
            currency: "USD",
          },
        ],
      }),
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/client-portal/services/${ENGAGEMENT_ID}`);
    await expect(
      page.getByRole("heading", { name: "Business Consulting" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

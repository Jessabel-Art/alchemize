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

test("service and task pages render only API records", async ({ page }) => {
  await page.goto("/client-portal/services/");
  await expect(
    page.getByRole("strong").filter({ hasText: "Business formation" }),
  ).toBeVisible();
  await expect(page.getByText("Insurance guidance")).toHaveCount(0);

  await page.goto("/client-portal/tasks/");
  await expect(
    page.getByRole("heading", { name: "Waiting on you" }),
  ).toBeVisible();
  await expect(page.getByText("Review formation details")).toBeVisible();
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

import { test, expect } from "@playwright/test";

function baseSummary(overrides = {}) {
  return {
    generated_at: "2026-09-15T00:00:00+00:00",
    integrations: {
      resend: {
        name: "Resend",
        provider: "resend",
        status: "Configured",
        configured: true,
        last_check: null,
        last_success: null,
        last_error: null,
        details: "Email provider configuration is present.",
      },
      stripe: {
        name: "Stripe",
        provider: "stripe",
        status: "Not configured",
        configured: false,
        last_check: null,
        last_success: null,
        last_error: null,
        details: "Stripe is not configured for this environment.",
      },
      google_calendar: {
        name: "Google Calendar",
        provider: "google_calendar",
        status: "Configured",
        configured: true,
        calendar_id: "primary",
        calendar_accessible: null,
        meet_capable: null,
        last_check: null,
        last_success: null,
        last_error: null,
        details: "Google Calendar access is configured.",
      },
      google_drive: {
        name: "Google Drive",
        provider: "google_drive",
        status: "Configured",
        configured: true,
        root_folder_id: "root123",
        last_check: null,
        last_success: null,
        last_error: null,
        details: "Google Drive is configured.",
      },
      ...overrides.integrations,
    },
    system: {
      database: {
        name: "Database",
        status: "Connected",
        configured: true,
        last_check: "2026-09-15T00:00:00+00:00",
        last_success: "2026-09-15T00:00:00+00:00",
        last_error: null,
        details: "A real SELECT 1 query was executed.",
      },
      application: {
        name: "Application",
        version: null,
        build: null,
        environment: "production",
        runtime: "8.2.20",
        deployed_at: null,
        details:
          "Version and runtime metadata are displayed only when reliably available.",
      },
      ...overrides.system,
    },
  };
}

async function mockAdmin(page, { onCheck } = {}) {
  const calls = [];
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const path = url.searchParams.get("route");
    if (path === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "integrations-test",
          },
        },
      });
    }
    if (path === "settings" && route.request().method() === "GET") {
      return route.fulfill({ json: { data: { business_name: "Alchemize" } } });
    }
    if (
      path === "settings/integrations" &&
      route.request().method() === "GET"
    ) {
      return route.fulfill({ json: { data: baseSummary() } });
    }
    if (
      path === "settings/integrations/check" &&
      route.request().method() === "POST"
    ) {
      const payload = route.request().postDataJSON();
      calls.push(payload);
      const result = onCheck ? await onCheck(payload) : null;
      return route.fulfill({ json: { data: result || {} } });
    }
    if (path === "portal-admin/attention")
      return route.fulfill({ json: { data: { items: [] } } });
    await route.fulfill({ json: { data: [] } });
  });
  return calls;
}

test("integration cards distinguish Configured from Connected and never claim Connected without a real check", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/settings?section=integrations");
  const resendCard = page.locator(".integration-card", { hasText: "Resend" });
  await expect(resendCard.locator(".status-pill")).toHaveText("Configured");
  await expect(resendCard).toContainText("Not available");

  const stripeCard = page.locator(".integration-card", { hasText: "Stripe" });
  await expect(stripeCard.locator(".status-pill")).toHaveText("Not configured");

  const calendarCard = page.locator(".integration-card", {
    hasText: "Google Calendar",
  });
  await expect(calendarCard).toContainText("Calendar access");
  await expect(calendarCard).toContainText("Google Meet");
  await expect(calendarCard).toContainText("Not yet checked");
});

test("Check Connection performs a real check, disables itself while running, and shows a concise result", async ({
  page,
}) => {
  let resolveCheck;
  const pending = new Promise((resolve) => {
    resolveCheck = resolve;
  });
  const calls = await mockAdmin(page, {
    onCheck: async () => {
      await pending;
      return {
        name: "Resend",
        provider: "resend",
        status: "Connected",
        configured: true,
        last_check: "2026-09-15T12:00:00+00:00",
        last_success: "2026-09-15T12:00:00+00:00",
        last_error: null,
        details: "Email provider configuration is present.",
      };
    },
  });
  await page.goto("/admin/settings?section=integrations");
  const resendCard = page.locator(".integration-card", { hasText: "Resend" });
  const button = resendCard.locator("button.secondary-button");
  await button.click();

  await expect(resendCard.locator(".status-pill")).toHaveText("Checking…");
  await expect(button).toBeDisabled();
  await expect(button).toHaveText("Checking…");
  await button.click({ force: true });

  resolveCheck();
  await expect(resendCard.locator(".status-pill")).toHaveText("Connected");
  await expect(resendCard).toContainText("Connection successful.");
  await expect(resendCard).toContainText("Sep 15, 2026");
  expect(calls).toHaveLength(1);
  expect(calls[0]).toMatchObject({ slug: "resend" });
});

test("A failed connection check shows a safe, concise message and never a raw exception", async ({
  page,
}) => {
  await mockAdmin(page, {
    onCheck: async () => ({
      name: "Google Drive",
      provider: "google_drive",
      status: "Error",
      configured: true,
      root_folder_id: "root123",
      last_check: "2026-09-15T12:00:00+00:00",
      last_success: null,
      last_error: "The configured calendar or folder could not be found.",
      details: "Google Drive is configured.",
    }),
  });
  await page.goto("/admin/settings?section=integrations");
  const driveCard = page.locator(".integration-card", {
    hasText: "Google Drive",
  });
  await driveCard.getByRole("button", { name: "Check Connection" }).click();
  await expect(driveCard.locator(".status-pill")).toHaveText("Error");
  await expect(driveCard).toContainText(
    "The configured calendar or folder could not be found.",
  );
  await expect(driveCard).not.toContainText("Exception");
  await expect(driveCard).not.toContainText("Traceback");
});

test("Google Meet capability is reported once known, distinct from Calendar access", async ({
  page,
}) => {
  await mockAdmin(page, {
    onCheck: async () => ({
      name: "Google Calendar",
      provider: "google_calendar",
      status: "Connected",
      configured: true,
      calendar_id: "primary",
      calendar_accessible: true,
      meet_capable: true,
      last_check: "2026-09-15T12:00:00+00:00",
      last_success: "2026-09-15T12:00:00+00:00",
      last_error: null,
      details: "Google Calendar access is configured.",
    }),
  });
  await page.goto("/admin/settings?section=integrations");
  const calendarCard = page.locator(".integration-card", {
    hasText: "Google Calendar",
  });
  await calendarCard.getByRole("button", { name: "Check Connection" }).click();
  await expect(calendarCard.locator(".status-pill")).toHaveText("Connected");
  const rows = calendarCard.locator("dl > div");
  await expect(rows.filter({ hasText: "Calendar access" })).toContainText(
    "Available",
  );
  await expect(rows.filter({ hasText: "Google Meet" })).toContainText(
    "Available",
  );
});

test("System card never shows Unknown -- Not available when metadata is unreliable", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/settings?section=integrations");
  const systemCard = page.locator(".integration-card.system-card");
  await expect(systemCard).toContainText("Not available");
  await expect(systemCard).not.toContainText("Unknown");
});

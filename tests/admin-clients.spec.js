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
  services: [],
  engagements: [],
  tasks: [],
  documents: [],
  invoices: [],
  payments: [],
  leads: [],
  appointments: [],
};

async function mockAdmin(page) {
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
    else if (key === "portal-admin/messages") data = { items: [] };
    else if (key && key.startsWith("portal-admin/access-grants"))
      data = { items: [] };
    else if (records[key]) data = records[key];
    await route.fulfill({ json: { data } });
  });
}

test("clicking View opens the client detail record without an infinite render loop", async ({
  page,
}) => {
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await mockAdmin(page);
  await page.goto("/admin/clients/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await expect(page.getByText("North Harbor Studio").first()).toBeVisible();

  await page.getByRole("link", { name: "View" }).first().click();

  await expect(
    page.getByRole("heading", { name: "North Harbor Studio" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/clients\/1\/?$/);

  // Regression guard: selectedClient is re-derived from a deep-cloned
  // adminStore snapshot on every render, so a useEffect that depends on the
  // object itself (rather than a stable primitive like its id) re-fires on
  // every render and throws "Maximum update depth exceeded".
  await page.waitForTimeout(300);
  expect(
    consoleErrors.some((entry) =>
      entry.includes("Maximum update depth exceeded"),
    ),
  ).toBe(false);
});

test("Add Record Requested Service dropdown reflects the full canonical service catalog", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/clients/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  await page
    .getByRole("button", { name: "+ Client or Prospect", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Add record" })).toBeVisible();

  const requestedServiceSelect = page
    .locator("label", { hasText: "Requested service" })
    .locator("select");

  await expect(requestedServiceSelect.locator("optgroup")).toHaveCount(2);
  await expect(
    requestedServiceSelect.getByRole("option", {
      name: "Web & Digital Solutions",
    }),
  ).toHaveCount(1);

  // Categories, not just individual services, must remain grouped rather
  // than flattened into a single mixed list.
  await expect(
    requestedServiceSelect.locator('optgroup[label="Individual Services"]'),
  ).toHaveCount(1);
  await expect(
    requestedServiceSelect.locator('optgroup[label="Business Services"]'),
  ).toHaveCount(1);
});

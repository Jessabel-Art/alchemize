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
  services: [
    {
      id: 2,
      service_name: "Business advisory",
      service_code: "business-advisory",
      category: "Advisory",
      audience: "business",
      catalog_status: "ACTIVE",
      active_flag: 1,
      description:
        "Review business operations and prepare a practical delivery plan. ".repeat(
          12,
        ),
      tiers: [
        {
          id: 1,
          tier_name: "Standard",
          base_price: 450,
          pricing_type: "FIXED",
          status: "ACTIVE",
          active_flag: 1,
          billing_frequency: "ONE_TIME",
          limits_metadata: "One review per engagement",
        },
      ],
    },
  ],
  engagements: [
    {
      id: 3,
      client_id: 1,
      service_id: 2,
      title: "Business advisory",
      status: "in_progress",
      start_date: "2026-09-01",
      target_date: "2026-10-01",
    },
  ],
  tasks: [
    {
      id: 4,
      client_id: 1,
      engagement_id: 3,
      title: "Review operating plan",
      status: "waiting_on_client",
      due_date: "2026-09-01",
      priority: "high",
    },
  ],
  documents: [
    {
      id: 5,
      client_id: 1,
      engagement_id: 3,
      document_name: "Operating agreement",
      status: "received",
      visibility: "shared",
      requested_date: "2026-09-01",
    },
  ],
  invoices: [
    {
      id: 6,
      client_id: 1,
      engagement_id: 3,
      invoice_number: "INV-1006",
      invoice_date: "2026-09-01",
      due_date: "2026-09-03",
      status: "past_due",
      currency: "USD",
      subtotal: 450,
      paid_total: 100,
    },
  ],
  payments: [
    {
      id: 7,
      client_id: 1,
      invoice_id: 6,
      amount: 100,
      payment_date: "2026-09-02",
      payment_method: "manual",
    },
  ],
  leads: [
    {
      id: 8,
      full_name: "Cedar Services",
      email: "cedar@example.test",
      status: "new",
      audience: "business",
      created_at: "2026-09-01",
      service_key: "business-advisory",
    },
  ],
  appointments: [
    {
      id: 9,
      client_id: 1,
      service_id: 2,
      appointment_type: "Consultation",
      scheduled_at: "2026-09-20 10:00:00",
      duration_minutes: 60,
      status: "scheduled",
      location_type: "virtual",
    },
  ],
};
const thread = {
  id: 10,
  subject: "Planning next steps",
  client_name: "North Harbor Studio",
  status: "waiting_on_alchemize",
  unread_count: 1,
  last_message_at: "2026-09-05T12:00:00",
};
async function mockAdmin(page, empty = false) {
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
    else if (key === "portal-admin/messages")
      data = { items: empty ? [] : [thread] };
    else if (key === "portal-admin/messages/10")
      data = {
        thread,
        messages: [
          {
            id: 11,
            sender_name: "North Harbor Studio",
            sender_type: "client",
            message_body:
              "Please review the operating plan before our meeting.",
            created_at: "2026-09-05T12:00:00",
          },
        ],
      };
    else if (key === "settings")
      data =
        route.request().method() === "PUT"
          ? route.request().postDataJSON()
          : {
              business_name: "Alchemize Business Services",
              business_email: "operations@example.test",
              timezone: "America/New_York",
              appointment_default_duration: 60,
              portal_message_email_notifications: true,
            };
    else if (records[key]) data = empty ? [] : records[key];
    await route.fulfill({ json: { data } });
  });
}
for (const width of [1440, 834, 390]) {
  test(`Admin visual workspace at ${width}px`, async ({ page }) => {
    await mockAdmin(page);
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const name of [
      "dashboard",
      "clients",
      "services",
      "client-requests",
      "communications",
      "appointments",
      "billing",
      "reports",
      "settings",
    ]) {
      await page.goto(`/admin/${name}/`);
      await expect(page.locator(".portal-page-header h1")).toBeVisible();
      await expect(page.getByText("Loading admin records…")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        name,
      ).toBe(true);
      if (name === "clients") {
        await expect(
          page.locator('td[data-label="Name"]').first(),
        ).toContainText("North Harbor");
        if (width === 390)
          expect(
            await page
              .locator("table")
              .first()
              .evaluate((el) => getComputedStyle(el).display),
          ).toBe("block");
      }
      if (name === "services") {
        const details = page.locator(".admin-long-text").first();
        await expect(details).not.toHaveAttribute("open", "");
        await details.locator("summary").click();
        await expect(details).toHaveAttribute("open", "");
        await details.locator("summary").click();
      }
      await page.screenshot({
        path: `artifacts/admin-ui-${name}-${width}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
}
test("Communication selection and compact compose preserve controls", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await page.getByRole("button", { name: /Planning next steps/ }).click();
  await expect(
    page.getByText("Please review the operating plan before our meeting."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "+ New Conversation", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Client", exact: true }),
  ).toBeVisible();
  expect(
    (await page.locator(".admin-compose-panel").boundingBox()).width,
  ).toBeLessThanOrEqual(720);
  await page.screenshot({
    path: "artifacts/admin-ui-communication-open.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".admin-compose-panel")).toHaveCount(0);
});
test("Empty conversations stay compact and settings mutation is preserved", async ({
  page,
}) => {
  await mockAdmin(page, true);
  await page.goto("/admin/communications/");
  await expect(
    page.getByText("No conversations match this view."),
  ).toBeVisible();
  expect(
    (await page.locator(".admin-workspace-grid").boundingBox()).height,
  ).toBeLessThan(180);
  await page.goto("/admin/settings/");
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Alchemize Business Services");
  const request = page.waitForRequest(
    (r) =>
      r.method() === "PUT" &&
      new URL(r.url()).searchParams.get("route") === "settings",
  );
  await page
    .getByRole("button", { name: "Save Settings", exact: true })
    .click();
  expect((await request).postDataJSON().business_name).toBe(
    "Alchemize Business Services",
  );
  await expect(page.getByText("Settings saved.")).toBeVisible();
});

test("layout inspection", async ({ page }) => {
  await mockAdmin(page);
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/admin/appointments/");
  await expect(page.locator(".scheduler-toolbar")).toBeVisible();
  console.log(
    await page.locator(".scheduler-toolbar").evaluate((el) => ({
      css: getComputedStyle(el).cssText,
      display: getComputedStyle(el).display,
      direction: getComputedStyle(el).flexDirection,
      width: getComputedStyle(el).width,
      children: [...el.children].map((e) => ({
        class: e.className,
        width: getComputedStyle(e).width,
        flex: getComputedStyle(e).flex,
        min: getComputedStyle(e).minWidth,
      })),
    })),
  );
  console.log(
    await page.evaluate(() =>
      [...document.querySelectorAll("main *")]
        .filter((e) => e.getBoundingClientRect().right > innerWidth)
        .slice(0, 18)
        .map((e) => ({
          tag: e.tagName,
          class: e.className,
          width: e.getBoundingClientRect().width,
        })),
    ),
  );
});

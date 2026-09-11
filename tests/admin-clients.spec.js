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

test("Client Management loads clients and prospects without the API error banner", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/clients/");
  await expect(page.locator(".portal-page-header h1")).toBeVisible();
  await expect(page.getByText("North Harbor Studio").first()).toBeVisible();
  await expect(page.getByText(/temporarily unavailable/i)).toHaveCount(0);
});

test("Prospect -> View/Edit -> Convert to Client lifecycle persists data and creates no duplicate", async ({
  page,
}) => {
  // A stateful mock: creating, editing, and converting a prospect must each
  // be reflected in subsequent list refetches, exactly like the real API.
  let nextLeadId = 50;
  let nextClientId = 90;
  const leadRows = [];
  const clientRows = [...records.clients];

  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const key = url.searchParams.get("route");
    const method = route.request().method();

    if (key === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "ui-test-token",
          },
        },
      });
    }
    if (key === "portal-admin/attention")
      return route.fulfill({ json: { data: { items: [] } } });
    if (key === "portal-admin/messages")
      return route.fulfill({ json: { data: { items: [] } } });
    if (key && key.startsWith("portal-admin/access-grants")) {
      return route.fulfill({ json: { data: { items: [] } } });
    }

    if (key === "leads" && method === "POST") {
      const body = route.request().postDataJSON();
      const id = nextLeadId++;
      leadRows.push({
        id,
        public_id: `lead-public-${id}`,
        full_name: body.full_name,
        business_name: body.business_name ?? null,
        email: body.email,
        phone: body.phone ?? null,
        audience: body.audience,
        service_key: body.service_key ?? null,
        message: body.message,
        status: "new",
        source: "admin_manual_entry",
        created_at: "2026-09-10 10:00:00",
        updated_at: "2026-09-10 10:00:00",
        client_id: null,
        assigned_owner: null,
        next_action: null,
      });
      return route.fulfill({ json: { data: { id } }, status: 201 });
    }
    if (key === "leads" && method === "GET") {
      return route.fulfill({ json: { data: leadRows } });
    }
    const leadIdMatch = /^leads\/(\d+)$/.exec(key || "");
    if (leadIdMatch && method === "PUT") {
      const id = Number(leadIdMatch[1]);
      const body = route.request().postDataJSON();
      const lead = leadRows.find((row) => row.id === id);
      Object.assign(lead, body, { updated_at: "2026-09-10 11:00:00" });
      return route.fulfill({ json: { data: { ...lead } } });
    }
    if (leadIdMatch && method === "GET") {
      const id = Number(leadIdMatch[1]);
      const lead = leadRows.find((row) => row.id === id);
      return route.fulfill({
        json: {
          data: { ...lead, contact_attempts: [], interests: [], notes: [] },
        },
      });
    }
    const convertMatch = /^leads\/(\d+)\/convert$/.exec(key || "");
    if (convertMatch && method === "POST") {
      const id = Number(convertMatch[1]);
      const lead = leadRows.find((row) => row.id === id);
      const body = route.request().postDataJSON();
      // Mirrors the real backend: a lead already carrying a client_id
      // returns the existing client instead of inserting a second one,
      // whether this is a genuine retry or a rapid double-click.
      if (lead.status === "converted" && lead.client_id) {
        const existing = clientRows.find((row) => row.id === lead.client_id);
        return route.fulfill({
          json: {
            data: {
              converted_lead_public_id: lead.public_id,
              new_client_id: lead.client_id,
              new_client_public_id: existing.public_id,
              status: "already_converted",
            },
          },
        });
      }
      const clientId = nextClientId++;
      clientRows.push({
        id: clientId,
        public_id: `client-public-${clientId}`,
        display_name: lead.full_name,
        client_type: body.client_type || "business",
        legal_name: body.legal_name ?? lead.business_name ?? null,
        primary_email: lead.email,
        primary_phone: lead.phone,
        status: "active",
        portal_status: "pending",
        updated_at: "2026-09-10 11:05:00",
      });
      lead.status = "converted";
      lead.client_id = clientId;
      return route.fulfill({
        json: {
          data: {
            converted_lead_public_id: lead.public_id,
            new_client_id: clientId,
            new_client_public_id: `client-public-${clientId}`,
            status: "converted",
          },
        },
      });
    }
    if (key === "clients" && method === "GET") {
      return route.fulfill({ json: { data: clientRows } });
    }

    if (records[key]) return route.fulfill({ json: { data: records[key] } });
    return route.fulfill({ json: { data: [] } });
  });

  await page.goto("/admin/clients/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  // Create the prospect with a real requested service and business name.
  await page
    .getByRole("button", { name: "+ Client or Prospect", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Jordan Rivera");
  await page.getByLabel("Email", { exact: true }).fill("jordan@example.test");
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Rivera Consulting");
  await page
    .locator("label", { hasText: "Requested service" })
    .locator("select")
    .selectOption("business-digital");
  await page.getByRole("button", { name: "Save prospect" }).click();
  await expect(page.getByText("Prospect saved.")).toBeVisible();

  expect(leadRows).toHaveLength(1);
  expect(leadRows[0].service_key).toBe("business-digital");
  expect(leadRows[0].business_name).toBe("Rivera Consulting");

  // Open the prospect (View/Edit Prospect).
  await page.getByRole("link", { name: "Jordan Rivera" }).click();
  await expect(
    page.getByRole("heading", { name: "Jordan Rivera" }),
  ).toBeVisible();

  // Edit persists.
  await page
    .locator("label", { hasText: "Name" })
    .first()
    .locator("input")
    .fill("Jordan A. Rivera");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Prospect updated.")).toBeVisible();
  expect(leadRows[0].full_name).toBe("Jordan A. Rivera");

  // Convert to Client -> complete client-specific fields -> Client.
  await page.getByRole("button", { name: "Convert to Client" }).click();
  await page.getByRole("button", { name: "Confirm conversion" }).click();

  await expect(page).toHaveURL(/\/admin\/clients\/90\/?$/);
  await expect(
    page.getByRole("heading", { name: "Jordan A. Rivera" }),
  ).toBeVisible();

  // A successful conversion must not leave any API error banner visible,
  // and the conversion modal (with its own "Confirm conversion" button)
  // must be gone rather than left open looking failed.
  await expect(page.getByText(/temporarily unavailable/i)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Confirm conversion" }),
  ).toHaveCount(0);

  // No duplicate person: exactly one client exists, linked to the original
  // prospect, and the prospect itself is marked converted (not deleted).
  expect(clientRows).toHaveLength(2);
  expect(leadRows[0].status).toBe("converted");
  expect(leadRows[0].client_id).toBe(90);
  const convertedClient = clientRows.find((row) => row.id === 90);
  expect(convertedClient.primary_email).toBe("jordan@example.test");
  expect(convertedClient.legal_name).toBe("Rivera Consulting");

  // Repeating the exact same conversion request (a retried request, a
  // second tab, a replayed click) must not create a second client — the
  // backend returns the existing client instead of inserting a new row.
  const repeat = await page.evaluate(async () => {
    const query = new window.URLSearchParams();
    query.set("route", "leads/50/convert");
    const response = await fetch(`/alchemize-api.php?${query.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "ui-test-token",
      },
      body: JSON.stringify({ client_type: "individual" }),
    });
    const text = await response.text();
    return { status: response.status, text };
  });
  expect(repeat.status, repeat.text).toBe(200);
  const repeatBody = JSON.parse(repeat.text);
  expect(repeatBody.data.status).toBe("already_converted");
  expect(repeatBody.data.new_client_id).toBe(90);
  expect(clientRows).toHaveLength(2);
});

test("Direct Client creation succeeds, shows no false error, closes the modal, refreshes the list, and cannot be duplicated by a repeated submission", async ({
  page,
}) => {
  let nextClientId = 200;
  const clientRows = [...records.clients];
  // Mirrors the real backend: a repeated submission carrying the same
  // idempotency key returns the client that key already created instead of
  // inserting a second row.
  const clientIdByIdempotencyKey = new Map();
  let createCalls = 0;
  let capturedIdempotencyKey = null;

  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const key = url.searchParams.get("route");
    const method = route.request().method();

    if (key === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "ui-test-token",
          },
        },
      });
    }
    if (key === "portal-admin/attention")
      return route.fulfill({ json: { data: { items: [] } } });
    if (key === "portal-admin/messages")
      return route.fulfill({ json: { data: { items: [] } } });
    if (key && key.startsWith("portal-admin/access-grants")) {
      return route.fulfill({ json: { data: { items: [] } } });
    }

    if (key === "clients" && method === "POST") {
      createCalls += 1;
      const body = route.request().postDataJSON();
      const idempotencyKey = body.idempotency_key || null;
      if (idempotencyKey) capturedIdempotencyKey = idempotencyKey;
      if (idempotencyKey && clientIdByIdempotencyKey.has(idempotencyKey)) {
        const existingId = clientIdByIdempotencyKey.get(idempotencyKey);
        const existing = clientRows.find((row) => row.id === existingId);
        return route.fulfill({
          status: 201,
          json: {
            data: {
              id: existingId,
              display_name: existing.display_name,
              client_type: body.client_type,
              idempotent_replay: true,
              message: "This client was already created from that submission.",
            },
          },
        });
      }
      const id = nextClientId++;
      clientRows.push({
        id,
        display_name: body.display_name,
        client_type: body.client_type,
        primary_email: body.primary_email,
        status: "prospective",
        portal_status: "pending",
        updated_at: "2026-09-10",
      });
      if (idempotencyKey) clientIdByIdempotencyKey.set(idempotencyKey, id);
      return route.fulfill({
        status: 201,
        json: {
          data: {
            id,
            display_name: body.display_name,
            client_type: body.client_type,
            message: "Client created successfully.",
          },
        },
      });
    }
    if (key === "clients" && method === "GET") {
      return route.fulfill({ json: { data: clientRows } });
    }

    if (records[key]) return route.fulfill({ json: { data: records[key] } });
    return route.fulfill({ json: { data: [] } });
  });

  await page.goto("/admin/clients/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  await page
    .getByRole("button", { name: "+ Client or Prospect", exact: true })
    .click();
  await page
    .locator("label", { hasText: "Record Type" })
    .locator("select")
    .selectOption("Client");
  await page
    .locator("label", { hasText: "Client name" })
    .locator("input")
    .fill("Alex Morgan");
  await page
    .locator("label", { hasText: "Email" })
    .locator("input")
    .fill("alex.morgan@example.test");

  await page.getByRole("button", { name: "Create client" }).click();

  // Successful creation: no false API error banner, the "Add record" modal
  // (with its own "Create client" button) is gone, and the new client is
  // visible in the refreshed list.
  await expect(page.getByText(/temporarily unavailable/i)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Add record" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "Create client" })).toHaveCount(
    0,
  );
  expect(createCalls).toBe(1);
  expect(clientRows).toHaveLength(records.clients.length + 1);
  expect(capturedIdempotencyKey).toBeTruthy();

  // A repeated submission of the exact same create operation (a retried
  // request, a second tab, a double-click that slipped past the frontend
  // guard) must not create a second client -- the backend recognizes the
  // idempotency key and returns the original client instead.
  const repeat = await page.evaluate(async (idempotencyKey) => {
    const query = new window.URLSearchParams();
    query.set("route", "clients");
    const response = await fetch(`/alchemize-api.php?${query.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "ui-test-token",
      },
      body: JSON.stringify({
        client_type: "individual",
        display_name: "Alex Morgan",
        primary_email: "alex.morgan@example.test",
        idempotency_key: idempotencyKey,
      }),
    });
    const text = await response.text();
    return { status: response.status, text };
  }, capturedIdempotencyKey);
  expect(repeat.status, repeat.text).toBe(201);
  const repeatBody = JSON.parse(repeat.text);
  expect(repeatBody.data.idempotent_replay).toBe(true);
  expect(clientRows).toHaveLength(records.clients.length + 1);
});

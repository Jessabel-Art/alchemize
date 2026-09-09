import { test, expect } from "@playwright/test";

// Fixture dated around the repo's treated "today" of 2026-09-09.
const clients = [
  {
    id: 1,
    display_name: "Jessy",
    client_type: "individual",
    primary_email: "jessy@example.com",
    primary_phone: "555-0100",
    status: "active",
    portal_status: "active",
    updated_at: "2026-06-01",
    created_at: "2026-06-01",
  },
];
const engagements = [
  {
    id: 5,
    public_id: "eng-pub-5",
    client_id: 1,
    title: "Business Consulting",
    status: "active",
    start_date: "2026-06-01",
  },
];
const appointments = [
  {
    id: 9,
    client_id: 1,
    service_id: null,
    appointment_type: "Consultation",
    scheduled_at: `${new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} 10:00:00`,
    duration_minutes: 60,
    status: "scheduled",
    location_type: "virtual",
  },
];

const threadList = [
  {
    id: "thr-1",
    subject: "Question about invoice",
    client_name: "Jessy",
    status: "waiting_on_alchemize",
    unread_count: 1,
    last_message_at: "2026-09-08T02:39:00",
    latest_message: "Can you confirm the balance?",
  },
  {
    id: "thr-2",
    subject: "Engagement kickoff",
    client_name: "Jessy",
    status: "resolved",
    unread_count: 0,
    last_message_at: "2026-09-01T10:00:00",
    latest_message: "Thanks for the update.",
  },
];

function threadDetail(overrides = {}) {
  return {
    thread: {
      id: "thr-1",
      client_id: 1,
      subject: "Question about invoice",
      status: "waiting_on_alchemize",
      client_action_required: 1,
      related_entity_type: null,
      related_entity_id: null,
      last_message_at: "2026-09-08T02:39:00",
      client_name: "Jessy",
      language_preference: "en",
      ...overrides,
    },
    messages: [
      {
        id: 101,
        sender_type: "client",
        sender_name: "Jessy",
        message_body: "Can you confirm the balance?",
        created_at: "2026-09-08T02:39:00",
      },
    ],
  };
}

async function mockAdmin(page, { onReply, onStatusUpdate } = {}) {
  let thread1Status = "waiting_on_alchemize";
  const extraMessages = [];

  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const key = url.searchParams.get("route");
    const method = route.request().method();

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
    if (key === "portal-admin/messages" && method === "GET") {
      await route.fulfill({
        json: {
          data: {
            items: threadList.map((t) =>
              t.id === "thr-1" ? { ...t, status: thread1Status } : t,
            ),
          },
        },
      });
      return;
    }
    if (key === "portal-admin/messages/thr-1" && method === "GET") {
      const detail = threadDetail({ status: thread1Status });
      detail.messages.push(...extraMessages);
      await route.fulfill({ json: { data: detail } });
      return;
    }
    if (key === "portal-admin/messages/thr-2" && method === "GET") {
      await route.fulfill({
        json: {
          data: threadDetail({
            id: "thr-2",
            subject: "Engagement kickoff",
            status: "resolved",
            related_entity_type: "engagement",
            related_entity_id: "eng-pub-5",
            last_message_at: "2026-09-01T10:00:00",
          }),
        },
      });
      return;
    }
    if (key === "portal-admin/messages/thr-1/reply" && method === "POST") {
      const body = route.request().postDataJSON();
      onReply?.(body);
      if (onReply) {
        extraMessages.push({
          id: 999,
          sender_type: "staff",
          sender_name: "Owner Admin",
          message_body: body.message,
          created_at: "2026-09-08T03:00:00",
        });
        thread1Status = "waiting_on_client";
      }
      await route.fulfill({
        json: { data: { thread_id: "thr-1" } },
        status: 201,
      });
      return;
    }
    if (key === "portal-admin/messages/thr-1" && method === "PUT") {
      const body = route.request().postDataJSON();
      onStatusUpdate?.(body);
      thread1Status = body.status;
      await route.fulfill({
        json: { data: { thread_id: "thr-1", status: body.status } },
      });
      return;
    }

    const records = { clients, engagements, appointments };
    const data = records[key] ?? [];
    await route.fulfill({ json: { data } });
  });
}

test("Communication Center renders with the header and existing conversations", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Communication center" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Review client conversations, respond, and keep ownership of the next step clear.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Can you confirm the balance/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Thanks for the update/ }),
  ).toBeVisible();
});

test("status tabs render with real counts", async ({ page }) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  const bar = page.locator(".portal-filter-bar");
  await expect(bar.getByRole("button", { name: /Inbox/ })).toContainText("2");
  await expect(bar.getByRole("button", { name: /Unread/ })).toContainText("1");
  await expect(
    bar.getByRole("button", { name: /Needs response/ }),
  ).toContainText("1");
  await expect(bar.getByRole("button", { name: /Archived/ })).toContainText(
    "0",
  );
});

test("selecting a conversation displays its history and metadata", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await page
    .getByRole("button", { name: /Can you confirm the balance/ })
    .click();
  await expect(page.locator(".admin-conversation-panel")).toBeVisible();
  await expect(page.locator(".admin-conversation-panel h2")).toHaveText(
    "Jessy",
  );
  await expect(
    page.locator(".portal-thread").getByText("Can you confirm the balance?"),
  ).toBeVisible();
  await expect(page.locator(".comm-thread-header .status-pill")).toContainText(
    "Waiting on Alchemize",
  );
});

test("client details render from the existing client relationship", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await page
    .getByRole("button", { name: /Can you confirm the balance/ })
    .click();
  const clientCard = page.locator(".comm-context-section").first();
  await expect(clientCard.getByText("jessy@example.com")).toBeVisible();
  await expect(clientCard.getByText("555-0100")).toBeVisible();
  await expect(clientCard.getByText("Active")).toBeVisible();
  await expect(
    clientCard.getByRole("link", { name: "View client →" }),
  ).toHaveAttribute("href", "/admin/clients/1");
  await expect(clientCard.getByText(/View in calendar/)).toBeVisible();
});

test("conversation details render, and an unlinked conversation shows Not linked", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await page
    .getByRole("button", { name: /Can you confirm the balance/ })
    .click();
  const detailsCard = page.locator(".comm-context-section").nth(1);
  await expect(detailsCard.getByText("Created")).toBeVisible();
  await expect(detailsCard.getByText("Last message")).toBeVisible();
  await expect(detailsCard.getByText("Client portal")).toBeVisible();
  await expect(detailsCard.getByText("Not linked")).toBeVisible();
});

test("an existing related engagement renders its real name instead of Not linked", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await page.getByRole("button", { name: /Thanks for the update/ }).click();
  const detailsCard = page.locator(".comm-context-section").nth(1);
  await expect(detailsCard.getByText("Business Consulting")).toBeVisible();
  await expect(detailsCard.getByText("Not linked")).toHaveCount(0);
});

test("reply composer renders and uses the existing reply mutation", async ({
  page,
}) => {
  let payload = null;
  await mockAdmin(page, {
    onReply: (body) => {
      payload = body;
    },
  });
  await page.goto("/admin/communications/");
  await page
    .getByRole("button", { name: /Can you confirm the balance/ })
    .click();

  const composer = page.getByRole("textbox", { name: "Reply" });
  await expect(composer).toBeVisible();
  await composer.fill("We will follow up shortly.");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();

  await expect(page.getByText("Reply sent.")).toBeVisible();
  await expect(
    page.getByText("We will follow up shortly.", { exact: false }),
  ).toBeVisible();
  expect(payload.message).toBe("We will follow up shortly.");
});

test("a failed reply produces a visible error instead of failing silently", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await page
    .getByRole("button", { name: /Can you confirm the balance/ })
    .click();
  // buildApiUrl() URL-encodes the "/" characters inside the route query
  // param, so a plain glob string here would never match; match on the
  // decoded query value instead via a predicate function.
  await page.route(
    (url) =>
      new URL(url).searchParams.get("route") ===
      "portal-admin/messages/thr-1/reply",
    async (route) => {
      await route.fulfill({
        status: 500,
        json: {
          error: {
            code: "INTERNAL_ERROR",
            message: "Unable to send the reply.",
          },
        },
      });
    },
  );
  await page.getByRole("textbox", { name: "Reply" }).fill("Hello there");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.getByText("Unable to send the reply.")).toBeVisible();
});

test("archive updates the conversation status via the existing mutation", async ({
  page,
}) => {
  let payload = null;
  await mockAdmin(page, {
    onStatusUpdate: (body) => {
      payload = body;
    },
  });
  await page.goto("/admin/communications/");
  await page
    .getByRole("button", { name: /Can you confirm the balance/ })
    .click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(async () => {
    expect(payload?.status).toBe("archived");
  }).toPass();
  await expect(
    page.getByRole("button", { name: "Restore to inbox", exact: true }),
  ).toBeVisible();
});

test("unselected conversation shows an intentional, compact empty state", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  await expect(page.locator(".admin-context-panel")).toHaveCount(0);
  await expect(page.locator(".admin-conversation-panel")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Select a conversation" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Select a conversation from the list to view its history and respond.",
    ),
  ).toBeVisible();
});

test("no fabricated mockup conversations are rendered", async ({ page }) => {
  await mockAdmin(page);
  await page.goto("/admin/communications/");
  for (const name of [
    "Sarah Miller",
    "Daniel Lee",
    "Emily Parker",
    "Rachel White",
    "Marcus Taylor",
  ]) {
    await expect(page.getByText(name)).toHaveCount(0);
  }
});

for (const width of [1440, 1280, 1024, 834, 390]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await mockAdmin(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/communications/");
    await page
      .getByRole("button", { name: /Can you confirm the balance/ })
      .click();
    await expect(page.locator(".admin-conversation-panel")).toBeVisible();
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows).toBeFalsy();
  });
}

import { test, expect } from "@playwright/test";

const threadList = [
  {
    id: "thr-1",
    subject: "Question about invoice",
    status: "waiting_on_client",
    client_action_required: 1,
    unread_count: 2,
    last_message_at: "2026-09-08T02:39:00",
    latest_message: "We can confirm the balance is $450.",
    related_entity_type: null,
  },
  {
    id: "thr-2",
    subject: "Engagement kickoff",
    status: "resolved",
    client_action_required: 0,
    unread_count: 0,
    last_message_at: "2026-09-01T10:00:00",
    latest_message: "Thanks for the update.",
    related_entity_type: "engagement",
  },
];

function threadDetail(overrides = {}) {
  return {
    thread: {
      id: "thr-1",
      subject: "Question about invoice",
      status: "waiting_on_client",
      client_action_required: 1,
      related_entity_type: null,
      last_message_at: "2026-09-08T02:39:00",
      ...overrides,
    },
    messages: [
      {
        id: 201,
        sender_type: "client",
        sender_name: "North Harbor Studio",
        message_body: "Can you confirm the balance?",
        created_at: "2026-09-08T02:30:00",
      },
      {
        id: 202,
        sender_type: "staff",
        sender_name: "Alchemize Admin",
        message_body: "We can confirm the balance is $450.",
        created_at: "2026-09-08T02:39:00",
      },
    ],
  };
}

async function mockClient(page, { onReply, onArchive } = {}) {
  let thread1Status = "waiting_on_client";
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
            user: { user_id: 7, role_slug: "client" },
            csrf_token: "test-token",
          },
        },
      });
      return;
    }
    if (key === "portal/messages" && method === "GET") {
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
    if (key === "portal/messages/thr-1" && method === "GET") {
      const detail = threadDetail({ status: thread1Status });
      detail.messages.push(...extraMessages);
      await route.fulfill({ json: { data: detail } });
      return;
    }
    if (key === "portal/messages/thr-2" && method === "GET") {
      await route.fulfill({
        json: {
          data: threadDetail({
            id: "thr-2",
            subject: "Engagement kickoff",
            status: "resolved",
            client_action_required: 0,
            related_entity_type: "engagement",
          }),
        },
      });
      return;
    }
    if (key === "portal/messages/thr-1/reply" && method === "POST") {
      const body = route.request().postDataJSON();
      onReply?.(body);
      extraMessages.push({
        id: 999,
        sender_type: "client",
        sender_name: "North Harbor Studio",
        message_body: body.message,
        created_at: "2026-09-08T03:00:00",
      });
      thread1Status = "waiting_on_alchemize";
      await route.fulfill({
        json: { data: { thread_id: "thr-1" } },
        status: 201,
      });
      return;
    }
    if (key === "portal/messages/thr-1/archive" && method === "POST") {
      onArchive?.();
      thread1Status = "archived";
      await route.fulfill({ json: { data: { thread_id: "thr-1" } } });
      return;
    }
    await route.fulfill({ json: { data: [] } });
  });
}

test("Messages page renders real conversations with subject, preview, and status", async ({
  page,
}) => {
  await mockClient(page);
  await page.goto("/client-portal/messages/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Messages" }),
  ).toBeVisible();
  await expect(page.getByText("Question about invoice")).toBeVisible();
  await expect(
    page.getByText("We can confirm the balance is $450."),
  ).toBeVisible();
  await expect(page.getByText("Response requested")).toBeVisible();
});

test("filter tabs show real counts and filter the list", async ({ page }) => {
  await mockClient(page);
  await page.goto("/client-portal/messages/");
  const bar = page.getByLabel("Message filters");
  await expect(bar.getByRole("button", { name: /^All/ })).toContainText("2");
  await expect(bar.getByRole("button", { name: /Unread/ })).toContainText("1");
  await expect(
    bar.getByRole("button", { name: /Action needed/ }),
  ).toContainText("1");
  await expect(bar.getByRole("button", { name: /Archived/ })).toContainText(
    "0",
  );

  await bar.getByRole("button", { name: /Archived/ }).click();
  await expect(page.getByText("No archived conversations")).toBeVisible();
  await expect(page.getByText("Question about invoice")).toHaveCount(0);
});

test("switching filters clears a conversation that no longer matches the active view", async ({
  page,
}) => {
  await mockClient(page);
  await page.goto("/client-portal/messages/");
  await page.getByText("Question about invoice").click();
  await expect(page.locator(".pm-thread-header")).toBeVisible();

  await page
    .getByLabel("Message filters")
    .getByRole("button", { name: /Archived/ })
    .click();
  await expect(page.locator(".pm-thread-header")).toHaveCount(0);
  await expect(page.getByText("Select a conversation")).toBeVisible();
});

test("selecting a conversation shows its history with client vs Alchemize messages distinguished", async ({
  page,
}) => {
  await mockClient(page);
  await page.goto("/client-portal/messages/");
  await page.getByText("Question about invoice").click();

  const messages = page.locator(".portal-thread li");
  await expect(messages).toHaveCount(2);
  await expect(messages.nth(0)).toHaveClass(/client/);
  await expect(messages.nth(1)).toHaveClass(/staff/);
  await expect(page.getByText("Can you confirm the balance?")).toBeVisible();
});

test("reply composer sends a reply through the existing mutation", async ({
  page,
}) => {
  let payload = null;
  await mockClient(page, {
    onReply: (body) => {
      payload = body;
    },
  });
  await page.goto("/client-portal/messages/");
  await page.getByText("Question about invoice").click();

  const composer = page.getByRole("textbox", { name: "Reply" });
  await expect(composer).toBeVisible();
  const sendButton = page.getByRole("button", {
    name: "Send reply",
    exact: true,
  });
  await expect(sendButton).toBeDisabled();

  await composer.fill("Thank you, that matches our records.");
  await expect(sendButton).toBeEnabled();
  await sendButton.click();

  await expect(async () => {
    expect(payload?.message).toBe("Thank you, that matches our records.");
  }).toPass();
  await expect(
    page.getByText("Thank you, that matches our records."),
  ).toBeVisible();
});

test("archiving a conversation from the client portal removes it from the default view", async ({
  page,
}) => {
  let archived = false;
  await mockClient(page, {
    onArchive: () => {
      archived = true;
    },
  });
  await page.goto("/client-portal/messages/");
  await page.getByText("Question about invoice").click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();

  await expect(async () => {
    expect(archived).toBe(true);
  }).toPass();
  await expect(page.getByText("Select a conversation")).toBeVisible();
  await expect(page.getByText("Question about invoice")).toHaveCount(0);
});

test("no internal admin workflow information is exposed to the client", async ({
  page,
}) => {
  await mockClient(page);
  await page.goto("/client-portal/messages/");
  await page.getByText("Question about invoice").click();
  for (const text of [
    "Next step",
    "Waiting on client",
    "Needs Alchemize response",
    "Mark resolved",
    "Link record",
    "Related record type",
  ]) {
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  }
});

test("mobile shows one panel at a time with explicit back navigation", async ({
  page,
}) => {
  await mockClient(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/client-portal/messages/");
  await expect(page.locator(".pm-list")).toBeVisible();
  await expect(page.locator(".pm-thread")).toBeHidden();

  await page.getByText("Question about invoice").click();
  await expect(page.locator(".pm-thread")).toBeVisible();
  await expect(page.locator(".pm-list")).toBeHidden();

  await page.getByRole("button", { name: "← Back to messages" }).click();
  await expect(page.locator(".pm-list")).toBeVisible();
  await expect(page.locator(".pm-thread")).toBeHidden();
});

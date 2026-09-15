import { test, expect } from "@playwright/test";

const baseCategories = {
  inactive_prospects: {
    title: "Inactive Prospects",
    description: "Prospects with no qualifying activity for 90+ days.",
    count: 2,
    action: "archive",
  },
  completed_engagements: {
    title: "Completed Engagements",
    description:
      "Completed client engagements older than 6 months, eligible for archival review.",
    count: 0,
    action: "archive",
  },
  expired_links: {
    title: "Expired Scheduling Links",
    description: "Scheduling links that can no longer be used.",
    count: 1,
    action: "delete",
  },
  expired_invitations: {
    title: "Expired Admin Invitations",
    description:
      "Administrator invitations that expired without being accepted.",
    count: 1,
    action: "remove",
  },
  expired_tokens: {
    title: "Expired Security Tokens",
    description:
      "Expired, unused authentication links (password reset, portal setup, email change).",
    count: 3,
    action: "purge",
  },
  orphaned_records: {
    title: "Orphaned Records",
    description:
      "Records with missing required parent relationships. Database referential integrity prevents this from occurring today.",
    count: 0,
    action: null,
  },
};

function overviewPayload(overrides = {}) {
  const summary = {
    inactive_prospects: baseCategories.inactive_prospects.count,
    completed_engagements: baseCategories.completed_engagements.count,
    expired_links: baseCategories.expired_links.count,
    expired_invitations: baseCategories.expired_invitations.count,
    expired_tokens: baseCategories.expired_tokens.count,
    orphaned_records: 0,
    ...overrides,
  };
  const categories = Object.fromEntries(
    Object.entries(baseCategories).map(([key, value]) => [
      key,
      { ...value, count: summary[key] },
    ]),
  );
  return {
    threshold_months: 6,
    prospect_threshold_days: 90,
    summary,
    categories,
  };
}

const inactiveProspectRecords = [
  {
    id: 101,
    public_id: "prospect-101",
    display_name: "John Smith",
    primary_email: "john@example.com",
    status: "prospective",
    created_at: "2026-01-01 00:00:00",
    updated_at: "2026-04-12 00:00:00",
    inactive_days: 155,
  },
  {
    id: 102,
    public_id: "prospect-102",
    display_name: "Jane Doe",
    primary_email: "jane@example.com",
    status: "prospective",
    created_at: "2026-01-01 00:00:00",
    updated_at: "2026-03-28 00:00:00",
    inactive_days: 170,
  },
];

const expiredLinkRecords = [
  {
    id: 201,
    public_id: "link-201",
    appointment_type: "Consultation",
    recipient_name: "Taylor Kim",
    recipient_email: "taylor@example.com",
    client_name: null,
    service_name: "Business Formation",
    created_at: "2026-08-01 00:00:00",
    expires_at: "2026-08-08 00:00:00",
    use_count: 0,
    max_uses: 1,
    used_at: null,
    revoked_at: null,
  },
];

const expiredInvitationRecords = [
  {
    user_id: 301,
    display_name: "Morgan Lee",
    email: "morgan@example.com",
    role_slug: "administrator",
    role_name: "Administrator",
    invited_at: "2026-09-01 00:00:00",
    expires_at: "2026-09-04 00:00:00",
  },
];

const expiredTokenRecords = [
  {
    id: 401,
    public_id: "token-401",
    email: "client1@example.com",
    purpose: "password_reset",
    created_at: "2026-08-20 00:00:00",
    expires_at: "2026-08-21 00:00:00",
  },
  {
    id: 402,
    public_id: "token-402",
    email: "client2@example.com",
    purpose: "invitation",
    created_at: "2026-08-20 00:00:00",
    expires_at: "2026-08-21 00:00:00",
  },
  {
    id: 403,
    public_id: "token-403",
    email: "admin@example.com",
    purpose: "email_change",
    created_at: "2026-08-20 00:00:00",
    expires_at: "2026-08-21 00:00:00",
  },
];

const previewByCategory = {
  inactive_prospects: {
    category: "inactive_prospects",
    action: "archive",
    count: inactiveProspectRecords.length,
    records: inactiveProspectRecords,
  },
  completed_engagements: {
    category: "completed_engagements",
    action: "archive",
    count: 0,
    records: [],
  },
  expired_links: {
    category: "expired_links",
    action: "delete",
    count: expiredLinkRecords.length,
    records: expiredLinkRecords,
  },
  expired_invitations: {
    category: "expired_invitations",
    action: "remove",
    count: expiredInvitationRecords.length,
    records: expiredInvitationRecords,
  },
  expired_tokens: {
    category: "expired_tokens",
    action: "purge",
    count: expiredTokenRecords.length,
    records: expiredTokenRecords,
  },
  orphaned_records: {
    category: "orphaned_records",
    action: null,
    count: 0,
    records: [],
  },
};

async function mockAdmin(page, { onExecute } = {}) {
  const executeCalls = [];
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const path = url.searchParams.get("route");
    if (path === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "test-token",
          },
        },
      });
    }
    if (path === "settings" && route.request().method() === "GET") {
      return route.fulfill({ json: { data: { business_name: "Alchemize" } } });
    }
    if (path === "settings/maintenance/overview") {
      return route.fulfill({ json: { data: overviewPayload() } });
    }
    if (path === "settings/maintenance/history") {
      return route.fulfill({ json: { data: [] } });
    }
    if (path === "settings/maintenance/preview") {
      const payload = route.request().postDataJSON();
      return route.fulfill({
        json: { data: previewByCategory[payload.category] },
      });
    }
    if (path === "settings/maintenance/execute") {
      const payload = route.request().postDataJSON();
      executeCalls.push(payload);
      onExecute?.(payload);
      const resultKey = {
        inactive_prospects: "archived",
        completed_engagements: "archived",
        expired_links: "deleted",
        expired_invitations: "removed",
        expired_tokens: "deleted",
      }[payload.category];
      const count = payload.selected_ids?.length || 0;
      return route.fulfill({
        json: {
          data: {
            action: payload.action,
            category: payload.category,
            [resultKey]: count,
            blocked: 0,
            failed: 0,
          },
        },
      });
    }
    if (path === "portal-admin/attention") {
      return route.fulfill({ json: { data: { items: [] } } });
    }
    await route.fulfill({ json: { data: [] } });
  });
  return executeCalls;
}

test("maintenance landing shows real candidate counts, not loose text", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/settings?section=data-maintenance");
  await expect(
    page.getByRole("heading", { name: "Data Maintenance", exact: true }),
  ).toBeVisible();
  const prospectCard = page.locator(".maintenance-card", {
    hasText: "Inactive Prospects",
  });
  await expect(prospectCard.getByText("2 candidates")).toBeVisible();
  await expect(
    prospectCard.getByRole("button", { name: /Review 2 prospects/ }),
  ).toBeVisible();
  const engagementCard = page.locator(".maintenance-card", {
    hasText: "Completed Engagements",
  });
  await expect(engagementCard.getByText("0 candidates")).toBeVisible();
  await expect(
    page.getByText("Review 3 tokens", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("0 detected")).toBeVisible();
});

test("inactive prospects review shows actual candidate records with reasons", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/settings?section=data-maintenance");
  await page
    .locator(".maintenance-card", { hasText: "Inactive Prospects" })
    .getByRole("button", { name: /Review/ })
    .click();
  await expect(page.getByText("John Smith")).toBeVisible();
  await expect(page.getByText("john@example.com")).toBeVisible();
  await expect(page.getByText("155 days")).toBeVisible();
  await expect(page.getByText("Jane Doe")).toBeVisible();
  await expect(page.getByText("170 days")).toBeVisible();
});

test("inactive prospect archival requires confirmation and calls the real mutation", async ({
  page,
}) => {
  const calls = await mockAdmin(page);
  await page.goto("/admin/settings?section=data-maintenance");
  await page
    .locator(".maintenance-card", { hasText: "Inactive Prospects" })
    .getByRole("button", { name: /Review/ })
    .click();
  await page
    .locator("tr", { hasText: "John Smith" })
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Archive prospect" }),
  ).toBeVisible();
  await expect(page.getByText("1 record selected.")).toBeVisible();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(async () => {
    expect(calls.at(-1)).toMatchObject({
      category: "inactive_prospects",
      action: "archive",
      selected_ids: [101],
    });
  }).toPass();
  await expect(page.getByText("1 prospect archived.")).toBeVisible();
});

test("keep active dismisses a prospect from review without any mutation", async ({
  page,
}) => {
  const calls = await mockAdmin(page);
  await page.goto("/admin/settings?section=data-maintenance");
  await page
    .locator(".maintenance-card", { hasText: "Inactive Prospects" })
    .getByRole("button", { name: /Review/ })
    .click();
  await page
    .locator("tr", { hasText: "John Smith" })
    .getByRole("button", { name: "Keep active", exact: true })
    .click();
  await expect(page.getByText("John Smith")).toHaveCount(0);
  await expect(page.getByText("Jane Doe")).toBeVisible();
  expect(calls).toHaveLength(0);
});

test("completed engagements review shows an intentional empty state", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/settings?section=data-maintenance");
  await page
    .locator(".maintenance-card", { hasText: "Completed Engagements" })
    .getByRole("button", { name: /Review/ })
    .click();
  await expect(
    page.getByText(
      "No completed engagements currently require archival review.",
    ),
  ).toBeVisible();
});

test("expired scheduling link deletion requires typed confirmation", async ({
  page,
}) => {
  const calls = await mockAdmin(page);
  await page.goto("/admin/settings?section=data-maintenance");
  await page.getByRole("button", { name: /Review 1 link/ }).click();
  await expect(page.getByText("Consultation")).toBeVisible();
  await page
    .locator("tr", { hasText: "Consultation" })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  const confirmButton = page
    .getByRole("button", { name: "Delete", exact: true })
    .last();
  await confirmButton.click();
  await expect(
    page.getByText("Type DELETE EXPIRED LINKS to confirm", { exact: true }),
  ).toBeVisible();
  expect(calls).toHaveLength(0);
  await page
    .getByLabel("Type DELETE EXPIRED LINKS to confirm")
    .fill("DELETE EXPIRED LINKS");
  await confirmButton.click();
  await expect(async () => {
    expect(calls.at(-1)).toMatchObject({
      category: "expired_links",
      action: "delete",
      confirm: "DELETE EXPIRED LINKS",
    });
  }).toPass();
});

test("expired admin invitation cleanup removes the invitation via the admin invitation architecture", async ({
  page,
}) => {
  const calls = await mockAdmin(page);
  await page.goto("/admin/settings?section=data-maintenance");
  await page.getByRole("button", { name: /Review 1 invitation/ }).click();
  await expect(page.getByText("Morgan Lee")).toBeVisible();
  await expect(page.getByText("morgan@example.com")).toBeVisible();
  await expect(
    page.locator("tr", { hasText: "Morgan Lee" }).getByRole("cell", {
      name: "Administrator",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator("tr", { hasText: "Morgan Lee" })
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(async () => {
    expect(calls.at(-1)).toMatchObject({
      category: "expired_invitations",
      action: "remove",
      selected_ids: [301],
    });
  }).toPass();
  await expect(page.getByText("1 invitation removed.")).toBeVisible();
});

test("expired token purge requires typed confirmation and explains active tokens are unaffected", async ({
  page,
}) => {
  const calls = await mockAdmin(page);
  await page.goto("/admin/settings?section=data-maintenance");
  await page.getByRole("button", { name: /Review 3 tokens/ }).click();
  await expect(page.getByText("client1@example.com")).toBeVisible();
  await page.locator(".maintenance-review-toolbar input[type=checkbox]");
  const rows = page.locator("tbody tr");
  await rows.nth(0).locator('input[type="checkbox"]').check();
  await rows.nth(1).locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: /Purge selected \(2\)/ }).click();
  await expect(
    page.getByText("Active, unexpired tokens are never affected."),
  ).toBeVisible();
  await page
    .getByLabel("Type PURGE EXPIRED TOKENS to confirm")
    .fill("PURGE EXPIRED TOKENS");
  await page.getByRole("button", { name: "Purge", exact: true }).click();
  await expect(async () => {
    expect(calls.at(-1)).toMatchObject({
      category: "expired_tokens",
      action: "purge",
      confirm: "PURGE EXPIRED TOKENS",
    });
    expect(calls.at(-1).selected_ids).toHaveLength(2);
  }).toPass();
});

test("a failed maintenance action surfaces an error instead of failing silently", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.route(
    (url) =>
      new URL(url).searchParams.get("route") === "settings/maintenance/execute",
    async (route) => {
      await route.fulfill({
        status: 500,
        json: {
          error: { code: "INTERNAL_ERROR", message: "Could not archive." },
        },
      });
    },
  );
  await page.goto("/admin/settings?section=data-maintenance");
  await page
    .locator(".maintenance-card", { hasText: "Inactive Prospects" })
    .getByRole("button", { name: /Review/ })
    .click();
  await page
    .locator("tr", { hasText: "John Smith" })
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.getByText("Could not archive.")).toBeVisible();
});

test("zero-result empty states render for every category", async ({ page }) => {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const path = new URL(route.request().url()).searchParams.get("route");
    if (path === "auth/session")
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "test-token",
          },
        },
      });
    if (path === "settings" && route.request().method() === "GET")
      return route.fulfill({ json: { data: { business_name: "Alchemize" } } });
    if (path === "settings/maintenance/overview")
      return route.fulfill({
        json: {
          data: overviewPayload({
            inactive_prospects: 0,
            completed_engagements: 0,
            expired_links: 0,
            expired_invitations: 0,
            expired_tokens: 0,
          }),
        },
      });
    if (path === "settings/maintenance/history")
      return route.fulfill({ json: { data: [] } });
    if (path === "settings/maintenance/preview") {
      const payload = route.request().postDataJSON();
      return route.fulfill({
        json: {
          data: {
            category: payload.category,
            action: null,
            count: 0,
            records: [],
          },
        },
      });
    }
    await route.fulfill({ json: { data: [] } });
  });
  await page.goto("/admin/settings?section=data-maintenance");
  await expect(
    page.getByText("No maintenance actions have been recorded yet."),
  ).toBeVisible();
  await page
    .locator(".maintenance-card", { hasText: "Inactive Prospects" })
    .getByRole("button", { name: "Review prospects", exact: true })
    .click();
  await expect(
    page.getByText("No inactive prospects currently require review."),
  ).toBeVisible();
});

test("maintenance history renders real recent actions, not raw counts", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.route(
    (url) =>
      new URL(url).searchParams.get("route") === "settings/maintenance/history",
    async (route) => {
      await route.fulfill({
        json: {
          data: [
            {
              event_type: "maintenance.prospect_archive",
              action_summary: "archived stale prospective record.",
              created_at: "2026-09-14 20:42:00",
              actor_name: "Jessy Santos",
            },
            {
              event_type: "maintenance.invitation_cleanup",
              action_summary: "removed 2 expired administrator invitations.",
              created_at: "2026-09-14 20:35:00",
              actor_name: "Jessy Santos",
            },
          ],
        },
      });
    },
  );
  await page.goto("/admin/settings?section=data-maintenance");
  await expect(
    page.getByText("Jessy Santos archived stale prospective record."),
  ).toBeVisible();
  await expect(
    page.getByText("Jessy Santos removed 2 expired administrator invitations."),
  ).toBeVisible();
});

for (const width of [1440, 834, 390]) {
  test(`Data Maintenance is responsive at ${width}px`, async ({ page }) => {
    await mockAdmin(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/settings?section=data-maintenance");
    await expect(
      page.getByRole("heading", { name: "Data Maintenance", exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator(".settings-layout")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await page.getByRole("button", { name: /Review 3 tokens/ }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

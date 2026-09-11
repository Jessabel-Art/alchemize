import { test, expect } from "@playwright/test";

// The "Review" action in Admin -> Client Requests previously had no
// onClick handler at all (a plain <button className="link-button">Review
// </button>), so clicking it did nothing for any of the three unified-queue
// record types (document requests, real intake-form submissions, tasks).
// These tests drive the fixed handler end to end against a mocked backend
// shaped exactly like the real API responses (documents/{id},
// portal-admin/documents/{id}/versions, portal-admin/intakes/{id},
// tasks/{id}), reflecting real production record shapes captured directly
// from the live database (client 9, engagement 2).

const clientRows = [
  {
    id: 9,
    display_name: "Test Client",
    client_type: "individual",
    primary_email: "client@example.test",
    status: "active",
    portal_status: "active",
    updated_at: "2026-09-05",
  },
];
const engagementRows = [
  {
    id: 2,
    public_id: "eng-pub-2",
    client_id: 9,
    title: "Website Build",
    status: "in_progress",
    service_name: "Web & Digital Solutions",
  },
];
const documentsMeta = [
  {
    id: 1,
    public_id: "doc-pub-1",
    client_id: 9,
    engagement_id: 2,
    document_name: "Logo files",
    document_type: "asset",
    status: "received",
    visibility: "shared",
    requested_date: "2026-09-01",
    due_date: null,
    client_instructions: "Please upload your logo files.",
    received_date: "2026-09-02",
    reviewed_date: null,
    internal_notes: "Looks good, approved.",
    storage_key: null,
    mime_type: null,
  },
  {
    id: 2,
    public_id: "doc-pub-2",
    client_id: 9,
    engagement_id: 2,
    document_name: "ID Verification",
    document_type: "identity",
    status: "awaiting_upload",
    visibility: "shared",
    requested_date: "2026-09-04",
    due_date: "2026-09-20",
    client_instructions: "",
    received_date: null,
    reviewed_date: null,
    internal_notes: "",
    storage_key: null,
    mime_type: null,
  },
];
const taskRows = [
  {
    id: 1,
    public_id: "task-pub-1",
    client_id: 9,
    engagement_id: 2,
    title: "Verify ID document",
    description: "Collect a government-issued identity document.",
    priority: "normal",
    due_date: "2026-09-10",
    status: "completed",
    visibility: "shared",
  },
];
const intakeListItems = [
  {
    id: "intake-pub-1",
    family_key: "web_digital",
    module_keys: ["brand"],
    status: "submitted",
    completion_percentage: 100,
    due_date: null,
    submitted_at: "2026-09-05 10:00:00",
    client_id: "client-pub-9",
    client_name: "Test Client",
    engagement_id: "eng-pub-2",
    engagement_title: "Website Build",
    intake_service_codes: "business-digital",
    assigned_team_member: null,
    missing_requirements: 0,
  },
];
const intakeDetail = {
  assignment: { ...intakeListItems[0], id: 1 },
  responses: {
    business_name: {
      value: "Rivera Consulting",
      section: "brand",
      applicability: "required",
      updated_at: "2026-09-05 09:00:00",
      currently_applicable: true,
    },
    brand_colors: {
      value: ["Teal", "Gold"],
      section: "brand",
      applicability: "optional",
      updated_at: "2026-09-05 09:00:00",
      currently_applicable: true,
    },
  },
  requirements: [
    {
      id: "req-pub-1",
      requirement_key: "logo",
      requirement_name: "Logo files",
      requirement_type: "asset",
      necessity: "optional",
      status: "accepted",
      notes: null,
      document_id: "doc-pub-1",
      document_name: "Logo files",
      document_status: "accepted",
      submission_id: "sub-pub-1",
      filename: "logo-files.pdf",
      uploaded_at: "2026-09-02 08:00:00",
    },
  ],
  definition: {
    key: "web_digital",
    label: "Web & Digital Solutions",
    modules: [
      {
        key: "brand",
        title: "Brand assets",
        fields: [
          { key: "business_name", label: "Business name", type: "text" },
          {
            key: "brand_colors",
            label: "Preferred brand colors",
            type: "text",
          },
        ],
      },
    ],
  },
};
const documentVersions = {
  items: [
    {
      id: "sub-pub-1",
      version_number: 1,
      original_filename: "logo-files.pdf",
      mime_type: "application/pdf",
      file_size_bytes: 45210,
      status: "received",
      submitted_at: "2026-09-02 08:00:00",
      reviewed_at: null,
      archived_at: null,
      uploaded_by: "Test Client",
    },
  ],
};

async function mockAdmin(page, { fail } = {}) {
  const requestedIds = { document: [], task: [], intake: [] };
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
            csrf_token: "test-token",
          },
        },
      });
    }
    if (key === "portal-admin/attention")
      return route.fulfill({ json: { data: { items: [] } } });
    if (key === "portal-admin/messages")
      return route.fulfill({ json: { data: { items: [] } } });
    if (key && key.startsWith("portal-admin/access-grants"))
      return route.fulfill({ json: { data: { items: [] } } });

    if (key === "clients") return route.fulfill({ json: { data: clientRows } });
    if (key === "engagements")
      return route.fulfill({ json: { data: engagementRows } });
    if (
      ["services", "appointments", "invoices", "payments", "leads"].includes(
        key,
      )
    )
      return route.fulfill({ json: { data: [] } });
    if (key === "tasks" && method === "GET")
      return route.fulfill({ json: { data: taskRows } });
    if (key === "documents" && method === "GET")
      return route.fulfill({ json: { data: documentsMeta } });
    if (key === "portal-admin/intakes")
      return route.fulfill({
        json: { data: { items: intakeListItems, definitions: [] } },
      });

    const documentIdMatch = /^documents\/(\d+)$/.exec(key || "");
    if (documentIdMatch && method === "GET") {
      requestedIds.document.push(Number(documentIdMatch[1]));
      if (fail === "document")
        return route.fulfill({
          status: 500,
          json: {
            error: {
              code: "INTERNAL_ERROR",
              message: "Documents API is temporarily unavailable.",
            },
          },
        });
      const doc = documentsMeta.find(
        (d) => d.id === Number(documentIdMatch[1]),
      );
      return route.fulfill({ json: { data: doc } });
    }

    const taskIdMatch = /^tasks\/(\d+)$/.exec(key || "");
    if (taskIdMatch && method === "GET") {
      requestedIds.task.push(Number(taskIdMatch[1]));
      if (fail === "task")
        return route.fulfill({
          status: 500,
          json: {
            error: {
              code: "INTERNAL_ERROR",
              message: "Tasks API is temporarily unavailable.",
            },
          },
        });
      const item = taskRows.find((t) => t.id === Number(taskIdMatch[1]));
      return route.fulfill({ json: { data: item } });
    }

    const intakeIdMatch = /^portal-admin\/intakes\/([^/]+)$/.exec(key || "");
    if (intakeIdMatch && method === "GET") {
      requestedIds.intake.push(intakeIdMatch[1]);
      if (fail === "intake")
        return route.fulfill({
          status: 500,
          json: {
            error: {
              code: "INTERNAL_ERROR",
              message: "Portal admin API is temporarily unavailable.",
            },
          },
        });
      return route.fulfill({ json: { data: intakeDetail } });
    }

    const versionsMatch = /^portal-admin\/documents\/([^/]+)\/versions$/.exec(
      key || "",
    );
    if (versionsMatch && method === "GET") {
      const items =
        versionsMatch[1] === "doc-pub-1" ? documentVersions.items : [];
      return route.fulfill({ json: { data: { items } } });
    }

    const downloadMatch = /^portal-admin\/documents\/([^/]+)\/download$/.exec(
      key || "",
    );
    if (downloadMatch && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "mock-file-bytes",
      });
    }

    return route.fulfill({ json: { data: [] } });
  });
  return requestedIds;
}

test("document Review opens with the correct record, shows metadata, and the uploaded file is downloadable", async ({
  page,
}) => {
  const requestedIds = await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  await expect(page.getByText("Logo files").first()).toBeVisible();
  const row = page.locator("tr", { hasText: "Logo files" });
  await row.getByRole("button", { name: "Review" }).click();

  // The handler fired with this row's real numeric id (1), not some other
  // row's, and not a no-op.
  await expect.poll(() => requestedIds.document).toEqual([1]);

  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Test Client", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Website Build")).toBeVisible();
  await expect(
    dialog.getByText("Please upload your logo files."),
  ).toBeVisible();
  await expect(dialog.getByText("Looks good, approved.")).toBeVisible();

  const downloadLink = dialog.getByRole("link", { name: /logo-files\.pdf/ });
  await expect(downloadLink).toBeVisible();
  const href = await downloadLink.getAttribute("href");
  expect(href).toContain("route=portal-admin");
  expect(href).toContain("download");

  // The download URL uses the existing document-storage architecture, not
  // a fabricated path -- confirm it actually resolves through the mocked
  // backend route.
  const download = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return { status: response.status, text: await response.text() };
  }, href);
  expect(download.status).toBe(200);
  expect(download.text).toBe("mock-file-bytes");

  // Closing the review view returns to Client Requests correctly.
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Logo files").first()).toBeVisible();
});

test("an awaiting-upload document Review shows no submitted file yet", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  const row = page.locator("tr", { hasText: "ID Verification" });
  await row.getByRole("button", { name: "Review" }).click();
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(
    dialog.getByText("No file has been uploaded for this request yet."),
  ).toBeVisible();
});

test("intake Review opens and displays the real submitted answers", async ({
  page,
}) => {
  const requestedIds = await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  await expect(page.getByText(/Web Digital intake/i)).toBeVisible();
  const row = page.locator("tr", { hasText: "Web Digital intake" });
  await row.getByRole("button", { name: "Review" }).click();

  await expect.poll(() => requestedIds.intake).toEqual(["intake-pub-1"]);
  await expect(
    page.getByRole("heading", { name: "Intake submission" }),
  ).toBeVisible();

  // Real submitted answers, using the field's actual question label from
  // the intake schema definition, not just the raw storage key.
  await expect(page.getByText("Business name")).toBeVisible();
  await expect(page.getByText("Rivera Consulting")).toBeVisible();
  await expect(page.getByText("Preferred brand colors")).toBeVisible();
  await expect(page.getByText("Teal, Gold")).toBeVisible();

  // The intake's own attached document requirement is reachable too.
  const attachmentLink = page.getByRole("link", { name: /Logo files/ });
  await expect(attachmentLink).toBeVisible();
  const href = await attachmentLink.getAttribute("href");
  expect(href).toContain("sub-pub-1");
});

test("task Review opens the task detail rather than leaving the button inert", async ({
  page,
}) => {
  const requestedIds = await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  const row = page.locator("tr", { hasText: "Verify ID document" });
  await row.getByRole("button", { name: "Review" }).click();

  await expect.poll(() => requestedIds.task).toEqual([1]);
  const dialog = page.getByRole("dialog", { name: "Task detail" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Collect a government-issued identity document."),
  ).toBeVisible();
});

test("a loading state is shown while Review data is being fetched", async ({
  page,
}) => {
  // Registered after mockAdmin so it runs first (Playwright routes run
  // most-recently-registered first) and can delay before falling through
  // to mockAdmin's handler via route.fallback() -- route.continue() would
  // instead send the request straight to the real network.
  await mockAdmin(page);
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    const key = url.searchParams.get("route");
    if (key === "documents/1") {
      await page.waitForTimeout(400);
    }
    return route.fallback();
  });
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  const row = page.locator("tr", { hasText: "Logo files" });
  await row.getByRole("button", { name: "Review" }).click();
  await expect(page.getByText("Loading…")).toBeVisible();

  // Let the delayed route finish before the test ends -- otherwise the
  // in-flight page.waitForTimeout inside the route callback is torn down
  // mid-flight and Playwright reports that as a failure.
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(dialog.getByText("Test Client", { exact: true })).toBeVisible();
});

for (const [type, label] of [
  ["document", "Document request"],
  ["intake", "Intake submission"],
  ["task", "Task detail"],
]) {
  test(`a Review API failure for a ${type} record shows an error instead of doing nothing`, async ({
    page,
  }) => {
    await mockAdmin(page, { fail: type });
    await page.goto("/admin/client-requests/");
    await page.waitForFunction(() => Boolean(window.adminStore));

    const rowText =
      type === "document"
        ? "Logo files"
        : type === "intake"
          ? "Web Digital intake"
          : "Verify ID document";
    const row = page.locator("tr", { hasText: rowText });
    await row.getByRole("button", { name: "Review" }).click();

    const dialog = page.getByRole("dialog", { name: label });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog.getByRole("alert")).toContainText(
      /temporarily unavailable/i,
    );
  });
}

test("Review filters by type via the legacy ?type= redirect query param", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/?type=intake");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await expect(page.getByText(/Web Digital intake/i)).toBeVisible();
  await expect(page.getByText("Logo files")).toHaveCount(0);
});

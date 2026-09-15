import { test, expect } from "@playwright/test";

// Admin -> Client Requests: the previously-inert "Review" action was fixed
// in an earlier pass to open a real detail view per record type. This pass
// replaces that narrow card modal with a full document-viewer experience
// for intake submissions and document requests (print-ready, inline file
// preview instead of forced downloads), adds a real controlled workflow
// (Client Review / Admin Review / Accepted / Completed) driving a
// View / Notes / Send Back actions row, and fixes the production
// NOT_FOUND file-serving defect. These tests mock the backend with shapes
// matching the real API responses (documents/{id}, portal-admin/documents/
// {id}/versions|preview|download, portal-admin/intakes/{id}, tasks/{id},
// notes/{entity}/{id}), reflecting real production record shapes captured
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
    status: "in_progress",
    visibility: "shared",
  },
];
const intakeListItems = [
  {
    id: "intake-pub-1",
    family_key: "web_digital",
    module_keys: ["project_overview"],
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
const intakeAssignment = { ...intakeListItems[0], id: 1 };
const intakeDefinition = {
  key: "web_digital",
  label: "Web & Digital Solutions",
  modules: [
    {
      key: "project_overview",
      title: "Project overview",
      fields: [
        {
          key: "project_type",
          label: "Project type",
          type: "multiselect",
          options: [
            { value: "new_website", label: "New Website" },
            { value: "website_redesign", label: "Website Redesign" },
          ],
        },
        { key: "project_goals", label: "Project goals", type: "textarea" },
      ],
    },
  ],
};
function buildIntakeDetail(overrides = {}) {
  return {
    assignment: { ...intakeAssignment, ...overrides.assignment },
    responses: {
      project_type: {
        value: "new_website",
        section: "project_overview",
        applicability: "required",
        currently_applicable: true,
      },
      project_goals: {
        value: "Launch a new marketing site before Q4.",
        section: "project_overview",
        applicability: "required",
        currently_applicable: true,
      },
      ...overrides.responses,
    },
    requirements: overrides.requirements || [
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
    definition: overrides.definition || intakeDefinition,
  };
}
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
const imageDocumentVersions = {
  items: [
    {
      id: "sub-pub-2",
      version_number: 1,
      original_filename: "id-front.png",
      mime_type: "image/png",
      file_size_bytes: 20481,
      status: "received",
      submitted_at: "2026-09-06 08:00:00",
      reviewed_at: null,
      archived_at: null,
      uploaded_by: "Test Client",
    },
  ],
};

async function mockAdmin(page, { fail, docVersions } = {}) {
  const calls = { document: [], task: [], intake: [], notes: [] };
  const state = {
    documents: documentsMeta.map((d) => ({ ...d })),
    tasks: taskRows.map((t) => ({ ...t })),
    intake: { ...intakeAssignment },
    notes: [],
  };
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
      return route.fulfill({ json: { data: state.tasks } });
    if (key === "documents" && method === "GET")
      return route.fulfill({ json: { data: state.documents } });
    if (key === "portal-admin/intakes") {
      return route.fulfill({
        json: {
          data: {
            items: [
              {
                ...intakeListItems[0],
                status: state.intake.status,
              },
            ],
            definitions: [],
          },
        },
      });
    }

    const documentIdMatch = /^documents\/(\d+)$/.exec(key || "");
    if (documentIdMatch && method === "GET") {
      calls.document.push(Number(documentIdMatch[1]));
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
      const doc = state.documents.find(
        (d) => d.id === Number(documentIdMatch[1]),
      );
      return route.fulfill({ json: { data: doc } });
    }
    if (documentIdMatch && method === "PUT") {
      const id = Number(documentIdMatch[1]);
      const body = route.request().postDataJSON();
      const doc = state.documents.find((d) => d.id === id);
      Object.assign(doc, body);
      return route.fulfill({ json: { data: doc } });
    }

    const taskIdMatch = /^tasks\/(\d+)$/.exec(key || "");
    if (taskIdMatch && method === "GET") {
      calls.task.push(Number(taskIdMatch[1]));
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
      const item = state.tasks.find((t) => t.id === Number(taskIdMatch[1]));
      return route.fulfill({ json: { data: item } });
    }
    if (taskIdMatch && method === "PUT") {
      const id = Number(taskIdMatch[1]);
      const body = route.request().postDataJSON();
      const item = state.tasks.find((t) => t.id === id);
      Object.assign(item, body);
      return route.fulfill({ json: { data: { id } } });
    }

    const intakeIdMatch = /^portal-admin\/intakes\/([^/]+)$/.exec(key || "");
    if (intakeIdMatch && method === "GET") {
      calls.intake.push(intakeIdMatch[1]);
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
      return route.fulfill({
        json: { data: buildIntakeDetail({ assignment: state.intake }) },
      });
    }
    if (intakeIdMatch && method === "PUT") {
      const body = route.request().postDataJSON();
      Object.assign(state.intake, {
        status: body.status,
        client_visible_review_note: body.client_visible_review_note,
      });
      return route.fulfill({
        json: { data: { id: intakeIdMatch[1], status: body.status } },
      });
    }

    const versionsMatch = /^portal-admin\/documents\/([^/]+)\/versions$/.exec(
      key || "",
    );
    if (versionsMatch && method === "GET") {
      const items =
        versionsMatch[1] === "doc-pub-1"
          ? (docVersions || documentVersions).items
          : versionsMatch[1] === "doc-pub-2"
            ? imageDocumentVersions.items
            : [];
      return route.fulfill({ json: { data: { items } } });
    }

    const downloadMatch = /^portal-admin\/documents\/([^/]+)\/download$/.exec(
      key || "",
    );
    if (downloadMatch && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/pdf",
        headers: { "Content-Disposition": "attachment; filename=file" },
        body: "mock-file-bytes-attachment",
      });
    }
    const previewMatch = /^portal-admin\/documents\/([^/]+)\/preview$/.exec(
      key || "",
    );
    if (previewMatch && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/pdf",
        headers: { "Content-Disposition": "inline; filename=file" },
        body: "mock-file-bytes-inline",
      });
    }

    const notesGetMatch = /^notes\/([a-z]+)\/([^/]+)$/.exec(key || "");
    if (notesGetMatch && method === "GET") {
      return route.fulfill({
        json: {
          data: state.notes.filter(
            (note) =>
              note.entity_type === notesGetMatch[1] &&
              note.entity_id === notesGetMatch[2],
          ),
        },
      });
    }
    if (key === "notes" && method === "POST") {
      const body = route.request().postDataJSON();
      calls.notes.push(body);
      const note = {
        public_id: `note-${state.notes.length + 1}`,
        ...body,
        created_at: "2026-09-10 12:00:00",
      };
      state.notes.push(note);
      return route.fulfill({
        status: 201,
        json: {
          data: { id: state.notes.length, entity_type: body.entity_type },
        },
      });
    }

    return route.fulfill({ json: { data: [] } });
  });
  return { calls, state };
}

test("intake View opens the print-ready document with human-readable answers", async ({
  page,
}) => {
  const { calls } = await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  await expect(page.getByText(/Web Digital intake/i)).toBeVisible();
  const row = page.locator("tr", { hasText: "Web Digital intake" });
  await row.getByRole("button", { name: "View" }).click();

  await expect.poll(() => calls.intake).toEqual(["intake-pub-1"]);
  const dialog = page.getByRole("dialog", { name: "Intake submission" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Client Intake Submission")).toBeVisible();
  await expect(dialog.getByText("Test Client")).toBeVisible();
  await expect(dialog.getByText("Project overview")).toBeVisible();

  // Human-readable formatting: the raw stored value "new_website" renders
  // as its real option label "New Website", not the raw machine value.
  await expect(dialog.getByText("Project type")).toBeVisible();
  await expect(dialog.getByText("New Website", { exact: true })).toBeVisible();
  await expect(dialog.getByText("new_website")).toHaveCount(0);

  // Long-form answers are preserved in full, not truncated into a card.
  await expect(
    dialog.getByText("Launch a new marketing site before Q4."),
  ).toBeVisible();

  // Attachment summary with a real clickable download link.
  const attachmentLink = dialog.getByRole("link", { name: /logo-files\.pdf/ });
  await expect(attachmentLink).toBeVisible();
  expect(await attachmentLink.getAttribute("href")).toContain("sub-pub-1");

  // Print control is present for intake; window.print() is wired.
  await page.exposeFunction("__printCalled", () => {});
  await page.evaluate(() => {
    window.__printCallCount = 0;
    window.print = () => {
      window.__printCallCount += 1;
    };
  });
  await dialog.getByRole("button", { name: "Print / Save PDF" }).click();
  await expect.poll(() => page.evaluate(() => window.__printCallCount)).toBe(1);

  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);
});

test("multiselect answers render every selected option's human-readable label", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("route") === "portal-admin/intakes/intake-pub-1") {
      return route.fulfill({
        json: {
          data: buildIntakeDetail({
            responses: {
              project_type: {
                value: ["new_website", "website_redesign"],
                section: "project_overview",
                applicability: "required",
                currently_applicable: true,
              },
            },
          }),
        },
      });
    }
    return route.fallback();
  });
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page
    .locator("tr", { hasText: "Web Digital intake" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Intake submission" });
  await expect(dialog.getByText("New Website, Website Redesign")).toBeVisible();
});

test("document View shows an inline PDF preview plus a separate Download Original action", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  const row = page.locator("tr", { hasText: "Logo files" });
  await row.getByRole("button", { name: "View" }).click();
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Test Client", { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("Please upload your logo files."),
  ).toBeVisible();
  await expect(dialog.getByText("Looks good, approved.")).toBeVisible();

  const iframe = dialog.locator("iframe");
  await expect(iframe).toBeVisible();
  const previewSrc = await iframe.getAttribute("src");
  expect(previewSrc).toContain("preview");

  // Inline preview actually resolves through the real preview route.
  const previewFetch = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return {
      status: response.status,
      text: await response.text(),
      disposition: response.headers.get("content-disposition"),
    };
  }, previewSrc);
  expect(previewFetch.status).toBe(200);
  expect(previewFetch.text).toBe("mock-file-bytes-inline");
  expect(previewFetch.disposition).toContain("inline");

  const downloadLink = dialog.getByRole("link", { name: "Download Original" });
  await expect(downloadLink).toBeVisible();
  const downloadHref = await downloadLink.getAttribute("href");
  expect(downloadHref).toContain("download");
  expect(downloadHref).not.toContain("preview");
});

test("an image submission previews inline as an <img>", async ({ page }) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page
    .locator("tr", { hasText: "ID Verification" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(dialog.locator("img[alt='id-front.png']")).toBeVisible();
});

test("a non-previewable file type shows the unavailable message and Download Original instead of an inline embed", async ({
  page,
}) => {
  await mockAdmin(page, {
    docVersions: {
      items: [
        {
          id: "sub-pub-3",
          version_number: 1,
          original_filename: "contract.docx",
          mime_type:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          submitted_at: "2026-09-02 08:00:00",
          uploaded_by: "Test Client",
        },
      ],
    },
  });
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page
    .locator("tr", { hasText: "Logo files" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(
    dialog.getByText("Preview unavailable for this file type."),
  ).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveCount(0);
  // Only the Alchemize brand mark (not a file preview <img>) should render.
  await expect(dialog.locator(".review-file-preview img")).toHaveCount(0);
  await expect(
    dialog.getByRole("link", { name: "Download Original" }),
  ).toBeVisible();
});

test("task View opens the task detail", async ({ page }) => {
  const { calls } = await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  const row = page.locator("tr", { hasText: "Verify ID document" });
  await row.getByRole("button", { name: "View" }).click();

  await expect.poll(() => calls.task).toEqual([1]);
  const dialog = page.getByRole("dialog", { name: "Task detail" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Collect a government-issued identity document."),
  ).toBeVisible();
});

for (const [type, label] of [
  ["document", "Document request"],
  ["intake", "Intake submission"],
  ["task", "Task detail"],
]) {
  test(`a View API failure for a ${type} record shows an error instead of doing nothing`, async ({
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
    await page
      .locator("tr", { hasText: rowText })
      .getByRole("button", { name: "View" })
      .click();

    const dialog = page.getByRole("dialog", { name: label });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog.getByRole("alert")).toContainText(
      /temporarily unavailable/i,
    );
  });
}

test("Next Action shows the controlled workflow stage, not a generic Review label", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  // Document "Logo files" is status=received -> Admin Review (client
  // submitted, Alchemize needs to review).
  await expect(
    page.locator("tr", { hasText: "Logo files" }).getByText("Admin Review"),
  ).toBeVisible();
  // Document "ID Verification" is status=awaiting_upload -> Client Review.
  await expect(
    page
      .locator("tr", { hasText: "ID Verification" })
      .getByText("Client Review"),
  ).toBeVisible();
  // Intake is status=submitted -> Admin Review.
  await expect(
    page
      .locator("tr", { hasText: "Web Digital intake" })
      .getByText("Admin Review"),
  ).toBeVisible();
});

test("Accept moves a document from Admin Review to Accepted", async ({
  page,
}) => {
  const { state } = await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  await page
    .locator("tr", { hasText: "Logo files" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await dialog.getByRole("button", { name: "Accept" }).click();

  await expect(dialog).toHaveCount(0);
  await expect.poll(() => state.documents[0].status).toBe("accepted");
  // Both the Status and Next Action columns legitimately read "Accepted"
  // at this status -- just confirm the row picked it up on refresh.
  await expect(
    page.locator("tr", { hasText: "Logo files" }).getByText("Accepted").first(),
  ).toBeVisible();
});

test("Send Back requires a reason, moves the record to Client Review, and preserves prior submission history", async ({
  page,
}) => {
  const { state } = await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  const row = page.locator("tr", { hasText: "Logo files" });
  await row.getByRole("button", { name: "Send Back" }).click();

  // Empty reason is rejected.
  await page.getByRole("button", { name: "Send Back" }).last().click();
  await expect(page.getByText("A short reason is required.")).toBeVisible();

  await page
    .getByLabel("Reason / instructions for the client")
    .fill("The logo file is too low resolution, please resubmit.");
  await page.getByRole("button", { name: "Send Back" }).last().click();

  await expect
    .poll(() => state.documents[0].status)
    .toBe("replacement_requested");
  // The original instructions are preserved, not overwritten.
  expect(state.documents[0].client_instructions).toContain(
    "Please upload your logo files.",
  );
  expect(state.documents[0].client_instructions).toContain(
    "too low resolution",
  );
  await expect(
    page.locator("tr", { hasText: "Logo files" }).getByText("Client Review"),
  ).toBeVisible();
});

test("Notes are saved and labeled internal/admin-only", async ({ page }) => {
  const { calls } = await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));

  const row = page.locator("tr", { hasText: "Logo files" });
  await row.getByRole("button", { name: "Notes" }).click();
  await expect(
    page.getByText("Internal / Admin-only. Not visible to the client."),
  ).toBeVisible();

  await page.getByLabel("Add a note").fill("Called the client to confirm.");
  await page.getByRole("button", { name: "Save note" }).click();

  await expect(page.getByText("Called the client to confirm.")).toBeVisible();
  await expect.poll(() => calls.notes).toHaveLength(1);
  expect(calls.notes[0].entity_type).toBe("document");
  expect(calls.notes[0].entity_id).toBe("doc-pub-1");
});

test("Review filters by type via the legacy ?type= redirect query param", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/?type=intake");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await expect(page.getByText(/Web Digital intake/i)).toBeVisible();
  await expect(page.getByText("Logo files")).toHaveCount(0);
});

test("intake sections and questions render in the form definition's own order, and an unanswered optional question is shown restrained", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.route("**/alchemize-api.php?*", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("route") === "portal-admin/intakes/intake-pub-1") {
      return route.fulfill({
        json: {
          data: buildIntakeDetail({
            assignment: {
              module_keys: ["zeta_section", "alpha_section"],
            },
            responses: {
              // No entry at all for zz_field -- an unanswered optional
              // question, not merely an empty string. aa_field has a real
              // answer so only zz_field should render as empty.
              aa_field: {
                value: "Yes, this is the aye answer.",
                currently_applicable: true,
              },
            },
            requirements: [],
            definition: {
              key: "web_digital",
              label: "Web & Digital Solutions",
              modules: [
                {
                  key: "zeta_section",
                  title: "Zeta section",
                  fields: [
                    {
                      key: "zz_field",
                      label: "Is this the zed question?",
                      type: "select",
                    },
                  ],
                },
                {
                  key: "alpha_section",
                  title: "Alpha section",
                  fields: [
                    {
                      key: "aa_field",
                      label: "Is this the aye question?",
                      type: "text",
                    },
                  ],
                },
              ],
            },
          }),
        },
      });
    }
    return route.fallback();
  });
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page
    .locator("tr", { hasText: "Web Digital intake" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Intake submission" });
  await expect(dialog).toBeVisible();

  // Section/question order follows the form definition's own array order
  // (Zeta before Alpha), not alphabetical or response order.
  const headings = dialog.locator(".review-print-section h2");
  await expect(headings).toHaveCount(2);
  await expect(headings.nth(0)).toHaveText("Zeta section");
  await expect(headings.nth(1)).toHaveText("Alpha section");

  // The unanswered optional question shows a restrained fallback, marked
  // for muted styling, rather than blank space or a raw missing value.
  const emptyAnswer = dialog.locator(".review-print-answer-empty");
  await expect(emptyAnswer).toHaveCount(1);
  await expect(emptyAnswer).toContainText("Is this the zed question?");
  await expect(emptyAnswer).toContainText("No response provided");
});

test("the action bar shows Accept as primary and Send Back as secondary when a submission is awaiting Admin Review", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page
    .locator("tr", { hasText: "Logo files" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(dialog.getByRole("button", { name: "Accept" })).toHaveClass(
    /primary-button/,
  );
  await expect(dialog.getByRole("button", { name: "Send Back" })).toHaveClass(
    /secondary-button/,
  );
});

test("a Completed document shows no Mark Completed / Accept / Send Back actions", async ({
  page,
}) => {
  const { state } = await mockAdmin(page);
  state.documents[0].status = "archived";
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page
    .locator("tr", { hasText: "Logo files" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Accept" })).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Mark Completed" }),
  ).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Send Back" })).toHaveCount(
    0,
  );
  // The table itself agrees: no Send Back offered on a completed row.
  await expect(
    page
      .locator("tr", { hasText: "Logo files" })
      .getByRole("button", { name: "Send Back" }),
  ).toHaveCount(0);
});

test("task View shows the full editorial workspace (client, engagement, status, priority, due) instead of a mostly-empty card", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page
    .locator("tr", { hasText: "Verify ID document" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Task detail" });
  await expect(dialog.getByText("Test Client", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Website Build")).toBeVisible();
  await expect(dialog.getByText("In Progress")).toBeVisible();
  await expect(dialog.getByText("Normal")).toBeVisible();
});

test("document View shows the submitted file's identity, version, uploader, upload date, and review state", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/client-requests/");
  await page.waitForFunction(() => Boolean(window.adminStore));
  await page
    .locator("tr", { hasText: "Logo files" })
    .getByRole("button", { name: "View" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Document request" });
  await expect(dialog.getByText("Latest", { exact: true })).toBeVisible();
  await expect(dialog.getByText("logo-files.pdf")).toBeVisible();
  const versionDetail = dialog.locator(".review-file-version-detail");
  await expect(versionDetail).toContainText("Version 1");
  await expect(versionDetail).toContainText("by Test Client");
  await expect(versionDetail).toContainText("Received");
});

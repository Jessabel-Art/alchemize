import { test, expect } from "@playwright/test";
import { Buffer } from "node:buffer";

test("requested and general uploads preserve secure endpoints and file download", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/client-portal/tasks-and-documents");
  await expect(
    page.locator("#document-logo").getByRole("link", { name: "View file" }),
  ).toHaveAttribute("href", /portal%2Fdocuments%2Flogo%2Fdownload/);
  const requested = page.locator("#document-registration");
  await requested.getByRole("button", { name: "Upload", exact: true }).click();
  await requested.locator('input[type="file"]').setInputFiles({
    name: "registration.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test"),
  });
  const requestPromise = page.waitForRequest((request) =>
    request.url().includes("portal%2Fdocuments%2Fregistration%2Fupload"),
  );
  await requested.getByRole("button", { name: "Upload securely" }).click();
  const request = await requestPromise;
  expect(request.method()).toBe("POST");
  expect(request.headers()["x-csrf-token"]).toBe("test");
  expect(request.postData()).toContain("registration.pdf");
  await expect(
    page.getByRole("button", { name: "Upload a document", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Upload a document", exact: true })
    .click();
  const general = page.locator("#general-document-form");
  await general
    .getByLabel("Document name", { exact: true })
    .fill("Supporting information");
  await general.locator('input[type="file"]').setInputFiles({
    name: "support.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test"),
  });
  const generalPromise = page.waitForRequest((request) =>
    request.url().includes("portal%2Fdocuments%2Fupload"),
  );
  await general.getByRole("button", { name: "Upload securely" }).click();
  const generalRequest = await generalPromise;
  expect(generalRequest.headers()["x-csrf-token"]).toBe("test");
  expect(generalRequest.postData()).toContain("Supporting information");
});

async function setup(page, { status = "submitted", empty = false } = {}) {
  const mutations = [];
  const assignment = {
    id: "intake-a",
    status,
    engagement_title: "Business Consulting Intake",
    completion_percentage: status === "assigned" ? 0 : 100,
    submitted_at: "2026-09-04",
    due_date: "2026-09-13",
  };
  await page.route("**/alchemize-api.php?*", async (route) => {
    const path = new URL(route.request().url()).searchParams.get("route");
    if (route.request().method() !== "GET")
      mutations.push({ path, body: route.request().postData() });
    const payloads = {
      "auth/session": {
        authenticated: true,
        user: { role_slug: "client" },
        csrf_token: "test",
      },
      "portal/dashboard": {},
      "portal/intakes": { items: empty ? [] : [assignment] },
      "portal/tasks": {
        items: empty
          ? []
          : [
              {
                id: "task-a",
                title: "Confirm business details",
                status: "completed",
              },
            ],
      },
      "portal/documents": {
        items: empty
          ? []
          : [
              {
                id: "logo",
                document_name: "Logo files",
                client_instructions: "Upload your logo files.",
                status: "under_review",
                current_version: 1,
              },
              {
                id: "registration",
                document_name: "Business registration",
                status: "requested",
                due_date: "2026-09-20",
              },
            ],
      },
      "portal/services": {
        items: [
          {
            id: "service",
            title: "Business Consulting",
            status: "in_progress",
            start_date: "2026-09-03",
            target_date: "2026-09-30",
          },
        ],
      },
      "portal/intakes/intake-a": {
        assignment,
        definition: {
          label: "Consulting",
          modules: [
            {
              key: "context",
              title: "Business context",
              fields: [
                {
                  key: "answer",
                  label: "Your goals",
                  type: "textarea",
                  required: true,
                },
                {
                  key: "blank",
                  label: "Additional details",
                  type: "text",
                  profile_key: "new_value",
                },
                { key: "people", label: "Owners", type: "person_refs" },
              ],
            },
          ],
        },
        responses: {
          answer: { value: "Original submitted answer" },
          people: { value: ["person-internal-id"] },
        },
        reference_snapshots: { people: [{ name: "Historical owner" }] },
        profile: {
          business: { new_value: "New profile value" },
          people: [],
          addresses: [],
        },
        requirements: [],
      },
    };
    await route.fulfill({ json: { data: payloads[path] || {} } });
  });
  return mutations;
}

test("compact rows, actual progress, filters, review and bottom upload interaction", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/client-portal/tasks-and-documents");
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "75");
  await expect(page.getByText("3 of 4 items complete")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View submission" }),
  ).toBeVisible();
  await expect(page.getByText("Continue intake")).toHaveCount(0);
  await expect(page.locator("#document-logo")).toContainText("Under review");
  await expect(
    page
      .locator("#document-logo")
      .getByRole("button", { name: "Upload", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page
    .locator("#document-registration")
    .getByRole("button", { name: "Upload", exact: true })
    .click();
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
  await expect(page.locator(".td-general")).toHaveCount(1);
  expect(
    await page
      .locator(".td-layout")
      .evaluate((el) => el.lastElementChild.classList.contains("td-general")),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Upload a document", exact: true })
    .click();
  await expect(page.getByLabel("Document name", { exact: true })).toHaveCount(
    1,
  );
  await page
    .getByRole("button", { name: "Completed (3)", exact: true })
    .click();
  await expect(page.locator(".td-row")).toHaveCount(3);
  await expect(page.locator("#document-registration")).toHaveCount(0);
  await expect(page.locator(".td-context")).toContainText("Sep 30, 2026");
  await expect(page.locator(".portal-nav-item svg")).toHaveCount(7);
  await expect(page.locator("body")).not.toContainText(/[✓○→�]|âœ/);
});

for (const status of [
  "submitted",
  "completed",
  "under_review",
  "approved",
  "waiting_on_alchemize",
  "archived",
]) {
  test(`${status} intake is read-only and preserves submitted answers`, async ({
    page,
  }) => {
    const mutations = await setup(page, { status });
    await page.goto("/client-portal/intake?assignment=intake-a");
    await expect(page.getByText("Original submitted answer")).toBeVisible();
    await expect(page.getByText("Historical owner")).toBeVisible();
    await expect(page.getByText("person-internal-id")).toHaveCount(0);
    await expect(page.getByText("New profile value")).toHaveCount(0);
    await expect(page.getByText("No answer submitted")).toBeVisible();
    await expect(
      page.locator(
        ".intake-workspace input, .intake-workspace textarea, .intake-workspace select",
      ),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Submit to Alchemize" }),
    ).toHaveCount(0);
    expect(mutations).toEqual([]);
  });
}

for (const [status, action] of [
  ["assigned", "Start intake"],
  ["in_progress", "Continue"],
  ["changes_requested", "Continue"],
]) {
  test(`${status} intake offers ${action} and remains editable`, async ({
    page,
  }) => {
    await setup(page, { status });
    await page.goto("/client-portal/tasks-and-documents");
    await page
      .locator("#intake-intake-a")
      .getByRole("link", { name: action, exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Your goals Required", exact: true }),
    ).toBeEditable();
  });
}

test("empty item sections are hidden", async ({ page }) => {
  await setup(page, { empty: true });
  await page.goto("/client-portal/tasks-and-documents");
  await expect(
    page.getByText("You're all caught up.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".td-group")).toHaveCount(0);
});

for (const width of [1440, 834, 390]) {
  test(`responsive tasks and documents at ${width}px`, async ({ page }) => {
    await setup(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/client-portal/tasks-and-documents");
    await expect(page.locator(".td-row")).toHaveCount(4);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const main = await page.locator(".td-main").boundingBox();
    const context = await page.locator(".td-context").boundingBox();
    if (width > 1000) expect(context.x).toBeGreaterThan(main.x + main.width);
    else expect(context.y).toBeGreaterThanOrEqual(main.y + main.height);
    await page.screenshot({
      path: `artifacts/tasks-documents-${width}.png`,
      fullPage: true,
    });
  });
}

test("legacy upload handoff preserves query and opens requested uploader", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/client-portal/documents?upload=registration");
  await expect(page).toHaveURL(/tasks-and-documents\?upload=registration/);
  await expect(
    page.locator('#document-registration input[type="file"]'),
  ).toBeVisible();
});

test("portal action links have visible hover and keyboard focus", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/client-portal/tasks-and-documents");
  const link = page.getByRole("link", { name: "View submission" });
  const before = await link.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await link.hover();
  await expect
    .poll(() => link.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(before);
  await link.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    "solid",
  );
});

import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
const definitions = JSON.parse(
  execFileSync(
    "php",
    [
      "-r",
      "require 'server/intake/definitions.php'; echo json_encode(alchemize_intake_definitions());",
    ],
    { encoding: "utf8" },
  ),
);
async function intake(page, keys = ["branding", "content", "integrations"]) {
  const definition = {
    ...definitions.web_digital,
    modules: definitions.web_digital.modules.filter((m) =>
      keys.includes(m.key),
    ),
  };
  const assignment = {
    id: "intake",
    family_key: "web_digital",
    engagement_title: "Website Design",
    status: "in_progress",
    completion_percentage: 0,
  };
  let responses = {};
  let submits = 0;
  let handoffs = 0;
  const requirements = [
    {
      id: "logo",
      requirement_key: "logo",
      requirement_name: "Logo files",
      necessity: "optional",
      status: "missing",
      eligible_documents: [],
    },
  ];
  await page.route("**/alchemize-api.php?*", async (route) => {
    const path = new URL(route.request().url()).searchParams.get("route");
    let data = {};
    if (path === "auth/session")
      data = {
        authenticated: true,
        user: { role_slug: "client", display_name: "Client" },
        csrf_token: "test",
      };
    if (path === "portal/intakes") data = { items: [assignment] };
    if (path === "portal/intakes/intake") {
      if (
        route.request().method() === "PUT" ||
        route.request().method() === "POST"
      ) {
        responses = {
          ...responses,
          ...route.request().postDataJSON().responses,
        };
        data = { completion_percentage: 0 };
      } else
        data = {
          assignment,
          definition,
          responses,
          requirements,
          profile: { business: {}, people: [], addresses: [] },
        };
    }
    if (path === "portal/intakes/intake/submit") {
      submits++;
      assignment.status = "submitted";
      data = { status: "submitted" };
    }
    if (path === "portal/intakes/intake/requirements/logo/upload-handoff") {
      handoffs++;
      data = { document_id: "secure-logo" };
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto("/client-portal/intake?assignment=intake");
  await expect(
    page.getByRole("heading", { name: "Website Design", exact: true }),
  ).toBeVisible();
  return {
    responses: () => responses,
    submits: () => submits,
    handoffs: () => handoffs,
  };
}
test("Next validates, focuses, updates completion; draft reload and final validation preserve answers", async ({
  page,
}) => {
  const state = await intake(page);
  await expect(page.getByText("Required field.", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Upload Logo files", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Next section", exact: true }).click();
  await expect(page.locator("#logo_available")).toBeFocused();
  await expect(page.locator("#logo_available")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.locator("#logo_available").selectOption("yes");
  await expect(
    page.getByRole("button", { name: "Upload Logo files", exact: true }),
  ).toBeVisible();
  await page.locator("#logo_available").selectOption("no");
  await expect(
    page.getByRole("button", { name: "Upload Logo files", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Next section", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Content", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Intake sections" })
      .getByRole("button", { name: /Branding assets.*Complete/ }),
  ).toBeVisible();
  await page.locator("#existing_copy").selectOption("yes");
  await page.locator("#existing_copy_details").fill("Saved manuscript");
  await page.locator("#copywriting_help").selectOption("no");
  await page
    .getByRole("button", { name: "Save and continue later", exact: true })
    .click();
  await expect(page.getByText(/Your information is saved/)).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation", { name: "Intake sections" })
    .getByRole("button", { name: /Content/ })
    .click();
  await expect(page.locator("#existing_copy_details")).toHaveValue(
    "Saved manuscript",
  );
  await page.locator("#existing_copy").selectOption("no");
  await expect(page.locator("#existing_copy_details")).toHaveCount(0);
  await page.getByRole("button", { name: "Next section", exact: true }).click();
  await page.getByLabel("Crm", { exact: true }).check();
  await page
    .getByRole("button", { name: "Submit to Alchemize", exact: true })
    .click();
  await expect(page.locator("#integration_notes")).toBeFocused();
  expect(state.submits()).toBe(0);
  await page.locator("#integration_notes").fill("Sync contacts");
  await page
    .getByRole("button", { name: "Submit to Alchemize", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your intake has been submitted." }),
  ).toBeVisible();
  expect(state.submits()).toBe(1);
  expect(state.responses().existing_copy_details.value).toBe(
    "Saved manuscript",
  );
  await expect(
    page.getByRole("link", { name: "View documents", exact: true }),
  ).toBeVisible();
});
test("final validation finds missing answers across sections on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await intake(page);
  await page
    .getByRole("navigation", { name: "Intake sections" })
    .getByRole("button", { name: /Integrations/ })
    .click();
  await page
    .getByRole("button", { name: "Submit to Alchemize", exact: true })
    .click();
  await expect(page.locator("#logo_available")).toBeFocused();
  expect(state.submits()).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("document handoff saves controlling and draft answers before leaving", async ({
  page,
}) => {
  const state = await intake(page, ["branding"]);
  await page.locator("#logo_available").selectOption("yes");
  await page.locator("#logo_formats").fill("SVG");
  await page
    .getByRole("button", { name: "Upload Logo files", exact: true })
    .click();
  await expect(page).toHaveURL(/client-portal\/documents\?upload=secure-logo/);
  expect(state.handoffs()).toBe(1);
  expect(state.responses().logo_available.value).toBe("yes");
  expect(state.responses().logo_formats.value).toBe("SVG");
});

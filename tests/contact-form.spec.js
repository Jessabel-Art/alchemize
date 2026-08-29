import { expect, test } from "@playwright/test";

const fillInquiry = async (page, audience, service = "") => {
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Inquiry");
  await page.getByLabel("Email address").fill("contact-test@example.invalid");
  await page.getByLabel("Who is this for?").selectOption(audience);
  if (service)
    await page.getByLabel("What do you need help with?").selectOption(service);
  await page
    .getByLabel("What are you trying to accomplish, improve, or resolve?")
    .fill("This is a focused automated contact form persistence test.");
};

test("contact selector exposes canonical grouped options without duplicates", async ({
  page,
}) => {
  await page.goto("/contact/");
  const select = page.getByLabel("What do you need help with?");
  await expect(select.locator("option").first()).toHaveText("I'm not sure yet");
  await expect(
    select.locator('optgroup[label="Individual Services"]'),
  ).toHaveCount(1);
  await expect(
    select.locator('optgroup[label="Business Services"]'),
  ).toHaveCount(1);
  const values = await select
    .locator("option")
    .evaluateAll((options) => options.map((option) => option.value));
  expect(values).toContain("individual-tax");
  expect(values).toContain("individual-notary");
  expect(values).toContain("individual-translation");
  expect(values).toContain("business-readiness");
  expect(values).toContain("business-operations");
  expect(values).toContain("business-financial");
  expect(values).toContain("business-advisory");
  expect(values).toContain("business-digital");
  await expect(select.locator('option[value="business-digital"]')).toHaveText(
    "Web & Digital Solutions",
  );
  expect(new Set(values).size).toBe(values.length);
});

for (const inquiry of [
  ["individual", "individual-tax"],
  ["business", "business-digital"],
  ["individual", ""],
]) {
  test(`shows success only after persistence confirmation for ${inquiry[1] || "unspecified service"}`, async ({
    page,
  }) => {
    let payload;
    await page.route("**/alchemize-api.php?route=leads", async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            leadId: "00000000-0000-4000-8000-000000000001",
            status: "new",
          },
        }),
      });
    });
    await page.goto("/contact/");
    await fillInquiry(page, inquiry[0], inquiry[1]);
    await page.getByRole("button", { name: "Send Inquiry" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Thank you for contacting Alchemize",
    );
    expect(payload.audience).toBe(inquiry[0]);
    expect(payload.service_key).toBe(inquiry[1] || null);
  });
}

test("persistence failure remains an error and rate limiting has a distinct message", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?route=leads", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "Internal detail" },
      }),
    }),
  );
  await page.goto("/contact/");
  await fillInquiry(page, "business", "business-operations");
  await page.getByRole("button", { name: "Send Inquiry" }).click();
  await expect(page.getByRole("status")).toHaveAttribute("data-state", "error");
  await expect(page.getByRole("status")).toContainText("unable to submit");
  await expect(page.getByRole("status")).not.toContainText("Internal detail");

  await page.unroute("**/alchemize-api.php?route=leads");
  await page.route("**/alchemize-api.php?route=leads", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "RATE_LIMITED",
          message: "Please wait before sending another request.",
        },
      }),
    }),
  );
  await page.getByRole("button", { name: "Send Inquiry" }).click();
  await expect(page.getByRole("status")).toContainText("Please wait");
});

test("contact form remains usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact/");
  await expect(page.getByLabel("Who is this for?")).toBeVisible();
  await expect(page.getByLabel("What do you need help with?")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send Inquiry" }),
  ).toBeVisible();
});

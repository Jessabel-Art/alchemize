import { expect, test } from "@playwright/test";

// Contact form: complete service inventory, EN/ES parity, canonical submitted
// values, and service-page -> contact preselection in both languages.

const languages = [
  {
    code: "en",
    prefix: "",
    unsure: "I'm not sure yet",
    digital: "Digital Support",
    web: "Web & Digital Solutions",
  },
  {
    code: "es",
    prefix: "/es",
    unsure: "Aún no estoy seguro",
    digital: "Apoyo digital",
    web: "Web y soluciones digitales",
  },
];

const individualValues = [
  "individual-tax",
  "individual-notary",
  "individual-translation",
  "individual-apostille",
  "business-digital",
];
const businessValues = [
  "business-readiness",
  "business-advisory",
  "business-operations",
  "business-financial",
  "business-bookkeeping",
  "business-payroll",
  "business-digital",
];

const optionValues = (page) =>
  page
    .locator("#service option")
    .evaluateAll((options) =>
      options.map((option) => option.value).filter(Boolean),
    );

// every service page, its canonical key, and the audience the form should show
const servicePages = [
  ["individuals/tax-preparation", "individual-tax", "individual"],
  ["individuals/notary-document-services", "individual-notary", "individual"],
  ["individuals/translation-services", "individual-translation", "individual"],
  ["individuals/apostille-services", "individual-apostille", "individual"],
  ["businesses/advisory-optimization", "business-advisory", "business"],
  ["businesses/operations-implementation", "business-operations", "business"],
  ["businesses/readiness-growth", "business-readiness", "business"],
  [
    "businesses/bookkeeping-financial-reporting",
    "business-bookkeeping",
    "business",
  ],
  ["businesses/payroll-processing", "business-payroll", "business"],
  ["businesses/business-tax-support", "business-financial", "business"],
];

for (const { code, prefix, unsure, digital, web } of languages) {
  test(`${code}: each audience lists every public service, including Apostille and Digital Support`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/contact`);
    await page.selectOption("#audience", "individual");
    expect(await optionValues(page)).toEqual(individualValues);
    await expect(
      page.locator('#service option[value="business-digital"]'),
    ).toHaveText(digital);
    await page.selectOption("#audience", "business");
    expect(await optionValues(page)).toEqual(businessValues);
    await expect(
      page.locator('#service option[value="business-digital"]'),
    ).toHaveText(web);
    // with no audience chosen the shared key is listed once, under Businesses
    await page.selectOption("#audience", "");
    const all = await optionValues(page);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toContain("individual-apostille");
    await expect(page.locator("#service option").first()).toHaveText(unsure);
  });

  for (const [path, key, audience] of servicePages) {
    test(`${code}: ${path} CTA preselects ${key}`, async ({ page }) => {
      await page.goto(`${prefix}/services/${path}`);
      await page.locator(".editorial-service-actions a.button").first().click();
      await expect(page).toHaveURL(
        new RegExp(`${prefix}/contact\\?service=${key}$`),
      );
      await expect(page.locator("#service")).toHaveValue(key);
      await expect(page.locator("#audience")).toHaveValue(audience);
    });
  }

  test(`${code}: the Web & Digital CTA preselects business-digital for businesses`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/web-digital`);
    await page.locator(".webx-actions a.button").click();
    await expect(page.locator("#service")).toHaveValue("business-digital");
    await expect(page.locator("#audience")).toHaveValue("business");
    await expect(page.locator("#service option:checked")).toHaveText(web);
  });

  test(`${code}: an individual reaches Digital Support with the same canonical key`, async ({
    page,
  }) => {
    await page.goto(
      `${prefix}/contact?service=business-digital&audience=individual`,
    );
    await expect(page.locator("#audience")).toHaveValue("individual");
    await expect(page.locator("#service")).toHaveValue("business-digital");
    await expect(page.locator("#service option:checked")).toHaveText(digital);
    // legacy identifiers still resolve
    await page.goto(`${prefix}/contact?service=web-digital`);
    await expect(page.locator("#service")).toHaveValue("business-digital");
    await expect(page.locator("#audience")).toHaveValue("business");
  });

  for (const [audience, service, expectedAudience] of [
    ["individual", "individual-apostille", "individual"],
    ["individual", "business-digital", "individual"],
    ["business", "business-digital", "business"],
    ["business", "business-payroll", "business"],
  ]) {
    test(`${code}: submits canonical values (${audience} / ${service})`, async ({
      page,
    }) => {
      let payload = null;
      await page.route("**/alchemize-api.php?route=leads*", (route) => {
        payload = JSON.parse(route.request().postData() || "{}");
        return route.fulfill({
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
      await page.goto(`${prefix}/contact`);
      await page.fill("#first-name", "Ana");
      await page.fill("#last-name", "Prueba");
      await page.fill("#email", "ana@example.invalid");
      await page.fill("#message", "Focused automated submission check.");
      await page.selectOption("#audience", audience);
      await page.selectOption("#service", service);
      await page.click("button[type=submit]");
      await expect(page.locator("#form-status")).toHaveAttribute(
        "data-state",
        "success",
      );
      expect(payload.service_key).toBe(service);
      expect(payload.serviceInterest).toBe(service);
      expect(payload.audience).toBe(expectedAudience);
      expect(payload.language_preference).toBe(code);
    });
  }
}

test("English and Spanish contact forms have the same fields, requirements and options", async ({
  page,
}) => {
  const describe = async (prefix) => {
    await page.goto(`${prefix}/contact`);
    return page.locator("[data-contact-form]").evaluate((form) =>
      [...form.querySelectorAll("input, select, textarea, button")].map(
        (el) => ({
          tag: el.tagName,
          name: el.getAttribute("name"),
          id: el.id,
          type: el.getAttribute("type"),
          required: el.required,
          autocomplete: el.getAttribute("autocomplete"),
          minlength: el.getAttribute("minlength"),
          values:
            el.tagName === "SELECT"
              ? [...el.options].map((option) => option.value)
              : undefined,
          hidden:
            el.type === "hidden" && el.name !== "languagePreference"
              ? el.value
              : undefined,
        }),
      ),
    );
  };
  const en = await describe("");
  const es = await describe("/es");
  expect(es).toEqual(en);
  await page.goto("/es/contact");
  await expect(page.locator('input[name="languagePreference"]')).toHaveValue(
    "es",
  );
  await page.goto("/contact");
  await expect(page.locator('input[name="languagePreference"]')).toHaveValue(
    "en",
  );
});

test("validation errors are localized in both languages from the same field keys", async ({
  page,
}) => {
  for (const [prefix, marker] of [
    ["", /Select a valid service/],
    ["/es", /Seleccione un servicio válido/],
  ]) {
    await page.route("**/alchemize-api.php?route=leads*", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error: { message: "x", fields: { service_key: "Server text" } },
        }),
      }),
    );
    await page.goto(`${prefix}/contact`);
    await page.fill("#first-name", "Ana");
    await page.fill("#last-name", "Prueba");
    await page.fill("#email", "ana@example.invalid");
    await page.fill("#message", "Focused automated validation check.");
    await page.selectOption("#audience", "individual");
    await page.click("button[type=submit]");
    await expect(page.locator(".field-error").first()).toHaveText(marker);
    await page.unroute("**/alchemize-api.php?route=leads*");
  }
});

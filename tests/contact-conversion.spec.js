import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Contact as the primary lead-intake path: complete service list, stable keys,
// preselection, safe fallbacks, an unambiguous success state, honest failures,
// keyboard use and layout. The lead endpoint is always intercepted.

const LEAD_ROUTE = "**/alchemize-api.php?route=leads*";
const stored = {
  status: 201,
  contentType: "application/json",
  body: JSON.stringify({
    data: { leadId: "00000000-0000-4000-8000-000000000007", status: "new" },
  }),
};

// canonical key -> audience the form shows, and the approved service name in each
// language (from the canonical taxonomy and service catalogs)
const services = [
  [
    "individual-tax",
    "individual",
    "Tax Preparation",
    "Preparación de impuestos",
  ],
  [
    "individual-notary",
    "individual",
    "Notary & Document Services",
    "Servicios notariales y de documentos",
  ],
  [
    "individual-translation",
    "individual",
    "Translation Services",
    "Servicios de traducción",
  ],
  [
    "individual-apostille",
    "individual",
    "North Carolina Apostille Facilitation & Support",
    "Facilitación y apoyo para apostillas de Carolina del Norte",
  ],
  [
    "business-readiness",
    "business",
    "Business Foundation",
    "Bases del negocio",
  ],
  [
    "business-advisory",
    "business",
    "Business Advisory",
    "Asesoría empresarial",
  ],
  [
    "business-operations",
    "business",
    "Operations & Administration",
    "Operaciones y administración",
  ],
  [
    "business-financial",
    "business",
    "Tax & Financial Organization",
    "Impuestos y organización financiera",
  ],
  ["business-bookkeeping", "business", "Bookkeeping", "Teneduría de libros"],
  ["business-payroll", "business", "Payroll", "Nómina"],
  [
    "business-digital",
    "business",
    "Web & Digital Solutions",
    "Web y soluciones digitales",
  ],
];

const languages = [
  { code: "en", prefix: "", labelIndex: 2, unsure: "I'm not sure yet" },
  { code: "es", prefix: "/es", labelIndex: 3, unsure: "Aún no estoy seguro" },
];

const fill = async (page, audience = "individual") => {
  await page.fill("#first-name", "Ana");
  await page.fill("#last-name", "Prueba");
  await page.fill("#email", "ana@example.invalid");
  await page.fill("#message", "Focused automated intake check.");
  if (audience) await page.selectOption("#audience", audience);
};

for (const { code, prefix, labelIndex, unsure } of languages) {
  test(`${code}: /contact with no service opens neutral`, async ({ page }) => {
    await page.goto(`${prefix}/contact`);
    await expect(page.locator("#service")).toHaveValue("");
    await expect(page.locator("#audience")).toHaveValue("");
    await expect(page.locator("#service option").first()).toHaveText(unsure);
  });

  for (const service of services) {
    const [key, audience] = service;
    test(`${code}: ?service=${key} preselects the service and its audience`, async ({
      page,
    }) => {
      await page.goto(`${prefix}/contact?service=${key}`);
      await expect(page.locator("#service")).toHaveValue(key);
      await expect(page.locator("#audience")).toHaveValue(audience);
      // the visible label is the approved name in this language; the value is the key
      const label = await page
        .locator(`#service option[value="${key}"]`)
        .first()
        .innerText();
      expect(label).toBe(service[labelIndex]);
    });
  }

  test(`${code}: obsolete, unknown and unpublished service parameters fail safely`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const query of [
      "?service=invented-service",
      "?service=individual-insurance",
      "?service=",
      "?service=%3Cscript%3E",
      "?service=business-tax&audience=alien",
      "?audience=business",
      "?audience=nonsense",
    ]) {
      await page.goto(`${prefix}/contact${query}`);
      await expect(page.locator("#service")).toBeVisible();
      const value = await page.locator("#service").inputValue();
      // legacy identifiers resolve to their canonical key; everything else is neutral
      expect(["", "business-financial"]).toContain(value);
      // the form remains fully usable
      await expect(page.locator("button[type=submit]")).toBeEnabled();
    }
    // a legacy key still resolves
    await page.goto(`${prefix}/contact?service=business-tax`);
    await expect(page.locator("#service")).toHaveValue("business-financial");
    // a valid audience alone preselects the audience and no service
    await page.goto(`${prefix}/contact?audience=business`);
    await expect(page.locator("#audience")).toHaveValue("business");
    await expect(page.locator("#service")).toHaveValue("");
    expect(errors).toEqual([]);
  });

  test(`${code}: a confirmed submission replaces the form with an unambiguous confirmation`, async ({
    page,
  }) => {
    let requests = 0;
    await page.route(LEAD_ROUTE, async (route) => {
      requests += 1;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return route.fulfill(stored);
    });
    await page.goto(`${prefix}/contact?service=individual-apostille`);
    await fill(page, "");
    // double click: one request, button locked while in flight
    await page.click("button[type=submit]", { clickCount: 2, delay: 10 });
    await expect(page.locator("button[type=submit]")).toBeDisabled();
    const panel = page.locator(".contact-success");
    await expect(panel).toBeVisible();
    expect(requests).toBe(1);

    // fields are gone, the confirmation has focus and says what happens next
    await expect(page.locator(".contact-form-body")).toBeHidden();
    await expect(panel).toBeFocused();
    await expect(panel.locator("h2")).toHaveText(
      code === "en"
        ? "Thank you for contacting Alchemize."
        : "Gracias por comunicarse con Alchemize.",
    );
    await expect(panel).toContainText(code === "en" ? "24 hours" : "24 horas");
    await expect(page.getByRole("status")).toHaveCount(1);

    // starting another request returns a blank form with focus on the first field
    await panel.getByRole("button").click();
    await expect(page.locator(".contact-form-body")).toBeVisible();
    await expect(page.locator("#first-name")).toBeFocused();
    await expect(page.locator("#first-name")).toHaveValue("");
    await expect(page.locator("#service")).toHaveValue("");
    await expect(page.locator("#audience")).toHaveValue("");
    await expect(page.locator("button[type=submit]")).toBeEnabled();
  });

  test(`${code}: a failed submission keeps the entered data and offers a localized message`, async ({
    page,
  }) => {
    await page.route(LEAD_ROUTE, (route) => route.abort());
    await page.goto(`${prefix}/contact`);
    await fill(page, "business");
    await page.selectOption("#service", "business-payroll");
    await page.click("button[type=submit]");
    const status = page.locator("#form-status");
    await expect(status).toHaveAttribute("data-state", "error");
    await expect(status).toBeFocused();
    const text = await status.innerText();
    expect(text).not.toMatch(/fetch|network/i);
    expect(text).toContain(
      code === "en" ? "unable to submit" : "No pudimos enviar",
    );
    await expect(page.locator(".contact-success")).toBeHidden();
    await expect(page.locator("#first-name")).toHaveValue("Ana");
    await expect(page.locator("#service")).toHaveValue("business-payroll");
    await expect(page.locator("button[type=submit]")).toBeEnabled();
  });

  test(`${code}: the audience choice is a real prompt, and a missing choice is reported`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/contact`);
    await expect(page.locator("#audience option").first()).toHaveText(
      code === "en" ? "Select one" : "Seleccione una opción",
    );
    await fill(page, "");
    await page.click("button[type=submit]");
    await expect(page.locator("#audience")).toBeFocused();
    expect(
      await page.locator("#audience").evaluate((el) => el.validationMessage),
    ).toBe(
      code === "en"
        ? "Please complete this required field."
        : "Complete este campo obligatorio.",
    );
  });

  test(`${code}: choosing phone as the contact method requires a phone number before any request`, async ({
    page,
  }) => {
    let requests = 0;
    await page.route(LEAD_ROUTE, (route) => {
      requests += 1;
      return route.fulfill(stored);
    });
    await page.goto(`${prefix}/contact`);
    await fill(page, "individual");
    await page.selectOption("#contact-method", "phone");
    await page.click("button[type=submit]");
    await expect(page.locator("#phone")).toBeFocused();
    expect(
      await page.locator("#phone").evaluate((el) => el.validationMessage),
    ).toBe(
      code === "en"
        ? "Enter a phone number, or choose another contact method."
        : "Ingrese un número de teléfono o elija otro medio de contacto.",
    );
    expect(requests).toBe(0);
    await page.fill("#phone", "910-555-0100");
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();
    expect(requests).toBe(1);
  });

  test(`${code}: the form works from the keyboard alone`, async ({ page }) => {
    await page.route(LEAD_ROUTE, (route) => route.fulfill(stored));
    await page.goto(`${prefix}/contact`);
    await page.locator("#first-name").focus();
    const order = [];
    for (let i = 0; i < 9; i += 1) {
      order.push(
        await page.evaluate(
          () => document.activeElement.id || document.activeElement.type,
        ),
      );
      await page.keyboard.press("Tab");
    }
    // honeypot is skipped; every real control is reachable in reading order
    expect(order).toEqual([
      "first-name",
      "last-name",
      "email",
      "phone",
      "audience",
      "service",
      "contact-method",
      "message",
      "submit",
    ]);
    await page.fill("#first-name", "Ana");
    await page.fill("#last-name", "Prueba");
    await page.fill("#email", "ana@example.invalid");
    await page.fill("#message", "Keyboard-only intake check.");
    await page.selectOption("#audience", "individual");
    await page.locator("#email").press("Enter");
    await expect(page.locator(".contact-success")).toBeVisible();
  });

  test(`${code}: the form, an error state and the confirmation have no accessibility violations`, async ({
    page,
  }) => {
    const scan = async () =>
      (await new AxeBuilder({ page }).analyze()).violations.map(
        (violation) => violation.id,
      );
    await page.goto(`${prefix}/contact`);
    expect(await scan()).toEqual([]);
    // error state: the form is filled but the request fails
    await page.route(LEAD_ROUTE, (route) => route.abort());
    await fill(page, "individual");
    await page.click("button[type=submit]");
    await expect(page.locator("#form-status")).toHaveAttribute(
      "data-state",
      "error",
    );
    expect(await scan()).toEqual([]);
    // confirmation state
    await page.unroute(LEAD_ROUTE);
    await page.route(LEAD_ROUTE, (route) => route.fulfill(stored));
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();
    expect(await scan()).toEqual([]);
  });

  for (const width of [390, 834, 1440]) {
    test(`${code}: no horizontal overflow at ${width}px, form and confirmation`, async ({
      page,
    }) => {
      await page.route(LEAD_ROUTE, (route) => route.fulfill(stored));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${prefix}/contact`);
      const overflow = () =>
        page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect(await overflow()).toBe(false);
      await expect(page.locator("button[type=submit]")).toBeVisible();
      await fill(page, "individual");
      await page.click("button[type=submit]");
      await expect(page.locator(".contact-success")).toBeVisible();
      expect(await overflow()).toBe(false);
      const box = await page.locator(".contact-success").boundingBox();
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    });
  }
}

test("autocomplete and input types suit mobile keyboards", async ({ page }) => {
  await page.goto("/contact");
  const attrs = await page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll("[data-contact-form] input")].map((el) => [
        el.name,
        { type: el.type, autocomplete: el.autocomplete },
      ]),
    ),
  );
  expect(attrs.firstName).toEqual({ type: "text", autocomplete: "given-name" });
  expect(attrs.lastName).toEqual({ type: "text", autocomplete: "family-name" });
  expect(attrs.email).toEqual({ type: "email", autocomplete: "email" });
  expect(attrs.phone).toEqual({ type: "tel", autocomplete: "tel" });
});

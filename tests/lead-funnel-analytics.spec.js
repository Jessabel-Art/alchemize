import { expect, test } from "@playwright/test";

// Lead-funnel measurement, end to end. GA4 only runs on the production hostnames,
// so the browser maps getalchemize.com to the local preview build: the real
// gating logic executes, the Google script is stubbed, and events are read from
// window.dataLayer. The lead endpoint is always intercepted; nothing is ever sent
// to production.

test.use({
  baseURL: "http://getalchemize.com",
  launchOptions: {
    args: ["--host-resolver-rules=MAP getalchemize.com 127.0.0.1:4173"],
  },
});

const LEAD_ROUTE = "**/alchemize-api.php?route=leads*";
const PII = {
  first: "Marisol",
  last: "Quintanilla",
  email: "marisol.quintanilla@example.invalid",
  phone: "910-555-0134",
  message: "My private situation involves account 4417-8823 and my landlord.",
};

const events = (page) =>
  page.evaluate(() =>
    (window.dataLayer || [])
      .map((entry) => Array.from(entry))
      .filter((entry) => entry[0] === "event")
      .map(([, name, params]) => ({ name, params: params || {} })),
  );
const named = async (page, name) =>
  (await events(page)).filter((event) => event.name === name);

const created = {
  status: 201,
  contentType: "application/json",
  body: JSON.stringify({
    data: { leadId: "00000000-0000-4000-8000-000000000042", status: "new" },
  }),
};

test.beforeEach(async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );
  // keep tel:/mailto: clicks from leaving the page during the test
  await page.addInitScript(() => {
    document.addEventListener("click", (event) => {
      if (event.target.closest?.('a[href^="tel:"], a[href^="mailto:"]'))
        event.preventDefault();
    });
  });
});

const fill = async (page, { audience, service, phoneMethod } = {}) => {
  await page.fill("#first-name", PII.first);
  await page.fill("#last-name", PII.last);
  await page.fill("#email", PII.email);
  await page.fill("#message", PII.message);
  if (audience) await page.selectOption("#audience", audience);
  if (service) await page.selectOption("#service", service);
  if (phoneMethod) {
    await page.fill("#phone", PII.phone);
    await page.selectOption("#contact-method", "phone");
  }
};

test("the GA4 tag is live on the production hostname in this harness", async ({
  page,
}) => {
  await page.goto("/");
  await expect
    .poll(async () => (await named(page, "page_view")).length)
    .toBeGreaterThan(0);
});

const languages = [
  {
    code: "en",
    prefix: "",
    notary: "Notary & Document Services",
    notaryPath: "/services/individuals/notary-document-services",
    cta: "Request a Notary Appointment",
  },
  {
    code: "es",
    prefix: "/es",
    notary: "Servicios notariales y de documentos",
    notaryPath: "/es/services/individuals/notary-document-services",
    cta: "Solicitar una cita notarial",
  },
];

for (const { code, prefix, notaryPath, cta } of languages) {
  test(`${code}: service page -> contact -> confirmed lead is one measurable funnel`, async ({
    page,
  }) => {
    let body = null;
    await page.route(LEAD_ROUTE, (route) => {
      body = route.request().postDataJSON();
      return route.fulfill(created);
    });
    await page.goto(notaryPath);
    await page.locator(".editorial-service-actions a.button").first().click();
    await expect(page).toHaveURL(
      new RegExp(`${prefix}/contact\\?service=individual-notary$`),
    );

    // service_cta_click: stable keys, current language, where on the page
    const clicks = await named(page, "service_cta_click");
    expect(clicks).toHaveLength(1);
    expect(clicks[0].params).toEqual({
      service_key: "individual-notary",
      service_category: "notary-document-services",
      audience: "individual",
      page_path: notaryPath,
      language: code,
      cta_location: "service_hero",
      cta_label: cta,
    });

    // arriving on Contact is not a start; editing a field is, exactly once
    expect(await named(page, "contact_form_start")).toHaveLength(0);
    await fill(page);
    expect(await named(page, "contact_form_start")).toHaveLength(1);
    await page.fill("#phone", PII.phone);
    await page.selectOption("#contact-method", "email");
    expect(await named(page, "contact_form_start")).toHaveLength(1);
    const start = (await named(page, "contact_form_start"))[0];
    expect(start.params).toEqual({
      service_key: "individual-notary",
      service_category: "notary-document-services",
      audience: "individual",
      page_path: `${prefix}/contact`,
      language: code,
      lead_source_page: notaryPath,
    });

    // a click on Submit alone is not a conversion
    expect(await named(page, "contact_form_submit")).toHaveLength(0);
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();

    const submits = await named(page, "contact_form_submit");
    expect(submits).toHaveLength(1);
    expect(submits[0].params).toEqual({
      service_key: "individual-notary",
      service_category: "notary-document-services",
      audience: "individual",
      page_path: `${prefix}/contact`,
      language: code,
      lead_source_page: notaryPath,
      cta_location: "service_hero",
    });
    // the stored lead itself carries the stable key, not the translated label
    expect(body.service_key).toBe("individual-notary");
    expect(body.language_preference).toBe(code);

    // no duplicate or legacy events, and nothing typed reached the data layer
    for (const name of [
      "service_cta_click",
      "contact_form_start",
      "contact_form_submit",
    ]) {
      expect(await named(page, name)).toHaveLength(1);
    }
    expect(await named(page, "contact_form_submitted")).toHaveLength(0);
    expect(await named(page, "contact_form_error")).toHaveLength(0);
    const everything = JSON.stringify(
      await page.evaluate(() =>
        (window.dataLayer || []).map((entry) => Array.from(entry)),
      ),
    ).toLowerCase();
    for (const value of Object.values(PII)) {
      expect(everything).not.toContain(value.toLowerCase());
    }
    expect(everything).not.toContain("marisol");
    expect(everything).not.toContain("quintanilla");
  });

  test(`${code}: the Translation pricing CTA is a measured, preselected service CTA`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/individuals/translation-services`);
    await page.locator("#pricing a.button").click();
    await expect(page).toHaveURL(
      new RegExp(`${prefix}/contact\\?service=individual-translation$`),
    );
    const clicks = await named(page, "service_cta_click");
    expect(clicks).toHaveLength(1);
    expect(clicks[0].params).toEqual({
      service_key: "individual-translation",
      service_category: "translation-apostille-support",
      audience: "individual",
      page_path: `${prefix}/services/individuals/translation-services`,
      language: code,
      cta_location: "service_pricing",
      cta_label:
        code === "en" ? "Request a Translation" : "Solicitar una traducción",
    });
    await expect(page.locator("#service")).toHaveValue(
      "individual-translation",
    );
  });

  test(`${code}: the refined CTA labels keep the same measured structure`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services/businesses/advisory-optimization`);
    await page.locator(".editorial-service-actions a.button").first().click();
    let [click] = await named(page, "service_cta_click");
    expect(click.params).toEqual({
      service_key: "business-advisory",
      service_category: "business-advisory",
      audience: "business",
      page_path: `${prefix}/services/businesses/advisory-optimization`,
      language: code,
      cta_location: "service_hero",
      cta_label:
        code === "en" ? "Start a Conversation" : "Iniciar una conversación",
    });
    await page.goto(`${prefix}/web-digital`);
    await page.locator(".webx-actions a.button").click();
    [click] = await named(page, "service_cta_click");
    expect(click.params).toEqual({
      service_key: "business-digital",
      service_category: "web-digital-solutions",
      audience: "business",
      page_path: `${prefix}/web-digital`,
      language: code,
      cta_location: "web_hero",
      cta_label:
        code === "en" ? "Discuss Your Project" : "Converse sobre su proyecto",
    });
  });

  test(`${code}: a direct visit is measured with no service and lead_source_page "direct"`, async ({
    page,
  }) => {
    await page.route(LEAD_ROUTE, (route) => route.fulfill(created));
    await page.goto(`${prefix}/contact`);
    await fill(page, { audience: "business" });
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();
    const [submit] = await named(page, "contact_form_submit");
    expect(submit.params).toEqual({
      service_key: "unspecified",
      service_category: "unspecified",
      audience: "business",
      page_path: `${prefix}/contact`,
      language: code,
      lead_source_page: "direct",
    });
  });

  test(`${code}: the header CTA keeps the page the visitor was on`, async ({
    page,
  }) => {
    await page.route(LEAD_ROUTE, (route) => route.fulfill(created));
    await page.goto(`${prefix}/faq`);
    await page.locator(".site-header a.header-cta").click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/contact$`));
    await fill(page, { audience: "individual" });
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();
    const [submit] = await named(page, "contact_form_submit");
    expect(submit.params.lead_source_page).toBe(`${prefix}/faq`);
    expect(submit.params.cta_location).toBeUndefined();
  });

  for (const [label, kind, respond] of [
    [
      "server error",
      "server_error",
      (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: "Internal detail 4417" } }),
        }),
    ],
    [
      "rate limit",
      "rate_limited",
      (route) =>
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: "{}",
        }),
    ],
    ["network failure", "network_error", (route) => route.abort()],
    [
      "2xx without a stored lead",
      "invalid_response",
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<!doctype html><title>fallback</title>",
        }),
    ],
    [
      "server-side validation",
      "server_validation",
      (route) =>
        route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "x", fields: { email: "Server text 4417" } },
          }),
        }),
    ],
  ]) {
    test(`${code}: ${label} is reported as contact_form_error, never as a lead`, async ({
      page,
    }) => {
      await page.route(LEAD_ROUTE, respond);
      await page.goto(`${prefix}/contact`);
      await fill(page, { audience: "business", service: "business-payroll" });
      await page.click("button[type=submit]");
      await expect(page.locator("#form-status")).toHaveAttribute(
        "data-state",
        "error",
      );
      // the visitor is never told it worked, and the raw error text stays private
      await expect(page.locator(".contact-success")).toBeHidden();
      const status = await page.locator("#form-status").innerText();
      expect(status).not.toMatch(/Failed to fetch|Internal detail|4417/);

      expect(await named(page, "contact_form_submit")).toHaveLength(0);
      const errors = await named(page, "contact_form_error");
      expect(errors).toHaveLength(1);
      expect(errors[0].params.error_type).toBe(kind);
      expect(errors[0].params.service_key).toBe("business-payroll");
      expect(errors[0].params.service_category).toBe(
        "bookkeeping-payroll-support",
      );
      expect(errors[0].params.language).toBe(code);
      expect(JSON.stringify(errors[0].params)).not.toMatch(
        /4417|Internal|Server text|marisol|quintanilla/i,
      );
    });
  }

  test(`${code}: a browser-blocked submit is a validation error without a request`, async ({
    page,
  }) => {
    let requests = 0;
    await page.route(LEAD_ROUTE, (route) => {
      requests += 1;
      return route.fulfill(created);
    });
    await page.goto(`${prefix}/contact`);
    await page.click("button[type=submit]");
    const errors = await named(page, "contact_form_error");
    expect(errors).toHaveLength(1);
    expect(errors[0].params.error_type).toBe("validation");
    expect(errors[0].params.error_field).toBe("firstName");
    expect(requests).toBe(0);
    expect(await named(page, "contact_form_submit")).toHaveLength(0);
    // a failed click is not a form start either
    expect(await named(page, "contact_form_start")).toHaveLength(0);
  });

  test(`${code}: duplicate and honeypot responses look successful but are not counted as new leads`, async ({
    page,
  }) => {
    await page.route(LEAD_ROUTE, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: { leadId: "dup-1", status: "received", duplicate: true },
        }),
      }),
    );
    await page.goto(`${prefix}/contact`);
    await fill(page, { audience: "individual" });
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();
    expect(await named(page, "contact_form_submit")).toHaveLength(0);

    // a bot that fills the hidden field gets the same fake success from the API
    await page.route(LEAD_ROUTE, (route) => route.fulfill(created));
    await page.goto(`${prefix}/contact`);
    await fill(page, { audience: "individual" });
    await page.evaluate(() => {
      const field = document.querySelector('input[name="website"]');
      field.value = "https://spam.invalid";
    });
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();
    expect(await named(page, "contact_form_submit")).toHaveLength(0);
    // the honeypot is not a form start either
    expect(await named(page, "contact_form_start")).toHaveLength(1);
  });

  test(`${code}: Web & Digital enters the same funnel as a business inquiry`, async ({
    page,
  }) => {
    await page.route(LEAD_ROUTE, (route) => route.fulfill(created));
    await page.goto(`${prefix}/web-digital`);
    await page.locator(".webx-actions a.button").click();
    await expect(page).toHaveURL(
      new RegExp(
        `${prefix}/contact\\?service=business-digital&audience=business$`,
      ),
    );
    const [click] = await named(page, "service_cta_click");
    expect(click.params).toMatchObject({
      service_key: "business-digital",
      service_category: "web-digital-solutions",
      audience: "business",
      page_path: `${prefix}/web-digital`,
      language: code,
      cta_location: "web_hero",
    });
    await fill(page);
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();
    const [start] = await named(page, "contact_form_start");
    expect(start.params.service_key).toBe("business-digital");
    const [submit] = await named(page, "contact_form_submit");
    expect(submit.params).toMatchObject({
      service_key: "business-digital",
      service_category: "web-digital-solutions",
      audience: "business",
      language: code,
      lead_source_page: `${prefix}/web-digital`,
      cta_location: "web_hero",
    });
  });

  test(`${code}: the Individual Digital Support pathway is distinguishable from the business pathway`, async ({
    page,
  }) => {
    await page.route(LEAD_ROUTE, (route) => route.fulfill(created));
    await page.goto(`${prefix}/services`);
    await page
      .locator('#individuals-panel a.service-row[href$="/web-digital"]')
      .click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/web-digital$`));
    await page.locator(".webx-actions a.button").click();
    await expect(page).toHaveURL(
      new RegExp(
        `${prefix}/contact\\?service=business-digital&audience=individual$`,
      ),
    );
    await expect(page.locator("#audience")).toHaveValue("individual");
    await expect(page.locator("#service")).toHaveValue("business-digital");

    const [click] = await named(page, "service_cta_click");
    expect(click.params).toMatchObject({
      service_key: "business-digital",
      service_category: "digital-support",
      audience: "individual",
      language: code,
    });
    await fill(page);
    await page.click("button[type=submit]");
    await expect(page.locator(".contact-success")).toBeVisible();
    const [submit] = await named(page, "contact_form_submit");
    expect(submit.params).toMatchObject({
      service_key: "business-digital",
      service_category: "digital-support",
      audience: "individual",
    });

    // the pathway belongs to that one navigation: reaching the same page from
    // the Business Services list is a business inquiry again
    await page
      .getByRole("contentinfo")
      .locator(".footer-group")
      .nth(1)
      .locator('a[href$="/web-digital"]')
      .click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/web-digital$`));
    await page.locator(".webx-actions a.button").click();
    await expect(page).toHaveURL(/audience=business$/);
  });

  test(`${code}: phone and email clicks are measured without the number or address`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/contact`);
    await page.locator(".contact-directory a[href^='tel:']").click();
    await page
      .locator(".contact-directory a[href='mailto:hello@getalchemize.com']")
      .click();
    await page
      .locator(".contact-directory a[href='mailto:start@getalchemize.com']")
      .click();
    await page.locator(".site-footer a[href^='tel:']").click();
    await page.locator(".site-footer a[href^='mailto:']").click();

    expect((await named(page, "phone_click")).map((e) => e.params)).toEqual([
      {
        page_path: `${prefix}/contact`,
        language: code,
        link_location: "contact_page",
      },
      {
        page_path: `${prefix}/contact`,
        language: code,
        link_location: "footer",
      },
    ]);
    expect((await named(page, "email_click")).map((e) => e.params)).toEqual([
      {
        page_path: `${prefix}/contact`,
        language: code,
        link_location: "contact_page",
        link_role: "general",
      },
      {
        page_path: `${prefix}/contact`,
        language: code,
        link_location: "contact_page",
        link_role: "new_clients",
      },
      {
        page_path: `${prefix}/contact`,
        language: code,
        link_location: "footer",
        link_role: "general",
      },
    ]);
    const reported = JSON.stringify([
      ...(await named(page, "phone_click")),
      ...(await named(page, "email_click")),
    ]);
    expect(reported).not.toMatch(/910|644|0207|@/);
  });
}

test("non-lead interactions do not create lead events", async ({ page }) => {
  await page.goto("/services");
  await page.locator("#businesses-tab").click();
  await page.goto("/resources");
  await page.mouse.wheel(0, 1200);
  await page.goto("/services/individuals/tax-preparation");
  const names = (await events(page)).map((event) => event.name);
  for (const forbidden of [
    "contact_form_submit",
    "contact_form_start",
    "service_cta_click",
    "phone_click",
    "email_click",
  ]) {
    expect(names).not.toContain(forbidden);
  }
});

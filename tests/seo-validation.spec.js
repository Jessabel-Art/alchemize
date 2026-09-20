import { expect, test } from "@playwright/test";

const ORIGIN = "https://getalchemize.com";

// Every public URL in the sitemap is rendered once; the checks below read the
// same snapshot (metadata is client-rendered, so it is read from the live DOM).
let sitemap;
let pages;

function parseSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>([^<]+)<\/loc>/)[1],
    alternates: Object.fromEntries(
      [...block.matchAll(/hreflang="([^"]+)"\s+href="([^"]+)"/g)].map(
        ([, language, href]) => [language, href],
      ),
    ),
  }));
}

const pathOf = (url) => url.replace(ORIGIN, "") || "/";

async function snapshot(page, path) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { state: "attached" });
  await page.waitForSelector('link[rel="canonical"]', { state: "attached" });
  // metadata effects run after first paint; settle on the final title
  await page.waitForTimeout(150);
  return page.evaluate(() => {
    const meta = (selector, attribute = "content") =>
      document.head.querySelector(selector)?.getAttribute(attribute) ?? null;
    const schemas = [
      ...document.head.querySelectorAll("script[type='application/ld+json']"),
    ]
      .map((script) => script.textContent)
      .map((text) => ({ text, json: JSON.parse(text) }));
    const headings = [
      ...document.querySelectorAll("main h1, main h2, main h3, main h4"),
    ].map((heading) => Number(heading.tagName[1]));
    return {
      lang: document.documentElement.lang,
      title: document.title,
      description: meta('meta[name="description"]'),
      canonicals: [
        ...document.head.querySelectorAll('link[rel="canonical"]'),
      ].map((link) => link.getAttribute("href")),
      robots: meta('meta[name="robots"]'),
      alternates: Object.fromEntries(
        [
          ...document.head.querySelectorAll('link[rel="alternate"][hreflang]'),
        ].map((link) => [
          link.getAttribute("hreflang"),
          link.getAttribute("href"),
        ]),
      ),
      ogUrl: meta('meta[property="og:url"]'),
      ogImage: meta('meta[property="og:image"]'),
      twitterImage: meta('meta[name="twitter:image"]'),
      h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
      headings,
      schemas,
      ids: [...document.querySelectorAll("[id]")].map((element) => element.id),
      imagesWithoutAlt: [...document.querySelectorAll("img")].filter(
        (image) => !image.hasAttribute("alt"),
      ).length,
    };
  });
}

test.describe("SEO validation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(240_000);
    const context = await browser.newContext({ baseURL });
    const response = await context.request.get("/sitemap.xml");
    sitemap = parseSitemap(await response.text());
    pages = new Map();
    const page = await context.newPage();
    for (const { loc } of sitemap) {
      pages.set(loc, await snapshot(page, pathOf(loc)));
    }
    await context.close();
  });

  test("sitemap lists only clean, unique, public URLs", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    const locs = sitemap.map(({ loc }) => loc);
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) {
      expect(loc.startsWith(ORIGIN)).toBe(true);
      expect(loc).not.toMatch(/[?#]/);
      // one URL per page: no trailing slash except the homepage
      if (loc !== `${ORIGIN}/`) expect(loc.endsWith("/")).toBe(false);
      expect(pathOf(loc)).not.toMatch(
        /^\/(admin|client-portal|login|register|set-password|jessy|appointment)/,
      );
    }
    expect(locs).toContain(`${ORIGIN}/web-digital`);
    expect(locs).toContain(`${ORIGIN}/es/web-digital`);
  });

  test("robots.txt keeps private areas out and points to the sitemap", async ({
    request,
  }) => {
    const robots = await (await request.get("/robots.txt")).text();
    for (const path of ["/admin", "/client-portal", "/login", "/register"])
      expect(robots).toContain(`Disallow: ${path}`);
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
    // nothing public is disallowed
    expect(robots).not.toMatch(/Disallow:\s*\/(services|resources|contact)/);
  });

  test("every public page has one canonical that equals its sitemap URL", async () => {
    for (const { loc } of sitemap) {
      const data = pages.get(loc);
      expect(data.canonicals, loc).toEqual([loc]);
      expect(data.ogUrl, loc).toBe(loc);
    }
  });

  test("pages are indexable and set the correct document language", async () => {
    for (const { loc } of sitemap) {
      const data = pages.get(loc);
      expect(data.robots ?? "", loc).not.toMatch(/noindex/i);
      const spanish = pathOf(loc) === "/es" || pathOf(loc).startsWith("/es/");
      // the two English-only guides keep an English URL as canonical
      if (spanish) expect(data.lang, loc).toBe("es");
      else expect(data.lang, loc).toBe("en");
    }
  });

  test("titles and descriptions are present, sized sensibly and unique", async () => {
    const titles = new Map();
    const descriptions = new Map();
    for (const { loc } of sitemap) {
      const { title, description } = pages.get(loc);
      expect(title.length, loc).toBeGreaterThan(15);
      expect(
        title.length,
        `${loc} title too long: ${title}`,
      ).toBeLessThanOrEqual(82);
      expect(description?.length ?? 0, loc).toBeGreaterThan(70);
      expect(
        description.length,
        `${loc} description too long`,
      ).toBeLessThanOrEqual(190);
      expect(title, loc).not.toMatch(/undefined|null|\[object/);
      titles.set(title, [...(titles.get(title) ?? []), loc]);
      descriptions.set(description, [
        ...(descriptions.get(description) ?? []),
        loc,
      ]);
    }
    for (const [title, locs] of titles) expect(locs, title).toHaveLength(1);
    for (const [description, locs] of descriptions)
      expect(locs, description).toHaveLength(1);
  });

  test("commercial page titles describe the service without overstating it", async () => {
    const title = (path) => pages.get(`${ORIGIN}${path}`).title;
    const service = (audience, slug, prefix = "") =>
      title(`${prefix}/services/${audience}/${slug}`);
    // Payroll: support around a payroll platform, not "processing services"
    expect(service("businesses", "payroll-processing")).toMatch(/Payroll/);
    expect(service("businesses", "payroll-processing")).not.toMatch(
      /Processing Services/i,
    );
    // Translation states the language pair; Apostille is facilitation
    expect(service("individuals", "translation-services")).toMatch(
      /English.Spanish/,
    );
    expect(service("individuals", "apostille-services")).toMatch(
      /Facilitation|Support/,
    );
    expect(service("individuals", "apostille-services", "/es")).toMatch(
      /Apoyo/,
    );
    // Notary: document support in North Carolina, no commission claim
    expect(service("individuals", "notary-document-services")).toMatch(
      /North Carolina/,
    );
    // Spanish canonical labels
    expect(
      service("businesses", "bookkeeping-financial-reporting", "/es"),
    ).toMatch(/^Teneduría de libros/);
    expect(service("businesses", "payroll-processing", "/es")).toMatch(
      /Nómina/,
    );
    // the Web & Digital umbrella states its scope in both languages
    expect(title("/web-digital")).toMatch(/Website Design/);
    expect(title("/es/web-digital")).toMatch(/Diseño Web/);
  });

  test("hreflang is self-referencing, reciprocal and matches the sitemap", async () => {
    for (const { loc, alternates } of sitemap) {
      const data = pages.get(loc);
      if (!alternates.en) {
        // English-only pages: no Spanish alternate is advertised anywhere
        expect(data.alternates.es, loc).toBeUndefined();
        expect(data.alternates["x-default"], loc).toBe(loc);
        continue;
      }
      expect(data.alternates, loc).toEqual(alternates);
      const own = data.lang;
      expect(data.alternates[own], `${loc} self`).toBe(loc);
      expect(data.alternates["x-default"], loc).toBe(alternates.en);
      // the alternate page points back at this one
      const other = pages.get(data.alternates[own === "en" ? "es" : "en"]);
      expect(other, `${loc} alternate is not in the sitemap`).toBeTruthy();
      expect(other.alternates[own], `${loc} reciprocal`).toBe(loc);
    }
  });

  test("each page has one descriptive H1 and no skipped heading levels", async () => {
    for (const { loc } of sitemap) {
      const { h1, headings } = pages.get(loc);
      expect(h1, loc).toHaveLength(1);
      expect(h1[0].length, loc).toBeGreaterThan(8);
      // main content: a heading never jumps more than one level down
      let previous = 1;
      for (const level of headings) {
        expect(level, `${loc} heading order`).toBeLessThanOrEqual(previous + 1);
        previous = level;
      }
    }
  });

  test("structured data is valid JSON that reflects the visible business facts", async () => {
    for (const { loc } of sitemap) {
      const data = pages.get(loc);
      const flat = data.schemas.flatMap(({ json }) => json["@graph"] ?? [json]);
      const types = flat.map((item) => item["@type"]);
      expect(types, loc).toContain("ProfessionalService");
      expect(types, loc).toContain("WebSite");
      // no prices, offers or internal rates in any structured data
      // (the FAQ quotes North Carolina's statutory notary fee limit in its
      // notarization cost answer; that is a legal maximum, not an Alchemize rate)
      for (const { json } of data.schemas) {
        const copy = JSON.parse(JSON.stringify(json));
        if (copy["@type"] === "FAQPage")
          copy.mainEntity = copy.mainEntity.filter(
            ({ name }) => !/notar/i.test(name),
          );
        expect(JSON.stringify(copy), loc).not.toMatch(
          /"(price|priceRange|priceCurrency|offers|lowPrice|highPrice)"|\$\s?\d/i,
        );
      }
      const business = flat.find(
        (item) => item["@type"] === "ProfessionalService",
      );
      expect(business.telephone).toBe("+1-910-644-0207");
      expect(business.address.addressLocality).toBe("Fayetteville");
      expect(business.address.addressRegion).toBe("NC");
      // no street address is published, so none is described
      expect(JSON.stringify(business)).not.toMatch(/streetAddress|postalCode/);
      // one WebSite/organization entity per page, no duplicates
      expect(
        types.filter((type) => type === "ProfessionalService"),
      ).toHaveLength(1);
      expect(types.filter((type) => type === "WebSite")).toHaveLength(1);
    }
  });

  test("service, breadcrumb, article and person markup point at the page itself", async () => {
    for (const { loc } of sitemap) {
      const flat = pages
        .get(loc)
        .schemas.flatMap(({ json }) => json["@graph"] ?? [json]);
      const path = pathOf(loc);
      const service = flat.find((item) => item["@type"] === "Service");
      if (
        /^(\/es)?\/(services\/(individuals|businesses)\/[^/]+|web-digital)$/.test(
          path,
        )
      ) {
        expect(service, loc).toBeTruthy();
        expect(service.url, loc).toBe(loc);
        expect(service.name.length, loc).toBeGreaterThan(3);
        expect(service.provider.name, loc).toBe("Alchemize Business Services");
      } else {
        expect(service, loc).toBeUndefined();
      }
      const crumbs = flat.find((item) => item["@type"] === "BreadcrumbList");
      if (crumbs) {
        const last = crumbs.itemListElement.at(-1);
        expect(last.item, loc).toBe(loc);
        expect(crumbs.itemListElement.map((item) => item.position)).toEqual(
          crumbs.itemListElement.map((_, index) => index + 1),
        );
      }
      const article = flat.find((item) => item["@type"] === "Article");
      if (article) {
        expect(article.mainEntityOfPage, loc).toBe(loc);
        expect(article.inLanguage, loc).toBe(
          path.startsWith("/es") ? "es" : "en",
        );
      }
    }
    // Apostille and Notary keep their regulated, North Carolina scope
    for (const slug of ["apostille-services", "notary-document-services"]) {
      const flat = pages
        .get(`${ORIGIN}/services/individuals/${slug}`)
        .schemas.flatMap(({ json }) => json["@graph"] ?? [json]);
      expect(flat.find((item) => item["@type"] === "Service").areaServed).toBe(
        "North Carolina",
      );
    }
  });

  test("social previews have a default image and no page has duplicate ids or missing alt attributes", async () => {
    for (const { loc } of sitemap) {
      const data = pages.get(loc);
      expect(data.ogImage, loc).toMatch(
        /^https:\/\/getalchemize\.com\/assets\//,
      );
      expect(data.twitterImage, loc).toBe(data.ogImage);
      expect(data.imagesWithoutAlt, loc).toBe(0);
      expect(new Set(data.ids).size, `${loc} duplicate ids`).toBe(
        data.ids.length,
      );
    }
  });

  test("no page metadata carries pricing, and only Translation and Apostille show prices", async ({
    page,
  }) => {
    for (const { loc } of sitemap) {
      const { title, description } = pages.get(loc);
      expect(`${title} ${description}`, loc).not.toMatch(/\$\s?\d/);
    }
    const priced = new Set(["translation-services", "apostille-services"]);
    for (const path of [
      "/services/individuals/tax-preparation",
      "/services/individuals/notary-document-services",
      "/services/businesses/advisory-optimization",
      "/services/businesses/operations-implementation",
      "/services/businesses/readiness-growth",
      "/services/businesses/bookkeeping-financial-reporting",
      "/services/businesses/payroll-processing",
      "/services/businesses/business-tax-support",
      "/web-digital",
      "/services/individuals/translation-services",
      "/services/individuals/apostille-services",
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1");
      const text = await page.locator("main").innerText();
      const slug = path.split("/").at(-1);
      if (priced.has(slug)) expect(text, path).toMatch(/\$\s?\d/);
      else expect(text, path).not.toMatch(/\$\s?\d/);
    }
  });
});

test.describe("SEO indexability and internal links", () => {
  test("a trailing slash resolves to the same canonical and alternates", async ({
    page,
  }) => {
    for (const path of ["/services/", "/es/services/", "/contact/"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1");
      const clean = path.replace(/\/$/, "");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${ORIGIN}${clean}`,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        `${ORIGIN}${clean}`,
      );
      await expect(
        page.locator('link[rel="alternate"][hreflang="x-default"]'),
      ).toHaveAttribute("href", `${ORIGIN}${clean.replace(/^\/es/, "")}`);
    }
  });

  test("unknown URLs render a helpful page that is kept out of the index", async ({
    page,
  }) => {
    for (const [path, lang, heading] of [
      ["/no-such-page", "en", /could not be found/i],
      ["/es/no-such-page", "es", /No pudimos encontrar/i],
      [
        "/services/no-such-audience/no-such-service/extra",
        "en",
        /could not be found/i,
      ],
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
        0,
      );
      await expect(
        page.getByRole("link", { name: /services|servicios/i }).first(),
      ).toBeVisible();
    }
    // leaving the not-found page restores normal indexing signals
    await page.goto("/no-such-page", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Go to the homepage" }).click();
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${ORIGIN}/`,
    );
  });

  test("English-only guides canonicalize to English in both language paths", async ({
    page,
  }) => {
    for (const slug of [
      "hostinger-for-small-business-websites",
      "api-integrations-for-small-business",
    ]) {
      for (const prefix of ["", "/es"]) {
        await page.goto(`${prefix}/resources/${slug}`, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForSelector("h1");
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `${ORIGIN}/resources/${slug}`,
        );
        await expect(
          page.locator('link[rel="alternate"][hreflang="es"]'),
        ).toHaveCount(0);
      }
    }
  });

  test("the Resource Library keeps one stable H1 while featured guides rotate", async ({
    page,
  }) => {
    await page.goto("/resources", { waitUntil: "domcontentloaded" });
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    const before = await h1.textContent();
    expect(before).toMatch(/Resource Library/);
    await page.getByRole("button", { name: /^Next:/i }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(before);
    await page.goto("/es/resources", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Biblioteca de recursos/,
    );
  });

  test("homepage categories and related services link with descriptive anchors", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const link = (name) =>
      page.locator(".home-path-list").getByRole("link", { name, exact: true });
    await expect(link("Tax Preparation")).toHaveAttribute(
      "href",
      "/services/individuals/tax-preparation",
    );
    await expect(link("Web & Digital Solutions")).toHaveAttribute(
      "href",
      "/web-digital",
    );
    await expect(link("Business Advisory")).toHaveAttribute(
      "href",
      "/services/businesses/advisory-optimization",
    );

    // no generic anchors on any service page; related links name their target
    const generic = /^(view service|learn more|read more|click here|more)$/i;
    for (const path of [
      "/services/individuals/translation-services",
      "/services/individuals/apostille-services",
      "/services/individuals/notary-document-services",
      "/services/businesses/bookkeeping-financial-reporting",
      "/services/businesses/advisory-optimization",
      "/es/services/individuals/translation-services",
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1");
      const anchors = await page
        .locator("main a")
        .evaluateAll((links) => links.map((a) => a.textContent.trim()));
      for (const text of anchors) expect(text, path).not.toMatch(generic);
    }
  });

  test("related services connect the intended clusters", async ({ page }) => {
    const related = async (path) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1");
      return page
        .locator("main a[href^='/services/'], main a[href='/web-digital']")
        .evaluateAll((links) => [
          ...new Set(links.map((a) => a.getAttribute("href"))),
        ]);
    };
    // Translation <-> Apostille <-> Notary
    const translation = await related(
      "/services/individuals/translation-services",
    );
    expect(translation).toEqual(
      expect.arrayContaining([
        "/services/individuals/apostille-services",
        "/services/individuals/notary-document-services",
      ]),
    );
    const apostille = await related("/services/individuals/apostille-services");
    expect(apostille).toEqual(
      expect.arrayContaining([
        "/services/individuals/notary-document-services",
        "/services/individuals/translation-services",
      ]),
    );
    // Bookkeeping <-> Payroll <-> Tax
    const bookkeeping = await related(
      "/services/businesses/bookkeeping-financial-reporting",
    );
    expect(bookkeeping).toEqual(
      expect.arrayContaining([
        "/services/businesses/payroll-processing",
        "/services/businesses/business-tax-support",
      ]),
    );
    // Advisory -> Operations, Foundation <-> Advisory
    const advisory = await related(
      "/services/businesses/advisory-optimization",
    );
    expect(advisory).toEqual(
      expect.arrayContaining([
        "/services/businesses/operations-implementation",
      ]),
    );
    const foundation = await related("/services/businesses/readiness-growth");
    expect(foundation).toEqual(
      expect.arrayContaining(["/services/businesses/advisory-optimization"]),
    );
  });

  test("Web & Digital links to its guides and keeps the consultation path", async ({
    page,
  }) => {
    for (const [path, guides] of [
      [
        "/web-digital",
        /website design process|Digital Presence Audit|SEO and Website Metadata/i,
      ],
      ["/es/web-digital", /diseño web|presencia digital|SEO/i],
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1");
      const related = page.locator(".webx-related a");
      await expect(related).toHaveCount(3);
      for (const anchor of await related.all()) {
        await expect(anchor).toHaveText(guides);
        expect(await anchor.getAttribute("href")).toMatch(
          /^(\/es)?\/resources\/[a-z-]+$/,
        );
      }
    }
    await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator('main a[href^="/contact?service=business-digital"]').first(),
    ).toBeVisible();
  });

  test("service inquiry links keep their preselected service", async ({
    page,
  }) => {
    const services = {
      "/services/individuals/tax-preparation": "individual-tax",
      "/services/individuals/notary-document-services": "individual-notary",
      "/services/individuals/translation-services": "individual-translation",
      "/services/individuals/apostille-services": "individual-apostille",
      "/services/businesses/advisory-optimization": "business-advisory",
      "/services/businesses/operations-implementation": "business-operations",
      "/services/businesses/readiness-growth": "business-readiness",
      "/services/businesses/bookkeeping-financial-reporting":
        "business-bookkeeping",
      "/services/businesses/payroll-processing": "business-payroll",
      "/services/businesses/business-tax-support": "business-financial",
    };
    for (const [path, key] of Object.entries(services)) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1");
      const hrefs = await page
        .locator("main a[href*='/contact?service=']")
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      expect(hrefs.length, path).toBeGreaterThan(0);
      for (const href of hrefs) expect(href, path).toContain(`service=${key}`);
    }
  });

  test("NAP is consistent between the footer, contact page and structured data", async ({
    page,
  }) => {
    for (const path of ["/", "/es"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const footer = page.locator(".footer-contact");
      await expect(footer).toContainText("Fayetteville, NC");
      await expect(footer.locator('a[href="tel:+19106440207"]')).toBeVisible();
      await expect(
        footer.locator('a[href="mailto:hello@getalchemize.com"]'),
      ).toBeVisible();
      // no street or private address anywhere in the footer
      await expect(footer).not.toContainText(
        /\d+\s+\w+\s+(st|street|ave|road|rd|dr|drive|ln|lane)\b/i,
      );
    }
  });
});

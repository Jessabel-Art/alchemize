import { existsSync, mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  DOWNLOADABLE_RESOURCE_IDS,
  downloadableResources,
  downloadableResourceById,
  getDownloadableResource,
} from "../src/pages/resources/downloadableResources.js";

const resourceSlugs = [
  "preparing-for-tax-season",
  "tax-records-what-to-keep",
  "estimated-taxes-questions",
  "professional-website-design-process",
  "digital-presence-audit",
  "seo-and-website-metadata",
  "hostinger-for-small-business-websites",
  "api-integrations-for-small-business",
  "starting-a-business-organization-checklist",
  "your-first-year-in-business",
  "business-formation-information-to-gather",
  "business-needs-a-process",
  "simple-administrative-system",
  "business-records-what-needs-a-home",
  "building-a-business-deadline-calendar",
];

const canonicalDownloadableResourceIds = [
  "consultation-preparation-workbook",
  "business-startup-formation-workbook",
  "business-operations-systems-workbook",
  "individual-tax-preparation-organizer",
  "business-tax-preparation-organizer",
];

test("downloadable library has five canonical English and Spanish resources", () => {
  const ids = downloadableResources.map(({ id }) => id);
  expect(downloadableResources).toHaveLength(5);
  expect(downloadableResourceById.size).toBe(5);
  expect(ids).toEqual(canonicalDownloadableResourceIds);
  expect(downloadableResources.every(({ download }) => !!download)).toBe(true);
  expect(
    downloadableResources.every(({ spanishDownload }) => !!spanishDownload),
  ).toBe(true);
  expect(new Set(ids).size).toBe(5);
  expect(downloadableResources.map(({ title }) => title)).toEqual([
    "Consultation Preparation Workbook",
    "Business Startup & Formation Workbook",
    "Business Operations & Systems Workbook",
    "Individual Tax Preparation Organizer",
    "Business Tax Preparation Organizer",
  ]);
  expect(downloadableResources.map(({ download }) => download)).toEqual([
    "/assets/downloads/consultation-preparation-workbook.pdf",
    "/assets/downloads/business-startup-formation-workbook.pdf",
    "/assets/downloads/business-operations-systems-workbook.pdf",
    "/assets/downloads/individual-tax-preparation-organizer.pdf",
    "/assets/downloads/business-tax-preparation-organizer.pdf",
  ]);
  expect(
    downloadableResources.map(({ spanishDownload }) => spanishDownload),
  ).toEqual([
    "/assets/downloads/es/consultation-preparation-workbook-es.pdf",
    "/assets/downloads/es/business-startup-formation-workbook-es.pdf",
    "/assets/downloads/es/business-operations-systems-workbook-es.pdf",
    "/assets/downloads/es/individual-tax-preparation-organizer-es.pdf",
    "/assets/downloads/es/business-tax-preparation-organizer-es.pdf",
  ]);
});

test("downloadable resources provide locale-specific English and Spanish PDF targets", () => {
  const englishPaths = Object.values(DOWNLOADABLE_RESOURCE_IDS).map(
    (id) => getDownloadableResource(id, "en").download,
  );
  const spanishPaths = Object.values(DOWNLOADABLE_RESOURCE_IDS).map(
    (id) => getDownloadableResource(id, "es").download,
  );

  expect(englishPaths).toHaveLength(5);
  expect(spanishPaths).toHaveLength(5);
  expect(englishPaths.every(Boolean)).toBe(true);
  expect(spanishPaths.every(Boolean)).toBe(true);
  expect(
    englishPaths.every((download) => download.startsWith("/assets/downloads/")),
  ).toBe(true);
  expect(
    spanishPaths.every((download) => download.includes("/downloads/es/")),
  ).toBe(true);
  expect(spanishPaths.every((download) => download.endsWith("-es.pdf"))).toBe(
    true,
  );
  for (const path of spanishPaths) {
    expect(existsSync(`public${path}`)).toBe(true);
  }
});

test("browse by responsibility renders real category counts and filters the library", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Individual Tax Preparation Organizer",
  );
  await expect(
    page.getByRole("heading", { name: "Browse by responsibility." }),
  ).toBeVisible();

  const cards = page.locator(".resource-category-card");
  await expect(cards).toHaveCount(6);
  const digitalCard = cards.filter({ hasText: "Web & Digital Solutions" });
  await expect(digitalCard.locator("small")).toHaveText("5 resources");

  await digitalCard.click();
  await expect(page.locator(".resource-result-count")).toContainText(
    "5 resources",
  );
  await expect(
    page.locator(".resource-toolbar .resource-select select").nth(1),
  ).toHaveValue("Web & Digital Solutions");
  // Selecting a responsibility card scrolls the library into view rather
  // than duplicating resource content underneath the card itself.
  await expect(page.locator("#all-resources")).toBeInViewport();
});

test("follow the journey renders the four editorial stages", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Follow the journey." }),
  ).toBeVisible();
  const steps = page.locator(".resource-journey-steps li");
  await expect(steps).toHaveCount(4);
  await expect(steps.nth(0)).toContainText("Understand");
  await expect(steps.nth(3)).toContainText("Act");
});

test("featured resources replace retired coverage content", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  const carousel = page.getByRole("region", { name: "Featured resources" });
  const heading = page.getByRole("heading", { level: 1 });
  const readGuide = page.getByRole("link", { name: "Read the guide" });
  await expect(readGuide).toHaveAttribute(
    "href",
    "/resources/preparing-for-tax-season",
  );

  await page.getByRole("button", { name: /^Next:/i }).click();
  await expect(heading).toHaveText(
    "What a Digital Presence Audit Can Reveal About Your Business",
  );
  await expect(readGuide).toHaveAttribute(
    "href",
    "/resources/digital-presence-audit",
  );

  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(heading).toHaveText(
    "Your First Year in Business: What Needs to Stay Organized",
  );
});

test("featured resource hero disables motion when requested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".resource-showcase-copy")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("every current resource route renders unique metadata", async ({
  page,
}) => {
  test.setTimeout(60_000);
  for (const slug of resourceSlugs) {
    await page.goto(`/resources/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".resource-article")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/resources/${slug}$`),
    );
    await expect(page.locator("#resource-structured-data")).toHaveCount(1);
  }
});

test("new hosting and API guides expose their intended links and disclosures", async ({
  page,
}) => {
  await page.goto("/resources/hostinger-for-small-business-websites");
  const referral = page.getByRole("link", {
    name: "Explore Hostinger hosting",
  });
  await expect(referral).toHaveAttribute(
    "href",
    "https://www.hostinger.com?REFERRALCODE=JZBJESSABFQ9",
  );
  await expect(referral).toHaveAttribute("target", "_blank");
  await expect(referral).toHaveAttribute("rel", /sponsored/);
  await expect(page.locator(".resource-referral-disclosure")).toContainText(
    "at no additional cost to you",
  );
  await expect(
    page.getByRole("link", {
      name: "Learn about Alchemize web and digital services",
    }),
  ).toHaveAttribute("href", "/web-digital");

  await page.goto("/resources/api-integrations-for-small-business");
  await expect(
    page.getByRole("heading", { name: "Payment-processing integrations" }),
  ).toBeVisible();
  await expect(page.locator(".resource-article")).toContainText(
    "Alchemize does not process, hold, or settle the customer's funds",
  );
  await expect(
    page.getByRole("link", {
      name: "Explore Alchemize web and digital services",
    }),
  ).toHaveAttribute("href", "/web-digital");
});

test("library and new digital articles have no serious accessibility violations", async ({
  page,
}) => {
  for (const path of [
    "/resources",
    "/resources/professional-website-design-process",
    "/resources/digital-presence-audit",
    "/resources/seo-and-website-metadata",
    "/resources/hostinger-for-small-business-websites",
    "/resources/api-integrations-for-small-business",
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(
        ({ impact }) => impact === "serious" || impact === "critical",
      ),
    ).toEqual([]);
  }
});

test("article print mode removes site chrome and preserves the guide", async ({
  page,
}) => {
  await page.goto("/resources/professional-website-design-process", {
    waitUntil: "domcontentloaded",
  });
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".resource-print-brand")).toBeVisible();
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("library and digital article layouts avoid horizontal overflow", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const screenshots = "artifacts/resources-library";
  mkdirSync(screenshots, { recursive: true });

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      "/resources",
      "/resources/hostinger-for-small-business-websites",
      "/resources/api-integrations-for-small-business",
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const hasOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasOverflow).toBeFalsy();
    }
  }
});

test("featured hero renders the supplied editorial image for the default resource", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  const heroImage = page.locator(".resource-showcase-image img");
  await expect(heroImage).toBeVisible();
  await expect(heroImage).toHaveAttribute(
    "src",
    "/assets/images/resources/featured-tax-organizer-hero.png",
  );
  // Slides without a supplied hero photo fall back to the original
  // two-column composition rather than reusing an unrelated image.
  await page.getByRole("button", { name: /^Next:/i }).click();
  await expect(page.locator(".resource-showcase-image")).toHaveCount(0);
});

test("the four supplied resource images render on their matching cards", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  const search = page.getByPlaceholder("Search guides, checklists, topics…");
  const expected = [
    [
      "tax preparation organizer",
      "/assets/images/resources/tax-resource-organizer.png",
      "/resources/preparing-for-tax-season",
    ],
    [
      "professional website design process",
      "/assets/images/resources/web-design-resource.png",
      "/resources/professional-website-design-process",
    ],
    [
      "digital presence audit",
      "/assets/images/resources/digital-presence-audit-resource.png",
      "/resources/digital-presence-audit",
    ],
    [
      "SEO and website metadata",
      "/assets/images/resources/seo-metadata-resource.png",
      "/resources/seo-and-website-metadata",
    ],
  ];
  for (const [term, src, href] of expected) {
    await search.fill(term);
    const card = page.locator(".resource-card").first();
    await expect(page.locator(".resource-card")).toHaveCount(1);
    await expect(card).toHaveAttribute("href", href);
    await expect(card.locator(".resource-card-media img")).toHaveAttribute(
      "src",
      src,
    );
  }

  // A resource without a supplied image still renders a consistent
  // thumbnail-shaped visual — a designed icon fallback, not an invented
  // or reused photo.
  await search.fill("estimated tax");
  const fallbackCard = page.locator(".resource-card").first();
  await expect(fallbackCard.locator(".resource-card-media img")).toHaveCount(0);
  await expect(fallbackCard.locator(".resource-card-icon")).toHaveCount(1);
});

test("type filter, sort, and grid/list controls operate on the full dataset", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });

  // Type filter uses the resource's own `type` field.
  await page
    .locator(".resource-select select")
    .first()
    .selectOption("Assessment guide");
  await expect(page.locator(".resource-result-count")).toContainText(
    "1 resource",
  );
  await expect(page.locator(".resource-card h3")).toHaveText(
    "What a Digital Presence Audit Can Reveal About Your Business",
  );
  await page.locator(".resource-select select").first().selectOption("All");

  // Sort reorders the same underlying data.
  await page
    .locator(".resource-toolbar .resource-select select")
    .nth(2)
    .selectOption("title");
  const firstTitleSorted = await page
    .locator(".resource-card h3")
    .first()
    .textContent();
  await page
    .locator(".resource-toolbar .resource-select select")
    .nth(2)
    .selectOption("recent");
  const firstRecentSorted = await page
    .locator(".resource-card h3")
    .first()
    .textContent();
  expect(firstTitleSorted).not.toEqual(firstRecentSorted);

  // Grid/list toggles presentation only.
  await expect(page.locator(".resource-card-grid")).toBeVisible();
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.locator(".resource-rows")).toBeVisible();
  await expect(page.locator(".resource-card-grid")).toHaveCount(0);
  await expect(page.locator(".resource-row").first()).toBeVisible();
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await expect(page.locator(".resource-card-grid")).toBeVisible();
});

test("client-side search filters resources across categories using existing data", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  const search = page.getByPlaceholder("Search guides, checklists, topics…");
  await search.fill("estimated tax");
  await expect(page.locator(".resource-result-count")).toContainText(
    "1 resource",
  );
  await expect(page.locator(".resource-card")).toHaveCount(1);
  await expect(page.locator(".resource-card h3")).toHaveText(
    "Estimated Taxes: Questions to Ask Before You Ignore Them",
  );

  await search.fill("no matching resource text at all");
  await expect(page.locator(".resource-no-results")).toBeVisible();
  await expect(page.locator(".resource-card")).toHaveCount(0);
});

test("load more reveals additional resources from the full filtered dataset", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".resource-result-count")).toContainText(
    "15 resources",
  );
  await expect(page.locator(".resource-card")).toHaveCount(6);
  const loadMore = page.getByRole("button", { name: "Load more resources" });
  await expect(loadMore).toBeVisible();
  await loadMore.click();
  await expect(page.locator(".resource-card")).toHaveCount(12);
  await loadMore.click();
  await expect(page.locator(".resource-card")).toHaveCount(15);
  await expect(loadMore).toHaveCount(0);
});

test("resource cards link to their correct existing routes", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  const search = page.getByPlaceholder("Search guides, checklists, topics…");
  await search.fill("building a business deadline calendar");
  await expect(
    page.getByRole("link", {
      name: /Building a Business Deadline Calendar/,
    }),
  ).toHaveAttribute("href", "/resources/building-a-business-deadline-calendar");
});

test("print checklist utility from the hero remains functional", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("link", { name: "Print checklist" }),
  ).toHaveAttribute("href", "/resources/preparing-for-tax-season?print=1");
});

test("the bottom CTA uses valid existing consultation and services routes", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });
  const cta = page.locator(".resource-cta");
  await expect(cta.locator("img")).toHaveAttribute(
    "src",
    "/assets/images/resources/resources-botanical-cta.png",
  );
  await expect(
    cta.getByRole("link", { name: "Schedule a consultation" }),
  ).toHaveAttribute("href", "/contact");
  await expect(
    cta.getByRole("link", { name: "Explore services" }),
  ).toHaveAttribute("href", "/services");
});

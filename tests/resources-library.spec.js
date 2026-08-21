import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const resourceSlugs = [
  "preparing-for-tax-season",
  "tax-records-what-to-keep",
  "estimated-taxes-questions",
  "medicare-basics-coverage-choices",
  "medicare-enrollment-periods",
  "comparing-medicare-coverage",
  "understanding-insurance-coverage",
  "starting-a-business-organization-checklist",
  "your-first-year-in-business",
  "business-formation-information-to-gather",
  "business-needs-a-process",
  "simple-administrative-system",
  "business-records-what-needs-a-home",
  "building-a-business-deadline-calendar",
];

test("resource library filters the complete collection accessibly", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Preparing for Tax Season",
  );
  await expect(page.locator(".resources-hero")).toHaveCount(0);
  await expect(page.locator(".resource-feature")).toHaveCount(0);
  await expect(page.locator(".resource-row")).toHaveCount(14);

  const medicareFilter = page.getByRole("button", {
    name: "Medicare & Insurance",
  });
  await medicareFilter.click();
  await expect(medicareFilter).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".resource-row")).toHaveCount(4);
  await expect(page.locator(".resource-result-count")).toContainText(
    "4 resources",
  );

  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".resource-row")).toHaveCount(14);
});

test("featured resource hero provides manual, keyboard, and valid route navigation", async ({
  page,
}) => {
  await page.goto("/resources", { waitUntil: "domcontentloaded" });

  const carousel = page.getByRole("region", { name: "Featured resources" });
  const heading = page.getByRole("heading", { level: 1 });
  const readGuide = page.getByRole("link", { name: "Read the guide" });
  const next = page.getByRole("button", { name: /Next featured resource/i });

  await expect(carousel).toBeVisible();
  await expect(readGuide).toHaveAttribute(
    "href",
    "/resources/preparing-for-tax-season",
  );
  await expect(
    page.getByRole("link", { name: "Print checklist" }),
  ).toHaveAttribute("href", "/resources/preparing-for-tax-season?print=1");

  await next.click();
  await expect(heading).toHaveText(
    "Medicare Basics: Understanding Your Coverage Choices",
  );
  await expect(readGuide).toHaveAttribute(
    "href",
    "/resources/medicare-basics-coverage-choices",
  );
  await expect(
    page.getByRole("link", { name: "View official source" }),
  ).toHaveAttribute("target", "_blank");

  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(heading).toHaveText(
    "Your First Year in Business: What Needs to Stay Organized",
  );
  await expect(readGuide).toHaveAttribute(
    "href",
    "/resources/your-first-year-in-business",
  );

  await page.keyboard.press("ArrowRight");
  await expect(heading).toHaveText(
    "When Your Business Needs a Process, Not Another To-Do List",
  );
  await expect(readGuide).toHaveAttribute(
    "href",
    "/resources/business-needs-a-process",
  );

  await page.keyboard.press("ArrowRight");
  await expect(heading).toHaveText("Preparing for Tax Season");
});

test("featured resource hero disables slide animation for reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/resources", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".resource-showcase-copy")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".resource-showcase-panel")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("every resource route renders the article system and unique metadata", async ({
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
    await expect(
      page.getByRole("link", { name: /Back to Resources/i }),
    ).toHaveAttribute("href", "/resources");
    await expect(
      page.getByText("Educational notice", { exact: true }),
    ).toBeVisible();
  }
});

test("Medicare resources expose current official sources and review cues", async ({
  page,
}) => {
  await page.goto("/resources/medicare-basics-coverage-choices", {
    waitUntil: "networkidle",
  });

  await expect(page.getByText("Reviewed for 2026")).toBeVisible();
  const officialLinks = page.locator(".resource-official a");
  await expect(officialLinks).toHaveCount(4);
  await expect(officialLinks.first()).toHaveAttribute("target", "_blank");
  await expect(officialLinks.first()).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  await expect(page.locator(".resource-disclaimer")).toContainText(
    "1-800-MEDICARE",
  );
});

test("retired consultation resource redirects to the maintained library", async ({
  page,
}) => {
  await page.goto("/resources/documents-to-bring-to-a-consultation", {
    waitUntil: "networkidle",
  });
  await expect(page).toHaveURL(/\/resources\/your-first-year-in-business$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your First Year in Business: What Needs to Stay Organized",
  );
});

test("library and Medicare article have no serious accessibility violations", async ({
  page,
}) => {
  for (const path of [
    "/resources",
    "/resources/medicare-basics-coverage-choices",
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
  await page.goto("/resources/preparing-for-tax-season", {
    waitUntil: "domcontentloaded",
  });
  await page.emulateMedia({ media: "print" });

  await expect(page.locator(".resource-print-brand")).toBeVisible();
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
  await expect(page.locator(".resource-utilities")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".resource-article-section").first()).toBeVisible();
});

test("library and article layouts avoid horizontal overflow", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const screenshots = "artifacts/resources-library";
  mkdirSync(screenshots, { recursive: true });

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      "/resources",
      "/resources/medicare-basics-coverage-choices",
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const hasOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasOverflow).toBeFalsy();
    }

    if ([1440, 390].includes(width)) {
      await page.goto("/resources", { waitUntil: "domcontentloaded" });
      await page.screenshot({
        path: `${screenshots}/resources-${width}.png`,
        fullPage: true,
      });
      await page.goto("/resources/medicare-basics-coverage-choices", {
        waitUntil: "domcontentloaded",
      });
      await page.screenshot({
        path: `${screenshots}/medicare-guide-${width}.png`,
        fullPage: true,
      });
    }
  }
});

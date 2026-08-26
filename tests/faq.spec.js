import { test, expect } from "@playwright/test";

test.describe("FAQ page", () => {
  test("shows the expanded FAQ structure and working search controls", async ({
    page,
  }) => {
    await page.goto("/faq");

    await expect(page.locator(".faq-page")).toBeVisible();
    await expect(page.locator(".faq-category-nav a")).toHaveCount(7);
    await expect(page.locator(".faq-category-nav")).toContainText("General");
    await expect(page.locator(".faq-category-nav")).toContainText(
      "Business Services",
    );
    await expect(page.locator(".faq-category-nav")).toContainText(
      "Web & Digital Solutions",
    );
    await expect(page.locator(".faq-category-nav")).toContainText(
      "Notary & Document Services",
    );
    await expect(page.locator(".faq-category-nav")).toContainText(
      "Working With Alchemize",
    );

    const search = page.locator("#faq-query");
    await expect(search).toBeVisible();

    const searchTerms = [
      "website",
      "seo",
      "google",
      "payments",
      "portal",
      "notary",
      "notarization",
      "identification",
      "document",
      "fee",
    ];

    for (const term of searchTerms) {
      await search.fill(term);
      await expect(page.locator(".faq-accordion-item").first()).toBeVisible();
      await expect(page.locator(".faq-results-meta")).toContainText("Showing");
    }

    await search.fill("notary");
    await expect(page.locator(".faq-accordion-item").first()).toBeVisible();

    await expect(page.getByRole("button", { name: /clear/i })).toBeVisible();
    await page.getByRole("button", { name: /clear/i }).click();
    await expect(search).toHaveValue("");

    const questionButtons = page.locator(".faq-question");
    await expect(questionButtons.first()).toBeVisible();
    const toggledQuestion = questionButtons.nth(1);
    await toggledQuestion.click();
    await expect(toggledQuestion).toHaveAttribute("aria-expanded", "true");
    await toggledQuestion.click();
    await expect(toggledQuestion).toHaveAttribute("aria-expanded", "false");

    const ids = await page
      .locator("[id^='faq-']")
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

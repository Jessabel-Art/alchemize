import { test, expect } from "@playwright/test";

test.describe("FAQ page", () => {
  test("shows the expanded FAQ structure and working search controls", async ({
    page,
  }) => {
    await page.goto("/faq");

    await expect(page.locator(".faq-page")).toBeVisible();
    await expect(page.locator(".faq-category-nav a")).toHaveCount(5);
    await expect(page.locator(".faq-category-nav")).toContainText("General");
    await expect(page.locator(".faq-category-nav")).toContainText(
      "Business Services",
    );
    await expect(page.locator(".faq-category-nav")).toContainText(
      "Working With Alchemize",
    );

    const search = page.locator("#faq-query");
    await expect(search).toBeVisible();

    await search.fill("notary");
    await expect(page.locator(".faq-accordion-item").first()).toBeVisible();

    await expect(page.getByRole("button", { name: /clear/i })).toBeVisible();
    await page.getByRole("button", { name: /clear/i }).click();
    await expect(search).toHaveValue("");
  });
});

import { test, expect } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`founder portfolio CTA placement and keyboard navigation at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    // Exercise native new-tab navigation without relying on the external site's uptime.
    await context.route("https://jessabel.art/**", (route) =>
      route.fulfill({ body: "Portfolio", contentType: "text/html" }),
    );
    await page.goto("/resources/meet-the-founder");
    const link = page
      .locator(".founder-identity")
      .getByRole("link", { name: "View Jessy's Portfolio" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "https://jessabel.art");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveClass("text-link");
    await expect(page.locator(".founder-photo-wrap a")).toHaveCount(0);
    const credentials = await page
      .locator(".founder-credential-line")
      .boundingBox();
    const cta = await link.boundingBox();
    const portrait = await page.locator(".founder-photo-wrap").boundingBox();
    expect(cta.y).toBeGreaterThanOrEqual(credentials.y + credentials.height);
    if (width > 1000) expect(cta.x + cta.width).toBeLessThan(portrait.x);
    else expect(cta.y + cta.height).toBeLessThan(portrait.y);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await link.hover();
    await expect
      .poll(() =>
        link.evaluate(
          (element) => getComputedStyle(element, "::after").transform,
        ),
      )
      .not.toBe("none");
    await link.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(link).toBeFocused();
    expect(
      await link.evaluate((element) => getComputedStyle(element).outlineStyle),
    ).not.toBe("none");
    const popup = page.waitForEvent("popup");
    await page.keyboard.press("Enter");
    const portfolio = await popup;
    await expect(portfolio).toHaveURL("https://jessabel.art/");
    await expect(page).toHaveURL(/\/resources\/meet-the-founder\/?$/);
    await portfolio.close();
    await expect(
      page.locator(".founder-cta-actions .button-primary"),
    ).toBeVisible();
  });
}

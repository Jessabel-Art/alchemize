import { expect, test } from "@playwright/test";

const routes = ["/", "/why-alchemize", "/resources/meet-the-founder"];

for (const route of routes) {
  for (const width of [1440, 768, 390]) {
    test(`${route} brand composition does not overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
    });
  }
}

test("new art-direction layers remain decorative", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home-path-bridge")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator(".home-capability-watermark")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await page.goto("/resources/meet-the-founder");
  for (const selector of [
    ".founder-background-watermark",
    ".founder-experience-axis",
    ".founder-intersection",
    ".founder-perspective-watermark",
  ]) {
    await expect(page.locator(selector)).toHaveAttribute("aria-hidden", "true");
  }
});

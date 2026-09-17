import { test, expect } from "@playwright/test";
import { jessyLinks } from "../src/pages/jessy/jessyLinks.js";

test("the page renders successfully with the expected title", async ({
  page,
}) => {
  const response = await page.goto("/jessy");
  expect(response.status()).toBeLessThan(400);
  await expect(page).toHaveTitle("Alchemize × Jessabel.art | Jessy");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Alchemize/,
  );
});

test("no normal Alchemize site header/footer/nav appears (standalone route)", async ({
  page,
}) => {
  await page.goto("/jessy");
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.locator("footer")).toHaveCount(0);
  await expect(page.locator("nav")).toHaveCount(0);
});

test("all four link cards render as full-card anchors with correct destinations", async ({
  page,
}) => {
  await page.goto("/jessy");

  const getalchemize = page.locator("a.jessy-card-getalchemize");
  const jessabel = page.locator("a.jessy-card-jessabel");
  const agency = page.locator("a.jessy-card-agency");
  const pinkladyz = page.locator("a.jessy-card-pinkladyz");

  await expect(getalchemize).toHaveAttribute(
    "href",
    jessyLinks.getalchemize.href,
  );
  await expect(jessabel).toHaveAttribute("href", jessyLinks.jessabelArt.href);
  await expect(agency).toHaveAttribute("href", jessyLinks.alchemizeAgency.href);
  await expect(pinkladyz).toHaveAttribute("href", jessyLinks.pinkladyz.href);

  expect(jessyLinks.getalchemize.href).toBe("https://getalchemize.com/");
  expect(jessyLinks.jessabelArt.href).toBe("https://jessabel.art/");

  // External destinations open safely in a new tab.
  for (const link of [jessabel, agency, pinkladyz]) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  // The internal destination stays in the same tab.
  await expect(getalchemize).not.toHaveAttribute("target", "_blank");
});

test("each card's entire visible image is inside its clickable anchor, with a meaningful label", async ({
  page,
}) => {
  await page.goto("/jessy");

  for (const selector of [
    "a.jessy-card-getalchemize",
    "a.jessy-card-jessabel",
    "a.jessy-card-agency",
    "a.jessy-card-pinkladyz",
  ]) {
    const card = page.locator(selector);
    await expect(card).toBeVisible();
    const img = card.locator("img");
    await expect(img).toHaveCount(1);
    const label = await card.getAttribute("aria-label");
    expect(label && label.trim().length).toBeGreaterThan(0);

    const cardBox = await card.boundingBox();
    const imgBox = await img.boundingBox();
    // The anchor's tap target is not smaller than its own image -- the
    // whole visible card, not just the text/arrow, is clickable.
    expect(cardBox.width).toBeGreaterThanOrEqual(imgBox.width - 1);
    expect(cardBox.height).toBeGreaterThanOrEqual(imgBox.height - 1);
  }
});

test("the title card is decorative and not a link", async ({ page }) => {
  await page.goto("/jessy");
  const title = page.locator(".jessy-title-card");
  await expect(title).toHaveAttribute("alt", "");
  await expect(title).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("a .jessy-title-card")).toHaveCount(0);
});

test("the real page title/subtitle text is present in the document structure", async ({
  page,
}) => {
  await page.goto("/jessy");
  await expect(
    page.getByRole("heading", { level: 1, name: "ALCHEMIZE × JESSABEL.ART" }),
  ).toBeAttached();
  await expect(
    page.getByText("YOUR TECH-SAVVY BUSINESS PARTNER."),
  ).toBeAttached();
});

test("keyboard focus is visible on each link", async ({ page }) => {
  await page.goto("/jessy");
  const getalchemize = page.locator("a.jessy-card-getalchemize");
  await getalchemize.focus();
  await expect(getalchemize).toBeFocused();
  const outline = await getalchemize.evaluate(
    (el) => getComputedStyle(el).outlineStyle,
  );
  expect(outline).not.toBe("none");
});

test("reduced motion disables the hover/focus transform transition", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/jessy");
  const card = page.locator("a.jessy-card-getalchemize");
  const durations = await card.evaluate((el) =>
    getComputedStyle(el)
      .transitionDuration.split(",")
      .map((value) => parseFloat(value)),
  );
  for (const seconds of durations) {
    expect(seconds).toBeLessThan(0.01);
  }
});

test("image assets preserve their supplied aspect ratios", async ({ page }) => {
  await page.goto("/jessy");
  const imgs = page.locator(".jessy-poster img");
  await expect(imgs).toHaveCount(5);
  for (const img of await imgs.all()) {
    await expect(img).toHaveJSProperty("complete", true);
  }
  const ratios = await page.evaluate(() =>
    [...document.querySelectorAll(".jessy-poster img")].map((img) => ({
      naturalRatio: img.naturalWidth / img.naturalHeight,
      renderedRatio:
        img.getBoundingClientRect().width / img.getBoundingClientRect().height,
    })),
  );
  for (const { naturalRatio, renderedRatio } of ratios) {
    expect(Number.isFinite(naturalRatio)).toBe(true);
    expect(renderedRatio).toBeCloseTo(naturalRatio, 1);
  }
});

test.describe("responsive layout", () => {
  for (const width of [320, 375, 390, 414, 430]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/jessy");
      const hasOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasOverflow).toBe(false);

      const cards = await page
        .locator(".jessy-card")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
      for (const box of cards) {
        expect(box.left).toBeGreaterThanOrEqual(-1);
        expect(box.right).toBeLessThanOrEqual(width + 1);
        expect(box.width).toBeGreaterThan(150);
      }
    });
  }

  test("desktop presentation stays constrained to a poster-width column, centered", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/jessy");
    const poster = page.locator(".jessy-poster");
    const box = await poster.boundingBox();
    expect(box.width).toBeLessThanOrEqual(520);
    expect(box.width).toBeGreaterThanOrEqual(430);

    const centerX = box.x + box.width / 2;
    expect(centerX).toBeGreaterThan(1440 / 2 - 20);
    expect(centerX).toBeLessThan(1440 / 2 + 20);

    const bg = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".jessy-page")).backgroundColor,
    );
    expect(bg).toMatch(/rgb\(1[0-9], 1[0-9], 2[0-9]\)|rgb\(10, 14, 20\)/);
  });
});

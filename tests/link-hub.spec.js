import { test, expect } from "@playwright/test";
import {
  linkHubButtons,
  linkHubSocials,
} from "../src/pages/links/linkHubConfig.js";

test("the /links page renders standalone with its title and metadata", async ({
  page,
}) => {
  const response = await page.goto("/links");
  expect(response.status()).toBeLessThan(400);
  await expect(page).toHaveTitle("Alchemize × Jessabel.Art | Links");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Alchemize/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://getalchemize.com/links",
  );
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.locator("footer")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Alchemize Business Services × Jessabel.Art",
    }),
  ).toBeVisible();
});

test("the legacy /jessy route redirects to /links", async ({ page }) => {
  await page.goto("/jessy");
  await expect(page).toHaveURL(/\/links$/);
});

test("buttons render in mockup order with confirmed destinations", async ({
  page,
}) => {
  await page.goto("/links");
  const items = page.locator(".links-list > li > .links-btn");
  await expect(items).toHaveCount(5);
  const ids = await items.evaluateAll((els) =>
    els.map((el) => el.className.match(/links-btn--(?!pending)(\w+)/)[1]),
  );
  expect(ids).toEqual([
    "getalchemize",
    "jessabel",
    "etsy",
    "instagram",
    "pinkladyz",
  ]);

  for (const button of linkHubButtons.filter((b) => b.href)) {
    const link = page.locator(`a.links-btn--${button.id}`);
    await expect(link).toHaveAttribute("href", button.href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAccessibleName(new RegExp(button.label));
  }

  expect(linkHubButtons.find((b) => b.id === "getalchemize").href).toBe(
    "https://getalchemize.com/",
  );
  expect(linkHubButtons.find((b) => b.id === "jessabel").href).toBe(
    "https://jessabel.art/",
  );
});

test("unconfigured destinations are not published as links", async ({
  page,
}) => {
  await page.goto("/links");
  for (const button of linkHubButtons.filter((b) => !b.href)) {
    await expect(page.locator(`a.links-btn--${button.id}`)).toHaveCount(0);
    await expect(page.locator(`.links-btn--${button.id}`)).toBeVisible();
  }
  const socialLinks = page.locator(".links-social a");
  await expect(socialLinks).toHaveCount(
    linkHubSocials.filter((s) => s.href).length,
  );
  await expect(page.locator(".links-social__item")).toHaveCount(4);
});

test("each button's whole visible surface is the tap target", async ({
  page,
}) => {
  await page.goto("/links");
  const link = page.locator("a.links-btn--getalchemize");
  const face = link.locator(".links-btn__face");
  const [linkBox, faceBox] = await Promise.all([
    link.boundingBox(),
    face.boundingBox(),
  ]);
  expect(Math.abs(linkBox.width - faceBox.width)).toBeLessThan(1);
  expect(Math.abs(linkBox.height - faceBox.height)).toBeLessThan(1);
});

test("pressing a button moves the face toward the stationary gold underlay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/links");
  const link = page.locator("a.links-btn--jessabel");
  const face = link.locator(".links-btn__face");
  const gold = link.locator(".links-btn__gold");
  await expect(face).toBeVisible();

  const goldBefore = await gold.boundingBox();
  const faceBefore = await face.boundingBox();
  // Gold sits down-right of the face so it shows on the bottom/right edges.
  expect(goldBefore.x).toBeGreaterThan(faceBefore.x);
  expect(goldBefore.y).toBeGreaterThan(faceBefore.y);

  await page.evaluate(() => {
    document
      .querySelector("a.links-btn--jessabel")
      .addEventListener("click", (event) => event.preventDefault());
  });
  await face.hover();
  await page.mouse.down();
  await page.waitForTimeout(250);
  const facePressed = await face.boundingBox();
  const goldPressed = await gold.boundingBox();
  await page.mouse.up();

  expect(facePressed.x).toBeGreaterThan(faceBefore.x);
  expect(facePressed.y).toBeGreaterThan(faceBefore.y);
  expect(goldPressed.x).toBeCloseTo(goldBefore.x, 0);
  expect(goldPressed.y).toBeCloseTo(goldBefore.y, 0);
});

test("keyboard focus is visible on links", async ({ page }) => {
  await page.goto("/links");
  await page.keyboard.press("Tab");
  const first = page.locator("a.links-btn--getalchemize");
  await expect(first).toBeFocused();
  const outline = await first.evaluate(
    (el) => getComputedStyle(el).outlineStyle,
  );
  expect(outline).not.toBe("none");
});

test("reduced motion removes the press transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/links");
  const duration = await page
    .locator("a.links-btn--getalchemize .links-btn__face")
    .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
  expect(duration).toBeLessThan(0.01);
});

test("artwork keeps its aspect ratio", async ({ page }) => {
  await page.goto("/links");
  const imgs = page.locator(".links-title img, .links-btn__face");
  await expect(imgs).toHaveCount(6);
  for (const img of await imgs.all()) {
    await expect(img).toHaveJSProperty("complete", true);
  }
  const ratios = await imgs.evaluateAll((els) =>
    els.map((img) => ({
      natural: img.naturalWidth / img.naturalHeight,
      rendered:
        img.getBoundingClientRect().width / img.getBoundingClientRect().height,
    })),
  );
  for (const { natural, rendered } of ratios) {
    expect(rendered).toBeCloseTo(natural, 1);
  }
});

test.describe("responsive layout", () => {
  const viewports = [
    [320, 640],
    [360, 800],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1440, 900],
    [844, 390],
  ];

  for (const [width, height] of viewports) {
    test(`fits without horizontal overflow at ${width}x${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/links");
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);

      const stage = await page.locator(".links-stage").boundingBox();
      expect(stage.width).toBeLessThanOrEqual(560);
      expect(Math.abs(stage.x + stage.width / 2 - width / 2)).toBeLessThan(2);

      const buttons = await page
        .locator(".links-btn")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
      for (const box of buttons) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
        expect(box.width).toBeGreaterThan(stage.width * 0.8);
      }
    });
  }
});

import { expect, test } from "@playwright/test";

// When the Services page collapses to one column (<= 900px) each section intro
// must read as a section header, not as another service category. Above 900px
// the two-column composition is the intended hierarchy and must not change.

const measure = (page, panelSelector) =>
  page.evaluate((selector) => {
    const panel = document.querySelector(selector);
    const intro = panel.querySelector(".services-catalog-intro");
    const h2 = intro.querySelector("h2");
    const paragraph = intro.querySelector("p");
    const list = panel.querySelector(".services-list");
    const firstHeading = list.firstElementChild.querySelector("h3");
    const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]);
    const top = (el) => el.getBoundingClientRect().top + window.scrollY;
    const bottom = (el) => el.getBoundingClientRect().bottom + window.scrollY;
    const cs = getComputedStyle(intro);
    return {
      columns: getComputedStyle(
        panel.querySelector(".services-catalog-inner"),
      ).gridTemplateColumns.split(" ").length,
      introFont: px(h2, "fontSize"),
      serviceFont: px(firstHeading, "fontSize"),
      introToDivider: top(list) - bottom(intro),
      dividerToFirst: top(firstHeading) - top(list),
      h2ToParagraph: top(paragraph) - bottom(h2),
      boxed:
        cs.backgroundColor !== "rgba(0, 0, 0, 0)" ||
        cs.borderTopWidth !== "0px" ||
        cs.boxShadow !== "none" ||
        px(intro, "paddingLeft") > 0,
      hscroll: document.documentElement.scrollWidth > innerWidth,
    };
  }, panelSelector);

for (const [code, prefix] of [
  ["en", ""],
  ["es", "/es"],
]) {
  for (const [tab, hash, selector] of [
    ["individuals", "", "#individuals-panel"],
    ["businesses", "#businesses", "#businesses-panel"],
  ]) {
    for (const width of [390, 700, 768, 834, 900]) {
      test(`${code} ${tab} @${width}px: the intro is a distinct header block above the listings`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${prefix}/services${hash}`);
        // measure the settled layout, not the reveal animation's 18px slide
        await page.evaluate(() =>
          document.querySelectorAll(".reveal").forEach((n) => {
            n.style.transition = "none";
            n.dataset.revealed = "true";
          }),
        );
        const m = await measure(page, selector);
        expect(m.columns).toBe(1);
        // level 2 stays prominent but is clearly below the level 3 service titles
        expect(m.introFont).toBeGreaterThanOrEqual(22);
        expect(m.introFont).toBeLessThanOrEqual(m.serviceFont * 0.9);
        // one cohesive unit: the paragraph stays tight under the headline
        expect(m.h2ToParagraph).toBeLessThan(24);
        // clear separation around the existing divider
        expect(m.introToDivider).toBeGreaterThanOrEqual(44);
        expect(m.dividerToFirst).toBeGreaterThanOrEqual(36);
        // typography and space only: no card, panel, border or background
        expect(m.boxed).toBe(false);
        expect(m.hscroll).toBe(false);
      });
    }

    for (const width of [901, 1024, 1440]) {
      test(`${code} ${tab} @${width}px: the desktop two-column composition is preserved`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${prefix}/services${hash}`);
        // measure the settled layout, not the reveal animation's 18px slide
        await page.evaluate(() =>
          document.querySelectorAll(".reveal").forEach((n) => {
            n.style.transition = "none";
            n.dataset.revealed = "true";
          }),
        );
        const m = await measure(page, selector);
        expect(m.columns).toBe(2);
        // the original fluid scale: clamp(2.2rem, 4vw, 4.2rem)
        const expected = Math.min(Math.max(width * 0.04, 35.2), 67.2);
        expect(Math.abs(m.introFont - expected)).toBeLessThan(0.6);
        expect(m.hscroll).toBe(false);
      });
    }
  }
}

test("the audience selector stays separate from the section intro on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/services");
  const gap = await page.evaluate(() => {
    const grid = document.querySelector(".services-choice-grid");
    const eyebrow = document.querySelector(
      "#individuals-panel .services-catalog-intro .eyebrow",
    );
    return (
      eyebrow.getBoundingClientRect().top - grid.getBoundingClientRect().bottom
    );
  });
  expect(gap).toBeGreaterThanOrEqual(48);
});

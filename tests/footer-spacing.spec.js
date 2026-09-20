import { expect, test } from "@playwright/test";

// Footer spacing and responsive density: the footer is compact, its columns are
// aligned, and nothing collides or clips from extra-wide desktop to mobile.

const footerMetrics = (page) =>
  page.evaluate(() => {
    const box = (element) => {
      const { top, bottom, left, right, height, width } =
        element.getBoundingClientRect();
      return { top, bottom, left, right, height, width };
    };
    const footer = document.querySelector(".site-footer");
    const bottomRow = footer.querySelector(".footer-bottom");
    const columns = [
      ...footer.querySelectorAll(".footer-brand, .footer-group"),
    ];
    const tallestBottom = Math.max(
      ...columns.map((column) => box(column).bottom),
    );
    return {
      footer: box(footer),
      // empty space between the tallest column and the divider
      toDivider: box(bottomRow).top - tallestBottom,
      columns: columns.map(box),
      headings: [...footer.querySelectorAll(".footer-group h2")].map(
        (heading) => box(heading),
      ),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      clipped: [...footer.querySelectorAll("a, span, p, h2")].some(
        (element) => {
          const rect = element.getBoundingClientRect();
          return rect.right > window.innerWidth + 0.5 || rect.left < -0.5;
        },
      ),
    };
  });

for (const [width, height] of [
  [1920, 1000],
  [1440, 900],
  [1280, 900],
  [1024, 900],
  [768, 1000],
  [390, 844],
]) {
  test(`footer has no overflow, clipping or overlap at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/", { waitUntil: "networkidle" });
    const footer = page.locator(".site-footer");
    await footer.scrollIntoViewIfNeeded();
    const metrics = await footerMetrics(page);
    expect(metrics.overflow).toBe(false);
    expect(metrics.clipped).toBe(false);
    // columns never overlap each other
    for (const [index, a] of metrics.columns.entries()) {
      for (const b of metrics.columns.slice(index + 1)) {
        const overlaps =
          a.left < b.right - 1 &&
          b.left < a.right - 1 &&
          a.top < b.bottom - 1 &&
          b.top < a.bottom - 1;
        expect(overlaps, `${width}px column overlap`).toBe(false);
      }
    }
    // the divider row sits below every column
    expect(metrics.toDivider).toBeGreaterThan(0);
    await expect(footer.locator(".footer-bottom")).toContainText(
      "© 2026 Alchemize Business Services LLC",
    );
    await expect(footer.locator(".footer-bottom")).toContainText(
      "getalchemize.com",
    );
  });
}

test("large desktop footer is compact: the divider follows the content closely", async ({
  page,
}) => {
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/", { waitUntil: "networkidle" });
    const metrics = await footerMetrics(page);
    // was ~100px of empty space; now roughly 55-70px
    expect(metrics.toDivider, `${width}px`).toBeGreaterThanOrEqual(45);
    expect(metrics.toDivider, `${width}px`).toBeLessThanOrEqual(75);
    // was ~680px tall at 1920; the footer is now well under 600px
    expect(metrics.footer.height, `${width}px`).toBeLessThanOrEqual(600);
  }
});

test("desktop columns share the width evenly and headings share one baseline", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const { columns, headings } = await footerMetrics(page);
  expect(columns).toHaveLength(5);
  // one row: every column starts at the same height
  expect(new Set(columns.map((column) => Math.round(column.top))).size).toBe(1);
  expect(new Set(headings.map((heading) => Math.round(heading.top))).size).toBe(
    1,
  );
  // brand is the widest; the three navigation columns match; Access is narrower
  const widths = columns.map((column) => column.width);
  expect(widths[0]).toBeGreaterThan(widths[1]);
  expect(Math.abs(widths[1] - widths[2])).toBeLessThan(2);
  expect(Math.abs(widths[2] - widths[3])).toBeLessThan(2);
  expect(widths[4]).toBeLessThan(widths[3]);
  // the gaps between neighbouring columns are all alike
  const gaps = columns.slice(1).map((c, i) => c.left - columns[i].right);
  expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(2);
});

test("a wrapped footer link keeps a tight line-height and clear space between items", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const links = await page.evaluate(() =>
    [...document.querySelectorAll(".footer-group a")].map((link) => {
      const style = getComputedStyle(link);
      const lineHeight = parseFloat(style.lineHeight);
      return {
        lines: Math.round(link.getBoundingClientRect().height / lineHeight),
        ratio: lineHeight / parseFloat(style.fontSize),
      };
    }),
  );
  for (const { ratio } of links) {
    expect(ratio).toBeGreaterThanOrEqual(1.35);
    expect(ratio).toBeLessThanOrEqual(1.5);
  }
  // the space between items exceeds the leading inside a link, so a wrapped
  // link cannot read as two separate links
  const { rowGap, leading } = await page.evaluate(() => {
    const group = document.querySelector(".footer-group");
    const link = group.querySelector("a");
    const style = getComputedStyle(link);
    return {
      rowGap: parseFloat(getComputedStyle(group).rowGap),
      leading: parseFloat(style.lineHeight) - parseFloat(style.fontSize),
    };
  });
  expect(rowGap).toBeGreaterThan(leading);
});

test("tablet keeps a 2 x 2 navigation grid and mobile pairs the short lists", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  let { columns } = await footerMetrics(page);
  // brand beside the navigation; Individuals/Businesses over Company/Access
  expect(columns[0].left).toBeLessThan(columns[1].left);
  expect(Math.round(columns[1].top)).toBe(Math.round(columns[2].top));
  expect(Math.round(columns[3].top)).toBe(Math.round(columns[4].top));
  expect(columns[3].top).toBeGreaterThan(columns[1].bottom - 1);

  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  ({ columns } = await footerMetrics(page));
  // still brand beside a 2 x 2 navigation grid
  expect(columns[0].left).toBeLessThan(columns[1].left);
  expect(Math.round(columns[1].top)).toBe(Math.round(columns[2].top));

  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  ({ columns } = await footerMetrics(page));
  // brand on top, then the navigation grid beneath it
  expect(columns[1].top).toBeGreaterThan(columns[0].bottom - 1);
  expect(Math.round(columns[1].top)).toBe(Math.round(columns[2].top));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  ({ columns } = await footerMetrics(page));
  // brand, then Individuals and Businesses full width, then Company | Access
  expect(columns[1].top).toBeGreaterThan(columns[0].bottom - 1);
  expect(columns[2].top).toBeGreaterThan(columns[1].bottom - 1);
  expect(Math.round(columns[3].top)).toBe(Math.round(columns[4].top));
  expect(columns[3].width).toBeLessThan(columns[1].width);
});

test("footer wording, destinations and bottom row are unchanged apart from the nationwide line", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const footer = page.locator(".site-footer");
  await expect(footer).toContainText(
    "Business operations · financial organization · documents · digital solutions",
  );
  await expect(footer).toContainText("Virtual services available nationwide.");
  await expect(footer).not.toContainText("Virtual business support");
  await expect(footer.locator(".footer-social-link")).toHaveCount(3);
  await expect(footer.locator(".footer-group")).toHaveCount(4);
  await expect(footer.locator(".footer-bottom span")).toHaveText([
    "© 2026 Alchemize Business Services LLC",
    "getalchemize.com",
  ]);
  // the bottom row adds no links
  await expect(footer.locator(".footer-bottom a")).toHaveCount(0);

  await page.goto("/es", { waitUntil: "networkidle" });
  await expect(page.locator(".site-footer")).toContainText(
    "Servicios virtuales disponibles a nivel nacional.",
  );
});

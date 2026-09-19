import { expect, test } from "@playwright/test";

// Audience -> Category -> Service must be legible on the Services page, and the
// routing decisions behind it must hold in both languages.

const languages = [
  {
    code: "en",
    prefix: "",
    individuals: "Digital Support",
    web: "Web & Digital Solutions",
  },
  {
    code: "es",
    prefix: "/es",
    individuals: "Apoyo digital",
    web: "Web y soluciones digitales",
  },
];

for (const { code, prefix, individuals, web } of languages) {
  test(`${code}: Digital Support (Individuals) and Web & Digital Solutions (Businesses) share /web-digital`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services`);
    const digital = page.locator("#individuals-panel .service-row").filter({
      has: page.getByRole("heading", { name: individuals, exact: true }),
    });
    await expect(digital).toHaveAttribute("href", `${prefix}/web-digital`);
    // no duplicate destination page exists for it
    const response = await page.goto(
      `${prefix}/services/individuals/digital-support`,
    );
    expect(response.status()).toBeLessThan(500);
    await expect(page).toHaveURL(new RegExp(`${prefix}/services/?$`));

    await page.goto(`${prefix}/services#businesses`);
    const business = page
      .locator("#businesses-panel .service-row")
      .filter({ has: page.getByRole("heading", { name: web, exact: true }) });
    await expect(business).toHaveAttribute("href", `${prefix}/web-digital`);
    await business.click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/web-digital/?$`));
  });

  test(`${code}: the footer reaches the shared Web & Digital page from both audiences`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/`);
    const footer = page.getByRole("contentinfo");
    await expect(
      footer.getByRole("link", { name: individuals, exact: true }),
    ).toHaveAttribute("href", `${prefix}/web-digital`);
    await expect(
      footer.getByRole("link", { name: web, exact: true }),
    ).toHaveAttribute("href", `${prefix}/web-digital`);
  });

  test(`${code}: multi-service categories are grouped visually but each service is its own link`, async ({
    page,
  }) => {
    for (const [hash, category, children] of [
      [
        "",
        "translation-apostille-support",
        ["translation-services", "apostille-services"],
      ],
      [
        "#businesses",
        "bookkeeping-payroll-support",
        ["bookkeeping-financial-reporting", "payroll-processing"],
      ],
    ]) {
      await page.goto(`${prefix}/services${hash}`);
      const group = page.locator(`#${category}.service-group`);
      await expect(group).toBeVisible();
      // the category header is a heading, not a link, and carries no arrow
      await expect(group.locator(".service-group-head a")).toHaveCount(0);
      await expect(
        group.locator(".service-group-head .service-row-arrow"),
      ).toHaveCount(0);
      const links = group.locator("a.service-child");
      await expect(links).toHaveCount(2);
      for (let index = 0; index < 2; index += 1) {
        await expect(links.nth(index)).toHaveAttribute(
          "href",
          new RegExp(
            `/services/(individuals|businesses)/${children[index]}/?$`,
          ),
        );
        await expect(
          links.nth(index).locator(".service-row-arrow"),
        ).toHaveCount(1);
      }
      // each child page is reachable and shows the category in its breadcrumb
      await links.nth(1).click();
      await expect(page).toHaveURL(new RegExp(`${children[1]}/?$`));
      await expect(
        page.locator(".service-breadcrumb").getByRole("link", {
          name: await page
            .locator(`.service-breadcrumb a[href$="#${category}"]`)
            .textContent(),
        }),
      ).toHaveAttribute("href", new RegExp(`#${category}$`));
    }
  });

  test(`${code}: parent categories are visibly distinct from child services`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services`);
    const group = page.locator("#translation-apostille-support");
    const parent = group.locator(".service-group-head h3");
    const child = group.locator(".service-child h4").first();
    const sizes = {
      parent: await parent.evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      ),
      child: await child.evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      ),
    };
    expect(sizes.child).toBeLessThan(sizes.parent * 0.7);
    const box = async (locator) => locator.boundingBox();
    const parentBox = await box(parent);
    const childBox = await box(child);
    expect(childBox.x).toBeGreaterThan(parentBox.x + 12); // indented
    const children = group.locator(".service-group-children");
    const styles = await children.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { border: cs.borderLeftWidth, tint: cs.backgroundColor };
    });
    expect(styles.border).toBe("1px");
    expect(styles.tint).not.toBe("rgba(0, 0, 0, 0)");
    await expect(group.locator(".service-group-count")).toHaveText(/^2 /);
  });

  test(`${code}: single-service categories render one direct row, never a redundant parent and child`, async ({
    page,
  }) => {
    for (const hash of ["", "#businesses"]) {
      await page.goto(`${prefix}/services${hash}`);
      const panel = page.locator(
        hash ? "#businesses-panel" : "#individuals-panel",
      );
      const rows = panel.locator("a.service-row");
      expect(await rows.count()).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < (await rows.count()); i += 1) {
        await expect(rows.nth(i).locator("h3")).toHaveCount(1);
        await expect(rows.nth(i).locator(".service-child, h4")).toHaveCount(0);
        await expect(rows.nth(i).locator(".service-row-arrow")).toHaveCount(1);
      }
      // no heading text appears twice inside an audience list
      const headings = await panel.locator("h3, h4").allTextContents();
      expect(new Set(headings).size).toBe(headings.length);
    }
  });
}

const viewports = [1440, 1024, 834, 768, 390];
for (const { code, prefix } of languages) {
  for (const width of viewports) {
    test(`${code}: services hierarchy stays legible at ${width}px without overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const hash of ["", "#businesses"]) {
        await page.goto(`${prefix}/services${hash}`);
        await page.evaluate(() =>
          document
            .querySelectorAll(".reveal")
            .forEach((n) => (n.dataset.revealed = "true")),
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
        ).toBe(false);
        const panel = page.locator(
          hash ? "#businesses-panel" : "#individuals-panel",
        );
        const group = panel.locator(".service-group");
        const parent = group.locator(".service-group-head h3");
        const child = group.locator(".service-child h4").first();
        const parentBox = await parent.boundingBox();
        const childBox = await child.boundingBox();
        expect(childBox.x).toBeGreaterThan(parentBox.x); // children stay indented
        const fonts = await Promise.all(
          [parent, child].map((l) =>
            l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
          ),
        );
        expect(fonts[1]).toBeLessThan(fonts[0]);
        // arrows sit beside their service name, and tap targets are large enough
        const arrowBoxes = await panel
          .locator(".service-row-arrow")
          .evaluateAll((els) =>
            els.map((el) => {
              const link = el.closest("a");
              const title = link.querySelector("h3, h4");
              const a = el.getBoundingClientRect();
              const t = title.getBoundingClientRect();
              const l = link.getBoundingClientRect();
              return {
                dy: Math.abs(a.top - t.top),
                inside: a.right <= l.right + 1,
                h: l.height,
              };
            }),
          );
        for (const arrow of arrowBoxes) {
          expect(arrow.inside).toBe(true);
          expect(arrow.h).toBeGreaterThanOrEqual(44);
          if (width <= 640) expect(arrow.dy).toBeLessThan(40);
        }
      }
    });
  }
}

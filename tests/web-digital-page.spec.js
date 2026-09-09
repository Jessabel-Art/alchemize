import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("no serious accessibility issues on /web-digital", async ({ page }) => {
  await page.goto("/web-digital");
  await page.waitForTimeout(850);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    ),
  ).toEqual([]);
});

test("page renders with the correct major section headings", async ({
  page,
}) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Professional digital presence for the work that matters.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "A website should do more than exist.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Small businesses" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Entrepreneurs & independent professionals",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "New & growing businesses",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Website and digital solutions",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Website design & development",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Visibility & digital presence",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Systems & support" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "The website is only one part of the system.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Built with more than design in mind.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Simple project process" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Digital support for what comes next.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Not sure what your digital presence needs yet?",
    }),
  ).toBeVisible();
});

test("the systems headline renders with readable contrast against its dark background", async ({
  page,
}) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  const heading = page.locator(".webx-enhancements h2");
  await expect(heading).toBeVisible();
  const { color, backgroundColor } = await heading.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, backgroundColor: cs.backgroundColor };
  });
  const rgb = color.match(/\d+/g).map(Number);
  // The background is dark emerald; the heading text must be a light,
  // high-contrast color (previously it inherited the dark background
  // color itself and was effectively invisible).
  expect(rgb[0] + rgb[1] + rgb[2]).toBeGreaterThan(500);
  expect(backgroundColor).not.toBe(color);
  await expect(
    page.locator(".webx-system-hub").getByText(/website|sitio web/i),
  ).toBeVisible();
});

test("the new workspace image asset loads in the Alchemize difference section", async ({
  page,
}) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  const image = page.locator(".webx-difference-visual img");
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute(
    "src",
    "/assets/images/services/web-digital-hero.png",
  );
  await expect(async () => {
    const naturalWidth = await image.evaluate((img) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  }).toPass();
});

test("the four connected-system groups are present", async ({ page }) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  const groups = page.locator(".webx-system-group");
  await expect(groups).toHaveCount(4);
  await expect(page.getByText("Attract", { exact: true })).toBeVisible();
  await expect(page.getByText("Convert", { exact: true })).toBeVisible();
  await expect(page.getByText("Operate", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Measure & maintain", { exact: true }),
  ).toBeVisible();
});

test("the six process steps use their refined descriptions and icons", async ({
  page,
}) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  const steps = page.locator(".webx-process-grid li");
  await expect(steps).toHaveCount(6);
  await expect(
    page.getByRole("heading", { level: 3, name: "Discover" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Launch" }),
  ).toBeVisible();
  await expect(page.locator(".webx-process-icon svg")).toHaveCount(6);
});

test("proposal CTA is functional and appears exactly twice", async ({
  page,
}) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  const proposalLinks = page.getByRole("link", {
    name: "Request a Project Proposal",
  });
  await expect(proposalLinks).toHaveCount(2);
  await expect(
    page.locator(".webx-actions").getByRole("link", {
      name: "Request a Project Proposal",
    }),
  ).toHaveCount(1);
  const heroCta = page.locator(".webx-actions").getByRole("link", {
    name: "Request a Project Proposal",
  });
  await expect(heroCta).toHaveAttribute(
    "href",
    "/contact?service=business-digital&audience=business",
  );
  const finalCta = page
    .locator(".webx-consult--bottom")
    .getByRole("link", { name: "Request a Project Proposal" });
  await expect(finalCta).toHaveAttribute(
    "href",
    "/contact?service=business-digital&audience=business",
  );
});

test("See What We Build scrolls to the service architecture section", async ({
  page,
}) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  const scrollLink = page.getByRole("link", {
    name: "See What We Build ↓",
  });
  await expect(scrollLink).toHaveAttribute("href", "#solutions");
  await scrollLink.click();
  await expect(page).toHaveURL(/#solutions$/);
  await expect(page.locator("#solutions")).toBeInViewport();
});

test("navigation remains intact on the web & digital page", async ({
  page,
}) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "Web & Digital Solutions" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Home" }),
  ).toHaveAttribute("href", "/");
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Services" }),
  ).toHaveAttribute("href", "/services");
});

test("no horizontal overflow across representative widths", async ({
  page,
}) => {
  await page.goto("/web-digital", { waitUntil: "domcontentloaded" });
  for (const width of [1920, 1440, 1024, 900, 768, 430, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows, `overflow at ${width}px`).toBeFalsy();
  }
});

import { test, expect } from "@playwright/test";

const portalRoutes = [
  "/client-portal/",
  "/client-portal/dashboard/",
  "/client-portal/services/",
  "/client-portal/tasks/",
  "/client-portal/documents/",
  "/client-portal/appointments/",
  "/client-portal/messages/",
  "/client-portal/billing/",
  "/client-portal/profile/",
];

test.describe("Client portal routes", () => {
  for (const route of portalRoutes) {
    test(`renders the portal shell on ${route}`, async ({ page }) => {
      const consoleErrors = [];
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(route);

      await expect(page.locator(".portal-shell")).toBeVisible();
      await expect(page.locator(".portal-sidebar")).toBeVisible();
      await expect(page.locator(".portal-nav")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("body")).toContainText("Client Portal");
      expect(consoleErrors).toEqual([]);
    });
  }

  test("dashboard shows the client workspace summary", async ({ page }) => {
    await page.goto("/client-portal/dashboard/");

    await expect(page.locator("body")).toContainText("Your service workspace");
    await expect(page.locator("body")).toContainText("Dashboard");
    await expect(page.locator("body")).toContainText("Appointments");
    await expect(page.locator("body")).toContainText("Documents");
  });

  test("service and task pages include the expected section content", async ({
    page,
  }) => {
    await page.goto("/client-portal/services/");
    await expect(page.locator("body")).toContainText("My services");
    await expect(page.locator("body")).toContainText("Tax preparation");

    await page.goto("/client-portal/tasks/");
    await expect(page.locator("body")).toContainText("Tasks");
    await expect(page.locator("body")).toContainText("Waiting on you");
  });
});

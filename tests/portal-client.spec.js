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

test.describe("Client Portal prototype", () => {
  for (const route of portalRoutes) {
    test(`renders the client shell on ${route}`, async ({ page }) => {
      const consoleErrors = [];
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(route);

      await expect(page.locator("#portal-app")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("body")).toContainText("Client Portal");
      expect(consoleErrors).toEqual([]);
    });
  }

  test("dashboard surfaces client work and next steps", async ({ page }) => {
    await page.goto("/client-portal/dashboard/");

    await expect(page.locator("body")).toContainText("Jess Example");
    await expect(page.locator("body")).toContainText("Needs your attention");
    await expect(page.locator("body")).toContainText("Upcoming");
    await expect(page.locator("body")).toContainText("Active services");
    await expect(page.locator("body")).toContainText("Recent updates");
  });

  test("service and task pages include realistic status content", async ({
    page,
  }) => {
    await page.goto("/client-portal/services/");
    await expect(page.locator("body")).toContainText("Active services");
    await expect(page.locator("body")).toContainText(
      "Business Formation & Startup",
    );

    await page.goto("/client-portal/tasks/");
    await expect(page.locator("body")).toContainText("Waiting on Client");
    await expect(page.locator("body")).toContainText("Upload requested W-2");
  });
});

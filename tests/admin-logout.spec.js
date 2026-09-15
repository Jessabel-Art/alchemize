import { test, expect } from "@playwright/test";

async function mockAdmin(page, { loggedOut } = {}) {
  let sessionRevoked = false;
  await page.route("**/alchemize-api.php?*", async (route) => {
    const key = new URL(route.request().url()).searchParams.get("route");
    if (key === "auth/session") {
      if (loggedOut || sessionRevoked) {
        await route.fulfill({ json: { data: { authenticated: false } } });
        return;
      }
      await route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "ui-test-token",
          },
        },
      });
      return;
    }
    if (key === "auth/logout") {
      sessionRevoked = true;
      await route.fulfill({
        json: { data: { authenticated: false, csrf_token: "" } },
      });
      return;
    }
    await route.fulfill({ json: { data: [] } });
  });
}

test("Log out is visible in the desktop Admin sidebar", async ({ page }) => {
  await mockAdmin(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/dashboard/");
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("Log out is reachable from the mobile Admin nav", async ({ page }) => {
  await mockAdmin(page);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/admin/dashboard/");
  await expect(page.locator(".portal-shell")).not.toHaveClass(
    /portal-nav-open/,
  );

  const toggle = page.getByRole("button", { name: "Toggle admin navigation" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator(".portal-shell")).toHaveClass(/portal-nav-open/);

  const logoutRequestPromise = page.waitForRequest((request) =>
    request.url().includes("route=auth%2Flogout"),
  );
  await page.getByRole("button", { name: "Log out" }).click();
  await logoutRequestPromise;
  await expect(page).toHaveURL(/\/login\/?$/);
});

test("Admin log out terminates the session and redirects to login", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  const logoutRequestPromise = page.waitForRequest((request) =>
    request.url().includes("route=auth%2Flogout"),
  );

  await page.getByRole("button", { name: "Log out" }).click();
  const request = await logoutRequestPromise;

  expect(request.method()).toBe("POST");
  await expect(page).toHaveURL(/\/login\/?$/);
});

test("A protected Admin route cannot be reached after logout", async ({
  page,
}) => {
  await mockAdmin(page);
  await page.goto("/admin/dashboard/");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login\/?$/);

  await page.goto("/admin/clients/");
  await expect(page).toHaveURL(/\/login\/?$/);
});

test("Directly visiting a protected Admin route without a session redirects to login", async ({
  page,
}) => {
  await mockAdmin(page, { loggedOut: true });
  await page.goto("/admin/settings/");
  await expect(page).toHaveURL(/\/login\/?$/);
});

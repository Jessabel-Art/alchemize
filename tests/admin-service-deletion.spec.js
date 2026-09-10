import { test, expect } from "@playwright/test";
for (const outcome of ["cancel", "success", "rejected", "refresh-failed"]) {
  test(`service deletion: ${outcome}`, async ({ page }) => {
    let deleted = false;
    let deleteCalls = 0;
    let refreshes = 0;
    const service = {
      id: 91,
      service_code: "test-service",
      service_name: "Test catalog service",
      audience: "business",
      category: "General",
      catalog_status: "ACTIVE",
      active_flag: 1,
      billing_type: "fixed",
      default_price: 100,
      tiers: [],
      add_ons: [],
    };
    await page.route("**/alchemize-api.php?*", async (route) => {
      const key = new URL(route.request().url()).searchParams.get("route");
      let data = [];
      if (key === "auth/session")
        data = {
          authenticated: true,
          user: { user_id: 1, role_slug: "owner-admin" },
          csrf_token: "test-token",
        };
      else if (key === "services/91" && route.request().method() === "DELETE") {
        deleteCalls++;
        expect(route.request().headers()["x-csrf-token"]).toBe("test-token");
        if (outcome === "rejected")
          return route.fulfill({
            status: 409,
            json: {
              error: {
                code: "SERVICE_IN_USE",
                message: "This service is protected by an active engagement.",
              },
            },
          });
        deleted = true;
        data = { deleted: true };
      } else if (key === "services") {
        if (deleted) {
          refreshes++;
          if (outcome === "refresh-failed")
            return route.fulfill({
              status: 500,
              json: { error: { message: "Catalog unavailable" } },
            });
        }
        data = deleted ? [] : [service];
      } else if (key?.startsWith("portal-admin/")) data = { items: [] };
      await route.fulfill({ json: { data } });
    });
    await page.goto("/admin/services/");
    await page
      .getByRole("button", { name: "Edit", exact: true })
      .first()
      .click();
    const drawer = page.locator(".service-editor-drawer");
    await expect(
      drawer.getByRole("button", { name: "Delete service", exact: true }),
    ).toBeVisible();
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Test catalog service");
      if (outcome === "cancel") await dialog.dismiss();
      else await dialog.accept();
    });
    await drawer
      .getByRole("button", { name: "Delete service", exact: true })
      .click();
    if (outcome === "cancel" || outcome === "rejected") {
      await expect(drawer).toBeVisible();
      await expect(
        page.getByText("Test catalog service", { exact: true }).first(),
      ).toBeVisible();
      if (outcome === "rejected")
        await expect(drawer.getByRole("alert")).toHaveText(
          "This service is protected by an active engagement.",
        );
      expect(deleteCalls).toBe(outcome === "cancel" ? 0 : 1);
      expect(deleted).toBe(false);
    } else {
      await expect(drawer).toHaveCount(0);
      await expect(
        page.getByText("Test catalog service", { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText(
          outcome === "success"
            ? "Service deleted: Test catalog service"
            : "Service deleted, but the catalog could not be refreshed: Catalog unavailable",
          { exact: true },
        ),
      ).toBeVisible();
      expect(deleteCalls).toBe(1);
      expect(refreshes).toBe(1);
    }
  });
}

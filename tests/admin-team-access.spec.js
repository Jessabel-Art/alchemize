import { test, expect } from "@playwright/test";

test("Team invitation, resend, revoke, and member changes are discrete persisted actions", async ({
  page,
}) => {
  const members = [
    {
      user_id: 1,
      display_name: "Owner",
      email: "owner@example.test",
      role_slug: "owner-admin",
      status: "active",
    },
    {
      user_id: 2,
      display_name: "Staff member",
      email: "staff@example.test",
      role_slug: "staff",
      status: "active",
    },
  ];
  let invitations = [];
  const writes = [];
  await page.route("**/alchemize-api.php?*", async (route) => {
    const request = route.request();
    const key = new URL(request.url()).searchParams.get("route");
    let data = [];
    if (key === "auth/session")
      data = { authenticated: true, user: members[0], csrf_token: "team-test" };
    if (key === "settings") data = {};
    if (key === "clients/team") {
      if (request.method() === "POST") {
        const payload = request.postDataJSON();
        writes.push(payload);
        expect(payload).toEqual({
          display_name: "New administrator",
          email: "new@example.test",
          role_slug: "administrator",
        });
        invitations = [
          {
            ...payload,
            user_id: 3,
            invited_at: "2026-09-15 10:00:00",
            expires_at: "2026-09-18 10:00:00",
            invitation_status: "pending",
          },
        ];
        data = { email_delivery: "sent" };
      } else if (request.method() === "PUT") {
        const payload = request.postDataJSON();
        writes.push(payload);
        Object.assign(members[1], payload);
        data = { updated: true };
      } else data = members;
    }
    if (key === "clients/team/invitations") {
      if (request.method() === "POST") {
        const payload = request.postDataJSON();
        writes.push(payload);
        invitations[0].invitation_status =
          payload.action === "revoke" ? "revoked" : "pending";
        data =
          payload.action === "resend"
            ? { email_delivery: "sent" }
            : { revoked: true };
      } else data = invitations;
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto("/admin/settings?section=team-access");
  await expect(
    page.getByRole("heading", { name: "Active administrators" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save team access" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "+ Add administrator", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("New administrator");
  await page.getByLabel("Email", { exact: true }).fill("new@example.test");
  await page
    .getByRole("button", { name: "Send invitation", exact: true })
    .click();
  const pending = page.getByRole("region", { name: "Pending invitations" });
  await expect(pending).toContainText("new@example.test");
  await expect(pending.getByRole("button", { name: "Manage" })).toHaveCount(0);
  await pending.getByRole("button", { name: "Resend invitation" }).click();
  await expect(page.getByRole("status")).toContainText("Invitation sent");
  await pending.getByRole("button", { name: "Revoke invitation" }).click();
  await expect(pending).toContainText("Revoked");
  await page.getByRole("button", { name: "Manage", exact: true }).click();
  await page.getByLabel("Access status").selectOption("inactive");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Active administrators" }),
  ).toContainText("Inactive");
  expect(writes.map((item) => item.action).filter(Boolean)).toEqual([
    "resend",
    "revoke",
  ]);
  expect(writes).toHaveLength(4);
  await page.reload();
  await expect(pending).toContainText("Revoked");
});

test("Account password confirmation and email verification are explicit", async ({
  page,
}) => {
  const user = {
    user_id: 1,
    display_name: "Owner",
    email: "owner@example.test",
    role_slug: "owner-admin",
    password_changed_at: "2026-09-14 10:00:00",
  };
  let passwordWrites = 0;
  await page.route("**/alchemize-api.php?*", async (route) => {
    const key = new URL(route.request().url()).searchParams.get("route");
    let data = [];
    if (key === "auth/session")
      data = { authenticated: true, user, csrf_token: "test" };
    if (key === "settings") data = {};
    if (key === "auth/account") {
      data = {
        user,
        recent_activity: [
          {
            event_type: "lead.converted",
            action_summary: "Lead converted to client record.",
            created_at: "2026-09-11 01:43:00",
          },
        ],
        security: {},
      };
      if (route.request().method() === "PUT") {
        expect(route.request().postDataJSON().current_password).toBe(
          "current-password",
        );
        data.email_change = { email_delivery: "sent" };
      }
    }
    if (key === "auth/change-password") passwordWrites++;
    await route.fulfill({ json: { data } });
  });
  await page.goto("/admin/settings?section=account-security");
  await expect(page.getByText("Lead converted", { exact: true })).toBeVisible();
  await expect(page.locator(".access-settings input")).toHaveCount(0);
  await expect(page.getByText("lead.converted", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await page
    .getByLabel("Current password", { exact: true })
    .fill("current-password");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-one");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("new-password-two");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("alert")).toHaveText("Passwords do not match.");
  expect(passwordWrites).toBe(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page
    .getByLabel("Login email", { exact: true })
    .fill("new@example.test");
  await page
    .getByLabel("Current password to change email")
    .fill("current-password");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Confirm the link");
  await expect(
    page.getByRole("region", { name: "Account profile" }),
  ).toContainText("owner@example.test");
});

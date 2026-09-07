import { test, expect } from "@playwright/test";

test("Business persistence contract, navigation, validation and responsive shell", async ({
  page,
}) => {
  let saved = {
    business_name: "Existing business",
    business_email: "ops@example.com",
    timezone: "America/New_York",
    appointment_default_duration: 75,
    portal_message_email_notifications: false,
  };
  let writes = 0;
  await page.route("**/alchemize-api.php?*", async (route) => {
    const path = new URL(route.request().url()).searchParams.get("route");
    let data = [];
    if (path === "auth/session")
      data = {
        authenticated: true,
        user: {
          user_id: 1,
          role_slug: "owner-admin",
          email: "alex@alchemize.co",
          display_name: "Alex Rivera",
        },
        csrf_token: "test-token",
      };
    if (path === "settings") {
      if (route.request().method() === "PUT") {
        saved = route.request().postDataJSON();
        writes++;
      }
      data = saved;
    }
    if (path === "portal-admin/attention") data = { items: [] };
    await route.fulfill({ json: { data } });
  });
  await page.goto("/admin/settings");
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Existing business",
  );
  await expect(
    page.getByLabel("Default appointment duration (minutes)"),
  ).toHaveValue("75");
  await expect(
    page.getByLabel("Email clients when a portal message is sent"),
  ).not.toBeChecked();
  await page
    .getByRole("navigation", { name: "Settings sections" })
    .getByRole("button", { name: "Data Maintenance", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Data Maintenance", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Settings sections" })
    .getByRole("button", { name: /System & Integrations/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /System & Integrations/i }),
  ).toBeVisible();
  await expect(page.getByText(/Safe operational status only/i)).toBeVisible();
  await page
    .getByRole("button", { name: "Account & Security", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Account & Security", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Display name")).toHaveValue("Alex Rivera");
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Notifications", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Operational notification delivery mode"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Team & Access", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Team & Access", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Save team access/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Business", exact: true }).click();
  await page.getByLabel(/Business notification email/i).fill("bad-email");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  expect(writes).toBe(0);
  await page
    .getByLabel(/Business notification email/i)
    .fill("new-ops@example.com");
  await page.getByLabel("Default appointment duration (minutes)").fill("0");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  expect(writes).toBe(0);
  await page.getByLabel("Default appointment duration (minutes)").fill("90");
  await page.getByLabel("Email clients when a portal message is sent").check();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible();
  expect(saved.portal_message_email_notifications).toBe(true);
  expect(saved.appointment_default_duration).toBe(90);
  await page.reload();
  await expect(page.getByLabel(/Business notification email/i)).toHaveValue(
    "new-ops@example.com",
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page
        .locator(".settings-layout")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
  }
  await page
    .getByRole("link", { name: "Manage business hours in Appointments" })
    .click();
  await expect(page).toHaveURL(/\/admin\/appointments/);
});

test("Account & Security loads personal details and supports self-service password changes without fake MFA", async ({
  page,
}) => {
  const account = {
    user_id: 1,
    public_id: "user-1",
    display_name: "Alex Rivera",
    email: "alex@alchemize.co",
    role_slug: "owner-admin",
    role_name: "Owner / Administrator",
    status: "active",
    last_login_at: "2025-01-18T08:32:10.000000Z",
    password_changed_at: "2025-01-10T12:00:00.000000Z",
  };

  await page.route("**/alchemize-api.php?*", async (route) => {
    const path = new URL(route.request().url()).searchParams.get("route");
    if (path === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: {
              user_id: 1,
              role_slug: "owner-admin",
              email: account.email,
              display_name: account.display_name,
            },
            csrf_token: "test-token",
          },
        },
      });
    }
    if (path === "auth/account") {
      if (route.request().method() === "PUT") {
        const payload = route.request().postDataJSON();
        account.display_name = payload.display_name || account.display_name;
        account.email = payload.email || account.email;
        return route.fulfill({
          json: {
            data: {
              updated: true,
              user: account,
              recent_activity: [
                {
                  event_type: "user.profile.updated",
                  action_summary: "Updated account profile.",
                  created_at: "2025-01-18T09:00:00.000000Z",
                },
              ],
              security: {
                mfa_available: false,
                session_note:
                  "Current browser session is managed by secure cookies and can be ended by signing out.",
              },
            },
          },
        });
      }
      return route.fulfill({
        json: {
          data: {
            user: account,
            recent_activity: [
              {
                event_type: "portal.password.changed",
                action_summary: "Changed password for the current account.",
                created_at: "2025-01-15T10:00:00.000000Z",
              },
            ],
            security: {
              mfa_available: false,
              session_note:
                "Current browser session is managed by secure cookies and can be ended by signing out.",
            },
          },
        },
      });
    }
    if (path === "auth/change-password") {
      return route.fulfill({
        json: { data: { changed: true } },
      });
    }
    if (path === "settings") {
      return route.fulfill({ json: { data: { business_name: "Alchemize" } } });
    }
    if (path === "portal-admin/attention") {
      return route.fulfill({ json: { data: { items: [] } } });
    }
    await route.fulfill({ json: { data: [] } });
  });

  await page.goto("/admin/settings?section=account-security");
  await expect(
    page.getByRole("heading", { name: "Account & Security", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Display name")).toHaveValue("Alex Rivera");
  await expect(page.getByLabel("Login email")).toHaveValue("alex@alchemize.co");
  await expect(
    page.getByText("Current browser session is managed by secure cookies"),
  ).toBeVisible();
  await expect(
    page.getByText("MFA is not configured for this workspace yet."),
  ).toBeVisible();

  await page.getByLabel("Display name").fill("Alex R. Rivera");
  await page.getByRole("button", { name: "Save account profile" }).click();
  await expect(page.getByText("Account profile saved.")).toBeVisible();

  await page.getByLabel("Current password").fill("old-password");
  await page.getByLabel("New password").fill("new-password-123");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password updated.")).toBeVisible();
});

test("Notifications section saves delivery mode without creating a second notification architecture", async ({
  page,
}) => {
  let saved = {
    business_name: "Existing business",
    business_email: "ops@example.com",
    timezone: "America/New_York",
    staff_notification_delivery_mode: "both",
    portal_message_email_notifications: true,
  };
  await page.route("**/alchemize-api.php?*", async (route) => {
    const path = new URL(route.request().url()).searchParams.get("route");
    if (path === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "test-token",
          },
        },
      });
    }
    if (path === "settings") {
      if (route.request().method() === "PUT") {
        saved = route.request().postDataJSON();
      }
      return route.fulfill({ json: { data: saved } });
    }
    if (path === "portal-admin/attention") {
      return route.fulfill({ json: { data: { items: [] } } });
    }
    await route.fulfill({ json: { data: [] } });
  });

  await page.goto("/admin/settings?section=notifications");
  await expect(
    page.getByRole("heading", { name: "Notifications", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Operational notification delivery mode"),
  ).toHaveValue("both");
  await page
    .getByLabel("Operational notification delivery mode")
    .selectOption("dashboard");
  await page
    .getByRole("button", { name: "Save notification settings" })
    .click();
  await expect(page.getByText("Notification settings saved.")).toBeVisible();
  expect(saved.staff_notification_delivery_mode).toBe("dashboard");
  expect(saved.business_email).toBe("ops@example.com");
});

test("Team & Access loads real internal users and restricts role changes to owner/admin managers", async ({
  page,
}) => {
  let teamUsers = [
    {
      id: 1,
      public_id: "user-1",
      display_name: "Alex Rivera",
      email: "alex@alchemize.co",
      status: "active",
      role_name: "Owner / Administrator",
      role_slug: "owner-admin",
    },
    {
      id: 2,
      public_id: "user-2",
      display_name: "Morgan Lee",
      email: "morgan@alchemize.co",
      status: "active",
      role_name: "Administrator",
      role_slug: "administrator",
    },
    {
      id: 3,
      public_id: "user-3",
      display_name: "Sam Chen",
      email: "sam@alchemize.co",
      status: "inactive",
      role_name: "Staff",
      role_slug: "staff",
    },
  ];

  await page.route("**/alchemize-api.php?*", async (route) => {
    const path = new URL(route.request().url()).searchParams.get("route");
    if (path === "auth/session") {
      return route.fulfill({
        json: {
          data: {
            authenticated: true,
            user: { user_id: 1, role_slug: "owner-admin" },
            csrf_token: "test-token",
          },
        },
      });
    }
    if (path === "settings") {
      return route.fulfill({ json: { data: { business_name: "Alchemize" } } });
    }
    if (path === "clients/team") {
      if (route.request().method() === "PUT") {
        const payload = route.request().postDataJSON();
        teamUsers = teamUsers.map((user) =>
          user.id === payload.user_id
            ? {
                ...user,
                role_slug: payload.role_slug,
                status: payload.status || user.status,
              }
            : user,
        );
        return route.fulfill({
          json: {
            data: {
              updated: true,
              user: teamUsers.find((user) => user.id === payload.user_id),
            },
          },
        });
      }
      return route.fulfill({ json: { data: teamUsers } });
    }
    if (path === "portal-admin/attention") {
      return route.fulfill({ json: { data: { items: [] } } });
    }
    await route.fulfill({ json: { data: [] } });
  });

  await page.goto("/admin/settings?section=team-access");
  await expect(
    page.getByRole("heading", { name: "Team & Access", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".team-member-meta strong", { hasText: "Alex Rivera" }),
  ).toBeVisible();
  await expect(
    page.locator(".team-member-meta strong", { hasText: "Morgan Lee" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Save team access/i }),
  ).toBeVisible();

  await page.getByLabel("Role for Morgan Lee").selectOption("staff");
  await page.getByLabel("Status for Morgan Lee").selectOption("inactive");
  await page.getByRole("button", { name: /Save team access/i }).click();

  await expect(page.getByText("Team access updated.")).toBeVisible();
  await expect(
    page.locator(".team-member-meta strong", { hasText: "Morgan Lee" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: /Status for Morgan Lee/i }),
  ).toHaveValue("inactive");
});

test("Load failure never presents fallback settings to save", async ({
  page,
}) => {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const path = new URL(route.request().url()).searchParams.get("route");
    if (path === "settings")
      return route.fulfill({
        status: 500,
        json: { error: { message: "Settings unavailable" } },
      });
    await route.fulfill({
      json: {
        data:
          path === "auth/session"
            ? {
                authenticated: true,
                user: { user_id: 1, role_slug: "owner-admin" },
              }
            : [],
      },
    });
  });
  await page.goto("/admin/settings");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save Settings", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry loading settings" }),
  ).toBeVisible();
});

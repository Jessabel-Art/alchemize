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
    if (path === "auth/account")
      data = {
        user: {
          user_id: 1,
          public_id: "user-1",
          display_name: "Alex Rivera",
          email: "alex@alchemize.co",
          role_slug: "owner-admin",
          role_name: "Owner / Administrator",
          status: "active",
          last_login_at: null,
          password_changed_at: null,
        },
        recent_activity: [],
        security: {
          mfa_available: false,
          session_note: "Current browser session is managed by secure cookies.",
        },
      };
    if (path === "clients/team/invitations") data = [];
    await route.fulfill({ json: { data } });
  });
  await page.goto("/admin/settings");
  await expect(page.getByText("Existing business")).toBeVisible();
  await expect(page.getByText("Business notification email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Edit business identity/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Edit business identity/i }).click();
  await expect(
    page.getByLabel("Business name", { exact: true }).last(),
  ).toHaveValue("Existing business");
  await page
    .getByRole("button", { name: "Cancel", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "Edit business identity", exact: true }),
  ).toBeVisible();
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
  await expect(page.getByText("Alex Rivera")).toBeVisible();
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
    page.getByRole("button", { name: "+ Add administrator", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Business", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit business identity", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Edit business identity/i }).click();
  await page.getByLabel(/Business notification email/i).fill("bad-email");
  await page
    .getByRole("button", { name: "Save Settings", exact: true })
    .click();
  expect(writes).toBe(0);
  await page.getByRole("button", { name: "Cancel" }).last().click();
  await expect(
    page.getByRole("button", { name: "Edit business identity", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit business identity", exact: true })
    .click();
  await page
    .getByLabel(/Business notification email/i)
    .fill("new-ops@example.com");
  await page.getByLabel("Email clients when a portal message is sent").check();
  await page
    .getByRole("button", { name: "Save Settings", exact: true })
    .click();
  await expect(page.getByText("Settings saved.")).toBeVisible();
  expect(saved.business_email).toBe("new-ops@example.com");
  expect(saved.portal_message_email_notifications).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Edit business identity", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("new-ops@example.com", { exact: true }),
  ).toBeVisible();
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
  await expect(page.getByText("Display name")).toBeVisible();
  await expect(page.getByText("Alex Rivera", { exact: true })).toBeVisible();
  await expect(
    page.getByText("alex@alchemize.co", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Current browser session is managed by secure cookies"),
  ).toBeVisible();
  await expect(
    page.getByText("MFA is not configured for this workspace yet."),
  ).toBeVisible();

  const profileWrites = [];
  page.on("request", (request) => {
    if (
      new URL(request.url()).searchParams.get("route") === "auth/account" &&
      request.method() === "PUT"
    )
      profileWrites.push(request);
  });
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(page.getByLabel("Display name", { exact: true })).toBeEditable();
  expect(profileWrites).toHaveLength(0);
  await expect(page.getByLabel("Login email", { exact: true })).toBeEditable();
  await expect(
    page.getByRole("button", { name: "Save changes", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Display name", { exact: true }).fill("Alex R. Rivera");
  const profileRequest = page.waitForRequest(
    (request) =>
      new URL(request.url()).searchParams.get("route") === "auth/account" &&
      request.method() === "PUT",
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const request = await profileRequest;
  expect(new URL(request.url()).pathname).toBe("/alchemize-api.php");
  expect(new URL(request.url()).origin).toBe(new URL(page.url()).origin);
  expect(request.headers()["content-type"]).toBe("application/json");
  expect(request.headers()["x-csrf-token"]).toBe("test-token");
  expect(request.postDataJSON()).toEqual({
    display_name: "Alex R. Rivera",
    email: "alex@alchemize.co",
    current_password: "",
  });
  await expect(
    page.getByRole("button", { name: "Edit profile", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Alex R. Rivera", { exact: true })).toBeVisible();
  await expect(page.getByText("Profile saved.")).toBeVisible();

  await page
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await page
    .getByLabel("Current password", { exact: true })
    .fill("old-password");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-123");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("new-password-123");
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(page.getByText("Password updated.")).toBeVisible();
});

test("Account profile stays read-only until an explicit edit action is chosen", async ({
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
              recent_activity: [],
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
            recent_activity: [],
            security: {
              mfa_available: false,
              session_note:
                "Current browser session is managed by secure cookies and can be ended by signing out.",
            },
          },
        },
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
  await expect(page.getByText("Display name")).toBeVisible();
  await expect(page.getByText("Alex Rivera", { exact: true })).toBeVisible();
  await expect(
    page.getByText("alex@alchemize.co", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit profile", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Display name")).toHaveCount(0);
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(page.getByLabel("Display name")).toHaveValue("Alex Rivera");
  await expect(page.getByLabel("Login email")).toHaveValue("alex@alchemize.co");
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
      user_id: 1,
      id: "user-1",
      display_name: "Alex Rivera",
      email: "alex@alchemize.co",
      status: "active",
      role_name: "Owner / Administrator",
      role_slug: "owner-admin",
    },
    {
      user_id: 2,
      id: "user-2",
      display_name: "Morgan Lee",
      email: "morgan@alchemize.co",
      status: "active",
      role_name: "Administrator",
      role_slug: "administrator",
    },
    {
      user_id: 3,
      id: "user-3",
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
          user.user_id === payload.user_id
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
              user: teamUsers.find((user) => user.user_id === payload.user_id),
            },
          },
        });
      }
      return route.fulfill({ json: { data: teamUsers } });
    }
    if (path === "clients/team/invitations") {
      return route.fulfill({ json: { data: [] } });
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
    page.locator(".access-member strong", { hasText: "Alex Rivera" }),
  ).toBeVisible();
  await expect(
    page.locator(".access-member strong", { hasText: "Morgan Lee" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "+ Add administrator", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Role" })).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Access status" }),
  ).toHaveCount(0);

  await page
    .locator(".access-member", { hasText: "Morgan Lee" })
    .getByRole("button", { name: "Manage", exact: true })
    .click();
  // Not exact: a <label> wrapping a <select> computes its accessible name
  // as the label text plus the selected option's own text (e.g.
  // "RoleAdministrator"), so an exact match against "Role" never resolves.
  await page.getByLabel("Role").selectOption("staff");
  await page.getByLabel("Access status").selectOption("inactive");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();

  await expect(page.getByText("Access updated.")).toBeVisible();
  await expect(
    page.locator(".access-member strong", { hasText: "Morgan Lee" }),
  ).toBeVisible();
  await expect(
    page.locator(".access-member", { hasText: "Morgan Lee" }),
  ).toContainText("Inactive");
});

test("Team access supports adding an authorized administrator with a unique email", async ({
  page,
}) => {
  const teamUsers = [
    {
      user_id: 1,
      id: "user-1",
      display_name: "Alex Rivera",
      email: "alex@alchemize.co",
      status: "active",
      role_name: "Owner / Administrator",
      role_slug: "owner-admin",
    },
    {
      user_id: 2,
      id: "user-2",
      display_name: "Morgan Lee",
      email: "morgan@alchemize.co",
      status: "active",
      role_name: "Administrator",
      role_slug: "administrator",
    },
  ];
  let invitations = [];

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
      if (route.request().method() === "POST") {
        const payload = route.request().postDataJSON();
        invitations = [
          ...invitations,
          {
            user_id: 3,
            display_name: payload.display_name,
            email: payload.email,
            role_slug: payload.role_slug || "administrator",
            role_name: "Administrator",
            invited_at: "2026-09-14T20:00:00.000000Z",
            expires_at: "2026-09-17T20:00:00.000000Z",
            invitation_status: "pending",
          },
        ];
        return route.fulfill({
          json: {
            data: {
              expires_at: "2026-09-17T20:00:00.000000Z",
              email_delivery: "sent",
            },
          },
        });
      }
      return route.fulfill({ json: { data: teamUsers } });
    }
    if (path === "clients/team/invitations") {
      return route.fulfill({ json: { data: invitations } });
    }
    if (path === "portal-admin/attention") {
      return route.fulfill({ json: { data: { items: [] } } });
    }
    await route.fulfill({ json: { data: [] } });
  });

  await page.goto("/admin/settings?section=team-access");
  await page
    .getByRole("button", { name: "+ Add administrator", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Nina Patel");
  await page.getByLabel("Email", { exact: true }).fill("nina@alchemize.co");
  await page.getByLabel("Role").selectOption("administrator");
  await page
    .getByRole("button", { name: "Send invitation", exact: true })
    .click();
  await expect(
    page.getByText("Invitation sent. Access begins after password setup."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Pending invitations" }),
  ).toBeVisible();
  const invitationRow = page.locator("tr", { hasText: "Nina Patel" });
  await expect(invitationRow).toBeVisible();
  await expect(invitationRow).toContainText("nina@alchemize.co");
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

import { test, expect } from "@playwright/test";

const today = new Date().toLocaleDateString("en-CA");

async function mockAdmin(
  page,
  { meetingUrl = "", meetingMethod = "google_meet" } = {},
) {
  await page.route("**/alchemize-api.php?*", async (route) => {
    const key = new URL(route.request().url()).searchParams.get("route");
    let data = [];
    if (key === "auth/session")
      data = {
        authenticated: true,
        user: { user_id: 1, role_slug: "owner-admin" },
        csrf_token: "meet-test-token",
      };
    if (key === "clients")
      data = [{ id: 1, display_name: "Cedar Studio", status: "active" }];
    if (key === "appointments" && route.request().method() === "GET")
      data = [
        {
          id: 9,
          public_id: "appointment-9",
          client_id: 1,
          appointment_type: "consultation",
          scheduled_at: `${today} 10:00:00`,
          duration_minutes: 60,
          status: "confirmed",
          location_type: "virtual",
          meeting_method: meetingMethod,
          meeting_url: meetingUrl,
        },
      ];
    await route.fulfill({ json: { data } });
  });
}

const detail = (page) =>
  page.getByRole("complementary", { name: "Appointment detail" });

test("a Google Meet appointment with a real join link shows a clickable Join Google Meet button", async ({
  page,
}) => {
  await mockAdmin(page, { meetingUrl: "https://meet.google.com/abc-defg-hij" });
  await page.goto("/admin/appointments/");
  const link = detail(page).getByRole("link", { name: "Join Google Meet" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    "href",
    "https://meet.google.com/abc-defg-hij",
  );
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(detail(page)).toContainText("Meeting method");
  await expect(detail(page)).toContainText("Google Meet");
});

test("a Google Meet appointment with no join link yet shows a pending state, never a broken or blank link", async ({
  page,
}) => {
  await mockAdmin(page, { meetingUrl: "" });
  await page.goto("/admin/appointments/");
  await expect(detail(page)).toContainText("Meeting link pending");
  await expect(
    detail(page).getByRole("link", { name: "Join Google Meet" }),
  ).toHaveCount(0);
});

test("a non-Google-Meet appointment never shows a Join Google Meet control", async ({
  page,
}) => {
  await mockAdmin(page, { meetingMethod: "phone", meetingUrl: "" });
  await page.goto("/admin/appointments/");
  await expect(detail(page)).toContainText("Meeting method");
  await expect(detail(page)).not.toContainText("Join Google Meet");
  await expect(detail(page)).not.toContainText("Meeting link pending");
});

import { test, expect } from "@playwright/test";

test.describe("Admin prototype workflows", () => {
  test("converts a lead to a client in memory", async ({ page }) => {
    await page.goto("/admin/dashboard/");

    await page.evaluate(() => {
      window.adminStore.convertLeadToClient({
        leadId: "lead-003",
        clientType: "Business",
        email: "hello@northharbor.demo",
        phone: "(555) 881-2143",
        businessName: "North Harbor Studio",
        intendedService: "Business Formation & Startup",
        initialClientStatus: "Active",
        createEngagement: true,
      });
    });

    const outcome = await page.evaluate(() => {
      const lead = window.adminStore.state.leads.find(
        (item) => item.id === "lead-003",
      );
      const client = window.adminStore.state.clients.find(
        (item) => item.displayName === "North Harbor Studio",
      );
      const engagement = window.adminStore.state.engagements.find(
        (item) =>
          item.serviceName === "Business Formation & Startup" &&
          item.clientId === client?.id,
      );
      return {
        leadStatus: lead?.status,
        clientCount: window.adminStore.state.clients.length,
        engagementCreated: Boolean(engagement),
      };
    });

    expect(outcome.leadStatus).toBe("Converted");
    expect(outcome.clientCount).toBeGreaterThan(3);
    expect(outcome.engagementCreated).toBe(true);
  });

  test("creates a task and completes it in the admin state", async ({
    page,
  }) => {
    await page.goto("/admin/tasks/");

    await page.evaluate(() => {
      window.adminStore.createTask({
        title: "Prepare follow-up review",
        clientId: "client-002",
        engagementId: "eng-002",
        assignedTo: "Owner / Administrator",
        status: "In Progress",
        priority: "High",
        dueDate: "2026-02-22",
        description: "Prepare a follow-up summary for the current tax review.",
        serviceName: "Individual Tax Preparation",
      });

      const latest = window.adminStore.state.tasks[0];
      window.adminStore.completeTask(latest.id);
    });

    const snapshot = await page.evaluate(() => {
      const task = window.adminStore.state.tasks.find(
        (item) => item.title === "Prepare follow-up review",
      );
      return {
        created: Boolean(task),
        status: task?.status,
        completedTasks: window.adminStore.state.tasks.filter(
          (item) => item.status === "Completed",
        ).length,
      };
    });

    expect(snapshot.created).toBe(true);
    expect(snapshot.status).toBe("Completed");
    expect(snapshot.completedTasks).toBeGreaterThan(1);
  });

  test("requests a document and updates its status in-session", async ({
    page,
  }) => {
    await page.goto("/admin/documents/");

    await page.evaluate(() => {
      window.adminStore.createDocumentRequest({
        clientId: "client-001",
        engagementId: "eng-001",
        name: "Updated operating agreement draft",
        category: "Requested",
        status: "Requested",
        serviceName: "Business Formation & Startup",
        instructions:
          "Please upload the revised agreement draft for team review.",
        dueDate: "2026-02-25",
        reviewer: "Jordan Martin",
      });

      const latest = window.adminStore.state.documents[0];
      window.adminStore.updateDocumentStatus(latest.id, "Under Review");
    });

    const snapshot = await page.evaluate(() => {
      const doc = window.adminStore.state.documents.find(
        (item) => item.name === "Updated operating agreement draft",
      );
      return {
        exists: Boolean(doc),
        status: doc?.status,
      };
    });

    expect(snapshot.exists).toBe(true);
    expect(snapshot.status).toBe("Under Review");
  });

  test("resets the admin prototype after reload", async ({ page }) => {
    await page.goto("/admin/dashboard/");
    await page.evaluate(() => {
      window.adminStore.convertLeadToClient({
        leadId: "lead-004",
        clientType: "Individual",
        email: "renee.chavez.demo@example.com",
        phone: "(555) 206-1177",
        businessName: "",
        intendedService: "Insurance Review",
        initialClientStatus: "Onboarding",
        createEngagement: true,
      });
    });

    const beforeReload = await page.evaluate(
      () =>
        window.adminStore.state.leads.find((lead) => lead.id === "lead-004")
          ?.status,
    );
    expect(beforeReload).toBe("Converted");

    await page.reload();

    const afterReload = await page.evaluate(
      () =>
        window.adminStore.state.leads.find((lead) => lead.id === "lead-004")
          ?.status,
    );
    expect(afterReload).toBe("Contacted");
  });
});

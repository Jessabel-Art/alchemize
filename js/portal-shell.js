import { getPortalSnapshot } from "./data/mock-api.js";
import {
  adminStore,
  getAdminSnapshot,
  resetAdminPrototype,
} from "./data/admin-api.js";
import { serviceStageCatalog, staffOptions } from "./data/admin-store.js";

const clientNav = [
  { label: "Dashboard", href: "/client-portal/dashboard/" },
  { label: "My Services", href: "/client-portal/services/" },
  { label: "Tasks", href: "/client-portal/tasks/" },
  { label: "Documents", href: "/client-portal/documents/" },
  { label: "Appointments", href: "/client-portal/appointments/" },
  { label: "Messages", href: "/client-portal/messages/" },
  { label: "Billing", href: "/client-portal/billing/" },
  { label: "Profile", href: "/client-portal/profile/" },
];

const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard/" },
  { label: "Leads", href: "/admin/leads/" },
  { label: "Clients", href: "/admin/clients/" },
  { label: "Services", href: "/admin/services/" },
  { label: "Tasks", href: "/admin/tasks/" },
  { label: "Documents", href: "/admin/documents/" },
  { label: "Appointments", href: "/admin/appointments/" },
  { label: "Messages", href: "/admin/messages/" },
  { label: "Billing", href: "/admin/billing/" },
  { label: "Content", href: "/admin/content/" },
  { label: "Settings", href: "/admin/settings/" },
];

const appLogoUrl = "/assets/alchemize-logo-horizontal-dark-main-theme.png";

const statusToneMap = {
  "Waiting on Client": "status-badge--warning",
  "Waiting on Alchemize": "status-badge--neutral",
  "In Progress": "status-badge--info",
  Review: "status-badge--muted",
  Completed: "status-badge--success",
  Scheduled: "status-badge--neutral",
  Confirmed: "status-badge--success",
  "Past Due": "status-badge--warning",
  Open: "status-badge--warning",
  Paid: "status-badge--success",
  Draft: "status-badge--muted",
  Unread: "status-badge--info",
  Read: "status-badge--muted",
  Archived: "status-badge--muted",
  "Not Started": "status-badge--muted",
};

function normalizePath(pathname) {
  const cleaned = pathname.replace(/\/index\.html$/, "/");
  return cleaned === "" ? "/" : cleaned.endsWith("/") ? cleaned : `${cleaned}/`;
}

function isActive(currentPath, href) {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(href);
}

function formatDate(value) {
  if (!value || value === "null") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function badgeLabel(status) {
  return status || "Development preview";
}

function statusBadge(status) {
  const tone = statusToneMap[status] || "status-badge--muted";
  return `<span class="status-badge ${tone}">${badgeLabel(status)}</span>`;
}

function renderEmptyState(title, body) {
  return `
    <div class="empty-state">
      <strong>${title}</strong>
      <p>${body}</p>
    </div>
  `;
}

function renderAuthShell() {
  const root = document.getElementById("portal-app");
  if (!root) return;

  const isRegister = window.location.pathname.startsWith("/register/");
  const isLogin = window.location.pathname.startsWith("/login/");

  const title = isRegister ? "Create Portal Access" : "Client and Admin Access";
  const subtitle = isRegister
    ? "New clients begin through an established consultation relationship. Portal access is provided after the client relationship is confirmed."
    : "Secure access is not connected yet. This preview page is now being prepared for future client and staff workflows.";

  const actionText = isRegister ? "Return to contact" : "Return to website";
  const actionHref = isRegister ? "/contact/" : "/";

  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand">
          <a href="/" aria-label="Return to Alchemize home">
            <img src="${appLogoUrl}" alt="Alchemize Business Services" />
          </a>
        </div>
        <div class="auth-status">
          <span class="status-badge status-badge--neutral">Secure access preview</span>
        </div>
        <h1>${title}</h1>
        <p class="auth-subtitle">${subtitle}</p>
        ${
          isLogin
            ? `
              <form class="auth-form" action="/login/" method="get" novalidate>
                <label>
                  <span>Email</span>
                  <input type="email" name="email" placeholder="name@example.com" disabled />
                </label>
                <label>
                  <span>Password</span>
                  <input type="password" name="password" placeholder="••••••••" disabled />
                </label>
                <div class="auth-row">
                  <a href="/register/" class="text-link">Create access</a>
                  <a href="/contact/" class="text-link">Need help?</a>
                </div>
                <button type="submit" class="button button--primary" disabled>Sign In</button>
                <p class="auth-note">Authentication is not connected yet.</p>
              </form>
            `
            : `
              <div class="auth-form">
                <p class="panel-copy">Portal access is prepared for established client relationships only.</p>
                <div class="auth-row auth-row--stacked">
                  <a href="/contact/" class="button button--primary">Schedule a Consultation</a>
                  <a href="/login/" class="button button--secondary">View sign-in preview</a>
                </div>
                <p class="auth-note">No account creation is being simulated. This page is an interface shell for future onboarding.</p>
              </div>
            `
        }
        <div class="auth-footer">
          <a href="${actionHref}">${actionText}</a>
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
        </div>
      </div>
    </div>
  `;
}

function routeTitle(pathname, isAdmin) {
  const routeMap = {
    "/client-portal/": "Your Alchemize workspace",
    "/client-portal/dashboard/": "Dashboard",
    "/client-portal/services/": "My Services",
    "/client-portal/tasks/": "Tasks",
    "/client-portal/documents/": "Documents",
    "/client-portal/appointments/": "Appointments",
    "/client-portal/messages/": "Messages",
    "/client-portal/billing/": "Billing",
    "/client-portal/profile/": "Profile",
    "/admin/": "Administration",
    "/admin/dashboard/": "Dashboard",
    "/admin/leads/": "Lead Pipeline",
    "/admin/clients/": "Client Management",
    "/admin/services/": "Service Management",
    "/admin/tasks/": "Task Management",
    "/admin/documents/": "Document Review",
    "/admin/appointments/": "Appointments",
    "/admin/messages/": "Messages",
    "/admin/billing/": "Billing",
    "/admin/content/": "Content Management",
    "/admin/settings/": "Settings",
  };

  return (
    routeMap[pathname] ||
    (isAdmin ? "Administration" : "Your Alchemize workspace")
  );
}

function renderSummaryCards(items) {
  return `
    <div class="summary-card-group">
      ${items
        .map(
          (item) => `
            <div class="summary-card">
              <span class="summary-card__value">${item.value}</span>
              <span class="summary-card__label">${item.label}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderClientDashboard(snapshot) {
  const {
    client,
    engagements,
    tasks,
    documents,
    appointments,
    notifications,
    activity,
  } = snapshot;
  const activeEngagements = engagements.filter(
    (engagement) => !["Completed", "Archived"].includes(engagement.status),
  );
  const urgentTasks = tasks
    .filter((task) =>
      ["Waiting on Client", "In Progress", "Not Started"].includes(task.status),
    )
    .slice(0, 3);
  const docsRequested = documents.filter((document) =>
    ["Requested", "Awaiting Upload", "Received", "Under Review"].includes(
      document.status,
    ),
  );
  const upcoming = appointments
    .filter((appointment) => appointment.status !== "Completed")
    .slice(0, 3);

  return `
    <div class="portal-section">
      <div class="workspace-header panel">
        <div>
          <p class="eyebrow eyebrow--small">Welcome</p>
          <h2>${client.displayName}</h2>
          <p class="workspace-subtitle">${client.associatedBusiness} · ${client.primaryRole} · ${client.portalStatus}</p>
        </div>
        <div class="workspace-meta">
          <span class="meta-chip">Account status: ${client.accountStatus}</span>
          <span class="meta-chip">Last login: ${client.lastLogin}</span>
        </div>
      </div>
    </div>

    <div class="portal-section">
      ${renderSummaryCards([
        { value: String(activeEngagements.length), label: "Active services" },
        { value: String(urgentTasks.length), label: "Needs attention" },
        { value: String(docsRequested.length), label: "Documents requested" },
        { value: String(upcoming.length), label: "Upcoming" },
      ])}
    </div>

    <div class="portal-section">
      <div class="section-header">
        <h2>Needs your attention</h2>
        <a class="text-link" href="/client-portal/tasks/">View all tasks</a>
      </div>
      <div class="task-grid">
        ${
          urgentTasks
            .map(
              (task) => `
              <div class="task-item">
                <div class="task-item__top">
                  <h3>${task.title}</h3>
                  ${statusBadge(task.status)}
                </div>
                <p>${task.description}</p>
                <div class="meta-row">
                  <span class="meta-chip">${task.serviceName}</span>
                  <span class="meta-chip">Due ${formatDate(task.dueDate)}</span>
                  <span class="meta-chip">${task.assignedTo}</span>
                </div>
              </div>
            `,
            )
            .join("") ||
          renderEmptyState(
            "You’re all caught up",
            "There are no outstanding action items in the current demo state.",
          )
        }
      </div>
    </div>

    <div class="portal-section">
      <div class="section-header">
        <h2>Documents requested</h2>
        <a class="text-link" href="/client-portal/documents/">Open document center</a>
      </div>
      <div class="document-grid">
        ${
          docsRequested
            .slice(0, 4)
            .map(
              (document) => `
              <div class="document-card">
                <h3 class="document-name">${document.name}</h3>
                <p>${document.serviceName}</p>
                <div class="meta-row">
                  <span class="meta-chip">${document.category}</span>
                  <span class="meta-chip">${document.status}</span>
                </div>
              </div>
            `,
            )
            .join("") ||
          renderEmptyState(
            "No documents are currently waiting on you",
            "When a document request is created, it will appear here.",
          )
        }
      </div>
    </div>

    <div class="portal-section">
      <div class="section-header">
        <h2>Upcoming</h2>
        <a class="text-link" href="/client-portal/appointments/">Review appointments</a>
      </div>
      <div class="list-stack">
        ${
          upcoming
            .map(
              (appointment) => `
              <div class="list-row list-row--stacked">
                <div>
                  <div class="list-label">${appointment.title}</div>
                  <div class="list-meta">${appointment.serviceName} · ${appointment.type}</div>
                </div>
                <div class="list-meta-right">
                  <div>${formatDate(appointment.date)} · ${appointment.time}</div>
                  ${statusBadge(appointment.status)}
                </div>
              </div>
            `,
            )
            .join("") ||
          renderEmptyState(
            "No upcoming appointments",
            "No meetings are currently scheduled in this demo view.",
          )
        }
      </div>
    </div>

    <div class="portal-section">
      <div class="section-header">
        <h2>Active services</h2>
        <a class="text-link" href="/client-portal/services/">Manage services</a>
      </div>
      <div class="document-grid">
        ${activeEngagements
          .slice(0, 4)
          .map(
            (engagement) => `
              <div class="document-card">
                <div class="service-card__header">
                  <h3>${engagement.serviceName}</h3>
                  ${statusBadge(engagement.status)}
                </div>
                <p>${engagement.currentStage}</p>
                <div class="meta-row">
                  <span class="meta-chip">${engagement.checklistProgress.completed}/${engagement.checklistProgress.total} checklist items</span>
                  <span class="meta-chip">${engagement.taskCount} tasks</span>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>

    <div class="portal-section two-col-grid">
      <div class="panel">
        <div class="section-header">
          <h2>Recent updates</h2>
          <a class="text-link" href="/client-portal/messages/">Open messages</a>
        </div>
        <div class="activity-list">
          ${notifications
            .slice(0, 4)
            .map(
              (notification) => `
                <div class="activity-item">
                  <span class="activity-dot"></span>
                  <div>
                    <strong>${notification.title}</strong>
                    <p>${notification.timestamp}</p>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>

      <div class="panel">
        <div class="section-header">
          <h2>Quick actions</h2>
        </div>
        <div class="quick-action-grid">
          <a class="button button--secondary" href="/client-portal/tasks/">View tasks</a>
          <a class="button button--secondary" href="/client-portal/documents/">View documents</a>
          <a class="button button--secondary" href="/client-portal/appointments/">View appointments</a>
          <a class="button button--primary" href="/contact/">Contact Alchemize</a>
        </div>
      </div>
    </div>

    <div class="portal-section">
      <div class="section-header">
        <h2>Recent activity</h2>
      </div>
      <div class="activity-list">
        ${activity
          .slice(0, 4)
          .map(
            (item) => `
              <div class="activity-item">
                <span class="activity-dot"></span>
                <div>
                  <strong>${item.title}</strong>
                  <p>${item.detail}</p>
                  <small>${formatDate(item.timestamp)}</small>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderServicesPage(snapshot) {
  const { engagements } = snapshot;
  const active = engagements.filter(
    (engagement) => !["Completed", "Archived"].includes(engagement.status),
  );
  const completed = engagements.filter(
    (engagement) => engagement.status === "Completed",
  );
  const archived = engagements.filter(
    (engagement) => engagement.status === "Archived",
  );

  const renderEngagementCard = (engagement) => `
    <div class="service-card panel">
      <div class="service-card__header">
        <h3>${engagement.serviceName}</h3>
        ${statusBadge(engagement.status)}
      </div>
      <div class="service-meta-row">
        <span>${engagement.audience}</span>
        <span>Current stage: ${engagement.currentStage}</span>
      </div>
      <p>${engagement.summary}</p>
      <div class="meta-row">
        <span class="meta-chip">Checklist: ${engagement.checklistProgress.completed}/${engagement.checklistProgress.total}</span>
        <span class="meta-chip">Tasks: ${engagement.taskCount}</span>
        <span class="meta-chip">Next: ${engagement.nextAction}</span>
      </div>
      <details class="service-detail">
        <summary>View service details</summary>
        <div class="detail-panel">
          <div>
            <h4>What Alchemize is working on</h4>
            <p>${engagement.notes}</p>
          </div>
          <div>
            <h4>What we need from you</h4>
            <p>${engagement.nextAction}</p>
          </div>
          <div>
            <h4>Checklist</h4>
            <p>${engagement.checklistLabel}</p>
          </div>
          <div>
            <h4>Appointment</h4>
            <p>${engagement.appointmentLabel}</p>
          </div>
        </div>
      </details>
    </div>
  `;

  return `
    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Active services</h2>
          <span class="status-badge status-badge--neutral">Current engagement view</span>
        </div>
        <div class="service-list">
          ${active.map(renderEngagementCard).join("") || renderEmptyState("No active services", "You do not currently have an active Alchemize service engagement.")}
        </div>
      </div>
    </div>

    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Completed services</h2>
          <span class="status-badge status-badge--success">Completed</span>
        </div>
        <div class="service-list">
          ${completed.map(renderEngagementCard).join("") || renderEmptyState("No completed services", "Completed engagements will remain visible here for reference.")}
        </div>
      </div>
    </div>

    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Past / archived</h2>
          <span class="status-badge status-badge--muted">Archive</span>
        </div>
        <div class="service-list">
          ${archived.map(renderEngagementCard).join("") || renderEmptyState("No archived services", "Archived service references will appear here when they are retained for future review.")}
        </div>
      </div>
    </div>
  `;
}

function renderTasksPage(snapshot) {
  const { tasks } = snapshot;
  const grouped = {
    "Waiting on Client": tasks.filter(
      (task) => task.status === "Waiting on Client",
    ),
    "In Progress": tasks.filter((task) => task.status === "In Progress"),
    "Not Started": tasks.filter((task) => task.status === "Not Started"),
    Completed: tasks.filter((task) => task.status === "Completed"),
  };

  const renderTaskList = (key, items) => `
    <div class="panel">
      <div class="section-header">
        <h3>${key}</h3>
        <span class="status-badge ${statusToneMap[key] || "status-badge--muted"}">${items.length}</span>
      </div>
      <div class="task-list">
        ${
          items
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .map(
              (task) => `
              <div class="task-row">
                <div>
                  <div class="list-label">${task.title}</div>
                  <div class="list-meta">${task.serviceName} · ${task.category} · ${task.assignedTo}</div>
                </div>
                <div class="task-row__meta">
                  <div class="list-meta">Due ${formatDate(task.dueDate)}</div>
                  ${statusBadge(task.status)}
                </div>
              </div>
            `,
            )
            .join("") ||
          `<div class="empty-state compact"><strong>No items</strong><p>Nothing is currently in this status group.</p></div>`
        }
      </div>
    </div>
  `;

  return `
    <div class="portal-section">
      <div class="section-header">
        <h2>Task status</h2>
        <span class="status-badge status-badge--neutral">Sorted by due date</span>
      </div>
      <div class="two-col-grid">
        ${["Waiting on Client", "In Progress", "Not Started", "Completed"]
          .map((key) => renderTaskList(key, grouped[key] || []))
          .join("")}
      </div>
    </div>
  `;
}

function renderDocumentsPage(snapshot) {
  const { documents } = snapshot;
  const categories = {
    Requested: documents.filter(
      (document) => document.category === "Requested",
    ),
    Uploaded: documents.filter((document) => document.category === "Uploaded"),
    "Shared by Alchemize": documents.filter(
      (document) => document.category === "Shared by Alchemize",
    ),
    "Completed / Archived": documents.filter(
      (document) => document.category === "Completed / Archived",
    ),
  };

  return `
    <div class="portal-section">
      <div class="section-header">
        <h2>Document center</h2>
        <span class="status-badge status-badge--neutral">Secure access preview</span>
      </div>
      <div class="portal-note">
        Sensitive documents should only be submitted through the future secure portal once upload functionality is connected. The current interface is prototype-only and is not a secure upload workflow.
      </div>
    </div>

    <div class="portal-section">
      <div class="document-grid">
        ${Object.entries(categories)
          .map(
            ([category, items]) => `
              <div class="panel">
                <div class="section-header">
                  <h3>${category}</h3>
                  <span class="status-badge status-badge--muted">${items.length}</span>
                </div>
                <div class="task-list">
                  ${
                    items.length
                      ? items
                          .map(
                            (document) => `
                            <div class="task-row">
                              <div>
                                <div class="list-label">${document.name}</div>
                                <div class="list-meta">${document.serviceName}</div>
                              </div>
                              <div class="task-row__meta">
                                <div class="list-meta">${document.status}</div>
                                ${document.category === "Requested" ? '<button class="button button--secondary" disabled>Upload Document</button>' : ""}
                              </div>
                            </div>
                          `,
                          )
                          .join("")
                      : renderEmptyState(
                          "No documents",
                          "No records are currently in this category.",
                        )
                  }
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderAppointmentsPage(snapshot) {
  const { appointments } = snapshot;
  const upcoming = appointments.filter(
    (appointment) => appointment.status !== "Completed",
  );
  const past = appointments.filter(
    (appointment) => appointment.status === "Completed",
  );

  const appointmentDetail = upcoming[0] || appointments[0];

  return `
    <div class="portal-section">
      <div class="section-header">
        <h2>Appointments</h2>
        <span class="status-badge status-badge--neutral">Demo schedule</span>
      </div>
      <div class="two-col-grid">
        <div class="panel">
          <div class="section-header">
            <h3>Upcoming</h3>
          </div>
          <div class="task-list">
            ${
              upcoming
                .map(
                  (appointment) => `
                  <div class="task-row">
                    <div>
                      <div class="list-label">${appointment.title}</div>
                      <div class="list-meta">${appointment.serviceName} · ${appointment.type}</div>
                    </div>
                    <div class="task-row__meta">
                      <div class="list-meta">${formatDate(appointment.date)} · ${appointment.time}</div>
                      ${statusBadge(appointment.status)}
                    </div>
                  </div>
                `,
                )
                .join("") ||
              renderEmptyState(
                "No upcoming appointments",
                "You do not have any upcoming appointments in this demo snapshot.",
              )
            }
          </div>
        </div>

        <div class="panel">
          <div class="section-header">
            <h3>Past</h3>
          </div>
          <div class="task-list">
            ${
              past
                .map(
                  (appointment) => `
                  <div class="task-row">
                    <div>
                      <div class="list-label">${appointment.title}</div>
                      <div class="list-meta">${appointment.serviceName}</div>
                    </div>
                    <div class="task-row__meta">
                      <div class="list-meta">${formatDate(appointment.date)}</div>
                      ${statusBadge(appointment.status)}
                    </div>
                  </div>
                `,
                )
                .join("") ||
              renderEmptyState(
                "No past appointments",
                "Past meetings will appear here when the workflow is live.",
              )
            }
          </div>
        </div>
      </div>
    </div>

    ${
      appointmentDetail
        ? `
      <div class="portal-section">
        <div class="panel detail-panel">
          <div class="section-header">
            <h2>${appointmentDetail.title}</h2>
            ${statusBadge(appointmentDetail.status)}
          </div>
          <div class="two-col-grid">
            <div>
              <h4>Purpose</h4>
              <p>Related service: ${appointmentDetail.serviceName}</p>
              <p>Location: ${appointmentDetail.location}</p>
            </div>
            <div>
              <h4>Preparation checklist</h4>
              <ul>
                ${appointmentDetail.preparation.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
        : ""
    }
  `;
}

function renderMessagesPage(snapshot) {
  const { messages } = snapshot;
  const threads = Object.values(
    messages.reduce((accumulator, message) => {
      if (!accumulator[message.threadId]) {
        accumulator[message.threadId] = [];
      }
      accumulator[message.threadId].push(message);
      return accumulator;
    }, {}),
  );

  const selectedThread = threads[0] || [];

  return `
    <div class="portal-section">
      <div class="messages-layout panel">
        <div class="message-list">
          <div class="section-header">
            <h2>Conversation list</h2>
          </div>
          ${threads
            .map(
              (thread) => `
                <div class="message-thread-item ${thread[0].status === "Unread" ? "is-unread" : ""}">
                  <strong>${thread[0].subject}</strong>
                  <span>${thread[0].senderType === "alchemize" ? "Alchemize" : "Client"}</span>
                  <small>${formatDate(thread[0].sentAt)}</small>
                </div>
              `,
            )
            .join("")}
        </div>

        <div class="message-thread">
          <div class="section-header">
            <h2>${selectedThread[0] ? selectedThread[0].subject : "No messages yet"}</h2>
          </div>
          ${
            selectedThread.length
              ? selectedThread
                  .map(
                    (message) => `
                    <div class="message-bubble ${message.senderType === "alchemize" ? "message-bubble--staff" : "message-bubble--client"}">
                      <strong>${message.senderType === "alchemize" ? "Alchemize team" : "You"}</strong>
                      <p>${message.body}</p>
                      <small>${formatDate(message.sentAt)}</small>
                    </div>
                  `,
                  )
                  .join("")
              : renderEmptyState(
                  "No messages yet",
                  "Secure communication will appear here after the message workflow is connected.",
                )
          }
          <div class="message-composer">
            <textarea placeholder="Compose a prototype message" rows="3" disabled></textarea>
            <button class="button button--primary" disabled>Send</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBillingPage(snapshot) {
  const { invoices, payments } = snapshot;

  return `
    <div class="portal-section">
      <div class="section-header">
        <h2>Outstanding</h2>
        <span class="status-badge status-badge--neutral">Demo billing only</span>
      </div>
      <div class="billing-grid">
        <div class="panel">
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                ${invoices
                  .map(
                    (invoice) => `
                      <tr>
                        <td>#${invoice.id}</td>
                        <td>${invoice.service}</td>
                        <td>$${invoice.amount.toLocaleString("en-US")}</td>
                        <td>${statusBadge(invoice.status)}</td>
                        <td>${formatDate(invoice.dueAt)}</td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="portal-section two-col-grid">
      <div class="panel">
        <div class="section-header">
          <h2>Payments</h2>
        </div>
        <div class="task-list">
          ${
            payments
              .map(
                (payment) => `
                <div class="task-row">
                  <div>
                    <div class="list-label">Payment #${payment.id}</div>
                    <div class="list-meta">${payment.methodLabel}</div>
                  </div>
                  <div class="task-row__meta">
                    <div class="list-meta">$${payment.amount.toLocaleString("en-US")}</div>
                    <span class="status-badge status-badge--success">Received</span>
                  </div>
                </div>
              `,
              )
              .join("") ||
            renderEmptyState(
              "No billing activity",
              "No payments are currently recorded in the mock dataset.",
            )
          }
        </div>
      </div>

      <div class="panel">
        <div class="section-header">
          <h2>Receipts</h2>
        </div>
        <div class="task-list">
          <div class="empty-state compact">
            <strong>Receipt access</strong>
            <p>Receipt and invoice downloads will appear here once secure storage and document access are connected.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProfilePage(snapshot) {
  const { client } = snapshot;
  return `
    <div class="portal-section two-col-grid">
      <div class="panel">
        <div class="section-header">
          <h2>Personal information</h2>
        </div>
        <div class="profile-info-list">
          <div class="profile-row"><span>Name</span><strong>${client.displayName}</strong></div>
          <div class="profile-row"><span>Email</span><strong>${client.email}</strong></div>
          <div class="profile-row"><span>Phone</span><strong>${client.phone}</strong></div>
          <div class="profile-row"><span>Preferred contact</span><strong>${client.preferredContactMethod}</strong></div>
        </div>
      </div>

      <div class="panel">
        <div class="section-header">
          <h2>Associated business</h2>
        </div>
        <div class="profile-info-list">
          <div class="profile-row"><span>Business</span><strong>${client.associatedBusiness}</strong></div>
          <div class="profile-row"><span>Role</span><strong>${client.primaryRole}</strong></div>
          <div class="profile-row"><span>Client type</span><strong>${client.clientType}</strong></div>
          <div class="profile-row"><span>Portal status</span><strong>${client.portalStatus}</strong></div>
        </div>
      </div>
    </div>

    <div class="portal-section two-col-grid">
      <div class="panel">
        <div class="section-header">
          <h2>Notification preferences</h2>
        </div>
        <div class="task-list">
          <div class="task-row"><div><div class="list-label">Task reminders</div></div><span class="status-badge status-badge--neutral">Enabled</span></div>
          <div class="task-row"><div><div class="list-label">Document updates</div></div><span class="status-badge status-badge--neutral">Enabled</span></div>
          <div class="task-row"><div><div class="list-label">Billing notices</div></div><span class="status-badge status-badge--neutral">Enabled</span></div>
        </div>
      </div>

      <div class="panel">
        <div class="section-header">
          <h2>Security</h2>
        </div>
        <div class="task-list">
          <div class="task-row"><div><div class="list-label">Authentication</div><div class="list-meta">Future secure sign-in flow</div></div><span class="status-badge status-badge--muted">Preview</span></div>
          <div class="task-row"><div><div class="list-label">MFA</div><div class="list-meta">Required for privileged access</div></div><span class="status-badge status-badge--muted">Future</span></div>
          <div class="task-row"><div><div class="list-label">Session handling</div><div class="list-meta">Backend-managed</div></div><span class="status-badge status-badge--muted">Future</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderAdminDashboard(snapshot) {
  const {
    leads,
    clients,
    engagements,
    tasks,
    documents,
    appointments,
    messages,
    invoices,
    activity,
  } = snapshot;
  const openInquiries = leads.filter((lead) =>
    ["New", "Contacted", "Consultation Requested"].includes(lead.status),
  ).length;
  const waitingOnClient = tasks.filter(
    (task) => task.status === "Waiting on Client",
  ).length;
  const overdueTasks = tasks.filter(
    (task) =>
      task.status !== "Completed" && new Date(task.dueDate) < new Date(),
  ).length;
  const documentsAwaitingReview = documents.filter((document) =>
    ["Awaiting Upload", "Received", "Under Review", "Requested"].includes(
      document.status,
    ),
  ).length;
  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.status !== "Completed",
  ).length;
  const pastDueInvoices = invoices.filter(
    (invoice) => invoice.status === "Past Due",
  ).length;
  const needsAttention = [
    { label: "New consultation requests", value: String(openInquiries) },
    { label: "Overdue internal tasks", value: String(overdueTasks) },
    { label: "Clients waiting on Alchemize", value: String(waitingOnClient) },
    {
      label: "Documents awaiting review",
      value: String(documentsAwaitingReview),
    },
    { label: "Upcoming appointments", value: String(upcomingAppointments) },
    { label: "Past-due invoices", value: String(pastDueInvoices) },
  ];

  return `
    <div class="portal-section">
      <div class="workspace-header panel">
        <div>
          <p class="eyebrow eyebrow--small">Operations overview</p>
          <h2>Needs attention</h2>
          <p class="workspace-subtitle">What needs action today across the Alchemize operation.</p>
        </div>
        <div class="workspace-meta">
          <span class="meta-chip">${clients.length} active clients</span>
          <span class="meta-chip">${engagements.length} engagement records</span>
        </div>
      </div>
    </div>

    <div class="portal-section">
      ${renderSummaryCards(needsAttention)}
    </div>

    <div class="portal-section two-col-grid">
      <div class="panel">
        <div class="section-header">
          <h2>Attention queue</h2>
          <a class="text-link" href="/admin/tasks/">Open task queue</a>
        </div>
        <div class="task-list">
          ${
            tasks
              .filter((task) => task.status !== "Completed")
              .slice(0, 5)
              .map(
                (task) => `
                <div class="task-row">
                  <div>
                    <div class="list-label">${task.title}</div>
                    <div class="list-meta">${task.serviceName} · ${task.assignedTo}</div>
                  </div>
                  <div class="task-row__meta">
                    <div class="list-meta">Due ${formatDate(task.dueDate)}</div>
                    ${statusBadge(task.status)}
                  </div>
                </div>
              `,
              )
              .join("") ||
            renderEmptyState(
              "No active work",
              "There are no priority tasks in the current mock queue.",
            )
          }
        </div>
      </div>

      <div class="panel">
        <div class="section-header">
          <h2>Quick actions</h2>
        </div>
        <div class="quick-action-grid">
          <a class="button button--secondary" href="/admin/leads/">View leads</a>
          <a class="button button--secondary" href="/admin/clients/">View clients</a>
          <a class="button button--secondary" href="/admin/tasks/">View tasks</a>
          <a class="button button--secondary" href="/admin/documents/">View documents</a>
          <a class="button button--secondary" href="/admin/appointments/">View appointments</a>
          <a class="button button--primary" href="/admin/messages/">Review messages</a>
        </div>
      </div>
    </div>

    <div class="portal-section">
      <div class="section-header">
        <h2>Upcoming activity</h2>
        <a class="text-link" href="/admin/appointments/">View appointments</a>
      </div>
      <div class="document-grid">
        ${
          appointments
            .filter((appointment) => appointment.status !== "Completed")
            .slice(0, 4)
            .map(
              (appointment) => `
              <div class="document-card">
                <h3>${appointment.title}</h3>
                <p>${appointment.serviceName}</p>
                <div class="meta-row">
                  <span class="meta-chip">${appointment.type}</span>
                  <span class="meta-chip">${appointment.status}</span>
                  <span class="meta-chip">${formatDate(appointment.date)}</span>
                </div>
              </div>
            `,
            )
            .join("") ||
          renderEmptyState(
            "No upcoming appointments",
            "No upcoming consultations or meetings are currently scheduled.",
          )
        }
      </div>
    </div>

    <div class="portal-section two-col-grid">
      <div class="panel">
        <div class="section-header">
          <h2>Recent activity</h2>
        </div>
        <div class="activity-list">
          ${activity
            .slice(0, 6)
            .map(
              (item) => `
                <div class="activity-item">
                  <span class="activity-dot"></span>
                  <div>
                    <strong>${item.eventType}</strong>
                    <p>${item.detail}</p>
                    <small>${item.target} · ${formatDate(item.timestamp)}</small>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>

      <div class="panel">
        <div class="section-header">
          <h2>Message queue</h2>
          <a class="text-link" href="/admin/messages/">Review inbox</a>
        </div>
        <div class="task-list">
          ${
            messages
              .slice(0, 4)
              .map(
                (message) => `
                <div class="task-row">
                  <div>
                    <div class="list-label">${message.subject}</div>
                    <div class="list-meta">${message.senderType === "alchemize" ? "Alchemize" : "Client"}</div>
                  </div>
                  <div class="task-row__meta">
                    <span class="status-badge ${message.status === "Unread" ? "status-badge--info" : "status-badge--muted"}">${message.status}</span>
                  </div>
                </div>
              `,
              )
              .join("") ||
            renderEmptyState(
              "No messages",
              "No communications currently require attention.",
            )
          }
        </div>
      </div>
    </div>
  `;
}

function renderLeadsPage(snapshot) {
  const { leads } = snapshot;
  return `
    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Lead pipeline</h2>
          <span class="status-badge status-badge--neutral">Consultation intake</span>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Service</th>
                <th>Source</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              ${
                leads
                  .map(
                    (lead) => `
                    <tr>
                      <td>${lead.name}</td>
                      <td>${lead.serviceInterest}</td>
                      <td>${lead.source}</td>
                      <td>${statusBadge(lead.status)}</td>
                      <td>${lead.assignedTo}</td>
                      <td>${lead.nextAction}</td>
                    </tr>
                  `,
                  )
                  .join("") ||
                `<tr><td colspan="6">No leads available in this demo state.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderClientsPage(snapshot) {
  const { clients } = snapshot;
  return `
    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Client directory</h2>
          <span class="status-badge status-badge--neutral">Search and filter-ready</span>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Services</th>
                <th>Status</th>
                <th>Last activity</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              ${
                clients
                  .map(
                    (client) => `
                    <tr>
                      <td>${client.displayName}</td>
                      <td>${client.clientType}</td>
                      <td>${client.activeServices}</td>
                      <td>${statusBadge(client.status)}</td>
                      <td>${formatDate(client.lastActivity)}</td>
                      <td>${client.nextAction}</td>
                    </tr>
                  `,
                  )
                  .join("") || `<tr><td colspan="6">No clients found.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAdminServicesPage(snapshot) {
  const { engagements } = snapshot;
  return `
    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Engagement management</h2>
          <span class="status-badge status-badge--neutral">Operational service view</span>
        </div>
        <div class="service-list">
          ${
            engagements
              .map(
                (engagement) => `
                <div class="service-card">
                  <div class="service-card__header">
                    <h3>${engagement.serviceName}</h3>
                    ${statusBadge(engagement.status)}
                  </div>
                  <div class="service-meta-row">
                    <span>${engagement.clientId}</span>
                    <span>${engagement.currentStage}</span>
                  </div>
                  <p>${engagement.summary}</p>
                  <div class="meta-row">
                    <span class="meta-chip">Assigned: ${engagement.assignedTo}</span>
                    <span class="meta-chip">Checklist: ${engagement.checklist}</span>
                    <span class="meta-chip">Next: ${engagement.nextAction}</span>
                  </div>
                </div>
              `,
              )
              .join("") ||
            renderEmptyState(
              "No engagements",
              "There are no active engagement records in this prototype state.",
            )
          }
        </div>
      </div>
    </div>
  `;
}

function renderAdminTasksPage(snapshot) {
  const { tasks } = snapshot;
  const grouped = {
    "Not Started": tasks.filter((task) => task.status === "Not Started"),
    "In Progress": tasks.filter((task) => task.status === "In Progress"),
    "Waiting on Client": tasks.filter(
      (task) => task.status === "Waiting on Client",
    ),
    Completed: tasks.filter((task) => task.status === "Completed"),
  };

  return `
    <div class="portal-section">
      <div class="section-header">
        <h2>Task board</h2>
        <span class="status-badge status-badge--neutral">Filter-ready board</span>
      </div>
      <div class="two-col-grid">
        ${["Not Started", "In Progress", "Waiting on Client", "Completed"]
          .map(
            (status) => `
              <div class="panel">
                <div class="section-header">
                  <h3>${status}</h3>
                  <span class="status-badge ${statusToneMap[status] || "status-badge--muted"}">${grouped[status].length}</span>
                </div>
                <div class="task-list">
                  ${
                    grouped[status]
                      .map(
                        (task) => `
                        <div class="task-row">
                          <div>
                            <div class="list-label">${task.title}</div>
                            <div class="list-meta">${task.serviceName} · ${task.assignedTo}</div>
                          </div>
                          <div class="task-row__meta">
                            <div class="list-meta">Due ${formatDate(task.dueDate)}</div>
                            ${statusBadge(task.status)}
                          </div>
                        </div>
                      `,
                      )
                      .join("") ||
                    `<div class="empty-state compact"><strong>No items</strong><p>No tasks in this status.</p></div>`
                  }
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderAdminDocumentsPage(snapshot) {
  const { documents } = snapshot;
  const groups = {
    "Awaiting Client": documents.filter((document) =>
      ["Requested", "Awaiting Upload"].includes(document.status),
    ),
    Received: documents.filter((document) => document.status === "Received"),
    "Needs Review": documents.filter(
      (document) => document.status === "Under Review",
    ),
    "Shared / Completed": documents.filter((document) =>
      ["Shared", "Archived"].includes(document.status),
    ),
  };

  return `
    <div class="portal-section">
      <div class="section-header">
        <h2>Document review queue</h2>
        <span class="status-badge status-badge--neutral">Operational review flow</span>
      </div>
      <div class="document-grid">
        ${Object.entries(groups)
          .map(
            ([group, items]) => `
              <div class="panel">
                <div class="section-header">
                  <h3>${group}</h3>
                  <span class="status-badge status-badge--muted">${items.length}</span>
                </div>
                <div class="task-list">
                  ${
                    items.length
                      ? items
                          .map(
                            (document) => `
                            <div class="task-row">
                              <div>
                                <div class="list-label">${document.name}</div>
                                <div class="list-meta">${document.serviceName} · ${document.assignedReviewer || "Unassigned"}</div>
                              </div>
                              <div class="task-row__meta">
                                <div class="list-meta">${document.status}</div>
                              </div>
                            </div>
                          `,
                          )
                          .join("")
                      : `<div class="empty-state compact"><strong>No documents</strong><p>No records are currently in this stage.</p></div>`
                  }
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderAdminAppointmentsPage(snapshot) {
  const { appointments } = snapshot;
  return `
    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Appointment agenda</h2>
          <span class="status-badge status-badge--neutral">Today + upcoming</span>
        </div>
        <div class="task-list">
          ${
            appointments
              .map(
                (appointment) => `
                <div class="task-row">
                  <div>
                    <div class="list-label">${appointment.title}</div>
                    <div class="list-meta">${appointment.serviceName} · ${appointment.type}</div>
                  </div>
                  <div class="task-row__meta">
                    <div class="list-meta">${formatDate(appointment.date)} · ${appointment.time}</div>
                    ${statusBadge(appointment.status)}
                  </div>
                </div>
              `,
              )
              .join("") ||
            renderEmptyState(
              "No appointments",
              "No consultation or service appointments are recorded yet.",
            )
          }
        </div>
      </div>
    </div>
  `;
}

function renderAdminMessagesPage(snapshot) {
  const { messages } = snapshot;
  return `
    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Message queue</h2>
          <span class="status-badge status-badge--neutral">Unread and needs response</span>
        </div>
        <div class="task-list">
          ${
            messages
              .map(
                (message) => `
                <div class="task-row">
                  <div>
                    <div class="list-label">${message.subject}</div>
                    <div class="list-meta">${message.senderType === "alchemize" ? "Alchemize" : "Client"} · ${formatDate(message.sentAt)}</div>
                  </div>
                  <div class="task-row__meta">
                    <span class="status-badge ${message.status === "Unread" ? "status-badge--info" : message.status === "Needs Response" ? "status-badge--warning" : "status-badge--muted"}">${message.status}</span>
                  </div>
                </div>
              `,
              )
              .join("") ||
            renderEmptyState(
              "No messages",
              "No communications currently require review.",
            )
          }
        </div>
      </div>
    </div>
  `;
}

function renderAdminBillingPage(snapshot) {
  const { invoices, payments } = snapshot;
  return `
    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Invoices and payments</h2>
          <span class="status-badge status-badge--neutral">Operational billing preview</span>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              ${
                invoices
                  .map(
                    (invoice) => `
                    <tr>
                      <td>#${invoice.id}</td>
                      <td>${invoice.clientId}</td>
                      <td>${invoice.engagementId}</td>
                      <td>$${invoice.amount.toLocaleString("en-US")}</td>
                      <td>${statusBadge(invoice.status)}</td>
                      <td>${formatDate(invoice.dueAt)}</td>
                    </tr>
                  `,
                  )
                  .join("") ||
                `<tr><td colspan="6">No invoices are currently recorded in this demo dataset.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Payments received</h2>
        </div>
        <div class="task-list">
          ${
            payments
              .map(
                (payment) => `
                <div class="task-row">
                  <div>
                    <div class="list-label">Payment #${payment.id}</div>
                    <div class="list-meta">${payment.methodLabel}</div>
                  </div>
                  <div class="task-row__meta">
                    <div class="list-meta">$${payment.amount.toLocaleString("en-US")}</div>
                    <span class="status-badge status-badge--success">Received</span>
                  </div>
                </div>
              `,
              )
              .join("") ||
            renderEmptyState(
              "No payments",
              "No payment activity is currently recorded.",
            )
          }
        </div>
      </div>
    </div>
  `;
}

function renderAdminContentPage(snapshot) {
  const { contentInventory } = snapshot;
  return `
    <div class="portal-section">
      <div class="panel">
        <div class="section-header">
          <h2>Content inventory</h2>
          <span class="status-badge status-badge--neutral">Operational content index</span>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Route</th>
                <th>Status</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              ${
                contentInventory
                  .map(
                    (item) => `
                    <tr>
                      <td>${item.item}</td>
                      <td>${item.type}</td>
                      <td>${item.route}</td>
                      <td>${statusBadge(item.status)}</td>
                      <td>${formatDate(item.lastUpdated)}</td>
                    </tr>
                  `,
                  )
                  .join("") ||
                `<tr><td colspan="5">No content inventory entries found.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAdminSettingsPage() {
  return `
    <div class="portal-section two-col-grid">
      <div class="panel">
        <div class="section-header">
          <h2>Business profile</h2>
        </div>
        <div class="task-list">
          <div class="task-row"><div><div class="list-label">Business name</div><div class="list-meta">Alchemize Business Services</div></div><span class="status-badge status-badge--neutral">Configured</span></div>
          <div class="task-row"><div><div class="list-label">Primary service mix</div><div class="list-meta">Tax, Formation, Advisory, Insurance</div></div><span class="status-badge status-badge--neutral">Live</span></div>
        </div>
      </div>

      <div class="panel">
        <div class="section-header">
          <h2>Users & permissions</h2>
        </div>
        <div class="task-list">
          <div class="task-row"><div><div class="list-label">Owner / Administrator</div><div class="list-meta">Full operational access</div></div><span class="status-badge status-badge--neutral">Assigned</span></div>
          <div class="task-row"><div><div class="list-label">Staff</div><div class="list-meta">Role-scoped service access</div></div><span class="status-badge status-badge--muted">Future</span></div>
          <div class="task-row"><div><div class="list-label">Client</div><div class="list-meta">Portal-only account access</div></div><span class="status-badge status-badge--muted">Future</span></div>
        </div>
      </div>
    </div>

    <div class="portal-section two-col-grid">
      <div class="panel">
        <div class="section-header">
          <h2>Service configuration</h2>
        </div>
        <div class="task-list">
          <div class="task-row"><div><div class="list-label">Business formation</div><div class="list-meta">Workflow: Clarify → Prepare → Establish → Organize</div></div><span class="status-badge status-badge--neutral">Enabled</span></div>
          <div class="task-row"><div><div class="list-label">Tax preparation</div><div class="list-meta">Workflow: Gather → Review → Prepare → Finalize</div></div><span class="status-badge status-badge--neutral">Enabled</span></div>
          <div class="task-row"><div><div class="list-label">Advisory</div><div class="list-meta">Workflow: Understand → Evaluate → Prioritize → Act</div></div><span class="status-badge status-badge--neutral">Enabled</span></div>
        </div>
      </div>

      <div class="panel">
        <div class="section-header">
          <h2>Security and integrations</h2>
        </div>
        <div class="task-list">
          <div class="task-row"><div><div class="list-label">Authentication</div><div class="list-meta">Server-side auth required</div></div><span class="status-badge status-badge--muted">Future</span></div>
          <div class="task-row"><div><div class="list-label">Notifications</div><div class="list-meta">Ops and task notifications</div></div><span class="status-badge status-badge--muted">Future</span></div>
          <div class="task-row"><div><div class="list-label">Integrations</div><div class="list-meta">CRM, billing, calendar, messaging</div></div><span class="status-badge status-badge--muted">Future</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderPortalContent(pathname, snapshot) {
  const isAdmin = document.body.dataset.appRole === "admin";

  if (isAdmin) {
    if (pathname === "/admin/" || pathname === "/admin/dashboard/") {
      return renderAdminDashboard(snapshot);
    }

    if (pathname === "/admin/leads/") {
      return renderLeadsPage(snapshot);
    }

    if (pathname === "/admin/clients/") {
      return renderClientsPage(snapshot);
    }

    if (pathname === "/admin/services/") {
      return renderAdminServicesPage(snapshot);
    }

    if (pathname === "/admin/tasks/") {
      return renderAdminTasksPage(snapshot);
    }

    if (pathname === "/admin/documents/") {
      return renderAdminDocumentsPage(snapshot);
    }

    if (pathname === "/admin/appointments/") {
      return renderAdminAppointmentsPage(snapshot);
    }

    if (pathname === "/admin/messages/") {
      return renderAdminMessagesPage(snapshot);
    }

    if (pathname === "/admin/billing/") {
      return renderAdminBillingPage(snapshot);
    }

    if (pathname === "/admin/content/") {
      return renderAdminContentPage(snapshot);
    }

    if (pathname === "/admin/settings/") {
      return renderAdminSettingsPage();
    }

    return renderAdminDashboard(snapshot);
  }

  if (
    pathname === "/client-portal/" ||
    pathname === "/client-portal/dashboard/"
  ) {
    return renderClientDashboard(snapshot);
  }

  if (pathname === "/client-portal/services/") {
    return renderServicesPage(snapshot);
  }

  if (pathname === "/client-portal/tasks/") {
    return renderTasksPage(snapshot);
  }

  if (pathname === "/client-portal/documents/") {
    return renderDocumentsPage(snapshot);
  }

  if (pathname === "/client-portal/appointments/") {
    return renderAppointmentsPage(snapshot);
  }

  if (pathname === "/client-portal/messages/") {
    return renderMessagesPage(snapshot);
  }

  if (pathname === "/client-portal/billing/") {
    return renderBillingPage(snapshot);
  }

  if (pathname === "/client-portal/profile/") {
    return renderProfilePage(snapshot);
  }

  return renderClientDashboard(snapshot);
}

function renderPrototypeToolbar(path) {
  const isAdmin = document.body.dataset.appRole === "admin";
  if (!isAdmin) return "";

  const actions = {
    "/admin/": [
      { label: "Convert Lead", action: "lead-convert" },
      { label: "New Task", action: "task-create" },
      { label: "Request Document", action: "document-request" },
    ],
    "/admin/dashboard/": [
      { label: "Convert Lead", action: "lead-convert" },
      { label: "New Task", action: "task-create" },
      { label: "Schedule Appointment", action: "appointment-schedule" },
    ],
    "/admin/leads/": [{ label: "Convert Lead", action: "lead-convert" }],
    "/admin/clients/": [
      { label: "Start Engagement", action: "engagement-start" },
      { label: "New Task", action: "task-create" },
      { label: "Add Note", action: "note-add" },
    ],
    "/admin/services/": [
      { label: "Start Engagement", action: "engagement-start" },
      { label: "Change Status", action: "engagement-status" },
    ],
    "/admin/tasks/": [{ label: "New Task", action: "task-create" }],
    "/admin/documents/": [
      { label: "Request Document", action: "document-request" },
    ],
    "/admin/appointments/": [
      { label: "Schedule Appointment", action: "appointment-schedule" },
    ],
    "/admin/messages/": [{ label: "Add Note", action: "note-add" }],
    "/admin/billing/": [{ label: "Draft Invoice", action: "invoice-draft" }],
  };

  const current = actions[path] || actions["/admin/"] || [];

  return `
    <div class="prototype-toolbar">
      <div class="prototype-toolbar__actions">
        ${current
          .map(
            (item) => `
              <button type="button" class="button button--secondary" data-admin-action="${item.action}">
                ${item.label}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="prototype-toolbar__meta">
        <span class="meta-chip">Prototype data resets on refresh</span>
      </div>
    </div>
  `;
}

function renderAdminSearch() {
  return `
    <label class="admin-global-search" aria-label="Admin search">
      <span class="sr-only">Admin search</span>
      <input type="search" data-admin-search placeholder="Search clients, leads, engagements, documents" />
    </label>
  `;
}

function renderModalContent(action, snapshot) {
  const openLeads = snapshot.leads.filter(
    (lead) => !["Converted", "Closed"].includes(lead.status),
  );
  const firstLead = openLeads[0] || snapshot.leads[0];
  const serviceChoices = Object.keys(serviceStageCatalog)
    .map((service) => `<option value="${service}">${service}</option>`)
    .join("");

  const clientChoices = snapshot.clients
    .filter((client) => !["Archived"].includes(client.status))
    .map(
      (client) => `<option value="${client.id}">${client.displayName}</option>`,
    )
    .join("");

  const engagementChoices = snapshot.engagements
    .filter((engagement) => !["Archived"].includes(engagement.status))
    .map(
      (engagement) =>
        `<option value="${engagement.id}">${engagement.serviceName}</option>`,
    )
    .join("");

  if (action === "lead-convert") {
    return `
      <form class="prototype-form" data-form-action="convertLead">
        <div class="prototype-field-grid">
          <label>
            <span>Lead</span>
            <select name="leadId" required>
              ${openLeads.length ? openLeads.map((lead) => `<option value="${lead.id}">${lead.name} · ${lead.serviceInterest}</option>`).join("") : `<option value="">No active leads</option>`}
            </select>
          </label>
          <label>
            <span>Client type</span>
            <select name="clientType" required>
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
            </select>
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" value="${firstLead ? firstLead.email : ""}" placeholder="name@example.com" />
          </label>
          <label>
            <span>Phone</span>
            <input type="tel" name="phone" value="${firstLead ? firstLead.phone : ""}" placeholder="(555) 000-0000" />
          </label>
          <label>
            <span>Associated business</span>
            <input type="text" name="businessName" placeholder="Optional" />
          </label>
          <label>
            <span>Intended service</span>
            <select name="intendedService" required>
              ${serviceChoices}
            </select>
          </label>
          <label>
            <span>Initial client status</span>
            <select name="initialClientStatus">
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
            </select>
          </label>
        </div>
        <div class="prototype-actions">
          <button type="button" class="button button--secondary" data-modal-close>Cancel</button>
          <button type="submit" class="button button--primary">Convert to Client</button>
        </div>
      </form>
    `;
  }

  if (action === "engagement-start") {
    return `
      <form class="prototype-form" data-form-action="startEngagement">
        <div class="prototype-field-grid">
          <label>
            <span>Client</span>
            <select name="clientId" required>
              ${clientChoices || `<option value="">No clients available</option>`}
            </select>
          </label>
          <label>
            <span>Service</span>
            <select name="serviceName" required>
              ${serviceChoices}
            </select>
          </label>
          <label>
            <span>Audience</span>
            <select name="audience">
              <option value="Business">Business</option>
              <option value="Individual">Individual</option>
            </select>
          </label>
          <label>
            <span>Initial status</span>
            <select name="initialStatus">
              <option value="Preparing">Preparing</option>
              <option value="Waiting on Client">Waiting on Client</option>
              <option value="In Progress">In Progress</option>
            </select>
          </label>
          <label>
            <span>Current stage</span>
            <input type="text" name="currentStage" value="${Object.values(serviceStageCatalog)[0]?.[0] || "Initial intake"}" />
          </label>
          <label>
            <span>Assigned checklist</span>
            <input type="text" name="assignedChecklist" value="Checklist draft" />
          </label>
          <label>
            <span>Target date</span>
            <input type="date" name="targetDate" />
          </label>
          <label>
            <span>Assigned to</span>
            <select name="assignedTo">
              ${staffOptions.map((person) => `<option value="${person}">${person}</option>`).join("")}
            </select>
          </label>
          <label class="wide-field">
            <span>Next action</span>
            <input type="text" name="nextAction" value="Confirm onboarding details" />
          </label>
        </div>
        <div class="prototype-actions">
          <button type="button" class="button button--secondary" data-modal-close>Cancel</button>
          <button type="submit" class="button button--primary">Start Service</button>
        </div>
      </form>
    `;
  }

  if (action === "task-create") {
    return `
      <form class="prototype-form" data-form-action="createTask">
        <div class="prototype-field-grid">
          <label>
            <span>Title</span>
            <input type="text" name="title" required placeholder="Prepare review notes" />
          </label>
          <label>
            <span>Client</span>
            <select name="clientId" required>
              ${clientChoices || `<option value="">No clients available</option>`}
            </select>
          </label>
          <label>
            <span>Engagement</span>
            <select name="engagementId">
              <option value="">General admin</option>
              ${engagementChoices}
            </select>
          </label>
          <label>
            <span>Assigned to</span>
            <select name="assignedTo">
              ${staffOptions.map((person) => `<option value="${person}">${person}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select name="status">
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on Client">Waiting on Client</option>
              <option value="Waiting on Alchemize">Waiting on Alchemize</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select name="priority">
              <option value="High">High</option>
              <option value="Medium" selected>Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label>
            <span>Due date</span>
            <input type="date" name="dueDate" required />
          </label>
          <label class="wide-field">
            <span>Description</span>
            <textarea name="description" rows="4" placeholder="Add task detail for the current workflow."></textarea>
          </label>
        </div>
        <div class="prototype-actions">
          <button type="button" class="button button--secondary" data-modal-close>Cancel</button>
          <button type="submit" class="button button--primary">Create Task</button>
        </div>
      </form>
    `;
  }

  if (action === "document-request") {
    return `
      <form class="prototype-form" data-form-action="requestDocument">
        <div class="prototype-field-grid">
          <label>
            <span>Client</span>
            <select name="clientId" required>
              ${clientChoices || `<option value="">No clients available</option>`}
            </select>
          </label>
          <label>
            <span>Engagement</span>
            <select name="engagementId">
              <option value="">General request</option>
              ${engagementChoices}
            </select>
          </label>
          <label>
            <span>Document title</span>
            <input type="text" name="name" required placeholder="2025 W-2" />
          </label>
          <label>
            <span>Category</span>
            <select name="category">
              <option value="Requested">Requested</option>
              <option value="Awaiting Upload">Awaiting Upload</option>
            </select>
          </label>
          <label>
            <span>Reviewer</span>
            <input type="text" name="reviewer" value="Owner / Administrator" />
          </label>
          <label>
            <span>Due date</span>
            <input type="date" name="dueDate" />
          </label>
          <label class="wide-field">
            <span>Instructions</span>
            <textarea name="instructions" rows="4" placeholder="Include any specific guidance for the client."></textarea>
          </label>
        </div>
        <div class="prototype-actions">
          <button type="button" class="button button--secondary" data-modal-close>Cancel</button>
          <button type="submit" class="button button--primary">Request Document</button>
        </div>
      </form>
    `;
  }

  if (action === "appointment-schedule") {
    return `
      <form class="prototype-form" data-form-action="scheduleAppointment">
        <div class="prototype-field-grid">
          <label>
            <span>Client</span>
            <select name="clientId" required>
              ${clientChoices || `<option value="">No clients available</option>`}
            </select>
          </label>
          <label>
            <span>Engagement</span>
            <select name="engagementId">
              <option value="">General</option>
              ${engagementChoices}
            </select>
          </label>
          <label>
            <span>Title</span>
            <input type="text" name="title" value="Review call" required />
          </label>
          <label>
            <span>Type</span>
            <select name="type">
              <option value="Consultation">Consultation</option>
              <option value="Review">Review</option>
              <option value="Strategy session">Strategy session</option>
            </select>
          </label>
          <label>
            <span>Date</span>
            <input type="date" name="date" required />
          </label>
          <label>
            <span>Time</span>
            <input type="time" name="time" required />
          </label>
          <label>
            <span>Delivery method</span>
            <select name="deliveryMethod">
              <option value="Video call">Video call</option>
              <option value="Phone">Phone</option>
              <option value="Conference room">Conference room</option>
            </select>
          </label>
          <label>
            <span>Duration (minutes)</span>
            <input type="number" name="duration" value="60" min="30" step="15" />
          </label>
          <label class="wide-field">
            <span>Preparation note</span>
            <textarea name="notes" rows="4" placeholder="Prep note for the client or internal team."></textarea>
          </label>
        </div>
        <div class="prototype-actions">
          <button type="button" class="button button--secondary" data-modal-close>Cancel</button>
          <button type="submit" class="button button--primary">Schedule Appointment</button>
        </div>
      </form>
    `;
  }

  if (action === "note-add") {
    return `
      <form class="prototype-form" data-form-action="addNote">
        <div class="prototype-field-grid">
          <label>
            <span>Related client</span>
            <select name="clientId">
              <option value="">Not client-specific</option>
              ${clientChoices}
            </select>
          </label>
          <label>
            <span>Related engagement</span>
            <select name="engagementId">
              <option value="">Not engagement-specific</option>
              ${engagementChoices}
            </select>
          </label>
          <label>
            <span>Author</span>
            <select name="author">
              ${staffOptions.map((person) => `<option value="${person}">${person}</option>`).join("")}
            </select>
          </label>
          <label class="wide-field">
            <span>Internal note</span>
            <textarea name="content" rows="5" required placeholder="INTERNAL ONLY"></textarea>
          </label>
        </div>
        <div class="prototype-actions">
          <button type="button" class="button button--secondary" data-modal-close>Cancel</button>
          <button type="submit" class="button button--primary">Add Internal Note</button>
        </div>
      </form>
    `;
  }

  if (action === "engagement-status") {
    return `
      <form class="prototype-form" data-form-action="updateEngagementStatus">
        <div class="prototype-field-grid">
          <label>
            <span>Engagement</span>
            <select name="engagementId" required>
              ${engagementChoices || `<option value="">No engagements</option>`}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select name="status">
              <option value="Preparing">Preparing</option>
              <option value="Waiting on Client">Waiting on Client</option>
              <option value="Waiting on Alchemize">Waiting on Alchemize</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Ready for Client">Ready for Client</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
          <label class="wide-field">
            <span>Next action</span>
            <input type="text" name="nextAction" value="Confirm next steps" />
          </label>
        </div>
        <div class="prototype-actions">
          <button type="button" class="button button--secondary" data-modal-close>Cancel</button>
          <button type="submit" class="button button--primary">Update Status</button>
        </div>
      </form>
    `;
  }

  if (action === "invoice-draft") {
    return `
      <form class="prototype-form" data-form-action="createInvoiceDraft">
        <div class="prototype-field-grid">
          <label>
            <span>Client</span>
            <select name="clientId" required>
              ${clientChoices || `<option value="">No clients available</option>`}
            </select>
          </label>
          <label>
            <span>Engagement</span>
            <select name="engagementId">
              <option value="">General</option>
              ${engagementChoices}
            </select>
          </label>
          <label>
            <span>Amount</span>
            <input type="number" name="amount" min="1" step="1" value="850" required />
          </label>
          <label>
            <span>Due date</span>
            <input type="date" name="dueDate" required />
          </label>
        </div>
        <div class="prototype-actions">
          <button type="button" class="button button--secondary" data-modal-close>Cancel</button>
          <button type="submit" class="button button--primary">Create Draft Invoice</button>
        </div>
      </form>
    `;
  }

  return "";
}

function openPrototypeModal(action, snapshot) {
  const existing = document.querySelector(".prototype-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.className = "prototype-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div class="prototype-modal__backdrop" data-modal-close></div>
    <div class="prototype-modal__panel" tabindex="-1">
      <div class="prototype-modal__header">
        <h2>${
          {
            "lead-convert": "Convert Lead",
            "engagement-start": "Start Service Engagement",
            "task-create": "New Task",
            "document-request": "Request Document",
            "appointment-schedule": "Schedule Appointment",
            "note-add": "Add Internal Note",
            "engagement-status": "Update Engagement Status",
            "invoice-draft": "Draft Invoice",
          }[action] || "Prototype Action"
        }</h2>
        <button type="button" class="prototype-close" aria-label="Close" data-modal-close>×</button>
      </div>
      ${renderModalContent(action, snapshot)}
    </div>
  `;

  document.body.appendChild(modal);

  const closeHandlers = modal.querySelectorAll("[data-modal-close]");
  closeHandlers.forEach((element) => {
    element.addEventListener("click", () => modal.remove());
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      modal.remove();
    }
  });

  const input = modal.querySelector("input, select, textarea, button");
  if (input) input.focus();
}

function handlePrototypeSubmit(event, snapshot) {
  const form = event.currentTarget;
  const formAction = form.dataset.formAction;
  const formData = new window.FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (formAction === "convertLead") {
    adminStore.convertLeadToClient({
      leadId: data.leadId,
      clientType: data.clientType,
      email: data.email,
      phone: data.phone,
      businessName: data.businessName || "",
      intendedService: data.intendedService,
      initialClientStatus: data.initialClientStatus,
    });
  }

  if (formAction === "startEngagement") {
    adminStore.startServiceEngagement({
      clientId: data.clientId,
      serviceName: data.serviceName,
      audience: data.audience,
      initialStatus: data.initialStatus,
      currentStage: data.currentStage,
      assignedChecklist: data.assignedChecklist,
      targetDate: data.targetDate,
      nextAction: data.nextAction,
      assignedTo: data.assignedTo,
    });
  }

  if (formAction === "createTask") {
    adminStore.createTask({
      title: data.title,
      clientId: data.clientId,
      engagementId: data.engagementId || null,
      assignedTo: data.assignedTo,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      description: data.description,
      serviceName: data.engagementId
        ? snapshot.engagements.find((item) => item.id === data.engagementId)
            ?.serviceName || "General admin support"
        : "General admin support",
    });
  }

  if (formAction === "requestDocument") {
    adminStore.createDocumentRequest({
      clientId: data.clientId,
      engagementId: data.engagementId || null,
      name: data.name,
      category: data.category,
      status:
        data.category === "Awaiting Upload" ? "Awaiting Upload" : "Requested",
      serviceName:
        snapshot.engagements.find((item) => item.id === data.engagementId)
          ?.serviceName || "General admin support",
      instructions: data.instructions,
      dueDate: data.dueDate,
      reviewer: data.reviewer,
    });
  }

  if (formAction === "scheduleAppointment") {
    adminStore.createAppointment({
      clientId: data.clientId,
      engagementId: data.engagementId || null,
      title: data.title,
      type: data.type,
      serviceName:
        snapshot.engagements.find((item) => item.id === data.engagementId)
          ?.serviceName || "General admin support",
      date: data.date,
      time: data.time,
      duration: Number(data.duration || 60),
      deliveryMethod: data.deliveryMethod,
      notes: data.notes,
    });
  }

  if (formAction === "addNote") {
    adminStore.addInternalNote({
      relatedType: data.engagementId
        ? "engagement"
        : data.clientId
          ? "client"
          : "lead",
      relatedId:
        data.engagementId || data.clientId || data.leadId || "prototype-note",
      author: data.author,
      content: data.content,
    });
  }

  if (formAction === "updateEngagementStatus") {
    adminStore.updateEngagementStatus(
      data.engagementId,
      data.status,
      data.nextAction || null,
    );
  }

  if (formAction === "createInvoiceDraft") {
    adminStore.createInvoiceDraft({
      clientId: data.clientId,
      engagementId: data.engagementId || null,
      amount: Number(data.amount || 0),
      dueDate: data.dueDate,
    });
  }

  const modal = form.closest(".prototype-modal");
  if (modal) modal.remove();

  const root = document.getElementById("portal-app");
  if (root) {
    const refreshed = adminStore.getSnapshot();
    renderAppShell(refreshed);
    attachAdminInteractions();
  }
}

function attachAdminInteractions() {
  const root = document.getElementById("portal-app");
  if (!root || document.body.dataset.appRole !== "admin") return;

  root.querySelectorAll("[data-admin-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const snapshot = adminStore.getSnapshot();
      openPrototypeModal(button.dataset.adminAction, snapshot);
    });
  });

  root.querySelectorAll(".prototype-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      const snapshot = adminStore.getSnapshot();
      handlePrototypeSubmit(event, snapshot);
    });
  });

  const searchInput = root.querySelector("[data-admin-search]");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const term = event.target.value.trim().toLowerCase();
      const currentPath = normalizePath(window.location.pathname);
      const snapshot = adminStore.getSnapshot();
      const filtered = {
        leads: term
          ? snapshot.leads.filter((lead) =>
              JSON.stringify(lead).toLowerCase().includes(term),
            )
          : snapshot.leads,
        clients: term
          ? snapshot.clients.filter((client) =>
              JSON.stringify(client).toLowerCase().includes(term),
            )
          : snapshot.clients,
        engagements: term
          ? snapshot.engagements.filter((engagement) =>
              JSON.stringify(engagement).toLowerCase().includes(term),
            )
          : snapshot.engagements,
        documents: term
          ? snapshot.documents.filter((document) =>
              JSON.stringify(document).toLowerCase().includes(term),
            )
          : snapshot.documents,
      };

      if (currentPath === "/admin/leads/") {
        const list = root.querySelector("tbody");
        if (list) {
          const rows = filtered.leads
            .map(
              (lead) => `
              <tr>
                <td>${lead.name}</td>
                <td>${lead.serviceInterest}</td>
                <td>${lead.source}</td>
                <td>${statusBadge(lead.status)}</td>
                <td>${lead.assignedTo}</td>
                <td>${lead.nextAction}</td>
              </tr>
            `,
            )
            .join("");
          list.innerHTML =
            rows || `<tr><td colspan="6">No matching leads</td></tr>`;
        }
      }
    });
  }
}

function renderAppShell(snapshot) {
  const root = document.getElementById("portal-app");
  if (!root) return;

  const path = normalizePath(window.location.pathname);
  const isAdmin = document.body.dataset.appRole === "admin";
  const navItems = isAdmin ? adminNav : clientNav;
  const title = isAdmin ? "Admin Access" : "Client Portal";
  const pageTitle = routeTitle(path, isAdmin);

  root.innerHTML = `
    <div class="application-shell">
      <aside class="app-sidebar" aria-label="Application navigation">
        <div class="app-brand-wrap">
          <a href="/" class="app-logo" aria-label="Return to Alchemize website">
            <img src="${appLogoUrl}" alt="Alchemize Business Services" />
          </a>
          <div class="app-identity">
            <span class="eyebrow eyebrow--small">${title}</span>
            <span class="app-preview">Preview workspace</span>
          </div>
        </div>
        <nav class="app-nav" aria-label="${title} navigation">
          ${navItems
            .map(
              (item) => `
                <a href="${item.href}" class="app-nav-item ${isActive(path, item.href) ? "is-active" : ""}">
                  ${item.label}
                </a>
              `,
            )
            .join("")}
        </nav>
        <div class="app-sidebar-footer">
          <a href="/contact/" class="sidebar-link">Need help?</a>
          <a href="/privacy/" class="sidebar-link">Privacy</a>
          <a href="/terms/" class="sidebar-link">Terms</a>
          <a href="/" class="sidebar-link">Return to website</a>
        </div>
      </aside>

      <div class="app-main">
        <header class="app-topbar">
          <div class="app-header-left">
            <button type="button" class="app-menu-toggle" aria-expanded="false" aria-controls="app-sidebar-mobile">
              Menu
            </button>
            <span class="app-kicker">${title}</span>
          </div>
          <div class="app-topbar-actions">
            <span class="status-badge status-badge--neutral">Prototype data</span>
            ${isAdmin ? renderAdminSearch() : ""}
            <button type="button" class="button button--ghost" disabled>Sign Out</button>
          </div>
        </header>

        <main class="app-content">
          <div class="page-heading-row">
            <div>
              <p class="eyebrow eyebrow--small">Workspace</p>
              <h1>${pageTitle}</h1>
            </div>
            <div class="page-header-actions">
              <button type="button" class="button button--primary" disabled>Future action</button>
            </div>
          </div>
          ${isAdmin ? renderPrototypeToolbar(path) : ""}
          <div id="portal-content-slot">${renderPortalContent(path, snapshot)}</div>
        </main>

        <footer class="app-footer">
          <span>Alchemize Business Services</span>
          <div>
            <a href="/privacy/">Privacy</a>
            <a href="/terms/">Terms</a>
            <a href="/">Return to Website</a>
          </div>
        </footer>
      </div>
    </div>
  `;

  const menuButton = document.querySelector(".app-menu-toggle");
  const sidebar = document.querySelector(".app-sidebar");
  if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      sidebar.classList.toggle("is-open", !expanded);
    });
  }

  if (isAdmin) {
    attachAdminInteractions();
  }
}

async function initPortalShell() {
  const isAuthPage =
    window.location.pathname.startsWith("/login/") ||
    window.location.pathname.startsWith("/register/");

  if (isAuthPage) {
    renderAuthShell();
    return;
  }

  const isAdmin = document.body.dataset.appRole === "admin";
  const snapshot = isAdmin
    ? await getAdminSnapshot()
    : await getPortalSnapshot();
  renderAppShell(snapshot);
}

window.addEventListener("DOMContentLoaded", initPortalShell);
window.resetAdminPrototype = resetAdminPrototype;
window.adminStore = adminStore;

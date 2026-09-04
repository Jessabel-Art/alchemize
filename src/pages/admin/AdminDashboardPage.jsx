import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminStore } from "../../../js/data/admin-store.js";
import { portalAdmin } from "../../services/admin-api.js";
import {
  getOpenInvoiceBalance,
  getInvoiceRemainingBalance,
} from "../../utils/admin-metrics.js";
import { isActiveClient } from "../../utils/client-status.js";
import "./admin.css";

const activityTone = {
  lead_status_changed: "status",
  task_created: "info",
  document_requested: "info",
  invoice_status_changed: "warning",
  appointment_scheduled: "success",
  lead_created: "info",
  lead_converted: "success",
  consultation_scheduled: "success",
  task_completed: "success",
  document_received: "success",
  service_status_changed: "status",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = safeDate(value);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isWithinDays = (value, limitDays) => {
  const date = safeDate(value);
  if (!date) return false;
  const diffMs = date.getTime() - Date.now();
  return diffMs >= 0 && diffMs <= limitDays * 24 * 60 * 60 * 1000;
};

const getClientName = (snapshot, clientId) =>
  snapshot.clients.find((client) => client.id === clientId)?.displayName ||
  "Client";

const getLeadStatusPriority = (status) => {
  const order = {
    New: 0,
    Contacted: 1,
    "Consultation Scheduled": 2,
    Qualified: 3,
    "Proposal / SOW Sent": 4,
    Converted: 5,
    "Closed / Not Moving Forward": 6,
  };
  return order[status] ?? 99;
};

function AdminDashboardPage() {
  const snapshot = adminStore.getSnapshot();
  const needs = adminStore.getNeedsAttention();
  const [portalAttention, setPortalAttention] = useState({
    items: [],
    loading: true,
    error: "",
  });
  const [portalReplies, setPortalReplies] = useState({});
  const [replacementItem, setReplacementItem] = useState(null);
  const [replacementNote, setReplacementNote] = useState("");
  const loadPortalAttention = async () => {
    try {
      const data = await portalAdmin.attention();
      setPortalAttention({
        items: data?.items || [],
        loading: false,
        error: "",
      });
    } catch (error) {
      setPortalAttention({ items: [], loading: false, error: error.message });
    }
  };
  useEffect(() => {
    loadPortalAttention();
  }, []);
  const resolvePortalItem = async (item, decision, payload = {}) => {
    const type = {
      task_action: "task",
      document_submission: "document",
      appointment_request: "appointment",
      profile_change: "profile",
      message: "message",
      access_request: "access",
    }[item.kind];
    if (!type) return;
    try {
      const result = await portalAdmin.resolve(
        type,
        item.id,
        decision,
        payload,
      );
      if (result?.setup_url) {
        await navigator.clipboard.writeText(result.setup_url);
        setPortalAttention((current) => ({
          ...current,
          error:
            "Authorized-user setup link copied because email delivery was unavailable.",
        }));
      }
      await loadPortalAttention();
      setReplacementItem(null);
      setReplacementNote("");
    } catch (error) {
      setPortalAttention((current) => ({ ...current, error: error.message }));
    }
  };
  const replyToPortalMessage = async (item) => {
    try {
      await portalAdmin.reply(item.id, portalReplies[item.id] || "");
      setPortalReplies((current) => ({ ...current, [item.id]: "" }));
      await loadPortalAttention();
    } catch (error) {
      setPortalAttention((current) => ({ ...current, error: error.message }));
    }
  };

  const openLeadCount = snapshot.leads.filter(
    (lead) =>
      !["Converted", "Closed / Not Moving Forward"].includes(lead.status),
  ).length;

  const attentionItems = [
    ...needs.leads.slice(0, 4).map((lead) => ({
      key: `lead-${lead.id}`,
      type: "Lead follow-up",
      title: lead.name,
      summary: lead.serviceInterest || "Service inquiry",
      reason: lead.status,
      due: lead.receivedAt,
      status: lead.status,
      to: "/admin/leads",
    })),
    ...snapshot.tasks
      .filter((task) => task.status !== "Completed")
      .slice(0, 4)
      .map((task) => ({
        key: `task-${task.id}`,
        type: "Task due",
        title: task.title,
        summary: getClientName(snapshot, task.clientId),
        reason: task.status,
        due: task.dueDate,
        status: task.status,
        to: "/admin/tasks",
      })),
    ...snapshot.documents
      .filter((document) => !["Archive", "Completed"].includes(document.status))
      .slice(0, 3)
      .map((document) => ({
        key: `document-${document.id}`,
        type: "Document review",
        title: document.name,
        summary: getClientName(snapshot, document.clientId),
        reason: document.status,
        due: document.receivedAt || document.requestedAt,
        status: document.status,
        to: "/admin/documents",
      })),
    ...snapshot.invoices
      .filter((invoice) => ["Past Due", "Open"].includes(invoice.status))
      .slice(0, 2)
      .map((invoice) => ({
        key: `invoice-${invoice.id}`,
        type: "Invoice",
        title: invoice.id,
        summary: getClientName(snapshot, invoice.clientId),
        reason: `${formatCurrency(invoice.amount)} · ${invoice.status}`,
        due: invoice.dueAt,
        status: invoice.status,
        to: "/admin/billing",
      })),
    ...snapshot.clients
      .filter((client) =>
        ["Onboarding", "Waiting on Client", "Paused"].includes(client.status),
      )
      .slice(0, 2)
      .map((client) => ({
        key: `client-${client.id}`,
        type: "Client follow-up",
        title: client.displayName,
        summary: client.nextAction || "Waiting on follow-up",
        reason: client.status,
        due: client.lastActivity,
        status: client.status,
        to: "/admin/clients",
      })),
  ]
    .sort((left, right) => {
      const leftValue = left.due
        ? new Date(left.due).getTime()
        : Number.MAX_SAFE_INTEGER;
      const rightValue = right.due
        ? new Date(right.due).getTime()
        : Number.MAX_SAFE_INTEGER;
      const delta = leftValue - rightValue;
      if (delta !== 0) return delta;
      return (
        getLeadStatusPriority(left.status) - getLeadStatusPriority(right.status)
      );
    })
    .slice(0, 8);

  const needsAttentionCount =
    new Set([
      ...needs.leads.map((lead) => `lead:${lead.id}`),
      ...needs.tasks.map((task) => `task:${task.id}`),
      ...needs.documents.map((document) => `document:${document.id}`),
      ...snapshot.invoices
        .filter((invoice) => ["Open", "Past Due"].includes(invoice.status))
        .map((invoice) => `invoice:${invoice.id}`),
      ...snapshot.clients
        .filter((client) =>
          ["Onboarding", "Waiting on Client", "Paused"].includes(client.status),
        )
        .map((client) => `client:${client.id}`),
    ]).size + portalAttention.items.length;

  const openInvoiceRows = snapshot.invoices.filter(
    (invoice) =>
      !["Paid", "Cancelled", "Void", "Closed"].includes(invoice.status),
  );
  const totalOutstanding = getOpenInvoiceBalance(openInvoiceRows);

  const upcomingAppointments = snapshot.appointments
    .filter(
      (appointment) =>
        !["Completed", "Cancelled"].includes(appointment.status) &&
        isWithinDays(appointment.date, 7),
    )
    .sort(
      (left, right) =>
        new Date(left.date).getTime() - new Date(right.date).getTime(),
    )
    .slice(0, 5);

  const leadQueue = snapshot.leads
    .filter((lead) =>
      ["New", "Contacted", "Consultation Scheduled"].includes(lead.status),
    )
    .sort(
      (left, right) =>
        new Date(right.receivedAt || 0).getTime() -
        new Date(left.receivedAt || 0).getTime(),
    )
    .slice(0, 5);

  const activeServiceWork = snapshot.engagements
    .filter(
      (engagement) => !["Completed", "Archived"].includes(engagement.status),
    )
    .sort(
      (left, right) =>
        new Date(left.targetDate || 0).getTime() -
        new Date(right.targetDate || 0).getTime(),
    )
    .slice(0, 5);

  const documentActions = snapshot.documents
    .filter((document) => !["Archive"].includes(document.status))
    .sort(
      (left, right) =>
        new Date(right.requestedAt || right.receivedAt || 0).getTime() -
        new Date(left.requestedAt || left.receivedAt || 0).getTime(),
    )
    .slice(0, 5);

  const billingWatch = openInvoiceRows
    .filter((invoice) => ["Open", "Past Due"].includes(invoice.status))
    .sort(
      (left, right) =>
        new Date(left.dueAt || 0).getTime() -
        new Date(right.dueAt || 0).getTime(),
    )
    .slice(0, 5);

  const recentActivity = snapshot.activity.slice(0, 5);

  const dashboardMetrics = [
    {
      label: "Open leads",
      value: openLeadCount,
      detail: "Awaiting qualification or follow-up",
      to: "/admin/leads",
    },
    {
      label: "Needs attention",
      value: needsAttentionCount,
      detail: "Open work and follow-up",
      to: "/admin/dashboard#attention",
    },
    {
      label: "Active clients",
      value: snapshot.clients.filter((client) => isActiveClient(client)).length,
      detail: "Current client relationships",
      to: "/admin/clients",
    },
    {
      label: "Open invoices",
      value: openInvoiceRows.length,
      detail: `${formatCurrency(totalOutstanding)} outstanding`,
      to: "/admin/billing",
    },
    {
      label: "Upcoming",
      value: upcomingAppointments.length,
      detail: "Appointments in the next 7 days",
      to: "/admin/appointments",
    },
  ];

  return (
    <div className="portal-page admin-dashboard">
      <header className="portal-page-header admin-dashboard-header">
        <div>
          <span className="section-kicker">Admin workspace</span>
          <h1>Operations dashboard</h1>
        </div>
        <p>
          A working view of the current operating queue: incoming leads, client
          needs, due work, appointments, and the items that require owner
          attention this day.
        </p>
      </header>

      <section className="dashboard-summary-strip" aria-label="Summary metrics">
        {dashboardMetrics.map((metric) => (
          <Link
            key={metric.label}
            to={metric.to}
            className="dashboard-summary-item metric-link-card"
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </Link>
        ))}
      </section>

      <section className="dashboard-operations-grid">
        <div className="dashboard-main-column">
          <article className="dashboard-panel portal-client-attention">
            <div className="panel-heading">
              <h2>Client Portal activity</h2>
            </div>
            {portalAttention.error ? (
              <p className="dashboard-empty-state" role="alert">
                {portalAttention.error}
              </p>
            ) : null}
            {portalAttention.loading ? (
              <div className="dashboard-empty-state">
                Loading client actions…
              </div>
            ) : null}
            {!portalAttention.loading && portalAttention.items.length ? (
              <ul className="attention-list compact-list">
                {portalAttention.items.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="attention-item compact-row"
                  >
                    <div className="attention-item-copy">
                      <div className="attention-item-topline">
                        <span className="attention-kind">
                          {item.kind.replaceAll("_", " ")}
                        </span>
                        <span className="status-pill info">{item.status}</span>
                      </div>
                      <strong>{item.title}</strong>
                      <small>{item.client_name}</small>
                      {item.detail ? <p>{item.detail}</p> : null}
                    </div>
                    <div className="portal-admin-actions">
                      {item.kind === "document_submission" ? (
                        <a href={portalAdmin.documentDownloadUrl(item.id)}>
                          Download securely
                        </a>
                      ) : null}
                      {item.kind === "appointment_request" ||
                      item.kind === "profile_change" ||
                      item.kind === "access_request" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => resolvePortalItem(item, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => resolvePortalItem(item, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      {item.kind === "document_submission" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => resolvePortalItem(item, "accept")}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplacementItem(item);
                              setReplacementNote("");
                            }}
                          >
                            Request replacement
                          </button>
                        </>
                      ) : null}
                      {item.kind === "task_action" ||
                      item.kind === "message" ? (
                        <button
                          type="button"
                          onClick={() => resolvePortalItem(item, "reviewed")}
                        >
                          Mark reviewed
                        </button>
                      ) : null}
                    </div>
                    {item.kind === "message" ? (
                      <div className="portal-admin-reply">
                        <label htmlFor={`reply-${item.id}`}>
                          Reply to client
                        </label>
                        <textarea
                          id={`reply-${item.id}`}
                          maxLength={5000}
                          value={portalReplies[item.id] || ""}
                          onChange={(event) =>
                            setPortalReplies((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => replyToPortalMessage(item)}
                        >
                          Send reply
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {!portalAttention.loading && !portalAttention.items.length ? (
              <div className="dashboard-empty-state">
                No client portal actions need review.
              </div>
            ) : null}
          </article>

          <article id="attention" className="dashboard-panel">
            <div className="panel-heading">
              <h2>Today / Needs your attention</h2>
              <Link to="/admin/leads" className="dashboard-view-link">
                View all
              </Link>
            </div>
            {attentionItems.length ? (
              <ul className="attention-list compact-list">
                {attentionItems.map((item) => (
                  <li key={item.key} className="attention-item compact-row">
                    <div className="attention-item-copy">
                      <div className="attention-item-topline">
                        <span className="attention-kind">{item.type}</span>
                        <span
                          className={`status-pill ${item.status === "Past Due" || item.reason?.includes("Past Due") ? "warning" : "info"}`}
                        >
                          {item.status || "Active"}
                        </span>
                      </div>
                      <strong>{item.title}</strong>
                      <small>{item.summary}</small>
                      <div className="attention-meta-row">
                        <span>{item.reason}</span>
                        <span>
                          {item.due ? formatDate(item.due) : "No date"}
                        </span>
                      </div>
                    </div>
                    <Link to={item.to} className="dashboard-action-link">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-empty-state">
                Nothing currently requires immediate action.
              </div>
            )}
          </article>
        </div>

        <div className="dashboard-side-column">
          <article className="dashboard-panel">
            <div className="panel-heading">
              <h2>Upcoming schedule</h2>
              <Link to="/admin/appointments" className="dashboard-view-link">
                View calendar
              </Link>
            </div>
            {upcomingAppointments.length ? (
              <ul className="schedule-list compact-list">
                {upcomingAppointments.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="schedule-item compact-row"
                  >
                    <div className="schedule-date-block">
                      <span>
                        {new Date(appointment.date).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="schedule-copy">
                      <strong>{appointment.title}</strong>
                      <small>{appointment.time}</small>
                      <small>
                        {getClientName(snapshot, appointment.clientId)}
                      </small>
                      <small>
                        {appointment.type} · {appointment.serviceName}
                      </small>
                    </div>
                    <span
                      className={`status-pill ${appointment.status === "Confirmed" ? "success" : "info"}`}
                    >
                      {appointment.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-empty-state">
                No appointments in the next 7 days.
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel">
          <div className="panel-heading">
            <h2>Prospect follow-up</h2>
            <Link to="/admin/leads" className="dashboard-view-link">
              View all
            </Link>
          </div>
          {leadQueue.length ? (
            <ul className="mini-list compact-list">
              {leadQueue.map((lead) => (
                <li key={lead.id}>
                  <div>
                    <strong>{lead.name}</strong>
                    <small>
                      {lead.audience} · {lead.serviceInterest}
                    </small>
                  </div>
                  <div className="mini-meta">
                    <span>{formatDate(lead.receivedAt)}</span>
                    <span>{lead.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashboard-empty-state">
              No prospects currently awaiting follow-up.
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading">
            <h2>Active service work</h2>
            <Link to="/admin/services" className="dashboard-view-link">
              View all
            </Link>
          </div>
          {activeServiceWork.length ? (
            <ul className="mini-list compact-list">
              {activeServiceWork.map((engagement) => (
                <li key={engagement.id}>
                  <div>
                    <strong>{engagement.serviceName}</strong>
                    <small>
                      {getClientName(snapshot, engagement.clientId)}
                    </small>
                  </div>
                  <div className="mini-meta">
                    <span>{engagement.status}</span>
                    <span>
                      {engagement.targetDate
                        ? formatDate(engagement.targetDate)
                        : "No target"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashboard-empty-state">No active service work.</div>
          )}
        </article>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel">
          <div className="panel-heading">
            <h2>Documents requiring action</h2>
            <Link to="/admin/documents" className="dashboard-view-link">
              View all
            </Link>
          </div>
          {documentActions.length ? (
            <ul className="mini-list compact-list">
              {documentActions.map((document) => (
                <li key={document.id}>
                  <div>
                    <strong>{document.name}</strong>
                    <small>
                      {getClientName(snapshot, document.clientId)} ·{" "}
                      {document.serviceName}
                    </small>
                  </div>
                  <div className="mini-meta">
                    <span>{document.status}</span>
                    <span>
                      {document.requestedAt
                        ? formatDate(document.requestedAt)
                        : "No date"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashboard-empty-state">
              No documents currently require action.
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading">
            <h2>Billing watch</h2>
            <Link to="/admin/billing" className="dashboard-view-link">
              View billing
            </Link>
          </div>
          <div className="billing-summary-row">
            <div>
              <span className="dashboard-kicker">Open balance</span>
              <strong>{formatCurrency(totalOutstanding)}</strong>
            </div>
            <div>
              <span className="dashboard-kicker">Past due</span>
              <strong>
                {formatCurrency(
                  billingWatch
                    .filter((invoice) => invoice.status === "Past Due")
                    .reduce(
                      (total, invoice) =>
                        total + getInvoiceRemainingBalance(invoice),
                      0,
                    ),
                )}
              </strong>
            </div>
          </div>
          {billingWatch.length ? (
            <ul className="mini-list compact-list">
              {billingWatch.map((invoice) => (
                <li key={invoice.id}>
                  <div>
                    <strong>{invoice.id}</strong>
                    <small>{getClientName(snapshot, invoice.clientId)}</small>
                  </div>
                  <div className="mini-meta">
                    <span>
                      {formatCurrency(getInvoiceRemainingBalance(invoice))}
                    </span>
                    <span>{invoice.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashboard-empty-state">No past-due invoices.</div>
          )}
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-panel">
          <div className="panel-heading">
            <h2>Recent activity</h2>
            <Link to="/admin/reports" className="dashboard-view-link">
              View activity
            </Link>
          </div>
          {recentActivity.length ? (
            <ul className="activity-list compact-list">
              {recentActivity.map((entry) => (
                <li key={entry.id}>
                  <span
                    className={`status-pill ${activityTone[entry.type] || "info"}`}
                  >
                    {entry.type || "Update"}
                  </span>
                  <div>
                    <strong>{entry.summary || entry.eventType}</strong>
                    <small>
                      {entry.actorName || "System"} ·{" "}
                      {formatDate(entry.timestamp)}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dashboard-empty-state">
              No recent operational activity.
            </div>
          )}
        </article>

        <aside className="dashboard-panel">
          <div className="panel-heading">
            <h2>Quick actions</h2>
          </div>
          <div className="quick-actions-grid">
            <Link to="/admin/clients" className="quick-action-link">
              Client management
            </Link>
            <Link to="/admin/appointments" className="quick-action-link">
              Appointments
            </Link>
            <Link
              to="/admin/clients?view=requests"
              className="quick-action-link"
            >
              Client requests
            </Link>
            <Link to="/admin/billing" className="quick-action-link">
              Billing
            </Link>
            <Link to="/admin/services" className="quick-action-link">
              Service work
            </Link>
          </div>
        </aside>
      </section>

      {replacementItem ? (
        <div
          className="replacement-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="replacement-modal">
            <div className="panel-heading replacement-header">
              <h2>Request replacement</h2>
            </div>
            <div className="replacement-context">
              <p>
                <strong>Client:</strong>{" "}
                {replacementItem.client_name || "Client"}
              </p>
              <p>
                <strong>Document:</strong>{" "}
                {replacementItem.title || replacementItem.name || "Document"}
              </p>
            </div>
            <label
              className="replacement-label"
              htmlFor="replacement-request-field"
            >
              Replacement request or explanation
            </label>
            <textarea
              id="replacement-request-field"
              className="replacement-textarea"
              required
              maxLength={500}
              value={replacementNote}
              onChange={(event) => setReplacementNote(event.target.value)}
              placeholder="Explain what should be replaced or resubmitted."
            />
            <div className="replacement-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (!replacementNote.trim()) return;
                  resolvePortalItem(replacementItem, "replacement", {
                    note: replacementNote.trim(),
                  });
                }}
              >
                Send replacement request
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setReplacementItem(null);
                  setReplacementNote("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminDashboardPage;

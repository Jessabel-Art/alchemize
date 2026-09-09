import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
  AlertTriangle,
  Users,
  Receipt,
  CalendarClock,
  CalendarPlus,
  MessageSquareText,
  FileText,
  Briefcase,
  Activity,
  Inbox,
  Settings,
  Send,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { adminStore } from "../../../js/data/admin-store.js";
import { portalAdmin } from "../../services/admin-api.js";
import {
  getOpenInvoiceBalance,
  getInvoiceRemainingBalance,
} from "../../utils/admin-metrics.js";
import { isActiveClient } from "../../utils/client-status.js";
import { AdminDetailDrawer } from "../../components/admin/admin-components.jsx";
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

const activityIcon = {
  lead_status_changed: UserPlus,
  lead_created: UserPlus,
  lead_converted: Users,
  task_created: ClipboardList,
  task_completed: CheckCircle2,
  document_requested: FileText,
  document_received: FileText,
  invoice_status_changed: Receipt,
  invoice_created: Receipt,
  appointment_scheduled: CalendarClock,
  consultation_scheduled: CalendarClock,
  service_status_changed: Briefcase,
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

const isWithinPastDays = (value, limitDays) => {
  const date = safeDate(value);
  if (!date) return false;
  const diffMs = Date.now() - date.getTime();
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

// Compact donut built from stroke-dasharray segments on a circle whose
// circumference is normalized to 100, so each segment's length is just its
// percentage share of the total.
function InvoiceDonut({ segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.total, 0);
  if (!total) {
    return (
      <svg
        viewBox="0 0 42 42"
        className="invoice-donut"
        role="img"
        aria-label="No invoice balance to visualize yet"
      >
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="none"
          stroke="var(--admin-line, #e3e3e3)"
          strokeWidth="4"
        />
      </svg>
    );
  }
  let cumulative = 0;
  return (
    <svg
      viewBox="0 0 42 42"
      className="invoice-donut"
      role="img"
      aria-label={segments
        .filter((segment) => segment.total > 0)
        .map((segment) => `${segment.label} ${formatCurrency(segment.total)}`)
        .join(", ")}
    >
      {segments
        .filter((segment) => segment.total > 0)
        .map((segment) => {
          const pct = (segment.total / total) * 100;
          const circle = (
            <circle
              key={segment.key}
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              className={`invoice-donut-segment accent-${segment.tone}`}
              strokeWidth="4"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={-cumulative}
              transform="rotate(-90 21 21)"
            />
          );
          cumulative += pct;
          return circle;
        })}
    </svg>
  );
}

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
  const [portalQueueOpen, setPortalQueueOpen] = useState(false);
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

  const today = new Date();
  const formattedToday = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const openLeadCount = snapshot.leads.filter(
    (lead) =>
      !["Converted", "Closed / Not Moving Forward"].includes(lead.status),
  ).length;
  const newLeadsThisWeek = snapshot.leads.filter((lead) =>
    isWithinPastDays(lead.receivedAt, 7),
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

  const attentionBreakdown = attentionItems.reduce((totals, item) => {
    const key = item.type;
    totals[key] = (totals[key] || 0) + 1;
    return totals;
  }, {});
  const attentionAccentByType = {
    "Lead follow-up": "info",
    "Task due": "pending",
    "Document review": "attention",
    Invoice: "danger",
    "Client follow-up": "archived",
  };

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
  const pastDueInvoiceRows = snapshot.invoices.filter(
    (invoice) => invoice.status === "Past Due",
  );
  const partiallyPaidInvoiceRows = snapshot.invoices.filter(
    (invoice) => invoice.status === "Partially Paid",
  );
  const paidInvoiceRows = snapshot.invoices.filter(
    (invoice) => invoice.status === "Paid",
  );
  const openOnlyRows = openInvoiceRows.filter(
    (invoice) =>
      invoice.status !== "Past Due" && invoice.status !== "Partially Paid",
  );
  const sumRemaining = (rows) =>
    rows.reduce((sum, invoice) => sum + getInvoiceRemainingBalance(invoice), 0);
  const invoiceBuckets = [
    {
      key: "open",
      label: "Open",
      tone: "info",
      count: openOnlyRows.length,
      total: sumRemaining(openOnlyRows),
    },
    {
      key: "overdue",
      label: "Overdue",
      tone: "danger",
      count: pastDueInvoiceRows.length,
      total: sumRemaining(pastDueInvoiceRows),
    },
    {
      key: "paid",
      label: "Paid",
      tone: "positive",
      count: paidInvoiceRows.length,
      total: paidInvoiceRows.reduce(
        (sum, invoice) => sum + Number(invoice.amount ?? invoice.subtotal ?? 0),
        0,
      ),
    },
    {
      key: "partiallyPaid",
      label: "Partially paid",
      tone: "pending",
      count: partiallyPaidInvoiceRows.length,
      total: sumRemaining(partiallyPaidInvoiceRows),
    },
  ];

  const upcomingAppointments = snapshot.appointments
    .filter(
      (appointment) =>
        !["Completed", "Cancelled"].includes(appointment.status) &&
        isWithinDays(appointment.date, 7),
    )
    .sort(
      (left, right) =>
        new Date(left.date).getTime() - new Date(right.date).getTime(),
    );
  const upcomingPreview = upcomingAppointments.slice(0, 3);

  const billingWatch = openInvoiceRows
    .filter((invoice) => ["Open", "Past Due"].includes(invoice.status))
    .sort(
      (left, right) =>
        new Date(left.dueAt || 0).getTime() -
        new Date(right.dueAt || 0).getTime(),
    );
  const nextInvoice = billingWatch[0] || null;

  const prospectFollowUp = snapshot.leads.filter((lead) =>
    ["New", "Contacted", "Consultation Scheduled"].includes(lead.status),
  );

  const documentsNeedingAction = snapshot.documents.filter(
    (document) => !["Archive"].includes(document.status),
  );
  const documentsOverdueCount = documentsNeedingAction.filter(
    (document) =>
      document.dueDate &&
      new Date(document.dueDate) < new Date() &&
      !["Completed", "Received"].includes(document.status),
  ).length;

  const activeEngagements = snapshot.engagements.filter(
    (engagement) => !["Completed", "Archived"].includes(engagement.status),
  );

  const recentActivity = snapshot.activity.slice(0, 5);
  const activeClientCount = snapshot.clients.filter((client) =>
    isActiveClient(client),
  ).length;

  const kpis = [
    {
      key: "leads",
      icon: UserPlus,
      label: "Open Leads",
      value: openLeadCount,
      detail:
        newLeadsThisWeek > 0
          ? `+${newLeadsThisWeek} this week`
          : "Awaiting qualification",
      to: "/admin/leads",
      tone: "info",
    },
    {
      key: "attention",
      icon: AlertTriangle,
      label: "Needs Attention",
      value: needsAttentionCount,
      detail:
        pastDueInvoiceRows.length > 0
          ? `${pastDueInvoiceRows.length} overdue`
          : "Open work and follow-up",
      to: "/admin/dashboard#attention",
      tone: "attention",
    },
    {
      key: "clients",
      icon: Users,
      label: "Active Clients",
      value: activeClientCount,
      detail: "Current client relationships",
      to: "/admin/clients",
      tone: "positive",
    },
    {
      key: "invoices",
      icon: Receipt,
      label: "Open Invoices",
      value: openInvoiceRows.length,
      detail: `${formatCurrency(totalOutstanding)} outstanding`,
      to: "/admin/billing",
      tone: "pending",
    },
    {
      key: "upcoming",
      icon: CalendarClock,
      label: "Upcoming",
      value: upcomingAppointments.length,
      detail: "Next 7 days",
      to: "/admin/appointments",
      tone: "info",
    },
  ];

  const focusCards = [
    {
      key: "portal",
      icon: MessageSquareText,
      count: portalAttention.items.length,
      label: "Client portal activity",
      detail: portalAttention.loading
        ? "Loading…"
        : portalAttention.items.length
          ? "Awaiting review"
          : "All caught up",
      onOpen: () => setPortalQueueOpen(true),
    },
    {
      key: "prospects",
      icon: UserPlus,
      count: prospectFollowUp.length,
      label: "Prospect follow-up",
      detail: "Pending outreach",
      to: "/admin/leads",
    },
    {
      key: "documents",
      icon: FileText,
      count: documentsNeedingAction.length,
      label: "Documents requiring action",
      detail: "Awaiting review",
      overdue: documentsOverdueCount,
      to: "/admin/documents",
    },
    {
      key: "engagements",
      icon: Briefcase,
      count: activeEngagements.length,
      label: "Active service work",
      detail: "In progress",
      to: "/admin/services",
    },
  ];

  return (
    <div className="portal-page admin-dashboard">
      <header className="portal-page-header admin-dashboard-header">
        <div>
          <span className="section-kicker">Workspace</span>
          <h1>Operations dashboard</h1>
          <p>
            Today&rsquo;s priorities, client activity, and upcoming work at a
            glance.
          </p>
        </div>
        <div className="dashboard-header-date">{formattedToday}</div>
      </header>

      <section className="dashboard-kpi-strip" aria-label="Summary metrics">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.key}
              to={kpi.to}
              className={`dashboard-kpi-card tone-${kpi.tone}`}
            >
              <span className="dashboard-kpi-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="dashboard-kpi-copy">
                <strong>{kpi.value}</strong>
                <span>{kpi.label}</span>
                <small>{kpi.detail}</small>
              </span>
              <ChevronRight
                size={14}
                className="dashboard-kpi-chevron"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </section>

      <section className="dashboard-command-grid">
        <div className="dashboard-main-column">
          <article id="attention" className="dashboard-panel">
            <div className="panel-heading">
              <h2>
                Today&rsquo;s focus
                {attentionItems.length ? (
                  <span className="panel-count">{attentionItems.length}</span>
                ) : null}
              </h2>
              <Link to="/admin/leads" className="dashboard-view-link">
                View all <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
            {attentionItems.length ? (
              <>
                <div
                  className="dashboard-distribution-bar"
                  role="img"
                  aria-label={Object.entries(attentionBreakdown)
                    .map(([type, count]) => `${count} ${type}`)
                    .join(", ")}
                >
                  {Object.entries(attentionBreakdown).map(([type, count]) => (
                    <span
                      key={type}
                      className={`dashboard-distribution-segment accent-${attentionAccentByType[type] || "info"}`}
                      style={{ flexGrow: count }}
                    />
                  ))}
                </div>
                <ul className="dashboard-distribution-legend">
                  {Object.entries(attentionBreakdown).map(([type, count]) => (
                    <li key={type}>
                      <span
                        className={`dashboard-distribution-dot accent-${attentionAccentByType[type] || "info"}`}
                      />
                      {count} {type}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="dashboard-empty-state">
                Nothing currently requires immediate action.
              </div>
            )}
          </article>

          <section
            className="dashboard-focus-cards"
            aria-label="Operational focus areas"
          >
            {focusCards.map((card) => {
              const Icon = card.icon;
              const CardTag = card.to ? Link : "button";
              const tagProps = card.to
                ? { to: card.to }
                : { type: "button", onClick: card.onOpen };
              return (
                <CardTag
                  key={card.key}
                  className="dashboard-focus-card"
                  {...tagProps}
                >
                  <span className="dashboard-focus-top">
                    <span className="dashboard-focus-icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="dashboard-focus-label">{card.label}</span>
                  </span>
                  <strong className="dashboard-focus-count">
                    {card.count}
                  </strong>
                  <span className="dashboard-focus-detail">
                    <small>{card.detail}</small>
                    {card.overdue ? (
                      <small className="dashboard-focus-overdue">
                        <AlertTriangle size={11} aria-hidden="true" />
                        {card.overdue} overdue
                      </small>
                    ) : null}
                  </span>
                  <span className="dashboard-focus-view">
                    View details <ArrowRight size={12} aria-hidden="true" />
                  </span>
                </CardTag>
              );
            })}
          </section>

          <div className="dashboard-lower-row">
            <article className="dashboard-panel">
              <div className="panel-heading">
                <h2>Recent activity</h2>
                <Link to="/admin/reports" className="dashboard-view-link">
                  View all <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
              {recentActivity.length ? (
                <ul className="activity-list compact-list">
                  {recentActivity.map((entry) => {
                    const Icon = activityIcon[entry.type] || Activity;
                    return (
                      <li key={entry.id}>
                        <span className="activity-icon">
                          <Icon size={14} aria-hidden="true" />
                        </span>
                        <div>
                          <strong>{entry.summary || entry.eventType}</strong>
                          <small>
                            {entry.clientId
                              ? getClientName(snapshot, entry.clientId)
                              : entry.actorName || "System"}{" "}
                            · {formatDate(entry.timestamp)}
                          </small>
                        </div>
                        <span
                          className={`status-pill ${activityTone[entry.type] || "info"}`}
                        >
                          {entry.type
                            ? entry.type.replaceAll("_", " ")
                            : "Update"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="dashboard-empty-state">
                  No recent operational activity.
                </div>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="panel-heading">
                <h2>Invoices at a glance</h2>
                <Link to="/admin/billing" className="dashboard-view-link">
                  View billing <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
              <div className="invoice-glance-body">
                <div className="invoice-donut-wrap">
                  <InvoiceDonut segments={invoiceBuckets} />
                  <div className="invoice-donut-center">
                    <strong>{formatCurrency(totalOutstanding)}</strong>
                    <span>Open balance</span>
                  </div>
                </div>
                <ul className="invoice-legend">
                  {invoiceBuckets.map((bucket) => (
                    <li key={bucket.key}>
                      <span
                        className={`invoice-legend-dot accent-${bucket.tone}`}
                      />
                      <span className="invoice-legend-label">
                        {bucket.label}
                      </span>
                      <span className="invoice-legend-count">
                        {bucket.count}
                      </span>
                      <span className="invoice-legend-amount">
                        {formatCurrency(bucket.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {nextInvoice ? (
                <div className="invoice-preview">
                  <div>
                    <strong>{nextInvoice.id}</strong>
                    <small>
                      {getClientName(snapshot, nextInvoice.clientId)}
                    </small>
                  </div>
                  <div className="invoice-preview-meta">
                    <span>
                      {formatCurrency(getInvoiceRemainingBalance(nextInvoice))}
                    </span>
                    <small>
                      {nextInvoice.dueAt
                        ? formatDate(nextInvoice.dueAt)
                        : "No due date"}
                    </small>
                  </div>
                  <span
                    className={`status-pill ${nextInvoice.status === "Past Due" ? "danger" : "info"}`}
                  >
                    {nextInvoice.status}
                  </span>
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  No open invoices right now.
                </div>
              )}
            </article>
          </div>
        </div>

        <aside
          className="dashboard-side-column"
          aria-label="Operations overview"
        >
          <article className="dashboard-panel">
            <div className="panel-heading">
              <h2>
                Upcoming schedule
                {upcomingAppointments.length ? (
                  <span className="panel-count">
                    {upcomingAppointments.length}
                  </span>
                ) : null}
              </h2>
              <Link to="/admin/appointments" className="dashboard-view-link">
                View calendar
              </Link>
            </div>
            {upcomingPreview.length ? (
              <ul className="schedule-list compact-list">
                {upcomingPreview.map((appointment) => (
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
                      <strong>
                        <span
                          className={`schedule-status-dot ${appointment.status === "Confirmed" ? "accent-positive" : "accent-info"}`}
                          aria-hidden="true"
                        />
                        {appointment.title}
                      </strong>
                      <small>{appointment.time}</small>
                      <small>
                        {getClientName(snapshot, appointment.clientId)}
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

          <aside className="dashboard-quick-actions">
            <div className="panel-heading">
              <h2>Quick actions</h2>
            </div>
            <div className="quick-actions-grid">
              <Link to="/admin/clients" className="quick-action-link">
                <span className="quick-action-icon">
                  <UserPlus size={14} aria-hidden="true" />
                </span>
                Add client
              </Link>
              <Link to="/admin/appointments" className="quick-action-link">
                <span className="quick-action-icon">
                  <CalendarPlus size={14} aria-hidden="true" />
                </span>
                New appointment
              </Link>
              <Link to="/admin/billing" className="quick-action-link">
                <span className="quick-action-icon">
                  <Receipt size={14} aria-hidden="true" />
                </span>
                Create invoice
              </Link>
              <Link to="/admin/client-requests" className="quick-action-link">
                <span className="quick-action-icon">
                  <Inbox size={14} aria-hidden="true" />
                </span>
                Client requests
              </Link>
              <Link to="/admin/services" className="quick-action-link">
                <span className="quick-action-icon">
                  <Settings size={14} aria-hidden="true" />
                </span>
                Manage services
              </Link>
              <Link to="/admin/communications" className="quick-action-link">
                <span className="quick-action-icon">
                  <Send size={14} aria-hidden="true" />
                </span>
                Compose message
              </Link>
            </div>
          </aside>

          <aside className="dashboard-brand-note">
            <Sparkles size={16} aria-hidden="true" />
            <div>
              <strong>Make a bigger impact</strong>
              <p>Keep clients moving forward, one step at a time.</p>
            </div>
          </aside>
        </aside>
      </section>

      <AdminDetailDrawer
        open={portalQueueOpen}
        title="Client portal activity — items awaiting review"
        onClose={() => setPortalQueueOpen(false)}
        className="portal-queue-drawer"
      >
        <div className="portal-client-attention">
          {portalAttention.error ? (
            <p className="dashboard-empty-state" role="alert">
              {portalAttention.error}
            </p>
          ) : null}
          {portalAttention.loading ? (
            <div className="dashboard-empty-state">Loading client actions…</div>
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
                    {item.kind === "task_action" || item.kind === "message" ? (
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
        </div>
      </AdminDetailDrawer>

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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { portalApi } from "../../services/portal-api.js";
import "./portal.css";

const formatCurrency = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(value || 0),
  );

const formatDate = (value, includeTime = false) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(
    undefined,
    includeTime
      ? {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      : { month: "short", day: "numeric", year: "numeric" },
  );
};

function ClientPortalDashboardPage() {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const [services, setServices] = useState(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    portalApi
      .services()
      .then((data) => active && setServices(data.items || []))
      .catch(() => {});
    portalApi
      .dashboard()
      .then((data) => active && setState({ status: "ready", data, error: "" }))
      .catch(
        (error) =>
          active &&
          setState({ status: "error", data: null, error: error.message }),
      );
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="portal-page">
        <div className="portal-empty-state">
          Loading your service workspace...
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="portal-page">
        <div className="portal-empty-state" role="alert">
          {state.error}
        </div>
      </div>
    );
  }

  const {
    client,
    summary,
    next_task: nextTask,
    next_appointment: nextAppointment,
    next_invoice: nextInvoice,
    recent_activity: activity = [],
    recent_communication: recentCommunication,
    attention = [],
    onboarding,
  } = state.data;
  const navigation = [
    {
      label: "Active services",
      value: summary.active_services,
      detail: "Current service relationships",
      to: "/client-portal/services",
    },
    {
      label: "Tasks requiring action",
      value: summary.tasks_requiring_action,
      detail: "Client-visible tasks awaiting you",
      to: "/client-portal/tasks",
    },
    {
      label: "Documents needed",
      value: summary.documents_needed,
      detail: "Outstanding client-visible requests",
      to: "/client-portal/documents",
    },
    {
      label: "Upcoming appointments",
      value: summary.upcoming_appointments,
      detail: "Scheduled client appointments",
      to: "/client-portal/appointments",
    },
    {
      label: "Messages",
      value: summary.unread_messages,
      detail: "Unread client messages",
      to: "/client-portal/messages",
    },
    {
      label: "Open balance",
      value: formatCurrency(summary.open_balance),
      detail: summary.has_past_due
        ? "Past-due balance needs attention"
        : "Issued invoices remaining",
      to: "/client-portal/billing",
    },
  ];

  return (
    <div className="portal-page client-workspace">
      <header className="portal-page-header">
        <div>
          <span className="section-kicker">Client portal</span>
          <h1>Your service workspace</h1>
        </div>
        <p>
          <strong>{client.preferred_name || client.display_name}</strong>
          <br />
          Your services, next steps, and account at a glance.
        </p>
      </header>

      <section className="portal-summary-grid" aria-label="Account summary">
        {navigation.map((item) => (
          <Link
            className={`portal-summary-item ${((item.to.endsWith("tasks") || item.to.endsWith("documents") || item.to.endsWith("messages")) && Number(item.value) > 0) || (item.to.endsWith("billing") && summary.has_past_due) ? "portal-metric-attention" : ""}`}
            to={item.to}
            key={item.label}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </Link>
        ))}
      </section>

      <div className="portal-dashboard-grid">
        <div className="portal-dashboard-main">
          {" "}
          {onboarding && !onboarding.dismissed && !onboardingDismissed ? (
            <section
              className="portal-onboarding"
              aria-labelledby="getting-started-title"
            >
              <div className="portal-section-heading">
                <div>
                  <span className="section-kicker">Getting started</span>
                  <h2 id="getting-started-title">Set up your workspace</h2>
                </div>
                <button
                  type="button"
                  className="portal-action-button"
                  onClick={async () => {
                    await portalApi.dismissOnboarding();
                    setOnboardingDismissed(true);
                  }}
                >
                  Dismiss checklist
                </button>
              </div>
              <div className="portal-setup-progress">
                <span>
                  {onboarding.steps.filter((step) => step.complete).length} of{" "}
                  {onboarding.steps.length} complete
                </span>
                <progress
                  aria-label="Workspace setup progress"
                  value={
                    onboarding.steps.filter((step) => step.complete).length
                  }
                  max={onboarding.steps.length || 1}
                />
              </div>
              <ul className="portal-checklist">
                {onboarding.steps.map((step) => (
                  <li key={step.key}>
                    <span aria-hidden="true">
                      {step.complete ? "âœ“" : "â—‹"}
                    </span>
                    <Link to={step.to}>{step.label}</Link>
                    <small>{step.complete ? "Complete" : "To do"}</small>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section
            className="portal-attention"
            aria-labelledby="attention-title"
          >
            <div className="portal-section-heading">
              <div>
                <span className="section-kicker">Attention needed</span>
                <h2 id="attention-title">Your next actions</h2>
              </div>
            </div>
            {attention.length ? (
              <ul className="portal-attention-list">
                {attention.map((item, index) => (
                  <li key={`${item.kind}-${item.title}-${index}`}>
                    <span
                      className={`portal-priority priority-${item.priority}`}
                    >
                      {item.priority === 1
                        ? "Past due"
                        : item.priority <= 2
                          ? "Action needed"
                          : "Upcoming"}
                    </span>
                    <div>
                      <small className="portal-action-type">
                        {item.kind?.replaceAll("_", " ")}
                      </small>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </div>
                    <Link to={item.to}>Review</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="portal-empty-state">
                Nothing needs your immediate attention.
              </div>
            )}
          </section>
          {!attention.some((item) => item.kind === "task") ? (
            <article className="portal-record-panel">
              <span className="section-kicker">Next action</span>
              {nextTask ? (
                <>
                  <h2>{nextTask.title}</h2>
                  <p>
                    {nextTask.description ||
                      "A client-facing task is ready for your attention."}
                  </p>
                  <small>Due {formatDate(nextTask.due_date)}</small>
                </>
              ) : (
                <div className="portal-empty-state">
                  No tasks require your attention.
                </div>
              )}
              <Link to="/client-portal/tasks">View tasks</Link>
            </article>
          ) : null}
          <section className="portal-service-summary">
            <div className="portal-section-heading">
              <h2>Active services</h2>
              <Link to="/client-portal/services">View services</Link>
            </div>
            {services === null ? (
              <p className="portal-empty-state">
                View your service engagements in Services.
              </p>
            ) : services.filter(
                (item) => !["completed", "archived"].includes(item.status),
              ).length ? (
              <ul className="portal-record-list">
                {services
                  .filter(
                    (item) => !["completed", "archived"].includes(item.status),
                  )
                  .map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <small>Started {formatDate(item.start_date)}</small>
                      </div>
                      <div className="portal-record-meta">
                        <span>{item.status?.replaceAll("_", " ")}</span>
                        <Link to="/client-portal/services">Review service</Link>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="portal-empty-state">
                No active services are currently listed.
              </p>
            )}
          </section>{" "}
          <article className="portal-record-panel">
            <span className="section-kicker">Recent communication</span>
            {recentCommunication ? (
              <>
                <h2>{recentCommunication.subject}</h2>
                <p>{recentCommunication.latest_message}</p>
                <small>
                  {formatDate(recentCommunication.last_message_at, true)}
                </small>
              </>
            ) : (
              <div className="portal-empty-state">No conversations yet.</div>
            )}
            <Link to="/client-portal/messages">View messages</Link>
          </article>{" "}
          <section
            className="portal-activity"
            aria-labelledby="client-activity-title"
          >
            <div className="portal-section-heading">
              <div>
                <span className="section-kicker">Recent updates</span>
                <h2 id="client-activity-title">Client-visible activity</h2>
              </div>
            </div>
            {activity.length ? (
              <ul className="portal-record-list">
                {activity.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.summary}</strong>
                      <small>{formatDate(item.created_at, true)}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="portal-empty-state">
                No client-visible activity is currently listed.
              </div>
            )}
          </section>
        </div>
        <aside
          className="portal-dashboard-rail"
          aria-label="Workspace essentials"
        >
          {" "}
          <article className="portal-record-panel">
            <span className="section-kicker">Next appointment</span>
            {nextAppointment ? (
              <>
                <h2>{nextAppointment.appointment_type}</h2>
                <p>{formatDate(nextAppointment.scheduled_at, true)}</p>
                <small>{nextAppointment.status}</small>
              </>
            ) : (
              <div className="portal-empty-state">
                No upcoming appointments.
              </div>
            )}
            <Link to="/client-portal/appointments">View appointments</Link>
          </article>{" "}
          <article className="portal-record-panel">
            <span className="section-kicker">Billing summary</span>
            <strong className="portal-balance">
              {formatCurrency(summary.open_balance)}
            </strong>
            {nextInvoice ? (
              <>
                <h2>{nextInvoice.invoice_number}</h2>
                <p>
                  {formatCurrency(
                    nextInvoice.outstanding_balance,
                    nextInvoice.currency,
                  )}
                </p>
                <small>Due {formatDate(nextInvoice.due_date)}</small>
              </>
            ) : (
              <div className="portal-empty-state">No open invoices.</div>
            )}
            <Link to="/client-portal/billing">View billing</Link>
          </article>
          <section className="portal-record-panel">
            <span className="section-kicker">Documents needed</span>
            <h2>{summary.documents_needed}</h2>
            <p>
              {summary.documents_needed
                ? "Requested files awaiting your upload."
                : "No outstanding document requests."}
            </p>
            <Link to="/client-portal/documents">View documents</Link>
          </section>
          <nav className="portal-quick-actions" aria-label="Quick actions">
            <h2>Quick actions</h2>
            <Link to="/client-portal/services">Request a service</Link>
            <Link to="/client-portal/documents">Upload a document</Link>
            <Link to="/client-portal/messages">Send a message</Link>
            <Link to="/client-portal/profile">Manage profile</Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}

export default ClientPortalDashboardPage;

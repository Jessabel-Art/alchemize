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
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  useEffect(() => {
    let active = true;
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
          A clear view of the services and responsibilities currently connected
          to {client.preferred_name || client.display_name}.
        </p>
      </header>

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
          <ul className="portal-checklist">
            {onboarding.steps.map((step) => (
              <li key={step.key}>
                <span aria-hidden="true">{step.complete ? "âœ“" : "â—‹"}</span>
                <Link to={step.to}>{step.label}</Link>
                <small>{step.complete ? "Complete" : "To do"}</small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="portal-attention" aria-labelledby="attention-title">
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
                <span className={`portal-priority priority-${item.priority}`}>
                  {item.priority === 1
                    ? "Past due"
                    : item.priority <= 2
                      ? "Action needed"
                      : "Upcoming"}
                </span>
                <div>
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

      <section className="portal-summary-grid" aria-label="Account summary">
        {navigation.map((item) => (
          <Link className="portal-summary-item" to={item.to} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </Link>
        ))}
      </section>

      <section className="portal-priority-grid" aria-label="Next actions">
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
        </article>
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
        <article className="portal-record-panel">
          <span className="section-kicker">Next appointment</span>
          {nextAppointment ? (
            <>
              <h2>{nextAppointment.appointment_type}</h2>
              <p>{formatDate(nextAppointment.scheduled_at, true)}</p>
              <small>{nextAppointment.status}</small>
            </>
          ) : (
            <div className="portal-empty-state">No upcoming appointments.</div>
          )}
          <Link to="/client-portal/appointments">View appointments</Link>
        </article>
        <article className="portal-record-panel">
          <span className="section-kicker">Next invoice</span>
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
      </section>

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
            {activity.map((item) => (
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
  );
}

export default ClientPortalDashboardPage;

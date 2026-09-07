import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileText,
  MessageSquareText,
  ReceiptText,
  Upload,
  UserRound,
} from "lucide-react";
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

const greetingFor = (name) => {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 18) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
};

const actionIconMap = {
  task: FileText,
  document: Upload,
  intake: Briefcase,
  payment: ReceiptText,
  message: MessageSquareText,
  appointment: CalendarClock,
  service: Briefcase,
};

const actionLabelMap = {
  task: "Review update",
  document: "Upload document",
  intake: "Continue intake",
  payment: "Review invoice",
  message: "Open message",
  appointment: "View appointment",
  service: "Review service",
};

function ClientPortalDashboardPage() {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const [services, setServices] = useState([]);
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
    attention = [],
    onboarding,
  } = state.data;

  const name =
    client?.preferred_name || client?.display_name?.split(" ")[0] || "there";
  const activeServices = services.filter(
    (item) => !["completed", "archived"].includes(item.status),
  );
  const onboardingIncomplete =
    onboarding &&
    !onboarding.dismissed &&
    onboarding.steps?.some((step) => !step.complete);
  const attentionItems =
    attention.length > 0
      ? attention
      : nextTask
        ? [
            {
              kind: "task",
              title: nextTask.title,
              detail: nextTask.description || "Client action required",
              priority: 2,
              to: "/client-portal/tasks-and-documents",
            },
          ]
        : [];

  return (
    <div className="portal-page client-workspace">
      <header className="portal-page-header">
        <div>
          <span className="section-kicker">Client portal</span>
          <h1>Your service workspace</h1>
        </div>
        <p>
          {greetingFor(name)}. Here&apos;s what&apos;s happening with your
          Alchemize account.
        </p>
      </header>

      <div className="portal-dashboard-grid">
        <div className="portal-dashboard-main">
          {onboardingIncomplete && !onboardingDismissed ? (
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
                  className="portal-action-button portal-quiet-button"
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
                      {step.complete ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </span>
                    <Link to={step.to}>{step.label}</Link>
                    <small>{step.complete ? "Complete" : "To do"}</small>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            className="portal-action-hero"
            aria-labelledby="action-required-heading"
          >
            <div className="portal-section-heading">
              <div className="portal-action-hero-copy">
                <span className="portal-hero-icon" aria-hidden="true">
                  <Bell size={18} />
                </span>
                <div>
                  <span className="section-kicker">Action required</span>
                  <h2 id="action-required-heading">Action required</h2>
                </div>
              </div>
              <Link
                to="/client-portal/tasks-and-documents"
                className="portal-inline-link"
              >
                View all tasks &amp; documents
                <ArrowRight size={14} />
              </Link>
            </div>

            {attentionItems.length ? (
              <div className="portal-action-list">
                {attentionItems.slice(0, 3).map((item, index) => {
                  const Icon = actionIconMap[item.kind] || Briefcase;
                  const actionLabel =
                    item.kind === "document" &&
                    item.title.toLowerCase().includes("document")
                      ? "Upload document"
                      : actionLabelMap[item.kind] || "Review update";
                  return (
                    <div
                      className="portal-action-row"
                      key={`${item.kind}-${item.title}-${index}`}
                    >
                      <div className="portal-action-icon" aria-hidden="true">
                        <Icon size={18} />
                      </div>
                      <div className="portal-action-main">
                        <div className="portal-action-title-row">
                          <strong>{item.title}</strong>
                          <span className="portal-status-badge">
                            {item.priority === 1
                              ? "Past due"
                              : item.priority <= 2
                                ? "Action needed"
                                : "Upcoming"}
                          </span>
                        </div>
                        <div className="portal-action-meta">
                          <span>
                            {item.detail || item.kind?.replaceAll("_", " ")}
                          </span>
                          {item.to ? (
                            <Link to={item.to}>{actionLabel}</Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="portal-empty-positive-state">
                <strong>You&apos;re all caught up.</strong>
                <p>Nothing needs your attention right now.</p>
              </div>
            )}
          </section>

          <section
            className="portal-service-summary"
            aria-labelledby="your-services-heading"
          >
            <div className="portal-section-heading">
              <div>
                <span className="section-kicker">Your services</span>
                <h2 id="your-services-heading">Your services</h2>
              </div>
              <Link to="/client-portal/services" className="portal-inline-link">
                View all services
                <ArrowRight size={14} />
              </Link>
            </div>
            <p className="portal-subhead">
              Here are the services you&apos;re working with us on.
            </p>

            {activeServices.length ? (
              <div className="portal-service-card-grid">
                {activeServices.map((item) => {
                  const statusLabel =
                    item.status === "in_progress"
                      ? "Preparing"
                      : item.status?.replaceAll("_", " ") || "Active";
                  const defaultNextStep =
                    item.status === "in_progress"
                      ? "We are reviewing your submitted information and will follow up soon."
                      : "We will let you know if anything is needed.";
                  const nextStep = item.assigned_contact
                    ? `Assigned to ${item.assigned_contact}`
                    : defaultNextStep;
                  return (
                    <article className="portal-service-card" key={item.id}>
                      <div className="portal-service-card-top">
                        <div className="portal-service-icon" aria-hidden="true">
                          <Briefcase size={18} />
                        </div>
                        <span className="portal-status-badge soft">
                          {statusLabel}
                        </span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.description || "Service in progress."}</p>
                      <dl className="portal-service-meta">
                        <div>
                          <dt>Started</dt>
                          <dd>{formatDate(item.start_date)}</dd>
                        </div>
                        <div>
                          <dt>Current phase</dt>
                          <dd>
                            {item.service_names?.[0] ||
                              item.status?.replaceAll("_", " ") ||
                              "In progress"}
                          </dd>
                        </div>
                      </dl>
                      <div className="portal-service-note">
                        <strong>Next step from Alchemize</strong>
                        <p>{nextStep}</p>
                      </div>
                      <div className="portal-service-actions">
                        <Link
                          to="/client-portal/tasks-and-documents"
                          className="portal-secondary-link"
                        >
                          View in Tasks &amp; Documents
                        </Link>
                        <Link
                          to="/client-portal/services"
                          className="portal-primary-link"
                        >
                          View service
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="portal-empty-state">
                No active services are currently listed.
              </div>
            )}
          </section>

          <section
            className="portal-activity"
            aria-labelledby="recent-activity-heading"
          >
            <div className="portal-section-heading">
              <div>
                <span className="section-kicker">Recent activity</span>
                <h2 id="recent-activity-heading">Recent activity</h2>
              </div>
              <Link to="/client-portal/messages" className="portal-inline-link">
                View all activity
                <ArrowRight size={14} />
              </Link>
            </div>
            <p className="portal-subhead">
              Your latest updates and communications.
            </p>
            {activity.length ? (
              <ul className="portal-activity-list">
                {activity.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <div className="portal-activity-icon" aria-hidden="true">
                      {item.summary.toLowerCase().includes("message") ? (
                        <MessageSquareText size={16} />
                      ) : item.summary.toLowerCase().includes("upload") ? (
                        <Upload size={16} />
                      ) : item.summary.toLowerCase().includes("submitted") ||
                        item.summary.toLowerCase().includes("intake") ? (
                        <FileText size={16} />
                      ) : (
                        <Briefcase size={16} />
                      )}
                    </div>
                    <div className="portal-activity-copy">
                      <strong>{item.summary}</strong>
                      <small>{formatDate(item.created_at, true)}</small>
                    </div>
                    <ArrowRight size={14} aria-hidden="true" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="portal-empty-state">
                No recent activity is currently listed.
              </div>
            )}
          </section>
        </div>

        <aside
          className="portal-dashboard-rail"
          aria-label="Workspace essentials"
        >
          <article className="portal-record-panel portal-side-panel">
            <div className="portal-side-header">
              <span className="section-kicker">Next appointment</span>
              <div className="portal-side-icon" aria-hidden="true">
                <CalendarClock size={18} />
              </div>
            </div>
            {nextAppointment ? (
              <>
                <h2>{nextAppointment.appointment_type || "Consultation"}</h2>
                <p>{formatDate(nextAppointment.scheduled_at, true)}</p>
                <small>
                  {nextAppointment.meeting_method ||
                    nextAppointment.location_type ||
                    "Meeting scheduled"}
                </small>
              </>
            ) : (
              <>
                <p>No upcoming appointments.</p>
              </>
            )}
            <Link to="/client-portal/appointments" className="portal-side-link">
              View appointments
            </Link>
          </article>

          <article className="portal-record-panel portal-side-panel">
            <div className="portal-side-header">
              <span className="section-kicker">Account summary</span>
              <div className="portal-side-icon" aria-hidden="true">
                <ReceiptText size={18} />
              </div>
            </div>
            {nextInvoice ? (
              <>
                <h2 className="portal-balance">
                  {formatCurrency(
                    summary.open_balance ||
                      nextInvoice.outstanding_balance ||
                      0,
                  )}
                </h2>
                <p>{`Invoice ${nextInvoice.invoice_number}`}</p>
                <small>{`Due ${formatDate(nextInvoice.due_date)}`}</small>
              </>
            ) : (
              <>
                <h2 className="portal-balance account-good">
                  Account in good standing
                </h2>
                <p>No open invoices.</p>
              </>
            )}
            <Link to="/client-portal/billing" className="portal-side-link">
              View billing
            </Link>
          </article>

          <nav className="portal-quick-actions" aria-label="Quick actions">
            <div className="portal-quick-header">
              <span className="section-kicker">Quick actions</span>
              <h2>Quick actions</h2>
            </div>
            <div className="portal-quick-grid">
              <Link
                className="portal-quick-action-tile"
                to="/client-portal/services"
              >
                <span className="portal-tile-icon" aria-hidden="true">
                  <Briefcase size={18} />
                </span>
                <span className="portal-tile-copy">
                  <strong>Request a service</strong>
                  <small>Explore services or tell us what you need.</small>
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link
                className="portal-quick-action-tile"
                to="/client-portal/tasks-and-documents"
              >
                <span className="portal-tile-icon" aria-hidden="true">
                  <Upload size={18} />
                </span>
                <span className="portal-tile-copy">
                  <strong>Upload a document</strong>
                  <small>Send us a file securely.</small>
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link
                className="portal-quick-action-tile"
                to="/client-portal/messages"
              >
                <span className="portal-tile-icon" aria-hidden="true">
                  <MessageSquareText size={18} />
                </span>
                <span className="portal-tile-copy">
                  <strong>Send a message</strong>
                  <small>Get in touch with our team.</small>
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link
                className="portal-quick-action-tile"
                to="/client-portal/appointments"
              >
                <span className="portal-tile-icon" aria-hidden="true">
                  <CalendarClock size={18} />
                </span>
                <span className="portal-tile-copy">
                  <strong>Appointments</strong>
                  <small>View or schedule a meeting.</small>
                </span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
}

export default ClientPortalDashboardPage;

import { useCallback, useEffect, useMemo, useState } from "react";
import { portalApi } from "../../services/portal-api.js";
import { auth } from "../../services/admin-api.js";
import "./portal.css";
import "./portal-messages.css";
import "./client-engagement-dashboard.css";
import ClientAppointments from "./ClientAppointments.jsx";
import TasksDocumentsWorkspace from "./TasksDocumentsWorkspace.jsx";
import ClientBilling from "./ClientBilling.jsx";
import ServiceFileDocument from "./ServiceFileDocument.jsx";
import { ReviewDocumentViewer } from "../../components/admin/review-documents.jsx";

const pageContent = {
  services: [
    "My services",
    "Services",
    "Review the services active in your account and the status of each current engagement.",
    "No active services are currently listed.",
  ],
  tasks: [
    "Tasks",
    "Tasks",
    "See and respond to client-facing action items connected to your active service work.",
    "No tasks require your attention.",
  ],
  "tasks-and-documents": [
    "Tasks & Documents",
    "Tasks & Documents",
    "Complete your assigned tasks and provide requested documents. Your progress helps us move your service forward.",
    "No tasks or document requests require your attention.",
  ],
  documents: [
    "Documents",
    "Documents",
    "Respond securely to requested documents and review shared document status.",
    "No outstanding document requests.",
  ],
  appointments: [
    "Appointments",
    "Appointments",
    "Book, manage, and stay on track.",
    "No upcoming appointments.",
  ],
  messages: [
    "Messages",
    "Messages",
    "Communicate securely with the Alchemize team in client-specific threads.",
    "No messages are currently listed.",
  ],
  billing: [
    "Billing",
    "Billing",
    "Review issued invoices, recorded payments, and your current open balance.",
    "No open invoices.",
  ],
  profile: [
    "Profile",
    "Profile",
    "Update permitted contact information or submit sensitive changes for review.",
    "No profile information is currently available.",
  ],
};

const labels = {
  not_started: "Not started",
  in_progress: "In progress",
  waiting_on_client: "Waiting on you",
  waiting_on_alchemize: "Waiting on Alchemize",
  completed: "Completed",
  archived: "Archived",
  awaiting_upload: "Upload needed",
  replacement_requested: "Replacement requested",
  received: "Uploaded — under review",
  under_review: "Under review by Alchemize",
  accepted: "Accepted — complete",
  requested: "Upload needed",
  shared: "Shared",
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  partially_paid: "Partially paid",
  past_due: "Past due",
  paid: "Paid",
  open: "Open",
  action_needed: "Action needed",
};
const labelFor = (value) =>
  labels[value] ||
  String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
const formatDate = (value, time = false) => {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(
    undefined,
    time
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
const formatCurrency = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(value || 0),
  );

function EmptyState({ children }) {
  return <div className="portal-empty-state">{children}</div>;
}
function Feedback({ state }) {
  if (!state?.message) return null;
  return (
    <p
      className={`portal-feedback ${state.type}`}
      role={state.type === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}
function ActionButton({ children, busy, ...props }) {
  return (
    <button
      type="button"
      className="portal-action-button"
      disabled={busy}
      {...props}
    >
      {busy ? "Working…" : children}
    </button>
  );
}

function PortalRecordsPage({ resource, engagementId = null }) {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState("");
  const content = pageContent[resource];
  const load = useCallback(async () => {
    // Only show the full-page loading state on the very first fetch for
    // this resource. A refetch that follows a mutation (via `run()`) keeps
    // the previously loaded data in place instead of unmounting the
    // resource view -- unmounting would wipe any local UI state a resource
    // component keeps (e.g. which conversation is open in Messages).
    setState((current) => ({
      status: current.data ? "ready" : "loading",
      data: current.data,
      error: "",
    }));
    try {
      if (resource === "tasks-and-documents") {
        const [tasks, documents, intakes, services] = await Promise.all([
          portalApi.tasks(),
          portalApi.documents(),
          portalApi.intakes(),
          portalApi.services().catch(() => ({ items: [] })),
        ]);
        setState({
          status: "ready",
          data: {
            tasks: tasks.items || [],
            documents: documents.items || [],
            intakes: intakes?.items || [],
            services: services.items || [],
          },
          error: "",
        });
        return;
      }

      if (resource === "services" && engagementId) {
        setState({
          status: "ready",
          data: await portalApi.service(engagementId),
          error: "",
        });
        return;
      }

      setState({
        status: "ready",
        data: await portalApi[resource](),
        error: "",
      });
    } catch (error) {
      setState({ status: "error", data: null, error: error.message });
    }
  }, [resource, engagementId]);
  useEffect(() => {
    load();
  }, [load]);
  const run = useCallback(
    async (key, operation, success) => {
      setBusy(key);
      setFeedback(null);
      try {
        await operation();
        setFeedback({ type: "success", message: success });
        await load();
      } catch (error) {
        setFeedback({ type: "error", message: error.message });
      } finally {
        setBusy("");
      }
    },
    [load],
  );
  const notify = useCallback(
    (type, message) => setFeedback({ type, message }),
    [],
  );
  const groups = useMemo(() => {
    if (resource === "tasks-and-documents") return [];
    return groupRecords(resource, state.data?.items || []);
  }, [resource, state.data]);

  return (
    <div
      className={`portal-page client-records-page portal-resource-${resource}`}
    >
      <header className="portal-page-header">
        <div>
          <span className="section-kicker">{content[0]}</span>
          <h1>{content[1]}</h1>
        </div>
        <p>{content[2]}</p>
      </header>
      <Feedback state={feedback} />
      {state.status === "loading" ? (
        <EmptyState>Loading {content[1].toLowerCase()}…</EmptyState>
      ) : null}
      {state.status === "error" ? (
        <div className="portal-empty-state" role="alert">
          {state.error}
        </div>
      ) : null}
      {state.status === "ready" ? (
        <ResourceContent
          resource={resource}
          data={state.data}
          groups={groups}
          empty={content[3]}
          busy={busy}
          run={run}
          notify={notify}
        />
      ) : null}
    </div>
  );
}

function groupRecords(resource, items) {
  if (resource === "tasks")
    return ["waiting_on_client", "in_progress", "not_started", "completed"]
      .map((status) => ({
        label: labelFor(status),
        items: items.filter((item) =>
          status === "in_progress"
            ? ["in_progress", "waiting_on_alchemize"].includes(item.status)
            : item.status === status,
        ),
      }))
      .filter((group) => group.items.length);
  if (resource === "documents")
    return [
      {
        label: "Requested",
        statuses: ["requested", "awaiting_upload", "replacement_requested"],
      },
      { label: "Awaiting review", statuses: ["received", "under_review"] },
      { label: "Completed", statuses: ["accepted", "archived"] },
    ]
      .map((group) => ({
        ...group,
        items: items.filter((item) => group.statuses.includes(item.status)),
      }))
      .filter((group) => group.items.length);
  return [];
}

function ResourceContent(props) {
  const { resource, data, groups, empty, busy, run, notify } = props;
  if (resource === "services") {
    if (data?.item) {
      return (
        <ServiceDetail
          item={data.item}
          client={data.client || {}}
          tasks={data.tasks || []}
          documents={data.documents || []}
          appointments={data.appointments || []}
          invoices={data.invoices || []}
          intake={data.intake || []}
          activity={data.activity || []}
          empty={empty}
          busy={busy}
          run={run}
        />
      );
    }
    return (
      <Services items={data.items || []} empty={empty} busy={busy} run={run} />
    );
  }
  if (resource === "tasks")
    return <Tasks groups={groups} empty={empty} busy={busy} run={run} />;
  if (resource === "tasks-and-documents")
    return (
      <TasksAndDocuments
        tasks={data?.tasks || []}
        documents={data?.documents || []}
        intakes={data?.intakes || []}
        services={data?.services || []}
        empty={empty}
        busy={busy}
        run={run}
      />
    );
  if (resource === "documents")
    return <Documents groups={groups} empty={empty} busy={busy} run={run} />;
  if (resource === "appointments")
    return (
      <Appointments
        items={data.items || []}
        empty={empty}
        busy={busy}
        run={run}
      />
    );
  if (resource === "messages")
    return (
      <Messages items={data.items || []} empty={empty} busy={busy} run={run} />
    );
  if (resource === "billing")
    return (
      <Billing
        data={data}
        empty={empty}
        busy={busy}
        run={run}
        notify={notify}
      />
    );
  if (resource === "profile")
    return <Profile data={data} empty={empty} busy={busy} run={run} />;
  return <EmptyState>{empty}</EmptyState>;
}

// Known operational events get a short, specific, client-facing label.
// Unmapped event types fall back to humanizing the tail of the event_type
// (e.g. "client.task.completed" -> "Completed") rather than showing the
// raw dotted key or an internal summary sentence verbatim.
const activityEventLabels = {
  "appointment.admin_created": "Appointment scheduled",
  "appointment.public_booked": "Appointment booked",
  "appointment.updated": "Appointment updated",
  "appointment.cancelled": "Appointment cancelled",
  "appointment.follow_up_completed": "Follow-up completed",
  "client.appointment.booked": "Appointment booked",
  "client.appointment.created": "Appointment requested",
  "client.appointment.requested": "Appointment requested",
  "client.appointment.confirmed": "Appointment confirmed",
  "client.appointment.acknowledged": "Appointment acknowledged",
  "client.appointment.reschedule_requested": "Reschedule requested",
  "client.appointment.cancel_requested": "Cancellation requested",
  "client.task.completed": "Task completed",
  "client.task.responded": "Response sent to Alchemize",
  "client.document.uploaded": "Document submitted",
  "client.document.uploaded_general": "Document shared with Alchemize",
  "client.document.downloaded": "Document downloaded",
  "client.intake.submitted": "Intake submitted",
  "client.message.sent": "Message sent to Alchemize",
  "client.message.archived": "Conversation archived",
  "client.profile.updated": "Profile updated",
  "client.profile.change_requested": "Profile change requested",
  "client.service.requested": "Service requested",
  "client.acknowledged": "Acknowledged",
  "admin.message.sent": "Alchemize started a conversation",
  "admin.message.resolved": "Alchemize resolved a conversation",
  "admin.message.status_changed": "Alchemize updated a conversation",
};

// Presentation-only normalization: maps raw event_type/summary values to
// short client-facing language and collapses consecutive entries that
// represent the same meaningful event on the same record (e.g. several
// "appointment.cancelled" writes for one appointment) into one. The
// underlying activity_events history itself is never modified.
function normalizeActivity(activity) {
  const seen = [];
  let lastKey = null;
  activity.forEach((entry) => {
    const label =
      activityEventLabels[entry.event_type] ||
      labelFor(
        entry.event_type ? entry.event_type.split(".").pop() : entry.summary,
      );
    const key = `${entry.event_type}:${entry.entity_id || ""}:${label}`;
    if (key === lastKey) return;
    lastKey = key;
    seen.push({ id: entry.id, label, createdAt: entry.created_at });
  });
  return seen;
}

function nextUpcomingAppointment(appointments) {
  const now = Date.now();
  const upcoming = appointments
    .filter((appointment) => appointment.status !== "cancelled")
    .map((appointment) => ({
      ...appointment,
      _start: new Date(
        appointment.scheduled_start || appointment.scheduled_at,
      ).getTime(),
    }))
    .filter(
      (appointment) =>
        !Number.isNaN(appointment._start) && appointment._start >= now,
    )
    .sort((a, b) => a._start - b._start);
  return upcoming[0] || null;
}

function buildActionItems({ tasks, documents, intake, invoices }) {
  const items = [];
  documents
    .filter((document) =>
      ["requested", "awaiting_upload", "replacement_requested"].includes(
        document.status,
      ),
    )
    .forEach((document) =>
      items.push({
        key: `document-${document.id}`,
        title: document.document_name,
        detail:
          document.client_instructions ||
          (document.status === "replacement_requested"
            ? "A replacement file is needed."
            : "Please submit this document."),
        due: document.due_date,
        actionLabel: "Upload document",
        actionHref: `/client-portal/tasks-and-documents?upload=${encodeURIComponent(document.id)}`,
      }),
    );
  tasks
    .filter((task) => !["completed", "archived"].includes(task.status))
    .forEach((task) =>
      items.push({
        key: `task-${task.id}`,
        title: task.title,
        detail: task.description || "Action requested.",
        due: task.due_date,
        actionLabel: "View task",
        actionHref: "/client-portal/tasks-and-documents",
      }),
    );
  intake
    .filter((assignment) =>
      ["assigned", "in_progress", "changes_requested"].includes(
        assignment.status,
      ),
    )
    .forEach((assignment) =>
      items.push({
        key: `intake-${assignment.id}`,
        title: `Complete ${labelFor(assignment.family_key)}`,
        detail:
          assignment.status === "changes_requested"
            ? assignment.client_visible_review_note ||
              "Alchemize requested changes to this intake."
            : `${Math.max(0, 100 - (assignment.completion_percentage || 0))}% remaining`,
        actionLabel: "Continue intake",
        actionHref: `/client-portal/intake?assignment=${encodeURIComponent(assignment.id)}`,
      }),
    );
  invoices
    .filter(
      (invoice) =>
        ["open", "partially_paid", "past_due"].includes(invoice.status) &&
        Number(invoice.outstanding_balance) > 0,
    )
    .forEach((invoice) =>
      items.push({
        key: `invoice-${invoice.id}`,
        title: `Invoice ${invoice.invoice_number}`,
        detail: `${formatCurrency(invoice.outstanding_balance, invoice.currency)} due ${formatDate(invoice.due_date)}`,
        actionLabel: "View invoice",
        actionHref: `/client-portal/billing/invoices/${encodeURIComponent(invoice.id)}`,
      }),
    );
  return items;
}

// completed -> current -> upcoming, chronological within each group, so
// the list reads as the real progression of the engagement rather than a
// fixed, invented workflow.
function orderMilestones(tasks) {
  const rank = (task) =>
    task.status === "completed" ? 0 : task.status === "not_started" ? 2 : 1;
  return [...tasks].sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    const aTime = new Date(a.completed_at || a.due_date || 0).getTime() || 0;
    const bTime = new Date(b.completed_at || b.due_date || 0).getTime() || 0;
    return aTime - bTime;
  });
}

function ServiceFilePreview({ data, onClose }) {
  return (
    <ReviewDocumentViewer title="Service File" onClose={onClose} printable>
      <ServiceFileDocument data={data} />
    </ReviewDocumentViewer>
  );
}

function MessageComposer({ engagement, onClose, onSent }) {
  const [subject, setSubject] = useState(`${engagement.title} engagement`);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      setError("Enter a message before sending.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await portalApi.createThread({
        subject,
        message,
        related_entity_type: "engagement",
        related_entity_id: engagement.id,
      });
      onSent();
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="engagement-modal-overlay" onClick={onClose}>
      <form
        className="engagement-modal-panel pm-compose"
        role="dialog"
        aria-modal="true"
        aria-label="Message Alchemize"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <h2>Message Alchemize</h2>
        <p>
          About your {engagement.title} engagement. Alchemize will see which
          engagement this refers to.
        </p>
        <label>
          <span>Subject</span>
          <input
            value={subject}
            maxLength={180}
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>
        <label>
          <span>Message</span>
          <textarea
            required
            maxLength={5000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        {error ? (
          <p role="alert" className="portal-feedback error">
            {error}
          </p>
        ) : null}
        <div className="portal-action-group">
          <button
            type="submit"
            className="portal-action-button"
            disabled={busy}
          >
            {busy ? "Sending…" : "Send message"}
          </button>
          <button
            type="button"
            className="portal-quiet-button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ServiceDetail({
  item,
  client = {},
  tasks = [],
  documents = [],
  appointments = [],
  invoices = [],
  intake = [],
  activity = [],
  empty,
  busy,
  run,
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMessage, setComposerMessage] = useState("");
  const [serviceFileOpen, setServiceFileOpen] = useState(false);

  const actionItems = buildActionItems({ tasks, documents, intake, invoices });
  const nextAppointment = nextUpcomingAppointment(appointments);
  const activityFeed = normalizeActivity(activity);
  const milestones = orderMilestones(tasks);
  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const progressPct = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : null;
  const openInvoices = invoices.filter(
    (invoice) =>
      ["open", "partially_paid", "past_due"].includes(invoice.status) &&
      Number(invoice.outstanding_balance) > 0,
  );
  const isCompleted = ["completed", "archived"].includes(item.status);
  const bookHref = `/client-portal/appointments?engagement=${encodeURIComponent(item.id)}`;
  const meetUrl = nextAppointment?.meeting_url || "";
  const hasSafeMeetUrl =
    nextAppointment?.meeting_method === "google_meet" &&
    /^https:\/\//i.test(meetUrl);

  return (
    <div className="engagement-dashboard">
      {composerMessage ? (
        <p role="status" className="portal-feedback success">
          {composerMessage}
        </p>
      ) : null}
      <header className="engagement-header">
        <div className="engagement-header-title">
          <a className="engagement-back-link" href="/client-portal/services">
            ← All services
          </a>
          <div className="engagement-header-heading">
            <h1>{item.title}</h1>
            <span
              className={`portal-status-pill engagement-status-${item.status}`}
            >
              {labelFor(item.status)}
            </span>
          </div>
          <p>{item.description || "Service in progress."}</p>
          <div className="engagement-header-meta">
            {item.start_date ? (
              <span>Started {formatDate(item.start_date)}</span>
            ) : null}
            {item.completion_date ? (
              <span>Completed {formatDate(item.completion_date)}</span>
            ) : null}
            {item.engagement_number ? (
              <span>Engagement #{item.engagement_number}</span>
            ) : null}
          </div>
        </div>
        <div className="portal-action-group engagement-header-actions">
          <a className="portal-action-button" href={bookHref}>
            Book appointment
          </a>
          <button
            type="button"
            className="portal-quiet-button"
            onClick={() => setComposerOpen(true)}
          >
            Message Alchemize
          </button>
          <button
            type="button"
            className="portal-quiet-button"
            onClick={() => setServiceFileOpen(true)}
          >
            Download service file
          </button>
        </div>
      </header>

      <div className="engagement-snapshot">
        <div className="engagement-snapshot-item">
          <span>Status</span>
          <strong>{labelFor(item.status)}</strong>
        </div>
        <div className="engagement-snapshot-item">
          <span>Open actions</span>
          <strong>
            {actionItems.length ? `${actionItems.length} remaining` : "None"}
          </strong>
        </div>
        <div className="engagement-snapshot-item">
          <span>Documents</span>
          <strong>{documents.length}</strong>
        </div>
        <div className="engagement-snapshot-item">
          <span>Next appointment</span>
          <strong>
            {nextAppointment
              ? formatDate(
                  nextAppointment.scheduled_start ||
                    nextAppointment.scheduled_at,
                  true,
                )
              : "None scheduled"}
          </strong>
        </div>
        <div className="engagement-snapshot-item">
          <span>Balance</span>
          <strong>
            {openInvoices.length
              ? formatCurrency(
                  openInvoices.reduce(
                    (sum, invoice) =>
                      sum + Number(invoice.outstanding_balance || 0),
                    0,
                  ),
                )
              : "$0 due"}
          </strong>
        </div>
      </div>

      <div className="portal-workspace-grid">
        <div className="portal-workspace-primary">
          {actionItems.length ? (
            <section
              className="engagement-action-required"
              aria-label="Action required"
            >
              <h2>Action required</h2>
              <ul className="portal-record-list">
                {actionItems.map((entry) => (
                  <li key={entry.key}>
                    <div>
                      <strong>{entry.title}</strong>
                      <p>{entry.detail}</p>
                    </div>
                    <div className="portal-record-meta">
                      {entry.due ? (
                        <small>Due {formatDate(entry.due)}</small>
                      ) : null}
                      <a
                        className="portal-action-button"
                        href={entry.actionHref}
                      >
                        {entry.actionLabel}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : !isCompleted ? (
            <p className="engagement-action-clear" role="status">
              No action needed right now.
            </p>
          ) : null}

          {tasks.length ? (
            <section
              className="engagement-milestones"
              aria-label="Tasks and milestones"
            >
              <h2>Tasks &amp; milestones</h2>
              {progressPct !== null ? (
                <div className="engagement-progress">
                  <small>
                    Engagement progress · {completedCount} of {tasks.length}{" "}
                    milestones completed
                  </small>
                  <div
                    className="engagement-progress-track"
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Engagement progress"
                  >
                    <div
                      className="engagement-progress-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <ol className="engagement-milestone-list">
                {milestones.map((task) => {
                  const state =
                    task.status === "completed"
                      ? "done"
                      : task.status === "not_started"
                        ? "upcoming"
                        : "current";
                  return (
                    <li key={task.id} className={`milestone-${state}`}>
                      <span className="milestone-marker" aria-hidden="true">
                        {state === "done"
                          ? "✓"
                          : state === "current"
                            ? "●"
                            : "○"}
                      </span>
                      <div>
                        <strong>{task.title}</strong>
                        <small>
                          {state === "done"
                            ? `Completed ${formatDate(task.completed_at || task.due_date)}`
                            : labelFor(task.status)}
                        </small>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}

          {documents.length ? (
            <section
              className="engagement-documents"
              aria-label="Documents and deliverables"
            >
              <h2>Documents</h2>
              <ul className="portal-record-list">
                {documents.map((document) => (
                  <li key={document.id}>
                    <div>
                      <strong>{document.document_name}</strong>
                      <p>
                        {document.client_instructions ||
                          "Client-visible document"}
                      </p>
                      {[
                        "requested",
                        "awaiting_upload",
                        "replacement_requested",
                      ].includes(document.status) ? (
                        <DocumentUpload item={document} busy={busy} run={run} />
                      ) : null}
                    </div>
                    <div className="portal-record-meta">
                      <span>{labelFor(document.status)}</span>
                      {document.due_date ? (
                        <small>Due {formatDate(document.due_date)}</small>
                      ) : null}
                      {document.current_version ? (
                        <a
                          className="portal-action-button"
                          href={portalApi.documentDownloadUrl(document.id)}
                        >
                          Download
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!actionItems.length &&
          !tasks.length &&
          !documents.length &&
          !appointments.length ? (
            <EmptyState>{empty}</EmptyState>
          ) : null}
        </div>

        <aside className="portal-workspace-utility">
          <section
            className="engagement-next-appointment"
            aria-label="Next appointment"
          >
            <span className="section-kicker">Next appointment</span>
            {nextAppointment ? (
              <>
                <strong>
                  {formatDate(
                    nextAppointment.scheduled_start ||
                      nextAppointment.scheduled_at,
                    true,
                  )}
                </strong>
                <p>{nextAppointment.appointment_type || "Consultation"}</p>
                <small>
                  {labelFor(
                    nextAppointment.meeting_method ||
                      nextAppointment.location_type ||
                      "virtual",
                  )}
                </small>
                <div className="portal-action-group">
                  <a
                    className="portal-action-button"
                    href={`/client-portal/appointments?appointment=${encodeURIComponent(nextAppointment.id)}`}
                  >
                    View appointment
                  </a>
                  {hasSafeMeetUrl ? (
                    <a
                      className="portal-action-button"
                      href={meetUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join Google Meet
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p>No appointment scheduled</p>
                <a className="portal-action-button" href={bookHref}>
                  Book appointment
                </a>
              </>
            )}
          </section>

          {openInvoices.length ? (
            <section className="engagement-billing" aria-label="Billing">
              <span className="section-kicker">Billing</span>
              <ul>
                {openInvoices.map((invoice) => (
                  <li key={invoice.id}>
                    <strong>{invoice.invoice_number}</strong>
                    <small>
                      {formatCurrency(
                        invoice.outstanding_balance,
                        invoice.currency,
                      )}{" "}
                      due {formatDate(invoice.due_date)} ·{" "}
                      {labelFor(invoice.status)}
                    </small>
                    <a
                      className="portal-action-button"
                      href={`/client-portal/billing/invoices/${encodeURIComponent(invoice.id)}`}
                    >
                      View invoice
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : invoices.length ? (
            <section className="engagement-billing" aria-label="Billing">
              <span className="section-kicker">Billing</span>
              <p>Paid in full.</p>
            </section>
          ) : null}

          {activityFeed.length ? (
            <section
              className="engagement-activity"
              aria-label="Engagement activity"
            >
              <span className="section-kicker">Engagement activity</span>
              <ol>
                {activityFeed.slice(0, 8).map((entry) => (
                  <li key={entry.id}>
                    <time>{formatDate(entry.createdAt)}</time>
                    <span>{entry.label}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section
            className="engagement-details"
            aria-label="Engagement details"
          >
            <span className="section-kicker">Engagement details</span>
            <dl>
              {item.service_names?.length ? (
                <div>
                  <dt>Service</dt>
                  <dd>{item.service_names.join(", ")}</dd>
                </div>
              ) : null}
              {item.assigned_contact ? (
                <div>
                  <dt>Alchemize contact</dt>
                  <dd>{item.assigned_contact}</dd>
                </div>
              ) : null}
              {item.engagement_number ? (
                <div>
                  <dt>Reference</dt>
                  <dd>{item.engagement_number}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </aside>
      </div>

      {composerOpen ? (
        <MessageComposer
          engagement={item}
          onClose={() => setComposerOpen(false)}
          onSent={() => {
            setComposerOpen(false);
            setComposerMessage("Message sent to Alchemize.");
          }}
        />
      ) : null}

      {serviceFileOpen ? (
        <ServiceFilePreview
          data={{
            item,
            client,
            tasks,
            documents,
            appointments,
            invoices,
            intake,
            activity: activityFeed,
          }}
          onClose={() => setServiceFileOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Services({ items, empty, busy, run }) {
  const [request, setRequest] = useState({ service_key: "", message: "" });
  const [requestOpen, setRequestOpen] = useState(false);
  const activeServices = items.filter(
    (item) => !["completed", "archived"].includes(item.status),
  );
  const pastServices = items.filter((item) =>
    ["completed", "archived"].includes(item.status),
  );

  return (
    <div className="portal-services-layout">
      <section className="portal-workspace-primary portal-services-main">
        <div className="portal-services-header">
          <div>
            <span className="section-kicker">Active services</span>
            <h2>Active services</h2>
          </div>
          <button
            type="button"
            className="portal-action-button"
            aria-expanded={requestOpen}
            aria-controls="portal-service-request-form"
            onClick={() => setRequestOpen((open) => !open)}
          >
            Request a service
          </button>
        </div>

        {!activeServices.length ? (
          <EmptyState>{empty}</EmptyState>
        ) : (
          <ul className="portal-services-list">
            {activeServices.map((item) => (
              <li key={item.id} className="portal-service-card">
                <div className="portal-service-card-main">
                  <div className="portal-service-card-header">
                    <span className="portal-status-pill">
                      {labelFor(item.status)}
                    </span>
                    <small>
                      {item.start_date
                        ? `Started ${formatDate(item.start_date)}`
                        : "Service started"}
                    </small>
                  </div>
                  <h3>
                    <strong>{item.title}</strong>
                  </h3>
                  {item.description && item.description !== item.title ? (
                    <p>{item.description}</p>
                  ) : null}
                  {item.service_names?.filter(
                    (name) =>
                      name.toLowerCase() !== item.title?.toLowerCase() &&
                      name !== item.description,
                  ).length ? (
                    <small className="portal-service-tags">
                      {item.service_names
                        .filter(
                          (name) =>
                            name.toLowerCase() !== item.title?.toLowerCase() &&
                            name !== item.description,
                        )
                        .join(" · ")}
                    </small>
                  ) : null}
                </div>
                <div className="portal-service-card-meta">
                  {item.target_date ? (
                    <small>Target date: {formatDate(item.target_date)}</small>
                  ) : null}
                  {item.assigned_contact ? (
                    <small>Contact: {item.assigned_contact}</small>
                  ) : null}
                  <div className="portal-action-group">
                    <a
                      className="portal-action-button"
                      href={`/client-portal/services/${item.id}`}
                    >
                      View service
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pastServices.length ? (
          <div className="portal-services-archive">
            <div className="portal-services-header secondary">
              <div>
                <span className="section-kicker">Past services</span>
                <h3>Past services</h3>
              </div>
            </div>
            <ul className="portal-service-history">
              {pastServices.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.status === "completed"
                        ? "Completed service"
                        : "Archived service"}
                    </small>
                  </div>
                  <span>
                    {item.start_date
                      ? formatDate(item.start_date)
                      : "Service date"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {requestOpen ? (
          <form
            id="portal-service-request-form"
            role="form"
            aria-label="Request a service"
            className="portal-service-request-form"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                "service-request",
                () => portalApi.requestService(request),
                "Service request sent for Admin review.",
              );
              setRequestOpen(false);
            }}
          >
            <h3>Request a service</h3>
            <label>
              <span>Service area</span>
              <select
                required
                value={request.service_key}
                onChange={(event) =>
                  setRequest({ ...request, service_key: event.target.value })
                }
              >
                <option value="">Select a service</option>
                <option value="individual-tax">Individual tax</option>
                <option value="individual-insurance">
                  Individual insurance
                </option>
                <option value="individual-notary">Individual notary</option>
                <option value="business-formation">Business formation</option>
                <option value="business-operations">Business operations</option>
                <option value="business-tax">Business tax</option>
                <option value="business-advisory">Business advisory</option>
                <option value="business-insurance">Business insurance</option>
                <option value="business-notary">Business notary</option>
              </select>
            </label>
            <label>
              <span>What do you need?</span>
              <textarea
                required
                maxLength="5000"
                value={request.message}
                onChange={(event) =>
                  setRequest({ ...request, message: event.target.value })
                }
              />
            </label>
            <button
              type="submit"
              className="portal-action-button"
              disabled={busy === "service-request"}
            >
              {busy === "service-request" ? "Sending…" : "Submit request"}
            </button>
          </form>
        ) : null}
      </section>

      <aside className="portal-workspace-utility portal-services-side">
        <div className="portal-service-support">
          <span className="section-kicker">Support</span>
          <h3>Need help with your service?</h3>
          <p>
            Review your tasks, send a document, or message the Alchemize team
            when you need a quick update.
          </p>
          <div className="portal-service-panel-links">
            <a href="/client-portal/tasks-and-documents">Tasks & documents</a>
            <a href="/client-portal/messages">Message Alchemize</a>
          </div>
        </div>
        <div className="portal-service-support muted">
          <span className="section-kicker">Checklist</span>
          <h3>Service progress</h3>
          <ul>
            <li>Confirm any action items in your workflow.</li>
            <li>Send information or documents as requested.</li>
            <li>Keep your service updates current to avoid delays.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function TasksAndDocuments(props) {
  return (
    <TasksDocumentsWorkspace
      {...props}
      DocumentUpload={DocumentUpload}
      GeneralDocumentUpload={GeneralDocumentUpload}
    />
  );
}

function Tasks({ groups, empty, busy, run }) {
  const [responses, setResponses] = useState({});
  if (!groups.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="portal-group-stack">
      {groups.map((group) => (
        <section
          key={group.label}
          className={
            group.label === "Completed" ? "portal-completed-group" : ""
          }
        >
          <h2>{group.label}</h2>
          <ul className="portal-record-list">
            {group.items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>
                    {item.description ||
                      item.engagement_title ||
                      "Client-visible task"}
                  </p>
                  {item.status !== "completed" ? (
                    <label className="portal-inline-field">
                      <span>Optional response</span>
                      <textarea
                        value={responses[item.id] || ""}
                        onChange={(event) =>
                          setResponses({
                            ...responses,
                            [item.id]: event.target.value,
                          })
                        }
                        maxLength={2000}
                      />
                    </label>
                  ) : null}
                </div>
                <div className="portal-record-meta">
                  <span>{labelFor(item.status)}</span>
                  <small>Due {formatDate(item.due_date)}</small>
                  {item.status !== "completed" ? (
                    <div className="portal-action-group">
                      <ActionButton
                        busy={busy === `${item.id}-acknowledge`}
                        onClick={() =>
                          run(
                            `${item.id}-acknowledge`,
                            () => portalApi.acknowledgeTask(item.id),
                            "Task acknowledged.",
                          )
                        }
                      >
                        Acknowledge
                      </ActionButton>
                      <ActionButton
                        busy={busy === `${item.id}-respond`}
                        onClick={() =>
                          run(
                            `${item.id}-respond`,
                            () =>
                              portalApi.respondToTask(
                                item.id,
                                responses[item.id] || "",
                              ),
                            "Response sent to Alchemize.",
                          )
                        }
                      >
                        Send response
                      </ActionButton>
                      <ActionButton
                        busy={busy === `${item.id}-complete`}
                        onClick={() =>
                          run(
                            `${item.id}-complete`,
                            () =>
                              portalApi.completeTask(
                                item.id,
                                responses[item.id] || "",
                              ),
                            "Task marked complete.",
                          )
                        }
                      >
                        Mark complete
                      </ActionButton>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Documents({ groups, empty, busy, run }) {
  const params = new window.URLSearchParams(window.location.search);
  const focusedId = params.get("upload");
  const returnTo = params.get("return");
  const uploadContext = params.get("context");
  return (
    <div className="portal-workspace-grid">
      <div className="portal-group-stack portal-workspace-primary">
        {!groups.length ? <EmptyState>{empty}</EmptyState> : null}
        {focusedId ? (
          <div className="portal-pending-note" role="status">
            <strong>Upload requested document</strong>
            <p>
              You are uploading this file for:{" "}
              {uploadContext || "your current service"}. It will be securely
              associated with that requested item.
            </p>
            {returnTo ? <a href={returnTo}>Return to this intake</a> : null}
          </div>
        ) : null}
        {groups.map((group) => (
          <section
            key={group.label}
            className={
              group.label === "Completed" ? "portal-completed-group" : ""
            }
          >
            <h2>{group.label}</h2>
            <ul className="portal-record-list">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  id={`document-${item.id}`}
                  className={focusedId === item.id ? "portal-record-focus" : ""}
                >
                  <div>
                    <strong>{item.document_name}</strong>
                    <p>
                      {item.engagement_title ||
                        item.service_name ||
                        "Client-visible document request"}
                    </p>
                    {item.client_instructions ? (
                      <p>{item.client_instructions}</p>
                    ) : null}
                    {item.submitted_filename ? (
                      <small>
                        Latest submission: {item.submitted_filename}
                      </small>
                    ) : null}
                    {item.client_visible_review_note ? (
                      <p className="portal-pending-note">
                        Alchemize guidance: {item.client_visible_review_note}
                      </p>
                    ) : null}
                    {[
                      "requested",
                      "awaiting_upload",
                      "replacement_requested",
                    ].includes(item.status) ? (
                      <DocumentUpload item={item} busy={busy} run={run} />
                    ) : null}
                    {item.current_version ? (
                      <div className="portal-action-group">
                        <a
                          className="portal-action-button"
                          href={portalApi.documentDownloadUrl(item.id)}
                        >
                          Download current file
                        </a>
                      </div>
                    ) : null}
                  </div>
                  <div className="portal-record-meta">
                    <span>{labelFor(item.status)}</span>
                    <small>Requested {formatDate(item.requested_date)}</small>
                    {item.due_date ? (
                      <small>Due {formatDate(item.due_date)}</small>
                    ) : null}
                    {item.current_version ? (
                      <small>Version {item.current_version}</small>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
function GeneralDocumentUpload({ busy, run }) {
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [comment, setComment] = useState("");
  return (
    <form
      className="portal-composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (file)
          run(
            "general-upload",
            async () => {
              await portalApi.uploadGeneralDocument(file, {
                document_name: documentName,
                comment,
              });
              trackDocumentUploaded();
            },
            "Document uploaded and visible to Alchemize.",
          );
      }}
    >
      <h2>Upload a document</h2>
      <p>
        Use this for a general document that was not specifically requested.
      </p>
      <label>
        <span>Document name</span>
        <input
          value={documentName}
          maxLength="180"
          onChange={(event) => setDocumentName(event.target.value)}
        />
      </label>
      <label>
        <span>Choose document</span>
        <input
          required
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
      <label>
        <span>Note (optional)</span>
        <input
          value={comment}
          maxLength="2000"
          onChange={(event) => setComment(event.target.value)}
        />
      </label>
      <button
        className="portal-action-button"
        disabled={!file || busy === "general-upload"}
      >
        {busy === "general-upload" ? "Uploading…" : "Upload securely"}
      </button>
      <small>PDF, JPG, PNG, WebP, DOCX, or XLSX. Maximum 15 MB.</small>
    </form>
  );
}
function DocumentUpload({ item, busy, run }) {
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  return (
    <form
      className="portal-action-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (file)
          run(
            item.id,
            async () => {
              await portalApi.uploadDocument(item.id, file, comment);
              trackDocumentUploaded();
            },
            "Document received and queued for review.",
          );
      }}
    >
      <label>
        <span>Choose document</span>
        <input
          type="file"
          required
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
      <label>
        <span>Note for Alchemize (optional)</span>
        <input
          value={comment}
          maxLength={2000}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>
      <button
        className="portal-action-button"
        disabled={!file || busy === item.id}
      >
        {busy === item.id ? "Uploading…" : "Upload securely"}
      </button>
      <small>PDF, JPG, PNG, WebP, DOCX, or XLSX. Maximum 15 MB.</small>
    </form>
  );
}

function Appointments({ items }) {
  return <ClientAppointments initialItems={items} />;
}

const messageFilterEmptyState = {
  all: {
    title: "No conversations yet",
    description: "Messages with the Alchemize team will appear here.",
  },
  unread: {
    title: "No unread conversations",
    description: "You're caught up on every message.",
  },
  action: {
    title: "Nothing needs your response",
    description: "Conversations waiting on you will appear here.",
  },
  archived: {
    title: "No archived conversations",
    description: "Conversations you archive will appear here.",
  },
};

function Messages({ items, busy, run }) {
  const [filter, setFilter] = useState("all");
  const [openedId, setOpenedId] = useState(null);
  const [opened, setOpened] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [reply, setReply] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({ subject: "", message: "" });

  const counts = useMemo(
    () => ({
      all: items.filter((thread) => thread.status !== "archived").length,
      unread: items.filter((thread) => Number(thread.unread_count) > 0).length,
      action: items.filter((thread) => Number(thread.client_action_required))
        .length,
      archived: items.filter((thread) => thread.status === "archived").length,
    }),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((thread) => {
        if (filter === "unread") return Number(thread.unread_count) > 0;
        if (filter === "action")
          return Number(thread.client_action_required) > 0;
        if (filter === "archived") return thread.status === "archived";
        return thread.status !== "archived";
      }),
    [items, filter],
  );

  // A conversation open in the thread pane that no longer belongs to the
  // active filter must not keep showing as though it still does. Only
  // re-check when the *filter* changes -- not whenever `items` refetches,
  // since a refetch also follows the client's own reply/archive actions on
  // the open thread, and re-checking against those would immediately close
  // the thread the client just acted on.
  useEffect(() => {
    if (openedId && !filteredItems.some((thread) => thread.id === openedId)) {
      setOpenedId(null);
      setOpened(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const openThread = async (id) => {
    setThreadError("");
    setThreadLoading(true);
    setOpenedId(id);
    try {
      setOpened(await portalApi.thread(id));
      window.dispatchEvent(new CustomEvent("alchemize:portal-refresh"));
    } catch (error) {
      setThreadError(error.message);
    } finally {
      setThreadLoading(false);
    }
  };

  const closeThread = () => {
    setOpenedId(null);
    setOpened(null);
  };

  const sendReply = () => {
    if (!openedId || !reply.trim()) return;
    run(
      `${openedId}-reply`,
      async () => {
        await portalApi.reply(openedId, reply.trim());
        setReply("");
        setOpened(await portalApi.thread(openedId));
      },
      "Reply sent.",
    );
  };

  const archiveOpen = () => {
    if (!openedId) return;
    run(
      `${openedId}-archive`,
      async () => {
        await portalApi.archiveThread(openedId);
        closeThread();
      },
      "Conversation archived.",
    );
  };

  const startConversation = (event) => {
    event.preventDefault();
    run(
      "new-message",
      async () => {
        const result = await portalApi.createThread(compose);
        setCompose({ subject: "", message: "" });
        setComposeOpen(false);
        if (result?.thread_id) await openThread(result.thread_id);
      },
      "Message sent to Alchemize.",
    );
  };

  const emptyState = messageFilterEmptyState[filter];

  return (
    <div className="pm-page">
      <div className="pm-toolbar">
        <button
          type="button"
          className="portal-action-button"
          onClick={() => setComposeOpen((current) => !current)}
        >
          {composeOpen ? "Close" : "+ New message"}
        </button>
      </div>
      {composeOpen ? (
        <form className="pm-compose" onSubmit={startConversation}>
          <label>
            <span>Subject</span>
            <input
              required
              maxLength={180}
              value={compose.subject}
              onChange={(event) =>
                setCompose({ ...compose, subject: event.target.value })
              }
            />
          </label>
          <label>
            <span>Message</span>
            <textarea
              required
              maxLength={5000}
              value={compose.message}
              onChange={(event) =>
                setCompose({ ...compose, message: event.target.value })
              }
            />
          </label>
          <div className="portal-action-group">
            <button
              className="portal-action-button"
              disabled={busy === "new-message"}
            >
              {busy === "new-message" ? "Sending…" : "Send message"}
            </button>
            <button type="button" onClick={() => setComposeOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <div className="pm-filter-bar" aria-label="Message filters">
        {[
          ["all", "All"],
          ["unread", "Unread"],
          ["action", "Action needed"],
          ["archived", "Archived"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "active" : ""}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
            <span className="pm-tab-count">{counts[value]}</span>
          </button>
        ))}
      </div>
      <div className={`pm-workspace ${openedId ? "has-thread" : ""}`}>
        <section className="pm-list" aria-label="Conversations">
          {filteredItems.length ? (
            <ul>
              {filteredItems.map((thread) => {
                const unread = Number(thread.unread_count) > 0;
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      className={`pm-row ${openedId === thread.id ? "selected" : ""} ${unread ? "unread" : ""}`}
                      aria-pressed={openedId === thread.id}
                      onClick={() => openThread(thread.id)}
                    >
                      <span className="pm-row-heading">
                        <strong>{thread.subject}</strong>
                        <small>
                          {formatDate(thread.last_message_at, true)}
                        </small>
                      </span>
                      <small className="pm-row-preview">
                        {thread.latest_message}
                      </small>
                      <span className="pm-row-footer">
                        <span className="pm-status">
                          {labelFor(thread.status)}
                        </span>
                        {Number(thread.client_action_required) ? (
                          <span className="pm-action-flag">
                            Response requested
                          </span>
                        ) : null}
                        {unread ? (
                          <span className="pm-unread-dot" aria-hidden="true" />
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="pm-empty-state">
              <h3>{emptyState.title}</h3>
              <p>{emptyState.description}</p>
            </div>
          )}
        </section>
        <section className="pm-thread" aria-live="polite">
          {threadError ? (
            <p className="portal-feedback error" role="alert">
              {threadError}
            </p>
          ) : null}
          {openedId ? (
            threadLoading || !opened ? (
              <p className="pm-loading">Loading…</p>
            ) : (
              <>
                <button
                  type="button"
                  className="pm-back-button"
                  onClick={closeThread}
                >
                  ← Back to messages
                </button>
                <header className="pm-thread-header">
                  <div>
                    <h2>{opened.thread.subject}</h2>
                    {opened.thread.related_entity_type ? (
                      <p className="pm-thread-context">
                        Related to {labelFor(opened.thread.related_entity_type)}
                      </p>
                    ) : null}
                  </div>
                  <span className="pm-status">
                    {labelFor(opened.thread.status)}
                  </span>
                </header>
                <ol className="portal-thread">
                  {opened.messages.map((entry) => (
                    <li key={entry.id} className={entry.sender_type}>
                      <div className="portal-thread-meta">
                        <strong>{entry.sender_name}</strong>
                        <small>{formatDate(entry.created_at, true)}</small>
                      </div>
                      <p>{entry.message_body}</p>
                    </li>
                  ))}
                </ol>
                {opened.thread.status === "archived" ? (
                  <p className="pm-archived-note">
                    This conversation is archived.
                  </p>
                ) : (
                  <div className="pm-composer">
                    <label>
                      <span>Reply</span>
                      <textarea
                        maxLength={5000}
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                      />
                    </label>
                    <div className="portal-action-group">
                      <button
                        type="button"
                        className="portal-action-button"
                        disabled={busy === `${openedId}-reply` || !reply.trim()}
                        onClick={sendReply}
                      >
                        {busy === `${openedId}-reply`
                          ? "Sending…"
                          : "Send reply"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === `${openedId}-archive`}
                        onClick={archiveOpen}
                      >
                        {busy === `${openedId}-archive`
                          ? "Archiving…"
                          : "Archive"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="pm-empty-state">
              <h3>Select a conversation</h3>
              <p>
                Choose a conversation from the list to view its history and
                respond.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Billing({ data, busy, run, notify }) {
  return <ClientBilling data={data} busy={busy} run={run} notify={notify} />;
}

function Profile({ data, empty, busy, run }) {
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const client = data.client;
  const [form, setForm] = useState(() =>
    client
      ? {
          primary_email: client.primary_email || "",
          primary_phone: client.primary_phone || "",
          preferred_contact_method: client.preferred_contact_method || "email",
          language_preference: client.language_preference || "en",
          legal_name: client.legal_name || "",
          business_legal_name: client.business_legal_name || "",
        }
      : {},
  );
  const [accessRequest, setAccessRequest] = useState({
    name: "",
    email: "",
    access_role: "authorized_user",
  });
  if (!client) return <EmptyState>{empty}</EmptyState>;

  const change = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const summaryValue = (value, fallback = "Not specified") => {
    if (value === null || value === undefined || value === "") return fallback;
    return value;
  };

  return (
    <div className="portal-profile-layout">
      <section className="portal-profile-details">
        <div className="portal-profile-header">
          <h2>{client.display_name}</h2>
          {!isEditing ? (
            <button
              type="button"
              className="portal-action-button"
              onClick={() => setIsEditing(true)}
            >
              Edit profile
            </button>
          ) : (
            <button
              type="button"
              className="portal-action-button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          )}
        </div>
        {(data.pending_changes || []).length ? (
          <div className="portal-pending-changes" role="status">
            <strong>Pending Alchemize review</strong>
            {data.pending_changes.map((item) => (
              <p key={item.id}>
                {labelFor(item.field_name)}:{" "}
                {item.proposed_value || "Remove current value"}
              </p>
            ))}
          </div>
        ) : null}

        {!isEditing ? (
          <dl className="portal-profile-summary">
            <div>
              <dt>Email</dt>
              <dd>{summaryValue(client.primary_email)}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{summaryValue(client.primary_phone)}</dd>
            </div>
            <div>
              <dt>Preferred contact</dt>
              <dd>{labelFor(client.preferred_contact_method || "email")}</dd>
            </div>
            <div>
              <dt>Language preference</dt>
              <dd>{labelFor(client.language_preference || "en")}</dd>
            </div>
            <div>
              <dt>Legal name</dt>
              <dd>{summaryValue(client.legal_name)}</dd>
            </div>
            {client.client_type === "business" ? (
              <div>
                <dt>Business legal name</dt>
                <dd>{summaryValue(client.business_legal_name)}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <form
            className="portal-profile-form"
            onSubmit={(event) => {
              event.preventDefault();
              const payload = Object.fromEntries(
                Object.entries(form).filter(([, value]) => value !== ""),
              );
              run(
                "profile",
                () => portalApi.updateProfile(payload),
                "Profile changes saved or submitted for review.",
              ).then(() => setIsEditing(false));
            }}
          >
            <label>
              <span>Email</span>
              <input
                name="primary_email"
                type="email"
                value={form.primary_email}
                onChange={change}
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                name="primary_phone"
                value={form.primary_phone}
                onChange={change}
              />
            </label>
            <label>
              <span>Preferred contact</span>
              <select
                name="preferred_contact_method"
                value={form.preferred_contact_method}
                onChange={change}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="either">Either</option>
              </select>
            </label>
            <label>
              <span>Language preference</span>
              <select
                name="language_preference"
                value={form.language_preference}
                onChange={change}
              >
                <option value="en">English</option>
                <option value="es">EspaÃ±ol</option>
              </select>
            </label>
            <fieldset>
              <legend>Changes requiring Alchemize review</legend>
              <label>
                <span>Legal name</span>
                <input
                  name="legal_name"
                  value={form.legal_name}
                  onChange={change}
                  placeholder={client.legal_name || "Propose a change"}
                />
              </label>
              {client.client_type === "business" ? (
                <label>
                  <span>Business legal name</span>
                  <input
                    name="business_legal_name"
                    value={form.business_legal_name}
                    onChange={change}
                    placeholder={
                      client.business_legal_name || "Propose a change"
                    }
                  />
                </label>
              ) : null}
            </fieldset>
            <div className="portal-profile-actions-row">
              <button
                className="portal-action-button"
                disabled={busy === "profile"}
                type="submit"
              >
                {busy === "profile" ? "Saving…" : "Save profile changes"}
              </button>
            </div>
          </form>
        )}
      </section>
      <section className="portal-profile-access-panel">
        <h2>Portal access and authorized users</h2>

        {!showPasswordForm ? (
          <button
            type="button"
            className="portal-action-button"
            onClick={() => setShowPasswordForm(true)}
          >
            Change password
          </button>
        ) : (
          <form
            className="portal-composer"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                "change-password",
                () => auth.changePassword(passwordForm),
                "Password changed successfully.",
              );
              setShowPasswordForm(false);
            }}
          >
            <h3>Change password</h3>
            <label>
              <span>Current password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    current_password: event.target.value,
                  })
                }
              />
            </label>
            <label>
              <span>New password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength="12"
                required
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    new_password: event.target.value,
                  })
                }
              />
            </label>
            <div className="portal-profile-actions-row">
              <button
                className="portal-action-button"
                disabled={busy === "change-password"}
                type="submit"
              >
                Change Password
              </button>
              <button
                type="button"
                className="portal-quiet-button"
                onClick={() => setShowPasswordForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {(data.portal_users || []).length ? (
          <ul className="portal-record-list">
            {data.portal_users.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.email}</p>
                </div>
                <div className="portal-record-meta">
                  <span>{labelFor(item.access_role)}</span>
                  <small>{labelFor(item.status)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {(data.authorized_user_requests || []).filter(
          (item) => item.status === "pending",
        ).length ? (
          <div className="portal-pending-changes" role="status">
            <strong>Pending access requests</strong>
            {data.authorized_user_requests
              .filter((item) => item.status === "pending")
              .map((item) => (
                <p key={item.id}>
                  {item.name} ({item.email}) —{" "}
                  {labelFor(item.requested_access_role)}
                </p>
              ))}
          </div>
        ) : null}
        {data.access_role === "primary_contact" ? (
          !showAccessForm ? (
            <button
              type="button"
              className="portal-action-button"
              onClick={() => setShowAccessForm(true)}
            >
              Request portal access
            </button>
          ) : (
            <form
              className="portal-composer"
              onSubmit={(event) => {
                event.preventDefault();
                run(
                  "access-request",
                  () => portalApi.requestAuthorizedUser(accessRequest),
                  "Portal access request sent for Admin review.",
                );
                setShowAccessForm(false);
              }}
            >
              <h3>Request portal access</h3>
              <p>Alchemize reviews every request before access is activated.</p>
              <label>
                <span>Name</span>
                <input
                  required
                  value={accessRequest.name}
                  onChange={(event) =>
                    setAccessRequest({
                      ...accessRequest,
                      name: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  required
                  type="email"
                  value={accessRequest.email}
                  onChange={(event) =>
                    setAccessRequest({
                      ...accessRequest,
                      email: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Access type</span>
                <select
                  value={accessRequest.access_role}
                  onChange={(event) =>
                    setAccessRequest({
                      ...accessRequest,
                      access_role: event.target.value,
                    })
                  }
                >
                  <option value="authorized_user">Authorized User</option>
                  <option value="billing_contact">Billing Contact</option>
                  <option value="document_contact">Document Contact</option>
                  <option value="read_only">Read-Only Contact</option>
                </select>
              </label>
              <div className="portal-profile-actions-row">
                <button
                  className="portal-action-button"
                  disabled={busy === "access-request"}
                  type="submit"
                >
                  Request Admin review
                </button>
                <button
                  type="button"
                  className="portal-quiet-button"
                  onClick={() => setShowAccessForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )
        ) : null}
        <h3>Authorized contacts</h3>
        {(data.authorized_contacts || []).length ? (
          <ul className="portal-record-list">
            {data.authorized_contacts.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.title || labelFor(item.authorization_level)}</p>
                  <small>
                    {[item.email, item.phone].filter(Boolean).join(" · ")}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>
            No additional authorized contacts are currently listed.
          </EmptyState>
        )}
      </section>
    </div>
  );
}

export default PortalRecordsPage;

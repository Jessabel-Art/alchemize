import { useCallback, useEffect, useMemo, useState } from "react";
import { portalApi } from "../../services/portal-api.js";
import { auth } from "../../services/admin-api.js";
import "./portal.css";
import ClientAppointments from "./ClientAppointments.jsx";
import TasksDocumentsWorkspace from "./TasksDocumentsWorkspace.jsx";

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
    "Book and manage time with Alchemize.",
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
    setState({ status: "loading", data: null, error: "" });
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
  const run = async (key, operation, success) => {
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
  };
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
  const { resource, data, groups, empty, busy, run } = props;
  if (resource === "services") {
    if (data?.item) {
      return (
        <ServiceDetail
          item={data.item}
          tasks={data.tasks || []}
          documents={data.documents || []}
          appointments={data.appointments || []}
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
    return <Billing data={data} empty={empty} busy={busy} run={run} />;
  if (resource === "profile")
    return <Profile data={data} empty={empty} busy={busy} run={run} />;
  return <EmptyState>{empty}</EmptyState>;
}

function ServiceDetail({
  item,
  tasks = [],
  documents = [],
  appointments = [],
  activity = [],
  empty,
}) {
  return (
    <div className="portal-workspace-grid">
      <div className="portal-workspace-primary">
        <section className="portal-service-detail" aria-label="Service detail">
          <div className="portal-services-header">
            <div>
              <span className="section-kicker">Active service</span>
              <h2>{item.title}</h2>
            </div>
            <a className="portal-action-button" href="/client-portal/services">
              Back to services
            </a>
          </div>
          <p>{item.description || "Service in progress."}</p>
          <div className="portal-service-meta">
            <small>Status: {labelFor(item.status)}</small>
            {item.start_date ? (
              <small>Started: {formatDate(item.start_date)}</small>
            ) : null}
            {item.target_date ? (
              <small>Target date: {formatDate(item.target_date)}</small>
            ) : null}
          </div>
        </section>

        {tasks.length ? (
          <section className="portal-group-stack">
            <h2>Tasks</h2>
            <ul className="portal-record-list">
              {tasks.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>
                      {task.description ||
                        task.engagement_title ||
                        "Client-visible task"}
                    </p>
                  </div>
                  <div className="portal-record-meta">
                    <span>{labelFor(task.status)}</span>
                    {task.due_date ? (
                      <small>Due {formatDate(task.due_date)}</small>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {documents.length ? (
          <section className="portal-group-stack">
            <h2>Documents</h2>
            <ul className="portal-record-list">
              {documents.map((document) => (
                <li key={document.id}>
                  <div>
                    <strong>{document.document_name}</strong>
                    <p>
                      {document.client_instructions || "Requested document"}
                    </p>
                  </div>
                  <div className="portal-record-meta">
                    <span>{labelFor(document.status)}</span>
                    {document.due_date ? (
                      <small>Due {formatDate(document.due_date)}</small>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!tasks.length &&
        !documents.length &&
        !appointments.length &&
        !activity.length ? (
          <EmptyState>{empty}</EmptyState>
        ) : null}
      </div>
      <aside className="portal-workspace-utility">
        <a
          className="portal-action-button"
          href={
            "/client-portal/appointments?engagement=" +
            encodeURIComponent(item.id)
          }
        >
          Book an appointment
        </a>
        {appointments.length ? (
          <section className="portal-service-support">
            <span className="section-kicker">Appointments</span>
            <h3>Appointments</h3>
            <ul>
              {appointments.map((appointment) => (
                <li key={appointment.id}>
                  {appointment.appointment_type || "Consultation"} ·{" "}
                  {formatDate(
                    appointment.scheduled_start || appointment.scheduled_at,
                    true,
                  )}{" "}
                  <a
                    href={
                      "/client-portal/appointments?appointment=" +
                      encodeURIComponent(appointment.id)
                    }
                  >
                    View appointment
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {activity.length ? (
          <section className="portal-service-support muted">
            <span className="section-kicker">Recent activity</span>
            <h3>Latest updates</h3>
            <ul>
              {activity.slice(0, 5).map((entry) => (
                <li key={entry.id}>{entry.summary}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </aside>
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
            () =>
              portalApi.uploadGeneralDocument(file, {
                document_name: documentName,
                comment,
              }),
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
            () => portalApi.uploadDocument(item.id, file, comment),
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

function Messages({ items, empty, busy, run }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState({});
  const [opened, setOpened] = useState(null);
  const [threadError, setThreadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [readIds, setReadIds] = useState(() => new Set());
  const filteredItems = items.filter((thread) => {
    if (filter === "unread")
      return !readIds.has(thread.id) && Number(thread.unread_count) > 0;
    if (filter === "action") return Number(thread.client_action_required) > 0;
    if (filter === "archived") return thread.status === "archived";
    return thread.status !== "archived";
  });
  const openThread = async (id) => {
    setThreadError("");
    try {
      setOpened(await portalApi.thread(id));
      setReadIds((current) => new Set([...current, id]));
      window.dispatchEvent(new CustomEvent("alchemize:portal-refresh"));
    } catch (error) {
      setThreadError(error.message);
    }
  };
  return (
    <div className="portal-workspace-grid">
      <section className="portal-workspace-primary">
        <h2>Message history</h2>

        {threadError ? (
          <p className="portal-feedback error" role="alert">
            {threadError}
          </p>
        ) : null}
        {opened ? (
          <section className="portal-thread" aria-live="polite">
            <div className="portal-section-heading">
              <div>
                <h2>{opened.thread.subject}</h2>
                <p>Conversation with Alchemize</p>
                {opened.thread.related_entity_type ? (
                  <small>
                    Related to {labelFor(opened.thread.related_entity_type)}
                  </small>
                ) : null}
              </div>
              <button
                type="button"
                className="portal-action-button"
                onClick={() => setOpened(null)}
              >
                Close thread
              </button>
            </div>
            <ol>
              {opened.messages.map((entry) => (
                <li key={entry.id} className={entry.sender_type}>
                  <strong>{entry.sender_name}</strong>
                  <p>{entry.message_body}</p>
                  <small>{formatDate(entry.created_at, true)}</small>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <div className="portal-filter-bar" aria-label="Message filters">
          {[
            ["all", "All messages"],
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
            </button>
          ))}
        </div>
        {filteredItems.length ? (
          <ul className="portal-record-list portal-message-list">
            {filteredItems.map((thread) => (
              <li key={thread.id}>
                <div>
                  <strong>{thread.subject}</strong>
                  <p>{thread.latest_message}</p>
                  <small>
                    {formatDate(thread.last_message_at, true)} ·{" "}
                    {readIds.has(thread.id) ? 0 : thread.unread_count || 0}{" "}
                    unread
                  </small>
                  {Number(thread.client_action_required) ? (
                    <p className="portal-pending-note">
                      Your response is requested.
                    </p>
                  ) : null}
                  {thread.status !== "archived" ? (
                    <label className="portal-inline-field">
                      <span>Reply</span>
                      <textarea
                        maxLength={5000}
                        value={reply[thread.id] || ""}
                        onChange={(event) =>
                          setReply({
                            ...reply,
                            [thread.id]: event.target.value,
                          })
                        }
                      />
                    </label>
                  ) : null}
                </div>
                <div className="portal-record-meta">
                  <span>{labelFor(thread.status)}</span>
                  <div className="portal-action-group">
                    <ActionButton onClick={() => openThread(thread.id)}>
                      Open thread
                    </ActionButton>
                    {thread.status !== "archived" ? (
                      <>
                        <ActionButton
                          busy={busy === thread.id}
                          onClick={() =>
                            run(
                              thread.id,
                              () =>
                                portalApi.reply(
                                  thread.id,
                                  reply[thread.id] || "",
                                ),
                              "Reply sent.",
                            )
                          }
                        >
                          Send reply
                        </ActionButton>
                        <ActionButton
                          busy={busy === `${thread.id}-archive`}
                          onClick={() =>
                            run(
                              `${thread.id}-archive`,
                              () => portalApi.archiveThread(thread.id),
                              "Conversation archived.",
                            )
                          }
                        >
                          Archive
                        </ActionButton>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>{empty}</EmptyState>
        )}
      </section>
      <aside className="portal-workspace-utility">
        {" "}
        <form
          className="portal-composer"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              "new-message",
              () => portalApi.createThread({ subject, message }),
              "Message sent to Alchemize.",
            );
          }}
        >
          <h2>Send a message to Alchemize</h2>
          <label>
            <span>Subject</span>
            <input
              required
              maxLength={180}
              value={subject}
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
          <button
            className="portal-action-button"
            disabled={busy === "new-message"}
          >
            {busy === "new-message" ? "Sending…" : "Send message"}
          </button>
        </form>
      </aside>
    </div>
  );
}

function PayPalInvoiceButton({ invoice, clientId, run }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!clientId || !containerRef.current) return undefined;

    let cancelled = false;

    const renderButtons = async () => {
      const existingScript = document.querySelector(
        `script[data-paypal-client-id="${clientId}"]`,
      );

      if (!existingScript) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");

          script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
            clientId,
          )}&currency=${encodeURIComponent(
            String(invoice.currency || "USD").toUpperCase(),
          )}`;

          script.async = true;
          script.dataset.paypalClientId = clientId;
          script.onload = resolve;
          script.onerror = () =>
            reject(new Error("PayPal could not be loaded."));

          document.head.appendChild(script);
        });
      } else if (!window.paypal) {
        await new Promise((resolve, reject) => {
          existingScript.addEventListener("load", resolve, { once: true });
          existingScript.addEventListener(
            "error",
            () => reject(new Error("PayPal could not be loaded.")),
            { once: true },
          );
        });
      }

      if (cancelled || !containerRef.current || !window.paypal?.Buttons) {
        return;
      }

      containerRef.current.innerHTML = "";

      await window.paypal
        .Buttons({
          style: {
            layout: "horizontal",
            label: "paypal",
            height: 40,
          },

          createOrder: async () => {
            const order = await portalApi.createPaypalOrder(invoice.id);

            if (!order.order_id) {
              throw new Error("PayPal order could not be created.");
            }

            return order.order_id;
          },

          onApprove: async (data) => {
            await run(
              `${invoice.id}-paypal`,
              () => portalApi.capturePaypalOrder(invoice.id, data.orderID),
              "PayPal payment completed.",
            );
          },

          onError: (error) => {
            console.error("PayPal checkout failed:", error);
          },
        })
        .render(containerRef.current);
    };

    renderButtons().catch((error) => {
      console.error("PayPal initialization failed:", error);
    });

    return () => {
      cancelled = true;

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [clientId, invoice.id, invoice.currency, run]);

  return <div className="portal-paypal-button" ref={containerRef} />;
}

function Billing({ data, empty, busy, run }) {
  const nextInvoice = [...(data.invoices || [])]
    .filter((item) => Number(item.outstanding_balance) > 0)
    .sort((a, b) =>
      String(a.due_date || "9999").localeCompare(String(b.due_date || "9999")),
    )[0];
  return (
    <>
      <div className="portal-financial-overview">
        <section className="portal-billing-summary">
          <span>Open balance</span>
          <strong>{formatCurrency(data.summary?.open_balance)}</strong>
        </section>
        <section className="portal-next-invoice">
          <span className="section-kicker">Next invoice</span>
          {nextInvoice ? (
            <>
              <h2>{nextInvoice.invoice_number}</h2>
              <p>
                {formatCurrency(
                  nextInvoice.outstanding_balance,
                  nextInvoice.currency,
                )}{" "}
                · Due {formatDate(nextInvoice.due_date)}
              </p>
              <span>{labelFor(nextInvoice.status)}</span>
            </>
          ) : (
            <p className="portal-empty-state">No open invoices.</p>
          )}
        </section>
      </div>
      <h2>Invoices</h2>
      {(data.invoices || []).length ? (
        <ul className="portal-record-list">
          {data.invoices.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.invoice_number}</strong>
                <p>
                  {item.engagement_title ||
                    item.client_facing_notes ||
                    "Issued invoice"}
                </p>
                <small>
                  Issued {formatDate(item.invoice_date)} · Due{" "}
                  {formatDate(item.due_date)}
                </small>
                <div className="portal-action-group">
                  <button
                    type="button"
                    className="portal-action-button"
                    onClick={() => window.print()}
                  >
                    Print invoice
                  </button>
                  <a
                    className="portal-action-button"
                    href={`mailto:billing@getalchemize.com?subject=${encodeURIComponent(`Invoice ${item.invoice_number}`)}`}
                  >
                    Contact billing
                  </a>
                </div>
              </div>
              <div className="portal-record-meta">
                <span>{labelFor(item.status)}</span>
                <strong>
                  {formatCurrency(item.outstanding_balance, item.currency)}
                </strong>
                <small>
                  {formatCurrency(item.paid_total, item.currency)} paid
                </small>
                <ActionButton
                  busy={busy === item.id}
                  onClick={() =>
                    run(
                      item.id,
                      () => portalApi.acknowledge("invoice", item.id),
                      "Invoice notice acknowledged.",
                    )
                  }
                >
                  Acknowledge
                </ActionButton>
                {["open", "partially_paid", "past_due"].includes(item.status) &&
                Number(item.outstanding_balance) > 0 ? (
                  <ActionButton
                    busy={busy === `${item.id}-pay`}
                    onClick={() =>
                      run(
                        `${item.id}-pay`,
                        async () => {
                          const checkout = await portalApi.checkoutInvoice(
                            item.id,
                          );
                          if (!checkout.checkout_url)
                            throw new Error(
                              "Online payment is temporarily unavailable.",
                            );
                          window.location.assign(checkout.checkout_url);
                        },
                        "Opening secure payment…",
                      )
                    }
                  >
                    Pay securely
                  </ActionButton>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>{empty}</EmptyState>
      )}
      {(data.payments || []).length ? (
        <>
          <h2>Payment history</h2>
          <ul className="portal-record-list">
            {data.payments.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.invoice_number}</strong>
                  <small>{formatDate(item.payment_date)}</small>
                </div>
                <div className="portal-record-meta">
                  <strong>{formatCurrency(item.amount)}</strong>
                  <small>{labelFor(item.payment_method)}</small>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

function Profile({ data, empty, busy, run }) {
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });
  const client = data.client;
  const [form, setForm] = useState(() =>
    client
      ? {
          primary_email: client.primary_email || "",
          primary_phone: client.primary_phone || "",
          preferred_contact_method: client.preferred_contact_method || "email",
          language_preference: client.language_preference || "en",
          legal_name: "",
          business_legal_name: "",
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
  return (
    <div className="portal-profile-layout">
      <section className="portal-profile-details">
        <h2>{client.display_name}</h2>
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
            );
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
                  placeholder={client.business_legal_name || "Propose a change"}
                />
              </label>
            ) : null}
          </fieldset>
          <button
            className="portal-action-button"
            disabled={busy === "profile"}
          >
            {busy === "profile" ? "Saving…" : "Save profile changes"}
          </button>
        </form>
      </section>
      <section>
        <h2>Portal access and authorized users</h2>
        <form
          className="portal-composer"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              "change-password",
              () => auth.changePassword(passwordForm),
              "Password changed successfully.",
            );
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
          <button
            className="portal-action-button"
            disabled={busy === "change-password"}
          >
            Change Password
          </button>
        </form>
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
                  {item.name} ({item.email}) â€”{" "}
                  {labelFor(item.requested_access_role)}
                </p>
              ))}
          </div>
        ) : null}
        {data.access_role === "primary_contact" ? (
          <form
            className="portal-composer"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                "access-request",
                () => portalApi.requestAuthorizedUser(accessRequest),
                "Portal access request sent for Admin review.",
              );
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
            <button
              className="portal-action-button"
              disabled={busy === "access-request"}
            >
              Request Admin review
            </button>
          </form>
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

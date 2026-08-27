import { useCallback, useEffect, useMemo, useState } from "react";
import { portalApi } from "../../services/portal-api.js";
import { auth } from "../../services/admin-api.js";
import "./portal.css";

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
  documents: [
    "Documents",
    "Documents",
    "Respond securely to requested documents and review shared document status.",
    "No outstanding document requests.",
  ],
  appointments: [
    "Appointments",
    "Appointments",
    "Confirm consultations or request scheduling changes without overwriting the appointment.",
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

function PortalRecordsPage({ resource }) {
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
      setState({
        status: "ready",
        data: await portalApi[resource](),
        error: "",
      });
    } catch (error) {
      setState({ status: "error", data: null, error: error.message });
    }
  }, [resource]);
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
  const groups = useMemo(
    () => groupRecords(resource, state.data?.items || []),
    [resource, state.data],
  );

  return (
    <div className="portal-page client-records-page">
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
  if (resource === "services")
    return (
      <Services items={data.items || []} empty={empty} busy={busy} run={run} />
    );
  if (resource === "tasks")
    return <Tasks groups={groups} empty={empty} busy={busy} run={run} />;
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

function Services({ items, empty, busy, run }) {
  const [request, setRequest] = useState({ service_key: "", message: "" });
  return (
    <>
      <form
        className="portal-composer"
        onSubmit={(event) => {
          event.preventDefault();
          run(
            "service-request",
            () => portalApi.requestService(request),
            "Service request sent for Admin review.",
          );
        }}
      >
        <h2>Request a service</h2>
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
            <option value="individual-insurance">Individual insurance</option>
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
          className="portal-action-button"
          disabled={busy === "service-request"}
        >
          {busy === "service-request" ? "Sending…" : "Request service"}
        </button>
      </form>
      {!items.length ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <ul className="portal-record-list">
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>
                  {item.description ||
                    item.service_names?.join(" · ") ||
                    "Service details will appear as the engagement progresses."}
                </p>
                <small>{item.service_names?.join(" · ")}</small>
              </div>
              <div className="portal-record-meta">
                <span>{labelFor(item.status)}</span>
                <small>Started {formatDate(item.start_date)}</small>
                {item.assigned_contact ? (
                  <small>Contact: {item.assigned_contact}</small>
                ) : null}
                <ActionButton
                  busy={busy === item.id}
                  onClick={() =>
                    run(
                      item.id,
                      () => portalApi.acknowledge("engagement", item.id),
                      "Service update acknowledged.",
                    )
                  }
                >
                  Acknowledge update
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Tasks({ groups, empty, busy, run }) {
  const [responses, setResponses] = useState({});
  if (!groups.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="portal-group-stack">
      {groups.map((group) => (
        <section key={group.label}>
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
    <div className="portal-group-stack">
      <GeneralDocumentUpload busy={busy} run={run} />
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
        <section key={group.label}>
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
                    <small>Latest submission: {item.submitted_filename}</small>
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

function Appointments({ items, empty, busy, run }) {
  const [requests, setRequests] = useState({});
  const [newRequest, setNewRequest] = useState({
    preferred_at: "",
    appointment_type: "Consultation",
    location_type: "virtual",
    reason: "",
  });
  return (
    <>
      <form
        className="portal-composer"
        onSubmit={(event) => {
          event.preventDefault();
          run(
            "appointment-request",
            () =>
              portalApi.requestAppointment({
                ...newRequest,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }),
            "Appointment request sent for scheduling review.",
          );
        }}
      >
        <h2>Request an appointment</h2>
        <label>
          <span>Preferred date and time</span>
          <input
            required
            type="datetime-local"
            value={newRequest.preferred_at}
            onChange={(event) =>
              setNewRequest({ ...newRequest, preferred_at: event.target.value })
            }
          />
        </label>
        <label>
          <span>Appointment type</span>
          <input
            required
            maxLength="80"
            value={newRequest.appointment_type}
            onChange={(event) =>
              setNewRequest({
                ...newRequest,
                appointment_type: event.target.value,
              })
            }
          />
        </label>
        <label>
          <span>Meeting method</span>
          <select
            value={newRequest.location_type}
            onChange={(event) =>
              setNewRequest({
                ...newRequest,
                location_type: event.target.value,
              })
            }
          >
            <option value="virtual">Virtual</option>
            <option value="phone">Phone</option>
            <option value="in_person">In person</option>
          </select>
        </label>
        <label>
          <span>Reason (optional)</span>
          <textarea
            maxLength="2000"
            value={newRequest.reason}
            onChange={(event) =>
              setNewRequest({ ...newRequest, reason: event.target.value })
            }
          />
        </label>
        <button
          className="portal-action-button"
          disabled={busy === "appointment-request"}
        >
          {busy === "appointment-request" ? "Sending…" : "Request appointment"}
        </button>
      </form>
      {!items.length ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <ul className="portal-record-list">
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.appointment_type}</strong>
                <p>
                  {item.client_instructions ||
                    item.engagement_title ||
                    "Appointment details"}
                </p>
                <small>
                  {item.location_type
                    ? labelFor(item.location_type)
                    : "Method to be confirmed"}
                </small>
                {item.pending_request ? (
                  <p className="portal-pending-note">
                    Your {labelFor(item.pending_request)} request is awaiting
                    Alchemize review.
                  </p>
                ) : null}
                {!["completed", "cancelled"].includes(item.status) &&
                !item.pending_request ? (
                  <div className="portal-appointment-request">
                    <label>
                      <span>Preferred new date and time</span>
                      <input
                        type="datetime-local"
                        value={requests[item.id]?.date || ""}
                        onChange={(event) =>
                          setRequests({
                            ...requests,
                            [item.id]: {
                              ...requests[item.id],
                              date: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Reason (optional)</span>
                      <input
                        maxLength={2000}
                        value={requests[item.id]?.reason || ""}
                        onChange={(event) =>
                          setRequests({
                            ...requests,
                            [item.id]: {
                              ...requests[item.id],
                              reason: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </div>
              <div className="portal-record-meta">
                <span>{labelFor(item.status)}</span>
                <small>{formatDate(item.scheduled_at, true)}</small>
                <div className="portal-action-group">
                  {item.client_instructions ? (
                    <ActionButton
                      busy={busy === `${item.id}-acknowledge`}
                      onClick={() =>
                        run(
                          `${item.id}-acknowledge`,
                          () =>
                            portalApi.appointmentAction(item.id, "acknowledge"),
                          "Appointment instructions acknowledged.",
                        )
                      }
                    >
                      Acknowledge instructions
                    </ActionButton>
                  ) : null}
                  {["requested", "scheduled"].includes(item.status) &&
                  !item.pending_request ? (
                    <ActionButton
                      busy={busy === `${item.id}-confirm`}
                      onClick={() =>
                        run(
                          `${item.id}-confirm`,
                          () => portalApi.appointmentAction(item.id, "confirm"),
                          "Appointment confirmed.",
                        )
                      }
                    >
                      Confirm
                    </ActionButton>
                  ) : null}
                  {!["completed", "cancelled"].includes(item.status) &&
                  !item.pending_request ? (
                    <>
                      <ActionButton
                        busy={busy === `${item.id}-reschedule`}
                        onClick={() =>
                          run(
                            `${item.id}-reschedule`,
                            () =>
                              portalApi.appointmentAction(
                                item.id,
                                "request-reschedule",
                                {
                                  requested_at: requests[item.id]?.date,
                                  reason: requests[item.id]?.reason,
                                },
                              ),
                            "Reschedule request sent.",
                          )
                        }
                      >
                        Request reschedule
                      </ActionButton>
                      <ActionButton
                        busy={busy === `${item.id}-cancel`}
                        onClick={() =>
                          run(
                            `${item.id}-cancel`,
                            () =>
                              portalApi.appointmentAction(
                                item.id,
                                "request-cancellation",
                                { reason: requests[item.id]?.reason },
                              ),
                            "Cancellation request sent.",
                          )
                        }
                      >
                        Request cancellation
                      </ActionButton>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
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
    <>
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
                  {readIds.has(thread.id) ? 0 : thread.unread_count || 0} unread
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
                        setReply({ ...reply, [thread.id]: event.target.value })
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
    </>
  );
}

function Billing({ data, empty, busy, run }) {
  return (
    <>
      <section className="portal-billing-summary">
        <span>Open balance</span>
        <strong>{formatCurrency(data.summary?.open_balance)}</strong>
      </section>
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

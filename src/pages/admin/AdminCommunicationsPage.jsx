import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessagesSquare, Sprout } from "lucide-react";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminEmptyState,
} from "../../components/admin/admin-components.jsx";
import { portalAdmin } from "../../services/admin-api.js";
import { adminStore } from "../../../js/data/admin-store.js";
import "./admin-communications.css";

const labels = {
  open: "Open",
  waiting_on_client: "Waiting on Client",
  waiting_on_alchemize: "Waiting on Alchemize",
  resolved: "Resolved",
  archived: "Archived",
};

const statusTone = {
  open: "info",
  waiting_on_client: "warning",
  waiting_on_alchemize: "warning",
  resolved: "success",
  archived: "neutral",
};

const listEmptyState = {
  active: {
    title: "No open conversations",
    description: "New client conversations will appear here.",
  },
  unread: {
    title: "No unread conversations",
    description: "You're caught up on every client message.",
  },
  response: {
    title: "Nothing needs a response",
    description: "Conversations waiting on Alchemize will appear here.",
  },
  archived: {
    title: "No archived conversations",
    description: "Archived conversations will appear here once archived.",
  },
};

const relatedEntityLabels = {
  service: "Service",
  engagement: "Engagement",
  task: "Task",
  document: "Document",
  appointment: "Appointment",
  invoice: "Invoice",
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "—");

const formatShortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const dateHeading = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const getInitials = (name = "") => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "—";
};

export default function AdminCommunicationsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("active");
  const [opened, setOpened] = useState(null);
  const [reply, setReply] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [relation, setRelation] = useState({ type: "", id: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({
    clientId: "",
    subject: "",
    message: "",
  });
  const snapshot = adminStore.getSnapshot();
  const clients = snapshot.clients;

  const load = async () => {
    try {
      setError("");
      const data = await portalAdmin.messages();
      setItems(data?.items || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load client conversations.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () => ({
      active: items.filter((thread) => thread.status !== "archived").length,
      unread: items.filter((thread) => Number(thread.unread_count) > 0).length,
      response: items.filter(
        (thread) => thread.status === "waiting_on_alchemize",
      ).length,
      archived: items.filter((thread) => thread.status === "archived").length,
    }),
    [items],
  );

  const visible = useMemo(
    () =>
      items.filter((thread) => {
        if (filter === "unread") return Number(thread.unread_count) > 0;
        if (filter === "response")
          return thread.status === "waiting_on_alchemize";
        if (filter === "archived") return thread.status === "archived";
        return thread.status !== "archived";
      }),
    [items, filter],
  );

  // A conversation open in the center pane that no longer belongs to the
  // active filter (e.g. switching to Archived while a non-archived thread
  // is open) must not keep presenting stale content as though it were
  // still part of the current view -- clear the selection instead. This
  // must only re-check when the *filter* changes, not whenever `items`
  // refetches -- a refetch also follows the admin's own actions on the
  // open thread (archive, resolve, reply), and re-checking against those
  // would immediately evict the thread the admin just acted on, hiding
  // things like the Restore-to-Inbox action right after archiving.
  useEffect(() => {
    if (opened && !visible.some((thread) => thread.id === opened.thread.id)) {
      setOpened(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const open = async (id) => {
    try {
      setError("");
      setReply("");
      setReplySent(false);
      setOpened(await portalAdmin.message(id));
      await load();
    } catch (openError) {
      setError(openError.message || "Unable to open this conversation.");
    }
  };

  const sendReply = async () => {
    if (!opened || !reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      await portalAdmin.reply(opened.thread.id, reply.trim());
      setReply("");
      setReplySent(true);
      setOpened(await portalAdmin.message(opened.thread.id));
      await load();
    } catch (replyError) {
      setError(replyError.message || "Unable to send the reply.");
    } finally {
      setBusy(false);
    }
  };

  const startConversation = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await portalAdmin.createMessage({
        client_id: Number(compose.clientId),
        subject: compose.subject.trim(),
        message: compose.message.trim(),
      });
      setComposeOpen(false);
      setCompose({ clientId: "", subject: "", message: "" });
      await load();
      if (result?.thread_id) await open(result.thread_id);
    } catch (composeError) {
      setError(composeError.message || "Unable to start the conversation.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status) => {
    if (!opened) return;
    setBusy(true);
    try {
      await portalAdmin.updateMessage(opened.thread.id, status);
      setOpened(await portalAdmin.message(opened.thread.id));
      await load();
    } catch (statusError) {
      setError(statusError.message || "Unable to update the conversation.");
    } finally {
      setBusy(false);
    }
  };

  const linkRecord = async () => {
    if (!opened || !relation.type || !relation.id) return;
    setBusy(true);
    try {
      await portalAdmin.linkMessage(opened.thread.id, {
        related_entity_type: relation.type,
        related_entity_id: relation.id,
      });
      setRelation({ type: "", id: "" });
      setOpened(await portalAdmin.message(opened.thread.id));
      await load();
    } catch (linkError) {
      setError(linkError.message || "Unable to link the client record.");
    } finally {
      setBusy(false);
    }
  };

  const clientRecord = opened
    ? clients.find((client) => client.id === String(opened.thread.client_id))
    : null;

  const upcomingAppointment = useMemo(() => {
    if (!opened) return null;
    const today = new Date().toISOString().slice(0, 10);
    const candidates = snapshot.appointments
      .filter(
        (appointment) =>
          appointment.clientId === String(opened.thread.client_id) &&
          appointment.date >= today &&
          appointment.status !== "Cancelled",
      )
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return candidates[0] || null;
  }, [opened, snapshot.appointments]);

  // The client's own existing records, grouped by the relationship types
  // the backend actually supports (server/services/portal-admin-service.php
  // linkThread(): service, engagement, task, document, appointment,
  // invoice). "service" is omitted here: linkThread() resolves it through
  // engagement_services, a join this admin snapshot has no client-scoped
  // view of, so a selectable list for it can't be built without inventing
  // an association from a different (client_service_assignments) table
  // that wouldn't actually resolve on the backend.
  const relatableByType = useMemo(() => {
    const clientId = opened ? String(opened.thread.client_id) : null;
    if (!clientId) return {};
    return {
      engagement: snapshot.engagements
        .filter((row) => row.clientId === clientId)
        .map((row) => ({
          value: row.publicId,
          label: `${row.title || "Engagement"} — ${row.status}`,
        })),
      task: snapshot.tasks
        .filter((row) => row.clientId === clientId)
        .map((row) => ({
          value: row.publicId,
          label: `${row.title || "Task"} — ${row.status}`,
        })),
      document: snapshot.documents
        .filter((row) => row.clientId === clientId)
        .map((row) => ({
          value: row.publicId,
          label: `${row.name || "Document"} — ${row.status}`,
        })),
      appointment: snapshot.appointments
        .filter((row) => row.clientId === clientId && row.publicId)
        .map((row) => ({
          value: row.publicId,
          label: `${row.type || "Appointment"} — ${formatShortDate(row.date)}`,
        })),
      invoice: snapshot.invoices
        .filter((row) => row.clientId === clientId)
        .map((row) => ({
          value: row.publicId,
          label: `Invoice ${row.invoiceNumber || row.id} — ${row.status}`,
        })),
    };
  }, [
    opened,
    snapshot.engagements,
    snapshot.tasks,
    snapshot.documents,
    snapshot.appointments,
    snapshot.invoices,
  ]);

  const relatableTypeOptions = useMemo(
    () =>
      Object.entries(relatedEntityLabels)
        .filter(([type]) => type !== "service")
        .map(([type, label]) => ({
          type,
          label,
          options: relatableByType[type] || [],
        })),
    [relatableByType],
  );

  const relatedRecord = useMemo(() => {
    const type = opened?.thread?.related_entity_type;
    const id = opened?.thread?.related_entity_id;
    if (!type || !id) return null;
    const match = (relatableByType[type] || []).find(
      (option) => option.value === id,
    );
    if (match) return match.label;
    if (type === "engagement") {
      const engagement = snapshot.engagements.find((e) => e.publicId === id);
      if (engagement)
        return `${engagement.serviceName || engagement.title || "Engagement"} — ${engagement.status}`;
    }
    if (type === "invoice") {
      const invoice = snapshot.invoices.find((i) => i.publicId === id);
      if (invoice) return `Invoice ${invoice.invoiceNumber || invoice.id}`;
    }
    return relatedEntityLabels[type] || type;
  }, [opened, relatableByType, snapshot.engagements, snapshot.invoices]);

  const messageGroups = useMemo(() => {
    const groups = [];
    (opened?.messages || []).forEach((message) => {
      const key = new Date(message.created_at).toDateString();
      const current = groups[groups.length - 1];
      if (current && current.key === key) current.messages.push(message);
      else groups.push({ key, messages: [message] });
    });
    return groups;
  }, [opened]);

  const isArchived = opened?.thread?.status === "archived";

  return (
    <div className="admin-module admin-communications">
      <AdminPageHeader
        eyebrow="Client communications"
        title="Communication center"
        summary="Review client conversations, respond, and keep ownership of the next step clear."
        actions={[
          {
            label: "+ New Conversation",
            primary: true,
            onClick: () => setComposeOpen(true),
          },
        ]}
      />
      {composeOpen ? (
        <form
          className="admin-section setting-group admin-compose-panel"
          onSubmit={startConversation}
        >
          <h2>New client conversation</h2>
          <label>
            <span>Client</span>
            <select
              required
              value={compose.clientId}
              onChange={(event) =>
                setCompose({ ...compose, clientId: event.target.value })
              }
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.displayName}
                </option>
              ))}
            </select>
          </label>
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
            <button className="primary-button" disabled={busy}>
              Send message
            </button>
            <button type="button" onClick={() => setComposeOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {error ? (
        <p className="admin-feedback error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="portal-filter-bar" aria-label="Conversation filters">
        {[
          ["active", "Inbox", counts.active],
          ["unread", "Unread", counts.unread],
          ["response", "Needs response", counts.response],
          ["archived", "Archived", counts.archived],
        ].map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "active" : ""}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
            <span className="comm-tab-count">{count}</span>
          </button>
        ))}
      </div>
      <div
        className={`admin-workspace-grid ${opened ? "has-conversation three-pane" : "no-selection"}`}
      >
        <section className="admin-list-panel" aria-label="Client conversations">
          {visible.length ? (
            visible.map((thread) => {
              const unread = Number(thread.unread_count) > 0;
              return (
                <button
                  className={`admin-list-row ${opened?.thread.id === thread.id ? "selected" : ""} ${unread ? "unread" : ""}`}
                  aria-pressed={opened?.thread.id === thread.id}
                  type="button"
                  key={thread.id}
                  onClick={() => open(thread.id)}
                >
                  <span className="comm-avatar" aria-hidden="true">
                    {getInitials(thread.client_name)}
                  </span>
                  <span className="comm-row-body">
                    <span className="comm-row-heading">
                      <strong>{thread.client_name}</strong>
                      <small>{formatShortDate(thread.last_message_at)}</small>
                    </span>
                    <small className="comm-row-subject">
                      {thread.latest_message || thread.subject}
                    </small>
                    <span className="comm-row-footer">
                      <AdminStatusBadge
                        status={labels[thread.status] || thread.status}
                        tone={statusTone[thread.status]}
                      />
                      {unread ? (
                        <small className="admin-unread-indicator">
                          <span
                            className="admin-unread-dot"
                            aria-hidden="true"
                          />
                          {thread.unread_count} unread
                        </small>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <AdminEmptyState
              title={listEmptyState[filter]?.title || "No conversations"}
              description={listEmptyState[filter]?.description}
            />
          )}
          {visible.length ? (
            <p className="comm-list-count">
              {visible.length} conversation{visible.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </section>
        {opened ? (
          <>
            <section className="admin-conversation-panel" aria-live="polite">
              <button
                type="button"
                className="comm-back-button"
                onClick={() => setOpened(null)}
              >
                ← Back to conversations
              </button>
              <header className="comm-thread-header">
                <span className="comm-avatar comm-avatar-lg" aria-hidden="true">
                  {getInitials(opened.thread.client_name)}
                </span>
                <div className="comm-thread-heading">
                  <div className="comm-thread-title-row">
                    <h2>{opened.thread.client_name}</h2>
                    <AdminStatusBadge
                      status={
                        labels[opened.thread.status] || opened.thread.status
                      }
                      tone={statusTone[opened.thread.status]}
                    />
                  </div>
                  <p className="comm-thread-subject">{opened.thread.subject}</p>
                  {relatedRecord ||
                  opened.thread.language_preference === "es" ? (
                    <p className="comm-thread-contact">
                      {relatedRecord}
                      {relatedRecord &&
                      opened.thread.language_preference === "es"
                        ? " · "
                        : ""}
                      {opened.thread.language_preference === "es"
                        ? "Prefers Español"
                        : ""}
                    </p>
                  ) : null}
                </div>
              </header>
              {messageGroups.map((group) => (
                <div className="comm-date-group" key={group.key}>
                  <div className="comm-date-separator">
                    {dateHeading(group.messages[0].created_at)}
                  </div>
                  <ol className="portal-thread">
                    {group.messages.map((message) => (
                      <li key={message.id} className={message.sender_type}>
                        <span
                          className="comm-avatar comm-avatar-sm"
                          aria-hidden="true"
                        >
                          {getInitials(message.sender_name)}
                        </span>
                        <div className="comm-message-body">
                          <div className="portal-thread-meta">
                            <strong>{message.sender_name}</strong>
                            <small>{formatDate(message.created_at)}</small>
                          </div>
                          <p>{message.message_body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              {isArchived ? (
                <p className="comm-archived-note">
                  This conversation is archived. Restore it to the inbox to
                  reply.
                </p>
              ) : (
                <div className="admin-reply-composer">
                  <label className="portal-inline-field">
                    <span>Reply</span>
                    <textarea
                      maxLength={5000}
                      value={reply}
                      onChange={(event) => {
                        setReply(event.target.value);
                        setReplySent(false);
                      }}
                    />
                  </label>
                  {replySent ? (
                    <p className="admin-feedback success">Reply sent.</p>
                  ) : null}
                  <div className="portal-action-group">
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busy || !reply.trim()}
                      onClick={sendReply}
                    >
                      {busy ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </div>
              )}
            </section>
            <section
              className="admin-context-panel"
              aria-label="Conversation context and actions"
            >
              <div className="comm-context-section">
                <div className="comm-context-header">
                  <h3>Client details</h3>
                  {opened.thread.client_id ? (
                    <Link to={`/admin/clients/${opened.thread.client_id}`}>
                      View client →
                    </Link>
                  ) : null}
                </div>
                <div className="comm-client-identity">
                  <span className="comm-avatar" aria-hidden="true">
                    {getInitials(opened.thread.client_name)}
                  </span>
                  <div>
                    <strong>{opened.thread.client_name}</strong>
                    {clientRecord?.email ? <p>{clientRecord.email}</p> : null}
                    {clientRecord?.phone ? <p>{clientRecord.phone}</p> : null}
                  </div>
                </div>
                <dl className="comm-detail-list">
                  <div>
                    <dt>Status</dt>
                    <dd>{clientRecord?.status || "—"}</dd>
                  </div>
                  <div>
                    <dt>Client since</dt>
                    <dd>
                      {clientRecord?.createdAt
                        ? new Date(clientRecord.createdAt).toLocaleDateString(
                            undefined,
                            { month: "short", year: "numeric" },
                          )
                        : "—"}
                    </dd>
                  </div>
                  {upcomingAppointment ? (
                    <div>
                      <dt>Upcoming appointment</dt>
                      <dd>
                        {new Date(
                          `${upcomingAppointment.date}T12:00:00`,
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {upcomingAppointment.time}
                        <Link
                          to="/admin/appointments"
                          className="comm-inline-link"
                        >
                          View in calendar →
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="comm-context-section">
                <h3>Conversation details</h3>
                <dl className="comm-detail-list">
                  <div>
                    <dt>Created</dt>
                    <dd>
                      {opened.messages.length
                        ? formatDate(opened.messages[0].created_at)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Last message</dt>
                    <dd>{formatDate(opened.thread.last_message_at)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      {labels[opened.thread.status] || opened.thread.status}
                    </dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>
                      {opened.messages[0]?.sender_type === "client"
                        ? "Client portal"
                        : "Alchemize admin"}
                    </dd>
                  </div>
                  <div>
                    <dt>Related to</dt>
                    <dd>{relatedRecord || "Not linked"}</dd>
                  </div>
                </dl>
                <div className="comm-related-form">
                  <label>
                    <span>Related record type</span>
                    <select
                      value={relation.type}
                      onChange={(event) =>
                        setRelation({
                          type: event.target.value,
                          id: "",
                        })
                      }
                    >
                      <option value="">Select a type</option>
                      {relatableTypeOptions.map(({ type, label }) => (
                        <option key={type} value={type}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {relation.type ? (
                    <label>
                      <span>Related record</span>
                      <select
                        value={relation.id}
                        onChange={(event) =>
                          setRelation({ ...relation, id: event.target.value })
                        }
                      >
                        <option value="">
                          {(relatableByType[relation.type] || []).length
                            ? "Select a record"
                            : "No matching records for this client"}
                        </option>
                        {(relatableByType[relation.type] || []).map(
                          (option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  ) : null}
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy || !relation.type || !relation.id}
                    onClick={linkRecord}
                  >
                    Link record
                  </button>
                </div>
              </div>

              <div className="comm-context-section">
                <h3>Workflow</h3>
                {isArchived ? (
                  <>
                    <p className="comm-next-step">
                      <span className="comm-next-step-kicker">Archived</span>
                      This conversation is archived and read-only. Restore it to
                      reply.
                    </p>
                    <div className="portal-action-group">
                      <button
                        type="button"
                        className="primary-button"
                        disabled={busy}
                        onClick={() => setStatus("open")}
                      >
                        Restore to Inbox
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="comm-next-step">
                      <span className="comm-next-step-kicker">Next step</span>
                      {opened.thread.status === "resolved"
                        ? "Resolved — no action pending"
                        : labels[opened.thread.status] || opened.thread.status}
                    </p>
                    <div className="portal-action-group">
                      {opened.thread.status !== "waiting_on_client" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setStatus("waiting_on_client")}
                        >
                          Waiting on client
                        </button>
                      ) : null}
                      {opened.thread.status !== "waiting_on_alchemize" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setStatus("waiting_on_alchemize")}
                        >
                          Needs Alchemize response
                        </button>
                      ) : null}
                      {opened.thread.status !== "resolved" ? (
                        <button
                          type="button"
                          className="primary-button"
                          disabled={busy}
                          onClick={() => setStatus("resolved")}
                        >
                          Mark resolved
                        </button>
                      ) : null}
                    </div>
                    <div className="portal-action-group comm-archive-action">
                      <button
                        type="button"
                        className="link-button"
                        disabled={busy}
                        onClick={() => setStatus("archived")}
                      >
                        Archive conversation
                      </button>
                    </div>
                  </>
                )}
              </div>

              <aside className="dashboard-brand-note">
                <Sprout size={28} aria-hidden="true" />
                <div>
                  <strong>Keep the conversation going</strong>
                  <p>
                    Clear, timely communication builds stronger client
                    relationships.
                  </p>
                </div>
              </aside>
            </section>
          </>
        ) : (
          <div className="comm-empty-state">
            <h3>
              <MessagesSquare size={16} strokeWidth={1.75} aria-hidden="true" />
              Select a conversation
            </h3>
            <p>
              Select a conversation from the list to view its history and
              respond.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

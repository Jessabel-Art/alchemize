import { useEffect, useMemo, useState } from "react";
import {
  AdminPageHeader,
  AdminStatusBadge,
} from "../../components/admin/admin-components.jsx";
import { portalAdmin } from "../../services/admin-api.js";
import { adminStore } from "../../../js/data/admin-store.js";

const labels = {
  open: "Open",
  waiting_on_client: "Waiting on Client",
  waiting_on_alchemize: "Waiting on Alchemize",
  resolved: "Resolved",
  archived: "Archived",
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "—");

export default function AdminCommunicationsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("active");
  const [opened, setOpened] = useState(null);
  const [reply, setReply] = useState("");
  const [relation, setRelation] = useState({ type: "", id: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({
    clientId: "",
    subject: "",
    message: "",
  });
  const clients = adminStore.getSnapshot().clients;

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

  const open = async (id) => {
    try {
      setError("");
      setOpened(await portalAdmin.message(id));
      await load();
    } catch (openError) {
      setError(openError.message || "Unable to open this conversation.");
    }
  };

  const sendReply = async () => {
    if (!opened || !reply.trim()) return;
    setBusy(true);
    try {
      await portalAdmin.reply(opened.thread.id, reply.trim());
      setReply("");
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
    if (!opened || !relation.type || !relation.id.trim()) return;
    setBusy(true);
    try {
      await portalAdmin.linkMessage(opened.thread.id, {
        related_entity_type: relation.type,
        related_entity_id: relation.id.trim(),
      });
      setOpened(await portalAdmin.message(opened.thread.id));
      await load();
    } catch (linkError) {
      setError(linkError.message || "Unable to link the client record.");
    } finally {
      setBusy(false);
    }
  };

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
          ["active", "Inbox"],
          ["unread", "Unread"],
          ["response", "Needs response"],
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
      <div
        className={`admin-workspace-grid ${opened ? "has-conversation" : ""}`}
      >
        <section className="admin-list-panel" aria-label="Client conversations">
          {visible.length ? (
            visible.map((thread) => (
              <button
                className={`admin-list-row ${opened?.thread.id === thread.id ? "selected" : ""}`}
                aria-pressed={opened?.thread.id === thread.id}
                type="button"
                key={thread.id}
                onClick={() => open(thread.id)}
              >
                <span>
                  <strong>{thread.subject}</strong>
                  <small>
                    {thread.client_name} · {formatDate(thread.last_message_at)}
                  </small>
                </span>
                <span>
                  <AdminStatusBadge
                    status={labels[thread.status] || thread.status}
                  />
                  {Number(thread.unread_count) ? (
                    <small>{thread.unread_count} unread</small>
                  ) : null}
                </span>
              </button>
            ))
          ) : (
            <p className="admin-empty-state">
              No conversations match this view.
            </p>
          )}
        </section>
        <section className="admin-conversation-panel" aria-live="polite">
          {opened ? (
            <>
              <header>
                <h2>{opened.thread.subject}</h2>
                <p>
                  {opened.thread.client_name} · Preferred language:{" "}
                  {opened.thread.language_preference === "es"
                    ? "Español"
                    : "English"}
                </p>
              </header>
              <ol className="portal-thread">
                {opened.messages.map((message) => (
                  <li key={message.id} className={message.sender_type}>
                    <strong>{message.sender_name}</strong>
                    <p>{message.message_body}</p>
                    <small>{formatDate(message.created_at)}</small>
                  </li>
                ))}
              </ol>
              <label className="portal-inline-field">
                <span>Reply</span>
                <textarea
                  maxLength={5000}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                />
              </label>
              <div className="portal-action-group">
                <label>
                  <span>Related record type</span>
                  <select
                    value={relation.type}
                    onChange={(event) =>
                      setRelation({ ...relation, type: event.target.value })
                    }
                  >
                    <option value="">Select</option>
                    {[
                      "service",
                      "engagement",
                      "task",
                      "document",
                      "appointment",
                      "invoice",
                    ].map((type) => (
                      <option key={type} value={type}>
                        {labels[type] || type}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Related record reference</span>
                  <input
                    value={relation.id}
                    onChange={(event) =>
                      setRelation({ ...relation, id: event.target.value })
                    }
                    placeholder="Record reference"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || !relation.type || !relation.id.trim()}
                  onClick={linkRecord}
                >
                  Link record
                </button>
              </div>
              <div className="portal-action-group">
                <button
                  type="button"
                  disabled={busy || !reply.trim()}
                  onClick={sendReply}
                >
                  Send reply
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus("waiting_on_client")}
                >
                  Waiting on client
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus("waiting_on_alchemize")}
                >
                  Needs Alchemize response
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus("resolved")}
                >
                  Mark resolved
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus("archived")}
                >
                  Archive
                </button>
              </div>
            </>
          ) : (
            <p className="admin-empty-state">
              Select a conversation to review its history.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

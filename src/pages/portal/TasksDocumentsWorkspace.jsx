import { useState } from "react";
import {
  ClipboardList,
  ClipboardCheck,
  FileText,
  Upload,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { portalApi } from "../../services/portal-api.js";
import { intakeLocked } from "./intake-logic.js";
import "./tasks-documents.css";

const date = (value) =>
  new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );
const done = (item) =>
  item.kind === "intake"
    ? intakeLocked(item.status)
    : item.kind === "document"
      ? ["received", "under_review", "accepted", "archived", "shared"].includes(
          item.status,
        )
      : item.status === "completed";
const humanize = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());

export default function TasksDocumentsWorkspace({
  tasks,
  documents,
  intakes,
  services,
  busy,
  run,
  DocumentUpload,
  GeneralDocumentUpload,
}) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("due");
  const [generalOpen, setGeneralOpen] = useState(false);
  const records = [
    ...intakes.map((item) => ({
      ...item,
      kind: "intake",
      title: item.engagement_title || "Client intake",
    })),
    ...tasks.map((item) => ({ ...item, kind: "task" })),
    ...documents.map((item) => ({
      ...item,
      kind: "document",
      title: item.document_name || "Document request",
    })),
  ];
  const count = records.filter(done).length;
  const percent = records.length
    ? Math.round((count / records.length) * 100)
    : 100;
  const matches = (item, key) =>
    key === "all" ||
    (key === "tasks" && item.kind !== "document") ||
    (key === "documents" && item.kind === "document") ||
    (key === "completed" && done(item));
  const shown = records
    .filter((item) => matches(item, filter))
    .sort((a, b) =>
      sort === "status"
        ? Number(done(a)) - Number(done(b)) ||
          String(a.status).localeCompare(String(b.status))
        : (Date.parse(a.due_date) || Infinity) -
          (Date.parse(b.due_date) || Infinity),
    );
  return (
    <div className="td-layout">
      <section className="td-progress" aria-label="Your progress">
        <div>
          <h2>Your progress</h2>
          <progress max="100" value={percent} aria-label="Items complete" />
          <div className="td-progress-meta">
            <span>
              {count} of {records.length} items complete
            </span>
            <span>{percent}% complete</span>
          </div>
        </div>
        <div className="td-progress-note">
          <CheckCircle aria-hidden="true" />
          <div>
            <strong>
              {count === records.length
                ? "You're all caught up"
                : "Keep your service moving"}
            </strong>
            <p>
              {count === records.length
                ? "Your client actions are complete."
                : "Complete the items that need your attention."}
            </p>
          </div>
        </div>
      </section>
      <div className="td-main portal-workspace-primary">
        <div className="td-filters" aria-label="Filter items">
          {[
            ["all", "All items", ClipboardList],
            ["tasks", "Tasks & Intake", ClipboardCheck],
            ["documents", "Documents", FileText],
            ["completed", "Completed", CheckCircle],
          ].map(([key, label, Icon]) => (
            <button
              type="button"
              key={key}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              <Icon aria-hidden="true" />
              {label} ({records.filter((item) => matches(item, key)).length})
            </button>
          ))}
          <label>
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="due">Due date</option>
              <option value="status">Status</option>
            </select>
          </label>
        </div>
        {count === records.length && filter === "all" ? (
          <div className="portal-empty-state">
            <strong>You're all caught up.</strong>
            <p>No tasks or documents need your attention right now.</p>
          </div>
        ) : null}
        {[
          ["Tasks & Intake", shown.filter((item) => item.kind !== "document")],
          ["Documents", shown.filter((item) => item.kind === "document")],
        ].map(([title, items]) =>
          items.length ? (
            <section className="td-group" key={title}>
              <h2>{title}</h2>
              <ul className="td-rows">
                {items.map((item) => (
                  <WorkspaceRow
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    busy={busy}
                    run={run}
                    DocumentUpload={DocumentUpload}
                  />
                ))}
              </ul>
            </section>
          ) : null,
        )}
        {!shown.length && records.length > 0 ? (
          <div className="portal-empty-state">No items in this category.</div>
        ) : null}
      </div>
      <aside className="td-context portal-workspace-utility">
        {services.map((service) => (
          <section key={service.id} className="td-service">
            <Briefcase aria-hidden="true" />
            <h2>{service.title}</h2>
            <span className="td-status">{humanize(service.status)}</span>
            {service.start_date ? (
              <p>
                <small>Started</small>
                <br />
                {date(service.start_date)}
              </p>
            ) : null}
            {service.target_date ? (
              <p>
                <small>Target completion</small>
                <br />
                {date(service.target_date)}
              </p>
            ) : null}
            <a href="/client-portal/services">View service</a>
          </section>
        ))}
        <section className="td-help">
          <MessageSquare aria-hidden="true" />
          <h2>Need help?</h2>
          <p>If you have any questions, reach out through Messages.</p>
          <a className="portal-action-button" href="/client-portal/messages">
            <MessageSquare aria-hidden="true" />
            Send a message
          </a>
        </section>
      </aside>
      <section className="td-general" aria-label="General document upload">
        <div className="td-upload-callout">
          <span className="td-icon">
            <Upload aria-hidden="true" />
          </span>
          <div>
            <h2>Upload a document</h2>
            <p>
              Have a document that wasn't specifically requested? You can upload
              it here and we'll review it.
            </p>
          </div>
          <button
            className="portal-action-button"
            type="button"
            aria-expanded={generalOpen}
            aria-controls="general-document-form"
            onClick={() => setGeneralOpen(!generalOpen)}
          >
            <Upload aria-hidden="true" />
            {generalOpen ? "Close uploader" : "Upload a document"}
          </button>
        </div>
        {generalOpen ? (
          <div id="general-document-form">
            <GeneralDocumentUpload busy={busy} run={run} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function WorkspaceRow({ item, busy, run, DocumentUpload }) {
  const [expanded, setExpanded] = useState(
    item.kind === "document" &&
      new URLSearchParams(window.location.search).get("upload") === item.id,
  );
  const [response, setResponse] = useState("");
  const complete = done(item);
  const Icon =
    item.kind === "intake"
      ? ClipboardList
      : item.kind === "document"
        ? FileText
        : ClipboardCheck;
  const review =
    item.kind === "document" &&
    ["received", "under_review"].includes(item.status);
  const due = item.due_date
    ? new Date(`${item.due_date.slice(0, 10)}T23:59:59`).getTime()
    : Infinity;
  const status = review
    ? "Under review"
    : complete
      ? "Completed"
      : due < Date.now()
        ? "Overdue"
        : due < Date.now() + 3 * 86400000
          ? "Due soon"
          : item.status === "in_progress"
            ? "In progress"
            : item.kind === "document"
              ? "Not uploaded"
              : "Action needed";
  return (
    <li className="td-row" id={`${item.kind}-${item.id}`}>
      <span className={`td-icon ${complete ? "is-complete" : ""}`}>
        <Icon aria-hidden="true" />
      </span>
      <div className="td-copy">
        <small>
          {humanize(item.kind)}
          {item.service_name ? ` / ${item.service_name}` : ""}
        </small>
        <strong>{item.title}</strong>
        <p>
          {item.client_instructions ||
            item.description ||
            (item.kind === "intake"
              ? complete
                ? "Your intake has been submitted."
                : "Complete your intake form to help us get started."
              : "")}
        </p>
        {item.engagement_title && item.engagement_title !== item.title ? (
          <small>{item.engagement_title}</small>
        ) : null}
        {item.due_date ? (
          <small className="td-date">
            <Calendar aria-hidden="true" />
            Due {date(item.due_date)}
          </small>
        ) : null}
        {item.client_visible_review_note ? (
          <p>{item.client_visible_review_note}</p>
        ) : null}
      </div>
      <div className="td-state">
        <span className={`td-status ${complete ? "is-complete" : ""}`}>
          {complete ? (
            <CheckCircle aria-hidden="true" />
          ) : (
            <Clock aria-hidden="true" />
          )}
          {status}
        </span>
        {item.submitted_at ? (
          <small>Submitted {date(item.submitted_at)}</small>
        ) : null}
        {item.kind === "document" && item.received_date ? (
          <small>Uploaded {date(item.received_date)}</small>
        ) : null}
        {review ? (
          <small>Your upload is awaiting Alchemize review.</small>
        ) : null}
      </div>
      <div className="td-actions">
        {item.kind === "intake" ? (
          <a
            className="portal-action-button"
            href={`/client-portal/intake?assignment=${encodeURIComponent(item.id)}`}
          >
            <Eye aria-hidden="true" />
            {complete
              ? "View submission"
              : item.status === "assigned" &&
                  !Number(item.completion_percentage)
                ? "Start intake"
                : "Continue"}
          </a>
        ) : null}
        {item.kind === "document" && item.current_version ? (
          <a
            className="portal-action-button"
            href={portalApi.documentDownloadUrl(item.id)}
          >
            <Eye aria-hidden="true" />
            View file
          </a>
        ) : null}
        {!complete && item.kind !== "intake" ? (
          <button
            className="portal-action-button"
            type="button"
            aria-expanded={expanded}
            aria-controls={`action-${item.kind}-${item.id}`}
            onClick={() => setExpanded(!expanded)}
          >
            {item.kind === "document" ? (
              <Upload aria-hidden="true" />
            ) : (
              <ClipboardCheck aria-hidden="true" />
            )}
            {expanded
              ? "Close"
              : item.kind === "document"
                ? "Upload"
                : "Continue"}
          </button>
        ) : null}
      </div>
      {expanded && !complete ? (
        <div className="td-expanded" id={`action-${item.kind}-${item.id}`}>
          {item.kind === "document" ? (
            <DocumentUpload item={item} busy={busy} run={run} />
          ) : (
            <>
              <label className="portal-inline-field">
                Optional response
                <textarea
                  value={response}
                  maxLength={2000}
                  onChange={(event) => setResponse(event.target.value)}
                />
              </label>
              <div className="portal-action-group">
                {[
                  [
                    "acknowledge",
                    "Acknowledge",
                    () => portalApi.acknowledgeTask(item.id),
                  ],
                  [
                    "respond",
                    "Send response",
                    () => portalApi.respondToTask(item.id, response),
                  ],
                  [
                    "complete",
                    "Mark complete",
                    () => portalApi.completeTask(item.id, response),
                  ],
                ].map(([key, label, operation]) => (
                  <button
                    className="portal-action-button"
                    key={key}
                    disabled={Boolean(busy)}
                    onClick={() =>
                      run(
                        `${item.id}-${key}`,
                        operation,
                        key === "complete"
                          ? "Task marked complete."
                          : "Response saved.",
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

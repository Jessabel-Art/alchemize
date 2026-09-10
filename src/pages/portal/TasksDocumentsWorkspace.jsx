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
  ArrowRight,
  AlertCircle,
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
// A document that is done() but still under Alchemize review isn't
// something the client needs to act on again, but it also isn't fully
// "complete" from the client's point of view — kept separate from done()
// so the progress/count math above (tested exactly) never changes.
const underReview = (item) =>
  item.kind === "document" &&
  ["received", "under_review"].includes(item.status);
const humanize = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
const actionLabel = (item, complete) => {
  if (item.kind === "intake") {
    return complete
      ? "View submission"
      : item.status === "assigned" && !Number(item.completion_percentage)
        ? "Start intake"
        : "Continue";
  }
  if (item.kind === "document") return complete ? "View file" : "Upload";
  return complete ? "View" : "Continue";
};

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
  // A compact preview of outstanding items surfaces at the top in the
  // default "All items" view; every record still renders exactly once
  // in its normal Tasks & Intake / Documents group below (the preview
  // links down to the real row via its existing id) so counts, groups,
  // and filtering behavior are unchanged.
  const needsAttention =
    filter === "all" ? shown.filter((item) => !done(item)) : [];
  const activeServices = services.filter(
    (service) => !["completed", "archived"].includes(service.status),
  );

  return (
    <div className="td-layout">
      <section className="td-progress" aria-label="Your progress">
        <div>
          <div className="td-progress-bar-row">
            <span className="td-progress-count">
              {count} of {records.length} items complete
            </span>
            <progress max="100" value={percent} aria-label="Items complete" />
            <span className="td-progress-percent">{percent}%</span>
          </div>
        </div>
        <div className="td-progress-note">
          {count === records.length ? (
            <CheckCircle aria-hidden="true" />
          ) : (
            <AlertCircle aria-hidden="true" />
          )}
          <div>
            <strong>
              {count === records.length
                ? "You're all caught up"
                : `${records.length - count} item${records.length - count === 1 ? "" : "s"} needs your attention`}
            </strong>
            <p>
              {count === records.length
                ? "Your client actions are complete."
                : "Complete the remaining item to keep your service moving."}
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
        {needsAttention.length ? (
          <section
            className="td-group td-attention"
            id="needs-attention"
            aria-label="Needs your attention"
          >
            <h2>
              <AlertCircle aria-hidden="true" />
              Needs your attention ({needsAttention.length})
            </h2>
            <ul className="td-attention-list">
              {needsAttention.map((item) => (
                <li key={`preview-${item.kind}-${item.id}`}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.service_name || humanize(item.kind)}
                      {item.due_date ? ` · Due ${date(item.due_date)}` : ""}
                    </small>
                  </div>
                  <a className="td-row-link" href={`#${item.kind}-${item.id}`}>
                    {actionLabel(item, false)}
                    <ArrowRight aria-hidden="true" size={14} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
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
        {needsAttention.length ? (
          <section className="td-action-panel">
            <span className="td-action-panel-kicker">
              <AlertCircle aria-hidden="true" />
              Action needed
            </span>
            {needsAttention.length === 1 ? (
              <>
                <strong className="td-action-panel-title">
                  {needsAttention[0].title}
                </strong>
                {needsAttention[0].service_name ? (
                  <p>{needsAttention[0].service_name}</p>
                ) : null}
                {needsAttention[0].due_date ? (
                  <small>Due {date(needsAttention[0].due_date)}</small>
                ) : null}
                <a
                  className="td-action-panel-link"
                  href={`#${needsAttention[0].kind}-${needsAttention[0].id}`}
                >
                  {actionLabel(needsAttention[0], false)} now
                  <ArrowRight aria-hidden="true" size={14} />
                </a>
              </>
            ) : (
              <>
                <strong className="td-action-panel-title">
                  {needsAttention.length} items
                </strong>
                <a className="td-action-panel-link" href="#needs-attention">
                  Review items
                  <ArrowRight aria-hidden="true" size={14} />
                </a>
              </>
            )}
          </section>
        ) : null}
        {activeServices.length ? (
          <section className="td-service">
            <h2>
              <Briefcase aria-hidden="true" />
              Your services
            </h2>
            <ul className="td-service-list">
              {activeServices.map((service) => (
                <li key={service.id}>
                  <strong>{service.title}</strong>
                  <span className="td-status">{humanize(service.status)}</span>
                  {service.start_date ? (
                    <small>Started {date(service.start_date)}</small>
                  ) : null}
                  {service.target_date ? (
                    <small>Target {date(service.target_date)}</small>
                  ) : null}
                </li>
              ))}
            </ul>
            <a href="/client-portal/services">
              View all services
              <ArrowRight aria-hidden="true" size={14} />
            </a>
          </section>
        ) : null}
        <section className="td-help">
          <h2>
            <MessageSquare aria-hidden="true" />
            Need help?
          </h2>
          <p>If you have any questions, reach out through Messages.</p>
          <a className="td-action-panel-link" href="/client-portal/messages">
            Send a message
            <ArrowRight aria-hidden="true" size={14} />
          </a>
        </section>
      </aside>
      <section className="td-general" aria-label="General document upload">
        <div className="td-upload-callout">
          <span className="td-icon">
            <Upload aria-hidden="true" />
          </span>
          <div>
            <h2>Need to send us something else?</h2>
            <p>
              Upload a document that wasn&apos;t specifically requested.
              We&apos;ll review it and follow up if needed.
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
  const review = underReview(item);
  // The checkbox reflects true client-facing completion: an
  // under-review document is done() (no longer actionable, excluded
  // from "needs attention"), but it hasn't been checked off yet either.
  const checked = complete && !review;
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
      <span
        className={`td-check ${checked ? "is-complete" : ""} ${review ? "is-review" : ""}`}
        aria-hidden="true"
      >
        {checked ? <CheckCircle aria-hidden="true" /> : null}
      </span>
      <div className="td-copy">
        <small>
          {humanize(item.kind)}
          {item.service_name ? ` · ${item.service_name}` : ""}
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
      </div>
      <div className="td-state">
        <span
          className={`td-status ${checked ? "is-complete" : review ? "is-review" : "is-action"}`}
        >
          {status}
        </span>
        {item.due_date ? (
          <small className="td-date">
            <Calendar aria-hidden="true" />
            Due {date(item.due_date)}
          </small>
        ) : null}
        {item.submitted_at ? (
          <small>Submitted {date(item.submitted_at)}</small>
        ) : null}
        {item.kind === "document" && item.received_date ? (
          <small>Uploaded {date(item.received_date)}</small>
        ) : null}
        {item.client_visible_review_note ? (
          <small>{item.client_visible_review_note}</small>
        ) : null}
      </div>
      <div className="td-actions">
        {item.kind === "intake" ? (
          <a
            className="td-row-link"
            href={`/client-portal/intake?assignment=${encodeURIComponent(item.id)}`}
          >
            {actionLabel(item, complete)}
            <ArrowRight aria-hidden="true" size={14} />
          </a>
        ) : null}
        {item.kind === "document" && item.current_version ? (
          <a
            className="td-row-link"
            href={portalApi.documentDownloadUrl(item.id)}
          >
            <Eye aria-hidden="true" size={14} />
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

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../../pages/admin/review-documents.css";

// ---------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------

const humanize = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatReviewDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Mirrors alchemize_intake_visible() (server/intake/definitions.php) so the
// document shows exactly the questions the client actually saw, in the
// same conditional order -- not the full field catalog for the family.
function isFieldVisible(field, values) {
  const condition = field.show_when;
  if (!condition) return true;
  if (condition.all) {
    return condition.all.every((child) =>
      isFieldVisible({ show_when: child }, values),
    );
  }
  if (condition.any) {
    return condition.any.some((child) =>
      isFieldVisible({ show_when: child }, values),
    );
  }
  const value = values[condition.field] ?? null;
  if (condition.in) return condition.in.includes(value);
  if (condition.not_empty) {
    return (
      value !== null &&
      value !== undefined &&
      (Array.isArray(value) ? value.length > 0 : String(value).trim() !== "")
    );
  }
  return value === (condition.equals ?? null);
}

// Mirrors the client portal's own read-only rendering
// (src/pages/portal/ClientIntakePage.jsx's locked-field branch) so the
// admin document shows the same human-readable values the client saw --
// option labels instead of raw stored values (e.g. "New Website" instead
// of "new_website"), multiselect arrays joined, and a graceful fallback
// for structured person/address references the admin payload doesn't
// carry snapshots for.
export function formatIntakeAnswer(field, response) {
  if (!response || response.applicability === "not_applicable") {
    return response?.applicability === "not_applicable"
      ? "Not applicable"
      : "No response provided";
  }
  const { value } = response;
  if (value === null || value === undefined || value === "") {
    return "No response provided";
  }
  if (Array.isArray(value)) {
    if (["person_refs", "address_refs"].includes(field.type)) {
      return "Submitted profile reference (historical details unavailable)";
    }
    if (value.length === 0) return "No response provided";
    return value
      .map(
        (item) =>
          field.options?.find((option) => option.value === item)?.label ||
          humanize(String(item)),
      )
      .join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  if (["date", "datetime-local"].includes(field.type)) {
    return formatReviewDate(value);
  }
  return (
    field.options?.find((option) => option.value === value)?.label ||
    (field.type === "select" ? humanize(String(value)) : String(value))
  );
}

// A restrained visual cue for the (uncommon, optional-field) case where a
// question simply has no answer to show -- it must never compete visually
// with real client responses.
export function isIntakeAnswerEmpty(field, response) {
  return formatIntakeAnswer(field, response) === "No response provided";
}

// ---------------------------------------------------------------------
// Workflow: derives the controlled "Next Action" stage and which
// contextual actions apply, purely from each record type's own real
// status value -- no new schema, no invented states.
// ---------------------------------------------------------------------

const DOCUMENT_STAGE_BY_STATUS = {
  Requested: "Client Review",
  "Awaiting Upload": "Client Review",
  "Replacement Requested": "Client Review",
  Received: "Admin Review",
  "Under Review": "Admin Review",
  Accepted: "Accepted",
  Archived: "Completed",
};
const TASK_STAGE_BY_STATUS = {
  "Not Started": "Client Review",
  "Waiting On Client": "Client Review",
  "In Progress": "Admin Review",
  "Waiting On Alchemize": "Admin Review",
  Completed: "Completed",
  Archived: "Completed",
};
const INTAKE_STAGE_BY_STATUS = {
  "Waiting On Client": "Client Review",
  "Changes Requested": "Client Review",
  Submitted: "Admin Review",
  "Under Review": "Admin Review",
  "Waiting On Alchemize": "Admin Review",
  Approved: "Accepted",
  Archived: "Completed",
};

export function resolveWorkflowStage(type, status) {
  const table =
    type === "Document"
      ? DOCUMENT_STAGE_BY_STATUS
      : type === "Task"
        ? TASK_STAGE_BY_STATUS
        : INTAKE_STAGE_BY_STATUS;
  return table[status] || "Admin Review";
}

// Which of the contextual actions (Accept / Complete / Send Back) apply to
// a row right now -- used both to gate the table's "Send Back" cell and
// the viewer's own action bar, so they never disagree.
export function resolveWorkflowActions(type, status) {
  const stage = resolveWorkflowStage(type, status);
  return {
    canAccept: stage === "Admin Review" && type !== "Task",
    canComplete:
      stage === "Accepted" || (stage === "Admin Review" && type === "Task"),
    canSendBack: stage === "Admin Review" || stage === "Accepted",
  };
}

// ---------------------------------------------------------------------
// Inline file preview
// ---------------------------------------------------------------------

const INLINE_PREVIEWABLE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function InlineFilePreview({
  mimeType,
  previewUrl,
  downloadUrl,
  filename,
}) {
  const previewable = INLINE_PREVIEWABLE_MIME_TYPES.includes(
    (mimeType || "").toLowerCase(),
  );
  if (!previewable) {
    return (
      <div className="review-file-fallback">
        <p>Preview unavailable for this file type.</p>
        <a
          className="secondary-button"
          href={downloadUrl}
          download={filename || undefined}
        >
          Download Original
        </a>
      </div>
    );
  }
  const isImage = (mimeType || "").startsWith("image/");
  return (
    <div className="review-file-preview">
      {isImage ? (
        <div className="review-file-preview-frame">
          <img src={previewUrl} alt={filename || "Submitted file"} />
        </div>
      ) : (
        <iframe src={previewUrl} title={filename || "Submitted file"} />
      )}
      <div className="review-file-preview-actions">
        <a
          className="secondary-button"
          href={downloadUrl}
          download={filename || undefined}
        >
          Download Original
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Intake submission document (print-ready)
// ---------------------------------------------------------------------

export function IntakeSubmissionDocument({ data }) {
  const { assignment, responses = {}, requirements = [], definition } = data;
  const values = Object.fromEntries(
    Object.entries(responses).map(([key, response]) => [key, response.value]),
  );
  const assignedModuleKeys = new Set(assignment.module_keys || []);
  const modules = (definition?.modules || []).filter((module) =>
    assignedModuleKeys.has(module.key),
  );

  return (
    <div className="review-print-sheet" aria-label="Client intake submission">
      <div className="review-print-page">
        <header className="review-print-header">
          <div className="review-print-brand">
            <img
              src="/assets/logos/alchemize-logo-dark.png"
              alt="Alchemize Business Services"
              className="review-print-logo"
            />
          </div>
          <div className="review-print-title-block">
            <h1 className="review-print-title">Client Intake Submission</h1>
            <p className="review-print-subtitle">
              {definition?.label || humanize(assignment.family_key)}
            </p>
          </div>
        </header>

        <dl className="review-print-meta">
          <div>
            <dt>Client</dt>
            <dd>{assignment.client_name}</dd>
          </div>
          <div>
            <dt>Engagement</dt>
            <dd>{assignment.engagement_title}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{formatReviewDate(assignment.submitted_at)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{humanize(assignment.status)}</dd>
          </div>
          <div>
            <dt>Completion</dt>
            <dd>{assignment.completion_percentage}%</dd>
          </div>
        </dl>

        {modules.map((module) => {
          const visibleFields = (module.fields || []).filter((field) =>
            isFieldVisible(field, values),
          );
          if (visibleFields.length === 0) return null;
          return (
            <section className="review-print-section" key={module.key}>
              <h2>{module.title}</h2>
              <dl className="review-print-answers">
                {visibleFields.map((field) => {
                  const response = responses[field.key];
                  const empty = isIntakeAnswerEmpty(field, response);
                  return (
                    <div
                      key={field.key}
                      className={empty ? "review-print-answer-empty" : ""}
                    >
                      <dt>{field.label}</dt>
                      {field.helper ? (
                        <p className="review-print-question-helper">
                          {field.helper}
                        </p>
                      ) : null}
                      <dd>{formatIntakeAnswer(field, response)}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          );
        })}

        {requirements.length > 0 ? (
          <section className="review-print-section review-print-attachments">
            <h2>Documents / Attachments</h2>
            <ul>
              {requirements.map((requirement) => (
                <li key={requirement.id}>
                  <span className="review-print-attachment-name">
                    {requirement.requirement_name}
                  </span>
                  {requirement.filename ? (
                    <span className="review-print-attachment-status received">
                      ✓{" "}
                      {requirement.downloadUrl ? (
                        <a href={requirement.downloadUrl} download>
                          {requirement.filename}
                        </a>
                      ) : (
                        requirement.filename
                      )}
                      {requirement.uploaded_at
                        ? ` — Received ${formatReviewDate(requirement.uploaded_at)}`
                        : ""}
                    </span>
                  ) : (
                    <span className="review-print-attachment-status missing">
                      Missing
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="review-print-footer">
          <span>Submission ID: {assignment.public_id || assignment.id}</span>
          <span>Generated from the Alchemize Admin Portal</span>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Document request review workspace
// ---------------------------------------------------------------------

export function DocumentRequestDocument({ document, submissions = [] }) {
  return (
    <div className="review-print-sheet" aria-label="Document request">
      <div className="review-print-page">
        <header className="review-print-header">
          <div className="review-print-brand">
            <img
              src="/assets/logos/alchemize-logo-dark.png"
              alt="Alchemize Business Services"
              className="review-print-logo"
            />
          </div>
          <div className="review-print-title-block">
            <h1 className="review-print-title">Document Request</h1>
            <p className="review-print-subtitle">{document.document_name}</p>
          </div>
        </header>

        <dl className="review-print-meta">
          <div>
            <dt>Client</dt>
            <dd>{document.client_name}</dd>
          </div>
          <div>
            <dt>Engagement</dt>
            <dd>{document.engagement_title || "No engagement"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{humanize(document.status)}</dd>
          </div>
          <div>
            <dt>Requested</dt>
            <dd>{formatReviewDate(document.requested_date)}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatReviewDate(document.due_date)}</dd>
          </div>
          <div>
            <dt>Received</dt>
            <dd>{formatReviewDate(document.received_date)}</dd>
          </div>
        </dl>

        {document.client_instructions ? (
          <section className="review-print-section">
            <h2>Instructions for the client</h2>
            <p>{document.client_instructions}</p>
          </section>
        ) : null}

        {document.internal_notes ? (
          <section className="review-print-section review-print-hide">
            <h2>Internal notes</h2>
            <p>{document.internal_notes}</p>
          </section>
        ) : null}

        <section className="review-print-section">
          <h2>Submitted file(s)</h2>
          {submissions.length === 0 ? (
            <p>No file has been uploaded for this request yet.</p>
          ) : (
            <div className="review-file-versions">
              {submissions.map((submission, index) => (
                <article
                  key={submission.id}
                  className="review-file-version review-print-hide"
                >
                  <div className="review-file-version-meta">
                    <div className="review-file-version-identity">
                      {index === 0 ? (
                        <span className="review-file-version-latest">
                          Latest
                        </span>
                      ) : null}
                      <strong>{submission.original_filename}</strong>
                    </div>
                    <span className="review-file-version-detail">
                      Version {submission.version_number} · uploaded{" "}
                      {formatReviewDate(submission.submitted_at)}
                      {submission.uploaded_by
                        ? ` by ${submission.uploaded_by}`
                        : ""}
                      {submission.status
                        ? ` · ${humanize(submission.status)}`
                        : ""}
                    </span>
                  </div>
                  <InlineFilePreview
                    mimeType={submission.mime_type}
                    previewUrl={submission.previewUrl}
                    downloadUrl={submission.downloadUrl}
                    filename={submission.original_filename}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Task detail workspace -- same editorial language as the document
// request viewer, not the small sidebar-drawer card treatment.
// ---------------------------------------------------------------------

export function TaskDetailDocument({ task, clientName, engagementTitle }) {
  return (
    <div className="review-print-sheet" aria-label="Task detail">
      <div className="review-print-page review-print-page-compact">
        <header className="review-print-header">
          <div className="review-print-brand">
            <img
              src="/assets/logos/alchemize-logo-dark.png"
              alt="Alchemize Business Services"
              className="review-print-logo"
            />
          </div>
          <div className="review-print-title-block">
            <h1 className="review-print-title">Task</h1>
            <p className="review-print-subtitle">{task.title}</p>
          </div>
        </header>

        <dl className="review-print-meta">
          <div>
            <dt>Client</dt>
            <dd>{clientName}</dd>
          </div>
          <div>
            <dt>Engagement / service</dt>
            <dd>{engagementTitle || "No engagement"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{humanize(task.status)}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{humanize(task.priority)}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatReviewDate(task.due_date)}</dd>
          </div>
          {task.completed_at ? (
            <div>
              <dt>Completed</dt>
              <dd>{formatReviewDate(task.completed_at)}</dd>
            </div>
          ) : null}
        </dl>

        {task.description ? (
          <section className="review-print-section">
            <h2>Instructions</h2>
            <p>{task.description}</p>
          </section>
        ) : (
          <p className="review-print-answer-empty">
            No additional instructions were provided for this task.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Full-screen review viewer (portaled to document.body so the app's
// existing print rules -- which unconditionally hide .admin-detail-drawer
// and every .admin-module but the invoice's own print root -- never touch
// it; see review-documents.css for the matching print scoping)
// ---------------------------------------------------------------------

export function ReviewDocumentViewer({
  title,
  onClose,
  printable = false,
  actions = null,
  children,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="review-viewer-overlay" onClick={onClose}>
      <div
        className="review-viewer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="review-viewer-toolbar review-print-hide">
          <h2>{title}</h2>
          <div className="review-viewer-toolbar-actions">
            {actions}
            {printable ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => window.print()}
              >
                Print / Save PDF
              </button>
            ) : null}
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        <div className="review-viewer-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

import {
  formatIntakeAnswer,
  isIntakeAnswerEmpty,
  isFieldVisible,
} from "../../components/admin/review-documents.jsx";
import "./service-file.css";

// The client-facing, printable engagement record ("Download service
// file"). Mirrors the established printable-document pattern already used
// for invoices (src/components/invoices/InvoiceDocument.jsx) and intake
// submissions (src/components/admin/review-documents.jsx): a plain
// presentational component styled for @media print, shown inside
// ReviewDocumentViewer and exported via the browser's own Print/Save-as-PDF
// dialog rather than a server-generated binary. All data is passed in
// already scoped to the authenticated client and the selected engagement
// by AlchemizePortalService::serviceDetail() -- this component performs no
// fetching of its own and enforces no authorization itself.

const humanize = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatCurrency = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(value || 0),
  );

export default function ServiceFileDocument({ data }) {
  const {
    item,
    client = {},
    tasks = [],
    documents = [],
    appointments = [],
    invoices = [],
    intake = [],
    activity = [],
  } = data;

  return (
    <div className="review-print-sheet" aria-label="Engagement service file">
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
            <h1 className="review-print-title">Engagement Service File</h1>
            <p className="review-print-subtitle">{item.title}</p>
          </div>
        </header>

        <dl className="review-print-meta">
          <div>
            <dt>Client</dt>
            <dd>{client.display_name || "—"}</dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>{item.service_names?.join(", ") || item.title}</dd>
          </div>
          {item.engagement_number ? (
            <div>
              <dt>Engagement reference</dt>
              <dd>{item.engagement_number}</dd>
            </div>
          ) : null}
          <div>
            <dt>Status</dt>
            <dd>{humanize(item.status)}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{formatDate(item.start_date)}</dd>
          </div>
          {item.completion_date ? (
            <div>
              <dt>Completed</dt>
              <dd>{formatDate(item.completion_date)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Generated</dt>
            <dd>{formatDate(new Date().toISOString())}</dd>
          </div>
        </dl>

        {tasks.length ? (
          <section className="review-print-section">
            <h2>Engagement Progress</h2>
            <table className="service-file-table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Status</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{humanize(task.status)}</td>
                    <td>
                      {task.status === "completed"
                        ? formatDate(task.completed_at)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {intake.length ? (
          <section className="review-print-section">
            <h2>Client Requests / Intake</h2>
            {intake.map((assignment) => (
              <div key={assignment.id} className="service-file-intake-block">
                <p className="service-file-intake-heading">
                  {humanize(assignment.family_key)} —{" "}
                  {humanize(assignment.status)}
                  {assignment.submitted_at
                    ? ` · Submitted ${formatDate(assignment.submitted_at)}`
                    : ` · ${assignment.completion_percentage || 0}% complete`}
                </p>
                {assignment.definition ? (
                  <IntakeAnswers assignment={assignment} />
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {documents.length ? (
          <section className="review-print-section">
            <h2>Document Manifest</h2>
            <table className="service-file-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.document_name}</td>
                    <td>From you</td>
                    <td>{humanize(document.status)}</td>
                    <td>
                      {formatDate(
                        document.received_date || document.requested_date,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {appointments.length ? (
          <section className="review-print-section">
            <h2>Appointments</h2>
            <table className="service-file-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      {formatDateTime(
                        appointment.scheduled_start || appointment.scheduled_at,
                      )}
                    </td>
                    <td>{appointment.appointment_type || "Consultation"}</td>
                    <td>
                      {humanize(
                        appointment.meeting_method ||
                          appointment.location_type ||
                          "virtual",
                      )}
                    </td>
                    <td>{humanize(appointment.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {invoices.length ? (
          <section className="review-print-section">
            <h2>Billing Summary</h2>
            <table className="service-file-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const total = Math.max(
                    Number(invoice.subtotal || 0) +
                      Number(invoice.adjustment_total || 0) -
                      Number(invoice.credit_deposit_total || 0),
                    0,
                  );
                  return (
                    <tr key={invoice.id}>
                      <td>{invoice.invoice_number}</td>
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td>{formatCurrency(total, invoice.currency)}</td>
                      <td>
                        {formatCurrency(invoice.paid_total, invoice.currency)}
                      </td>
                      <td>
                        {formatCurrency(
                          invoice.outstanding_balance,
                          invoice.currency,
                        )}
                      </td>
                      <td>{humanize(invoice.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ) : null}

        {activity.length ? (
          <section className="review-print-section">
            <h2>Engagement Activity</h2>
            <ul className="service-file-activity">
              {activity.map((entry) => (
                <li key={entry.id}>
                  <span>{formatDate(entry.createdAt)}</span>
                  {entry.label}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function IntakeAnswers({ assignment }) {
  const values = Object.fromEntries(
    Object.entries(assignment.responses || {}).map(([key, response]) => [
      key,
      response.value,
    ]),
  );
  const assignedModuleKeys = new Set(assignment.module_keys || []);
  const modules = (assignment.definition?.modules || []).filter((module) =>
    assignedModuleKeys.has(module.key),
  );
  return modules.map((module) => {
    const visibleFields = (module.fields || []).filter((field) =>
      isFieldVisible(field, values),
    );
    if (!visibleFields.length) return null;
    return (
      <div key={module.key}>
        <p className="service-file-module-title">{module.title}</p>
        <dl className="review-print-answers">
          {visibleFields.map((field) => {
            const response = assignment.responses?.[field.key];
            const empty = isIntakeAnswerEmpty(field, response);
            return (
              <div
                key={field.key}
                className={empty ? "review-print-answer-empty" : ""}
              >
                <dt>{field.label}</dt>
                <dd>{formatIntakeAnswer(field, response)}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  });
}

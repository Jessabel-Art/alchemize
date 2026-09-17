import { useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminDetailDrawer,
  AdminTable,
} from "../../components/admin/admin-components.jsx";
import { settings } from "../../services/admin-api.js";
import "./admin-data-maintenance.css";

const categoryMeta = {
  inactive_prospects: {
    title: "Inactive Prospects",
    reviewNoun: "prospect",
    reviewNounPlural: "prospects",
    emptyTitle: "No inactive prospects",
    emptyDescription: "No inactive prospects currently require review.",
    actions: {
      archive: {
        label: "Archive",
        confirmTitle: "Archive prospect",
        confirmBody:
          "This prospect will be removed from active prospect views, but historical information will be retained.",
        confirmBodyPlural:
          "These prospects will be removed from active prospect views, but historical information will be retained.",
        resultKey: "archived",
      },
      delete: {
        label: "Delete",
        confirmTitle: "Delete prospect",
        confirmBody:
          "This permanently deletes the prospect record. This action cannot be undone, and is only available when the record has no engagements, invoices, documents, appointments, tasks, or active portal access.",
        confirmBodyPlural:
          "This permanently deletes the prospect records. This action cannot be undone, and is only available for records with no engagements, invoices, documents, appointments, tasks, or active portal access.",
        typedConfirm: "DELETE INACTIVE PROSPECTS",
        resultKey: "deleted",
      },
    },
  },
  completed_engagements: {
    title: "Completed Engagements",
    reviewNoun: "engagement",
    reviewNounPlural: "engagements",
    actionLabel: "Archive",
    actionVerb: "archive",
    confirmTitle: "Archive engagement",
    confirmBody:
      "This engagement will be removed from active operational views. Its history with the client, invoices, payments, documents, and messages is preserved.",
    confirmBodyPlural:
      "These engagements will be removed from active operational views. Their history with clients, invoices, payments, documents, and messages is preserved.",
    emptyTitle: "No completed engagements",
    emptyDescription:
      "No completed engagements currently require archival review.",
    resultKey: "archived",
  },
  expired_links: {
    title: "Expired Scheduling Links",
    reviewNoun: "link",
    reviewNounPlural: "links",
    actionLabel: "Delete",
    actionVerb: "delete",
    confirmTitle: "Delete expired scheduling link",
    confirmBody:
      "This permanently removes the expired link. This action cannot be undone.",
    confirmBodyPlural:
      "This permanently removes the expired links. This action cannot be undone.",
    typedConfirm: "DELETE EXPIRED LINKS",
    emptyTitle: "No expired scheduling links",
    emptyDescription: "No expired scheduling links currently require review.",
    resultKey: "deleted",
  },
  expired_invitations: {
    title: "Expired Admin Invitations",
    reviewNoun: "invitation",
    reviewNounPlural: "invitations",
    actionLabel: "Remove",
    actionVerb: "remove",
    confirmTitle: "Remove expired invitation",
    confirmBody:
      "This removes the expired invitation link. The pending account was never activated, so no administrator access is affected.",
    confirmBodyPlural:
      "This removes the expired invitation links. These pending accounts were never activated, so no administrator access is affected.",
    emptyTitle: "No expired invitations",
    emptyDescription: "No expired administrator invitations require cleanup.",
    resultKey: "removed",
  },
  expired_tokens: {
    title: "Expired Security Tokens",
    reviewNoun: "token",
    reviewNounPlural: "tokens",
    actionLabel: "Purge",
    actionVerb: "purge",
    confirmTitle: "Purge expired tokens",
    confirmBody:
      "This permanently removes the expired token. Active, unexpired tokens are never affected. This action cannot be undone.",
    confirmBodyPlural:
      "This permanently removes the expired tokens. Active, unexpired tokens are never affected. This action cannot be undone.",
    typedConfirm: "PURGE EXPIRED TOKENS",
    emptyTitle: "No expired tokens",
    emptyDescription: "No expired security tokens currently require cleanup.",
    resultKey: "deleted",
  },
  expired_client_requests: {
    title: "Expired Client Requests",
    reviewNoun: "request",
    reviewNounPlural: "requests",
    emptyTitle: "No expired client requests",
    emptyDescription: "No stale document requests currently require review.",
    actions: {
      archive: {
        label: "Archive",
        confirmTitle: "Archive client request",
        confirmBody:
          "This request will be removed from active client-request views, but its record is retained.",
        confirmBodyPlural:
          "These requests will be removed from active client-request views, but their records are retained.",
        resultKey: "archived",
      },
      delete: {
        label: "Delete",
        confirmTitle: "Delete client request",
        confirmBody:
          "This permanently deletes the request. Only available when the client never submitted anything for it. This action cannot be undone.",
        confirmBodyPlural:
          "This permanently deletes the requests. Only available for requests the client never submitted anything for. This action cannot be undone.",
        typedConfirm: "DELETE CLIENT REQUESTS",
        resultKey: "deleted",
      },
    },
  },
  invoice_disposable: {
    title: "Disposable Invoices",
    reviewNoun: "invoice",
    reviewNounPlural: "invoices",
    actionLabel: "Delete",
    actionVerb: "delete",
    confirmTitle: "Delete disposable invoice",
    confirmBody:
      "This permanently deletes the invoice. Only available for draft, cancelled, or voided invoices with zero payment history. This action cannot be undone.",
    confirmBodyPlural:
      "This permanently deletes the invoices. Only available for draft, cancelled, or voided invoices with zero payment history. This action cannot be undone.",
    typedConfirm: "DELETE DISPOSABLE INVOICES",
    emptyTitle: "No disposable invoices",
    emptyDescription:
      "No draft, cancelled, or voided invoices currently qualify for deletion.",
    resultKey: "deleted",
  },
  invoice_uncollected: {
    title: "Uncollected Invoices",
    reviewNoun: "invoice",
    reviewNounPlural: "invoices",
    actionLabel: "Archive",
    actionVerb: "archive",
    confirmTitle: "Archive uncollected invoice",
    confirmBody:
      "This invoice will be removed from active billing views. All line items, totals, and payment history are fully preserved.",
    confirmBodyPlural:
      "These invoices will be removed from active billing views. All line items, totals, and payment history are fully preserved.",
    emptyTitle: "No uncollected invoices",
    emptyDescription:
      "No stale, uncollected invoices currently require archival review.",
    resultKey: "archived",
  },
  test_records: {
    title: "Purge Test Records",
    reviewNoun: "test client",
    reviewNounPlural: "test clients",
    actionLabel: "Purge",
    actionVerb: "purge",
    confirmTitle: "Purge test records",
    confirmBody:
      'This permanently removes this test client record and its dependent data -- engagements, tasks, appointments, invoices, payments, documents, messages, notifications, notes, and activity history. A record qualifies as test data by a reserved test email domain (example.com, example.test, and similar), a name/title starting or ending with "test", or "test" appearing as its own word in a description or notes field. Standalone appointments, engagements, invoices, and other operational records with their own qualifying fields are also purged even when their client is legitimate. Legitimate production and business records are never affected. This action cannot be undone.',
    confirmBodyPlural:
      'This permanently removes these test client records and their dependent data -- engagements, tasks, appointments, invoices, payments, documents, messages, notifications, notes, and activity history -- plus any never-converted lead records and standalone operational records (appointments, engagements, invoices, and more) independently identified as test data. A record qualifies by a reserved test email domain (example.com, example.test, and similar), a name/title starting or ending with "test", or "test" appearing as its own word in a description or notes field. Legitimate production and business records are never affected. This action cannot be undone.',
    typedConfirm: "PURGE TEST DATA",
    emptyTitle: "No test records found",
    emptyDescription:
      'No client, lead, or operational records matching a reserved test email domain, a qualifying test name/title, or a standalone "test" in a description were found.',
    resultKey: "deleted",
  },
};

const testPurgeLabels = {
  clients: "Clients",
  leads: "Leads",
  engagements: "Engagements",
  tasks: "Tasks",
  appointments: "Appointments",
  appointment_scheduling_links: "Scheduling links",
  documents: "Documents",
  document_submissions: "Document submissions",
  intake_assignments: "Intake assignments",
  invoices: "Invoices",
  payments: "Payments",
  conversations: "Conversations",
  messages: "Messages",
  notifications: "Notifications",
  notes: "Notes",
  activity_events: "Activity events",
};

// Normalizes both category shapes -- a single top-level action
// (actionVerb/actionLabel/...) or a multi-action `actions` map -- into a
// uniform [verb, actionMeta][] list so review rows/toolbars/confirm dialogs
// never need to know which shape a given category uses.
function categoryActions(meta) {
  if (meta.actions) return Object.entries(meta.actions);
  return [
    [
      meta.actionVerb,
      {
        label: meta.actionLabel,
        confirmTitle: meta.confirmTitle,
        confirmBody: meta.confirmBody,
        confirmBodyPlural: meta.confirmBodyPlural,
        typedConfirm: meta.typedConfirm,
        resultKey: meta.resultKey,
      },
    ],
  ];
}

const dateLabel = (value) =>
  value
    ? new Date(String(value).replace(" ", "T")).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const dateTimeLabel = (value) =>
  value
    ? new Date(String(value).replace(" ", "T")).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const tokenPurposeLabel = {
  invitation: "Client portal invitation",
  password_reset: "Password reset",
  email_change: "Email change confirmation",
};

function rowKey(category, record) {
  if (category === "expired_invitations") return record.user_id;
  return record.id;
}

function ReviewRows({ category, records, selected, onToggle, onSoloAction }) {
  const meta = categoryMeta[category];
  if (category === "inactive_prospects") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Name</th>
            <th>Email</th>
            <th>Last activity</th>
            <th>Inactive</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.display_name}`}
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                />
              </td>
              <td>{row.display_name}</td>
              <td>{row.primary_email || "—"}</td>
              <td>{dateLabel(row.updated_at)}</td>
              <td>{row.inactive_days} days</td>
              <td>
                <div className="maintenance-row-actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onSoloAction(row.id, "dismiss")}
                  >
                    Keep active
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onSoloAction(row.id, "archive")}
                  >
                    {meta.actions.archive.label}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!row.delete_eligible}
                    title={row.delete_blocked_reason || undefined}
                    onClick={() => onSoloAction(row.id, "delete")}
                  >
                    {meta.actions.delete.label}
                  </button>
                </div>
                {!row.delete_eligible && row.delete_blocked_reason ? (
                  <p className="maintenance-row-note">
                    {row.delete_blocked_reason}
                  </p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  if (category === "completed_engagements") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Client</th>
            <th>Engagement</th>
            <th>Completed</th>
            <th>Last activity</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.title}`}
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                />
              </td>
              <td>{row.client_name || "—"}</td>
              <td>{row.title}</td>
              <td>{dateLabel(row.completion_date)}</td>
              <td>
                {row.last_activity_at ? dateLabel(row.last_activity_at) : "—"}
              </td>
              <td>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSoloAction(row.id, "act")}
                >
                  {meta.actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  if (category === "expired_links") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Purpose</th>
            <th>Recipient</th>
            <th>Related to</th>
            <th>Created</th>
            <th>Expired</th>
            <th>Usage</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.appointment_type}`}
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                />
              </td>
              <td>{row.appointment_type || "—"}</td>
              <td>{row.recipient_name || row.recipient_email || "—"}</td>
              <td>{row.client_name || row.service_name || "—"}</td>
              <td>{dateLabel(row.created_at)}</td>
              <td>{dateLabel(row.expires_at)}</td>
              <td>
                {Number(row.use_count) > 0
                  ? `Used ${row.use_count}/${row.max_uses}`
                  : "Never used"}
              </td>
              <td>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSoloAction(row.id, "act")}
                >
                  {meta.actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  if (category === "expired_invitations") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Invitee</th>
            <th>Email</th>
            <th>Role</th>
            <th>Invited</th>
            <th>Expired</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.user_id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.display_name}`}
                  checked={selected.has(row.user_id)}
                  onChange={() => onToggle(row.user_id)}
                />
              </td>
              <td>{row.display_name}</td>
              <td>{row.email}</td>
              <td>{row.role_name || row.role_slug}</td>
              <td>{dateLabel(row.invited_at)}</td>
              <td>{dateLabel(row.expires_at)}</td>
              <td>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSoloAction(row.user_id, "act")}
                >
                  {meta.actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  if (category === "expired_tokens") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Account</th>
            <th>Type</th>
            <th>Created</th>
            <th>Expired</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select token for ${row.email}`}
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                />
              </td>
              <td>{row.email}</td>
              <td>{tokenPurposeLabel[row.purpose] || row.purpose}</td>
              <td>{dateLabel(row.created_at)}</td>
              <td>{dateLabel(row.expires_at)}</td>
              <td>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSoloAction(row.id, "act")}
                >
                  {meta.actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  if (category === "expired_client_requests") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Client</th>
            <th>Request</th>
            <th>Engagement</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Due</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.document_name}`}
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                />
              </td>
              <td>{row.client_name || "—"}</td>
              <td>{row.document_name}</td>
              <td>{row.engagement_title || "—"}</td>
              <td>{row.status}</td>
              <td>{dateLabel(row.requested_date)}</td>
              <td>{row.due_date ? dateLabel(row.due_date) : "—"}</td>
              <td>
                <div className="maintenance-row-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onSoloAction(row.id, "archive")}
                  >
                    {meta.actions.archive.label}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!row.delete_eligible}
                    title={
                      row.delete_eligible
                        ? undefined
                        : "The client already submitted something for this request; only archival is available."
                    }
                    onClick={() => onSoloAction(row.id, "delete")}
                  >
                    {meta.actions.delete.label}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  if (category === "invoice_disposable") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Invoice</th>
            <th>Client</th>
            <th>Engagement</th>
            <th>Status</th>
            <th>Date</th>
            <th>Amount</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select invoice ${row.invoice_number}`}
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                />
              </td>
              <td>{row.invoice_number}</td>
              <td>{row.client_name || "—"}</td>
              <td>{row.engagement_title || "—"}</td>
              <td>{row.status}</td>
              <td>{dateLabel(row.invoice_date)}</td>
              <td>
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: row.currency || "USD",
                }).format(Number(row.subtotal || 0))}
              </td>
              <td>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSoloAction(row.id, "act")}
                >
                  {meta.actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  if (category === "invoice_uncollected") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Invoice</th>
            <th>Client</th>
            <th>Engagement</th>
            <th>Status</th>
            <th>Due</th>
            <th>Outstanding</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select invoice ${row.invoice_number}`}
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                />
              </td>
              <td>{row.invoice_number}</td>
              <td>{row.client_name || "—"}</td>
              <td>{row.engagement_title || "—"}</td>
              <td>{row.status}</td>
              <td>{dateLabel(row.due_date)}</td>
              <td>
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: row.currency || "USD",
                }).format(Number(row.outstanding_balance || 0))}
              </td>
              <td>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSoloAction(row.id, "act")}
                >
                  {meta.actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  if (category === "test_records") {
    return (
      <AdminTable>
        <thead>
          <tr>
            <th aria-label="Select" />
            <th>Client</th>
            <th>Email</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {records.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${row.display_name}`}
                  checked={selected.has(row.id)}
                  onChange={() => onToggle(row.id)}
                />
              </td>
              <td>{row.display_name}</td>
              <td>{row.primary_email || "—"}</td>
              <td>{row.client_type}</td>
              <td>{row.status}</td>
              <td>{dateLabel(row.created_at)}</td>
              <td>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSoloAction(row.id, "act")}
                >
                  {meta.actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    );
  }
  return null;
}

export default function AdminDataMaintenance() {
  const [overview, setOverview] = useState({
    loading: true,
    error: "",
    data: null,
  });
  const [history, setHistory] = useState({
    loading: true,
    error: "",
    items: [],
  });
  const [review, setReview] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadOverview = async () => {
    setOverview((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await settings.maintenance("overview", {});
      setOverview({ loading: false, error: "", data });
    } catch (error) {
      setOverview({
        loading: false,
        error: error.message || "Maintenance overview could not be loaded.",
        data: null,
      });
    }
  };

  const loadHistory = async () => {
    setHistory((current) => ({ ...current, loading: true, error: "" }));
    try {
      const items = await settings.maintenanceHistory();
      setHistory({ loading: false, error: "", items: items || [] });
    } catch (error) {
      setHistory({
        loading: false,
        error: error.message || "Maintenance history could not be loaded.",
        items: [],
      });
    }
  };

  useEffect(() => {
    loadOverview();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openReview = async (category) => {
    setReview({
      category,
      loading: true,
      error: "",
      records: [],
      selected: new Set(),
    });
    try {
      const result = await settings.maintenance("preview", {
        category,
        limit: 50,
      });
      setReview({
        category,
        loading: false,
        error: "",
        records: result.records || [],
        selected: new Set(),
        orphanTestLeads: result.orphan_test_leads || 0,
        breakdown: result.breakdown || null,
      });
    } catch (error) {
      setReview({
        category,
        loading: false,
        error: error.message || "This review could not be loaded.",
        records: [],
        selected: new Set(),
        orphanTestLeads: 0,
        breakdown: null,
      });
    }
  };

  const closeReview = () => {
    setReview(null);
    setConfirm(null);
  };

  const toggleSelect = (id) => {
    setReview((current) => {
      if (!current) return current;
      const next = new Set(current.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...current, selected: next };
    });
  };

  const dismissRow = (category, id) => {
    setReview((current) => {
      if (!current || current.category !== category) return current;
      const next = new Set(current.selected);
      next.delete(id);
      return {
        ...current,
        records: current.records.filter((row) => rowKey(category, row) !== id),
      };
    });
  };

  const requestConfirm = (category, action, ids) => {
    if (ids.length === 0) return;
    setConfirm({
      category,
      action,
      ids,
      typedValue: "",
      busy: false,
      error: "",
    });
  };

  const runConfirmedAction = async () => {
    if (!confirm) return;
    const meta = categoryMeta[confirm.category];
    const [, actionMeta] = categoryActions(meta).find(
      ([verb]) => verb === confirm.action,
    );
    if (
      actionMeta.typedConfirm &&
      confirm.typedValue !== actionMeta.typedConfirm
    ) {
      setConfirm((current) => ({
        ...current,
        error: `Type ${actionMeta.typedConfirm} to confirm.`,
      }));
      return;
    }
    setConfirm((current) => ({ ...current, busy: true, error: "" }));
    try {
      const result = await settings.maintenance("execute", {
        category: confirm.category,
        action: confirm.action,
        selected_ids: confirm.ids,
        confirm: actionMeta.typedConfirm ? confirm.typedValue : undefined,
      });
      const blocked = result?.blocked ?? 0;
      if (confirm.category === "test_records") {
        const deleted = result?.deleted || {};
        const total = Object.values(deleted).reduce(
          (sum, count) => sum + (count || 0),
          0,
        );
        setFeedback({
          type: "success",
          message:
            `Test records purged successfully. ${total} record${total === 1 ? "" : "s"} removed.` +
            (blocked > 0
              ? ` ${blocked} selected record${blocked === 1 ? "" : "s"} no longer qualified as test records and were left unchanged.`
              : ""),
          breakdown: Object.entries(deleted)
            .filter(([, count]) => count > 0)
            .map(([key, count]) => ({
              key,
              label: testPurgeLabels[key] || key,
              count,
            })),
        });
      } else {
        const affected = result?.[actionMeta.resultKey] ?? 0;
        const verbPast =
          confirm.action === "archive"
            ? "archived"
            : confirm.action === "delete"
              ? "deleted"
              : confirm.action === "purge"
                ? "purged"
                : "removed";
        setFeedback({
          type: "success",
          message:
            `${affected} ${affected === 1 ? meta.reviewNoun : meta.reviewNounPlural} ${verbPast}.` +
            (blocked > 0
              ? ` ${blocked} could not be ${verbPast} and were left unchanged.`
              : ""),
        });
      }
      setReview((current) => {
        if (!current || current.category !== confirm.category) return current;
        const idSet = new Set(confirm.ids);
        return {
          ...current,
          records: current.records.filter(
            (row) => !idSet.has(rowKey(confirm.category, row)),
          ),
          selected: new Set(),
        };
      });
      setConfirm(null);
      loadOverview();
      loadHistory();
    } catch (error) {
      setConfirm((current) => ({
        ...current,
        busy: false,
        error: error.message || "This action could not be completed.",
      }));
    }
  };

  const onSoloAction = (category, id, kind) => {
    if (kind === "dismiss") {
      dismissRow(category, id);
      return;
    }
    const action =
      kind === "act" ? categoryActions(categoryMeta[category])[0][0] : kind;
    requestConfirm(category, action, [id]);
  };

  const primaryGroups = [
    {
      label: "Client lifecycle",
      categories: [
        "inactive_prospects",
        "completed_engagements",
        "expired_client_requests",
      ],
    },
    {
      label: "Billing",
      categories: ["invoice_disposable", "invoice_uncollected"],
    },
    {
      label: "Testing & QA",
      categories: ["test_records"],
    },
  ];

  const data = overview.data;
  const summary = data?.summary || {};
  const categories = data?.categories || {};

  return (
    <div className="maintenance-workspace">
      <p className="settings-note">
        Review and manage records that are no longer part of active operations.
      </p>
      {feedback ? (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={
            feedback.type === "error"
              ? "admin-feedback"
              : "admin-feedback success"
          }
        >
          <p>{feedback.message}</p>
          {feedback.breakdown && feedback.breakdown.length > 0 ? (
            <ul className="maintenance-purge-breakdown">
              {feedback.breakdown.map((item) => (
                <li key={item.key}>
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {overview.loading ? (
        <p role="status">Loading maintenance overview…</p>
      ) : overview.error ? (
        <p role="alert" className="admin-feedback">
          {overview.error}
        </p>
      ) : (
        <>
          {primaryGroups.map((group) => (
            <section
              className="maintenance-group"
              key={group.label}
              aria-label={group.label}
            >
              <h2 className="maintenance-group-title">{group.label}</h2>
              <div className="maintenance-card-grid">
                {group.categories.map((category) => {
                  const meta = categoryMeta[category];
                  const info = categories[category];
                  const count = info?.count ?? 0;
                  return (
                    <article className="maintenance-card" key={category}>
                      <h3>{meta.title}</h3>
                      <p className="maintenance-card-count">
                        {count} candidate{count === 1 ? "" : "s"}
                      </p>
                      <p className="maintenance-card-description">
                        {info?.description}
                      </p>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => openReview(category)}
                      >
                        Review{" "}
                        {count > 0
                          ? `${count} ${count === 1 ? meta.reviewNoun : meta.reviewNounPlural}`
                          : meta.reviewNounPlural}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          <section
            className="maintenance-secondary-section"
            aria-label="System & security"
          >
            <h2 className="maintenance-group-title">System &amp; security</h2>
            <div className="maintenance-secondary-row">
              <div>
                <h3>Expired Scheduling Links</h3>
                <p>{categories.expired_links?.description}</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => openReview("expired_links")}
              >
                Review {summary.expired_links || 0} link
                {summary.expired_links === 1 ? "" : "s"}
              </button>
            </div>
            <div className="maintenance-secondary-row">
              <div>
                <h3>Expired Admin Invitations</h3>
                <p>{categories.expired_invitations?.description}</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => openReview("expired_invitations")}
              >
                Review {summary.expired_invitations || 0} invitation
                {summary.expired_invitations === 1 ? "" : "s"}
              </button>
            </div>
            <div className="maintenance-secondary-row">
              <div>
                <h3 id="expired-tokens-heading">Expired Security Tokens</h3>
                <p>{categories.expired_tokens?.description}</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => openReview("expired_tokens")}
              >
                Review {summary.expired_tokens || 0} token
                {summary.expired_tokens === 1 ? "" : "s"}
              </button>
            </div>
            <div className="maintenance-secondary-row">
              <div>
                <h3>Orphaned Records</h3>
                <p>{categories.orphaned_records?.description}</p>
              </div>
              <span className="maintenance-static-count">0 detected</span>
            </div>
          </section>

          <section
            className="maintenance-history-section"
            aria-labelledby="maintenance-history-heading"
          >
            <h3 id="maintenance-history-heading">Maintenance History</h3>
            <p className="settings-note">
              Recent administrative cleanup and archival activity.
            </p>
            {history.loading ? (
              <p role="status">Loading history…</p>
            ) : history.error ? (
              <p role="alert" className="admin-feedback">
                {history.error}
              </p>
            ) : history.items.length === 0 ? (
              <p className="maintenance-history-empty">
                No maintenance actions have been recorded yet.
              </p>
            ) : (
              <ol className="maintenance-history-list">
                {history.items.map((item, index) => (
                  <li key={index}>
                    <time>{dateTimeLabel(item.created_at)}</time>
                    <p>
                      {item.actor_name || "An administrator"}{" "}
                      {item.action_summary}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}

      <AdminDetailDrawer
        open={Boolean(review)}
        title={review ? categoryMeta[review.category].title : ""}
        onClose={closeReview}
        className="maintenance-review-drawer"
      >
        {review ? (
          confirm ? (
            (() => {
              const [, actionMeta] = categoryActions(
                categoryMeta[confirm.category],
              ).find(([verb]) => verb === confirm.action);
              return (
                <div className="maintenance-confirm">
                  <h3>{actionMeta.confirmTitle}</h3>
                  <p>
                    {confirm.ids.length === 1
                      ? actionMeta.confirmBody
                      : actionMeta.confirmBodyPlural}
                  </p>
                  {confirm.category === "test_records" && review.breakdown ? (
                    <div>
                      <p className="maintenance-confirm-count">
                        Test records found
                      </p>
                      <ul className="maintenance-purge-breakdown">
                        {Object.entries(review.breakdown)
                          .filter(([, count]) => count > 0)
                          .map(([key, count]) => (
                            <li key={key}>
                              <span>{testPurgeLabels[key] || key}</span>
                              <span>{count}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className="maintenance-confirm-count">
                    {confirm.ids.length} record
                    {confirm.ids.length === 1 ? "" : "s"} selected.
                  </p>
                  {actionMeta.typedConfirm ? (
                    <label className="maintenance-typed-confirm">
                      <span>Type {actionMeta.typedConfirm} to confirm</span>
                      <input
                        value={confirm.typedValue}
                        onChange={(event) =>
                          setConfirm((current) => ({
                            ...current,
                            typedValue: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ) : null}
                  {confirm.error ? (
                    <p role="alert" className="admin-feedback">
                      {confirm.error}
                    </p>
                  ) : null}
                  <div className="maintenance-confirm-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={confirm.busy}
                      onClick={() => setConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={confirm.busy}
                      onClick={runConfirmedAction}
                    >
                      {confirm.busy ? "Working…" : actionMeta.label}
                    </button>
                  </div>
                </div>
              );
            })()
          ) : review.loading ? (
            <p role="status">Loading records…</p>
          ) : review.error ? (
            <p role="alert" className="admin-feedback">
              {review.error}
            </p>
          ) : (
            <>
              {review.category === "test_records" &&
              review.orphanTestLeads > 0 ? (
                <p className="maintenance-row-note">
                  {review.orphanTestLeads} never-converted lead
                  {review.orphanTestLeads === 1 ? "" : "s"} on a reserved test
                  email domain will also be removed automatically when you
                  purge.
                </p>
              ) : null}
              {review.records.length === 0 ? (
                <AdminEmptyState
                  title={categoryMeta[review.category].emptyTitle}
                  description={categoryMeta[review.category].emptyDescription}
                />
              ) : (
                <>
                  <div className="maintenance-review-toolbar">
                    <p>
                      {review.records.length} record
                      {review.records.length === 1 ? "" : "s"} require review
                    </p>
                    <div className="maintenance-row-actions">
                      {categoryActions(categoryMeta[review.category]).map(
                        ([verb, actionMeta]) => (
                          <button
                            key={verb}
                            type="button"
                            className="primary-button"
                            disabled={review.selected.size === 0}
                            onClick={() =>
                              requestConfirm(
                                review.category,
                                verb,
                                Array.from(review.selected),
                              )
                            }
                          >
                            {actionMeta.label} selected ({review.selected.size})
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="maintenance-table-wrap">
                    <ReviewRows
                      category={review.category}
                      records={review.records}
                      selected={review.selected}
                      onToggle={toggleSelect}
                      onSoloAction={(id, kind) =>
                        onSoloAction(review.category, id, kind)
                      }
                    />
                  </div>
                </>
              )}
            </>
          )
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}

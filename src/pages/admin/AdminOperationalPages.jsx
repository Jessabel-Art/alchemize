import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AdminDetailDrawer,
  AdminEmptyState,
  AdminMetrics,
  AdminPageHeader,
  AdminSection,
  AdminStatusBadge,
  AdminTabs,
  AdminToolbar,
} from "../../components/admin/admin-components.jsx";
import {
  adminStore,
  serviceStageCatalog,
  staffOptions,
} from "../../../js/data/admin-store.js";

const leadStatuses = [
  "New",
  "Contacted",
  "Consultation Scheduled",
  "Qualified",
  "Proposal / SOW Sent",
  "Converted",
  "Closed / Not Moving Forward",
];

const taskStatuses = [
  "Waiting on Client",
  "Waiting on Team",
  "In Progress",
  "Completed",
];

const documentStatuses = ["Received", "Requested", "Under Review", "Archive"];

const appointmentStatuses = [
  "Upcoming",
  "Confirmed",
  "Needs Reschedule",
  "Completed",
  "Cancelled",
  "Follow-up Required",
];

const billingStatuses = ["Draft", "Issued", "Partially Paid", "Paid", "Past Due", "Void"];

const serviceLabelMap = Object.fromEntries(
  Object.entries(serviceStageCatalog).map(([label]) => [
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    label,
  ]),
);

const statusTone = {
  New: "info",
  Contacted: "neutral",
  "Consultation Scheduled": "success",
  Qualified: "status",
  "Proposal / SOW Sent": "warning",
  Converted: "success",
  "Closed / Not Moving Forward": "neutral",
  Prospect: "info",
  Onboarding: "status",
  Active: "success",
  "Waiting on Client": "warning",
  Paused: "neutral",
  Completed: "success",
  Inactive: "neutral",
  "Waiting on Team": "info",
  "In Progress": "status",
  Received: "success",
  Requested: "info",
  "Under Review": "warning",
  Archive: "neutral",
  Upcoming: "info",
  Confirmed: "success",
  "Needs Reschedule": "warning",
  "Follow-up Required": "warning",
  Cancelled: "neutral",
  Draft: "neutral",
  Open: "info",
  "Past Due": "warning",
  Paid: "success",
  Pending: "info",
  Active: "success",
  "Waiting on Team": "info",
  "Waiting on Client": "warning",
  Completed: "success",
  Cancelled: "neutral",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const toTitleCase = (value) =>
  (value || "")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeLeadStatus = (value) => {
  if (!value) return "New";

  const raw = String(value).trim();
  const normalized = raw.toLowerCase();

  const aliases = {
    new: "New",
    "new lead": "New",
    "new inquiry": "New",
    contacted: "Contacted",
    "consultation requested": "Consultation Scheduled",
    "consultation-requested": "Consultation Scheduled",
    "consultation scheduled": "Consultation Scheduled",
    qualified: "Qualified",
    "proposal / sow sent": "Proposal / SOW Sent",
    "proposal-sow-sent": "Proposal / SOW Sent",
    "proposal sent": "Proposal / SOW Sent",
    converted: "Converted",
    closed: "Closed / Not Moving Forward",
    "not moving forward": "Closed / Not Moving Forward",
    "closed / not moving forward": "Closed / Not Moving Forward",
  };

  return aliases[normalized] || raw;
};

const leadFreshnessThresholds = {
  fresh: 2,
  aging: 5,
};

const deriveLeadFreshness = (lead = {}) => {
  const lastMeaningfulActivity =
    lead.lastActivityAt ||
    lead.lastContact ||
    lead.updatedAt ||
    lead.receivedAt ||
    new Date().toISOString();

  const lastActivityDate = new Date(lastMeaningfulActivity);
  const elapsedDays = Number.isNaN(lastActivityDate.getTime())
    ? 0
    : Math.max(0, Math.floor((Date.now() - lastActivityDate.getTime()) / 86400000));

  if (elapsedDays <= leadFreshnessThresholds.fresh) {
    return { state: "Fresh", days: elapsedDays, label: `Fresh · ${elapsedDays} day${elapsedDays === 1 ? "" : "s"}` };
  }

  if (elapsedDays <= leadFreshnessThresholds.aging) {
    return { state: "Aging", days: elapsedDays, label: `Aging · ${elapsedDays} day${elapsedDays === 1 ? "" : "s"}` };
  }

  return { state: "Stale", days: elapsedDays, label: `Stale · ${elapsedDays} day${elapsedDays === 1 ? "" : "s"}` };
};

const normalizeLeadRecord = (lead = {}) => {
  const name = lead.name || lead.full_name || "Unassigned lead";
  const email = lead.email || "";
  const phone = lead.phone || lead.phone_number || "";
  const businessName =
    lead.businessName ||
    lead.business_name ||
    lead.company_name ||
    lead.company ||
    "";
  const source = lead.source || "Website";
  const audience =
    lead.audience ||
    (lead.type === "Business" ? "Business" : lead.type === "Individual" ? "Individual" : "Individual");
  const serviceInterest =
    lead.serviceInterest ||
    lead.service_name ||
    lead.requestedService ||
    serviceLabelMap[lead.service_key?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")] ||
    "General consultation";
  const receivedAt =
    lead.receivedAt ||
    lead.created_at ||
    lead.createdAt ||
    lead.date_received ||
    new Date().toISOString();
  const status = normalizeLeadStatus(lead.status);
  const assignedTo = lead.assignedTo || lead.owner || lead.assigned_to || "Unassigned";
  const nextAction = lead.nextAction || lead.next_action || "Review inquiry";
  const lastContact = lead.lastContact || lead.last_contact || lead.updated_at || null;
  const lastActivityAt = lead.lastActivityAt || lastContact || receivedAt;
  const interests = Array.isArray(lead.interests)
    ? lead.interests
    : typeof lead.interests === "string"
      ? lead.interests
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [];
  const contactAttempts = Array.isArray(lead.contactAttempts) ? lead.contactAttempts : [];
  const internalNotes =
    lead.internalNotes ||
    lead.notes ||
    lead.message ||
    "No internal notes recorded yet.";
  const freshness = deriveLeadFreshness({ ...lead, lastActivityAt, receivedAt, lastContact });

  return {
    ...lead,
    id: lead.id || lead.public_id || `lead-${Math.random().toString(36).slice(2, 9)}`,
    name,
    email,
    phone,
    businessName,
    audience,
    source,
    serviceInterest,
    receivedAt,
    status,
    assignedTo,
    nextAction,
    lastContact,
    lastActivityAt,
    interests,
    contactAttempts,
    internalNotes,
    freshness,
  };
};

const createEmptyClientForm = () => ({
  clientType: "Individual",
  displayName: "",
  businessName: "",
  dbaName: "",
  legalBusinessName: "",
  email: "",
  businessEmail: "",
  phone: "",
  businessPhone: "",
  preferredContactMethod: "Email",
  status: "Prospect",
  portalStatus: "Active",
  representative: "",
  authorizedUsers: "",
  businessAddress: "",
  notes: "",
});

const createEmptyServiceForm = () => ({
  serviceCode: "",
  serviceName: "",
  shortDescription: "",
  audience: "Individual",
  category: "General",
  status: "Active",
  defaultDuration: "60",
  defaultOwner: "Owner / Administrator",
  defaultTaskTemplate: "",
  defaultPreparationRequirements: "",
  billingType: "Fixed Fee",
  defaultPrice: "",
  currency: "USD",
  taxable: false,
  depositRequired: false,
  defaultDepositAmount: "",
  minimumCharge: "",
  defaultBillingDescription: "",
  internalPricingNotes: "",
  addOns: "",
});

const parseAddOnInput = (value = "") => {
  if (!value || !String(value).trim()) return [];

  return String(value)
    .split(/\n|,/) 
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, name, price, ...rest] = line.split("|").map((part) => part.trim());
      const normalizedCode = code || name.replace(/\s+/g, "-").toUpperCase();
      const normalizedName = name || code || "Add-on";
      const normalizedPrice = price && Number(price) ? Number(price) : null;
      return {
        id: `addon-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`,
        addOnCode: normalizedCode,
        addOnName: normalizedName,
        description: rest.join(" ") || "",
        defaultPrice: normalizedPrice,
        billingType: "Fixed Fee",
        active: true,
        required: false,
        optional: true,
        internalNotes: rest.join(" ") || "",
      };
    });
};

function LeadManagementPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [nextActionDraft, setNextActionDraft] = useState("");
  const [ownerDraft, setOwnerDraft] = useState("Owner / Administrator");
  const [consultationDate, setConsultationDate] = useState("");
  const [showAddLeadForm, setShowAddLeadForm] = useState(false);
  const [draftLead, setDraftLead] = useState({
    name: "",
    email: "",
    phone: "",
    audience: "Individual",
    businessName: "",
    serviceInterest: "Business Advisory",
    source: "Manual entry",
    message: "",
  });

  const refreshLeads = () => {
    try {
      setError("");
      setIsLoading(true);
      const snapshot = adminStore.getSnapshot();
      const nextRows = (snapshot.leads || []).map(normalizeLeadRecord);
      setRows(nextRows);
      setSelectedLead((current) => {
        if (!current) return current;
        return nextRows.find((lead) => lead.id === current.id) || null;
      });
    } catch (loadError) {
      setError("Unable to load leads.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLeads();
  }, []);

  const serviceOptions = useMemo(
    () => ["All", ...new Set(rows.map((lead) => lead.serviceInterest).filter(Boolean))],
    [rows],
  );

  const filteredRows = useMemo(() => {
    const result = rows.filter((lead) => {
      const searchText = [
        lead.name,
        lead.email,
        lead.businessName,
        lead.serviceInterest,
        lead.message,
        lead.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchText.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
      const matchesService = serviceFilter === "All" || lead.serviceInterest === serviceFilter;
      const matchesType = typeFilter === "All" || lead.audience === typeFilter;
      return matchesSearch && matchesStatus && matchesService && matchesType;
    });

    return [...result].sort((left, right) => {
      const leftTime = new Date(left.receivedAt || 0).getTime();
      const rightTime = new Date(right.receivedAt || 0).getTime();

      if (sortOrder === "oldest") return leftTime - rightTime;
      if (sortOrder === "updated") {
        const leftUpdated = new Date(left.lastContact || left.receivedAt || 0).getTime();
        const rightUpdated = new Date(right.lastContact || right.receivedAt || 0).getTime();
        return rightUpdated - leftUpdated;
      }
      return rightTime - leftTime;
    });
  }, [rows, search, statusFilter, serviceFilter, typeFilter, sortOrder]);

  const summary = [
    { label: "New", value: rows.filter((lead) => normalizeLeadStatus(lead.status) === "New").length },
    { label: "Needs Follow-Up", value: rows.filter((lead) => normalizeLeadStatus(lead.status) === "Contacted").length },
    { label: "Consultation Scheduled", value: rows.filter((lead) => normalizeLeadStatus(lead.status) === "Consultation Scheduled").length },
    { label: "Qualified", value: rows.filter((lead) => normalizeLeadStatus(lead.status) === "Qualified").length },
    { label: "Converted", value: rows.filter((lead) => normalizeLeadStatus(lead.status) === "Converted").length },
  ];

  const updateLeadStatus = (leadId, nextStatus) => {
    const nextValue = normalizeLeadStatus(nextStatus);
    setRows((current) =>
      current.map((lead) =>
        lead.id === leadId ? { ...lead, status: nextValue } : lead,
      ),
    );
    setSelectedLead((current) => {
      if (!current || current.id !== leadId) return current;
      return { ...current, status: nextValue };
    });
  };

  const persistLeadNote = () => {
    if (!selectedLead || !noteDraft.trim()) return;

    const content = noteDraft.trim();
    const nextRows = rows.map((lead) =>
      lead.id === selectedLead.id
        ? {
            ...lead,
            internalNotes: `${lead.internalNotes || ""}${lead.internalNotes ? "\n" : ""}${content}`.trim(),
          }
        : lead,
    );
    setRows(nextRows);
    setSelectedLead((current) => {
      if (!current || current.id !== selectedLead.id) return current;
      return {
        ...current,
        internalNotes: `${current.internalNotes || ""}${current.internalNotes ? "\n" : ""}${content}`.trim(),
      };
    });
    setNoteDraft("");
  };

  const assignOwner = () => {
    if (!selectedLead) return;
    const ownerName = ownerDraft.trim() || "Owner / Administrator";
    setRows((current) =>
      current.map((lead) =>
        lead.id === selectedLead.id ? { ...lead, assignedTo: ownerName } : lead,
      ),
    );
    setSelectedLead((current) => ({ ...current, assignedTo: ownerName }));
  };

  const setNextAction = () => {
    if (!selectedLead || !nextActionDraft.trim()) return;
    const nextValue = nextActionDraft.trim();
    setRows((current) =>
      current.map((lead) =>
        lead.id === selectedLead.id ? { ...lead, nextAction: nextValue } : lead,
      ),
    );
    setSelectedLead((current) => ({ ...current, nextAction: nextValue }));
    setNextActionDraft("");
  };

  const scheduleLeadConsultation = () => {
    if (!selectedLead) return;
    const chosenDate = consultationDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    updateLeadStatus(selectedLead.id, "Consultation Scheduled");
    setRows((current) =>
      current.map((lead) =>
        lead.id === selectedLead.id
          ? { ...lead, nextAction: `Consultation scheduled for ${formatDate(chosenDate)}` }
          : lead,
      ),
    );
    setSelectedLead((current) => ({
      ...current,
      nextAction: `Consultation scheduled for ${formatDate(chosenDate)}`,
      lastContact: new Date().toISOString(),
    }));
  };

  const convertSelectedLead = () => {
    if (!selectedLead) return;
    const converted = adminStore.convertLeadToClient({
      leadId: selectedLead.id,
      clientType: selectedLead.audience || "Individual",
      email: selectedLead.email,
      phone: selectedLead.phone,
      businessName: selectedLead.businessName,
      intendedService: selectedLead.serviceInterest,
    });

    if (converted) {
      refreshLeads();
      setSelectedLead(null);
    }
  };

  const addLead = () => {
    const newLead = {
      id: `lead-temp-${Date.now()}`,
      name: draftLead.name || "New lead",
      email: draftLead.email || "",
      phone: draftLead.phone || "",
      businessName: draftLead.businessName || "",
      audience: draftLead.audience || "Individual",
      serviceInterest: draftLead.serviceInterest || "Business Advisory",
      source: draftLead.source || "Manual entry",
      message: draftLead.message || "No inquiry details provided yet.",
      status: "New",
      receivedAt: new Date().toISOString(),
      assignedTo: "Owner / Administrator",
      nextAction: "Review inquiry and assign follow-up",
      internalNotes: "Manual lead draft created locally. This prototype does not yet persist manual lead creation in the backend.",
    };

    setRows((current) => [normalizeLeadRecord(newLead), ...current]);
    setShowAddLeadForm(false);
    setDraftLead({
      name: "",
      email: "",
      phone: "",
      audience: "Individual",
      businessName: "",
      serviceInterest: "Business Advisory",
      source: "Manual entry",
      message: "",
    });
    setSelectedLead(normalizeLeadRecord(newLead));
  };

  const leadDetail = selectedLead ? normalizeLeadRecord(selectedLead) : null;

  if (isLoading) {
    return (
      <div className="admin-module">
        <AdminPageHeader
          eyebrow="Lead pipeline"
          title="Lead pipeline"
          summary="Review incoming inquiries, determine the appropriate next step, and move qualified opportunities toward an active client relationship."
        />
        <div className="admin-empty-state" aria-live="polite">
          <h3>Loading leads…</h3>
          <p>Gathering the current intake queue.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-module">
        <AdminPageHeader
          eyebrow="Lead pipeline"
          title="Lead pipeline"
          summary="Review incoming inquiries, determine the appropriate next step, and move qualified opportunities toward an active client relationship."
        />
        <div className="admin-empty-state" role="alert">
          <h3>Unable to load leads.</h3>
          <p>The lead records could not be retrieved. Try again.</p>
          <button type="button" className="primary-button" onClick={refreshLeads}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-module">
      <AdminPageHeader
        eyebrow="Lead pipeline"
        title="Lead pipeline"
        summary="Review incoming inquiries, determine the appropriate next step, and move qualified opportunities toward an active client relationship."
      />

      <AdminMetrics items={summary.map((item) => ({ label: item.label, value: item.value, hint: "Current" }))} />

      <AdminToolbar
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: ["All", ...leadStatuses].map((option) => ({ value: option, label: option })),
          },
          {
            label: "Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: ["All", "Individual", "Business"].map((option) => ({ value: option, label: option })),
          },
          {
            label: "Service",
            value: serviceFilter,
            onChange: setServiceFilter,
            options: serviceOptions.map((option) => ({ value: option, label: option })),
          },
        ]}
        actions={[{ label: "+ Add Lead", primary: true, onClick: () => setShowAddLeadForm(true) }]}
        extraControls={
          <label className="admin-filter admin-sort-filter">
            <span>Sort</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="updated">Recently updated</option>
            </select>
          </label>
        }
      />

      {showAddLeadForm ? (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Add lead</h2>
            <button type="button" className="secondary-button" onClick={() => setShowAddLeadForm(false)}>
              Cancel
            </button>
          </div>
          <div className="admin-detail-grid">
            <label className="admin-filter">
              <span>Name</span>
              <input
                value={draftLead.name}
                onChange={(event) => setDraftLead((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="admin-filter">
              <span>Email</span>
              <input
                type="email"
                value={draftLead.email}
                onChange={(event) => setDraftLead((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="admin-filter">
              <span>Phone</span>
              <input
                value={draftLead.phone}
                onChange={(event) => setDraftLead((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label className="admin-filter">
              <span>Type</span>
              <select
                value={draftLead.audience}
                onChange={(event) => setDraftLead((current) => ({ ...current, audience: event.target.value }))}
              >
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
              </select>
            </label>
            <label className="admin-filter">
              <span>Business name</span>
              <input
                value={draftLead.businessName}
                onChange={(event) => setDraftLead((current) => ({ ...current, businessName: event.target.value }))}
              />
            </label>
            <label className="admin-filter">
              <span>Requested service</span>
              <select
                value={draftLead.serviceInterest}
                onChange={(event) => setDraftLead((current) => ({ ...current, serviceInterest: event.target.value }))}
              >
                {Object.keys(serviceStageCatalog).map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </label>
            <label className="admin-filter full-span">
              <span>Inquiry</span>
              <textarea
                rows="4"
                value={draftLead.message}
                onChange={(event) => setDraftLead((current) => ({ ...current, message: event.target.value }))}
              />
            </label>
          </div>
          <p className="admin-note-text">
            This manual add flow is prepared for the current UI, but the backend does not yet provide a persistent create-lead API for manual entries.
          </p>
          <div className="admin-header-actions">
            <button type="button" className="primary-button" onClick={addLead}>
              Save draft lead
            </button>
          </div>
        </div>
      ) : null}

      <AdminSection title="Lead records">
        {filteredRows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Type</th>
                  <th>Requested Service</th>
                  <th>Date Received</th>
                  <th>Status</th>
                  <th>Last Contact</th>
                  <th>Next Action</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="lead-cell">
                        <strong>{lead.name}</strong>
                        <span>{lead.email || "Email not provided"}</span>
                        {lead.businessName ? <small>{lead.businessName}</small> : null}
                      </div>
                    </td>
                    <td>{lead.audience || "Individual"}</td>
                    <td>{lead.serviceInterest}</td>
                    <td>{formatDate(lead.receivedAt)}</td>
                    <td>
                      <AdminStatusBadge status={lead.status} tone={statusTone[lead.status] || "neutral"} />
                    </td>
                    <td>{lead.lastContact ? formatDate(lead.lastContact) : "—"}</td>
                    <td>{lead.nextAction || "Review inquiry"}</td>
                    <td>{lead.assignedTo || "Unassigned"}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button" onClick={() => setSelectedLead(lead)}>
                          View
                        </button>
                        <button type="button" className="link-button" onClick={() => setSelectedLead(lead)}>
                          Edit
                        </button>
                        <select
                          className="inline-select"
                          value={lead.status}
                          onChange={(event) => updateLeadStatus(lead.id, event.target.value)}
                          aria-label={`Update status for ${lead.name}`}
                        >
                          {leadStatuses.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            title="No leads to review."
            description="New consultation requests and manually added leads will appear here."
            actionLabel="Add Lead"
            onAction={() => setShowAddLeadForm(true)}
          />
        )}
      </AdminSection>

      <AdminDetailDrawer
        open={Boolean(leadDetail)}
        title={leadDetail?.name || "Lead detail"}
        onClose={() => setSelectedLead(null)}
      >
        {leadDetail ? (
          <div className="admin-detail-grid">
            <div className="detail-block">
              <h3>Overview</h3>
              <dl>
                <div><dt>Name</dt><dd>{leadDetail.name}</dd></div>
                <div><dt>Email</dt><dd>{leadDetail.email || "Not provided"}</dd></div>
                <div><dt>Phone</dt><dd>{leadDetail.phone || "Not provided"}</dd></div>
                <div><dt>Type</dt><dd>{leadDetail.audience}</dd></div>
                <div><dt>Business name</dt><dd>{leadDetail.businessName || "—"}</dd></div>
                <div><dt>Date received</dt><dd>{formatDate(leadDetail.receivedAt)}</dd></div>
                <div><dt>Lead source</dt><dd>{leadDetail.source}</dd></div>
                <div><dt>Current status</dt><dd><AdminStatusBadge status={leadDetail.status} tone={statusTone[leadDetail.status] || "neutral"} /></dd></div>
                <div><dt>Assigned owner</dt><dd>{leadDetail.assignedTo || "Unassigned"}</dd></div>
              </dl>
            </div>

            <div className="detail-block">
              <h3>Request</h3>
              <dl>
                <div><dt>Requested service</dt><dd>{leadDetail.serviceInterest}</dd></div>
                <div><dt>Original inquiry</dt><dd>{leadDetail.message || "No inquiry message was captured."}</dd></div>
                <div><dt>Preferred contact method</dt><dd>{leadDetail.preferred_contact || "Not captured"}</dd></div>
                <div><dt>Company / business</dt><dd>{leadDetail.businessName || "—"}</dd></div>
              </dl>
            </div>

            <div className="detail-block">
              <h3>Follow-up</h3>
              <dl>
                <div><dt>Last contact</dt><dd>{leadDetail.lastContact ? formatDate(leadDetail.lastContact) : "—"}</dd></div>
                <div><dt>Next action</dt><dd>{leadDetail.nextAction || "Review inquiry"}</dd></div>
                <div><dt>Consultation date</dt><dd>{consultationDate || "Not scheduled"}</dd></div>
              </dl>
            </div>

            <div className="detail-block">
              <h3>Internal notes</h3>
              <p>{leadDetail.internalNotes || "No internal notes on this lead yet."}</p>
              <textarea
                rows="4"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Add a note for the internal team"
              />
              <button type="button" className="secondary-button" onClick={persistLeadNote}>
                Add internal note
              </button>
            </div>

            <div className="detail-block full-width">
              <h3>Lead actions</h3>
              <div className="admin-inline-actions">
                <label className="admin-filter admin-action-select">
                  <span>Update status</span>
                  <select
                    value={leadDetail.status}
                    onChange={(event) => updateLeadStatus(leadDetail.id, event.target.value)}
                  >
                    {leadStatuses.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-filter admin-action-select">
                  <span>Assign owner</span>
                  <select value={leadDetail.assignedTo || "Unassigned"} onChange={(event) => setOwnerDraft(event.target.value)}>
                    {staffOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="secondary-button" onClick={assignOwner}>
                  Save owner
                </button>
                <input
                  value={nextActionDraft}
                  onChange={(event) => setNextActionDraft(event.target.value)}
                  placeholder="Set next action"
                />
                <button type="button" className="secondary-button" onClick={setNextAction}>
                  Save next action
                </button>
                <input
                  type="date"
                  value={consultationDate}
                  onChange={(event) => setConsultationDate(event.target.value)}
                />
                <button type="button" className="primary-button" onClick={scheduleLeadConsultation}>
                  Schedule consultation
                </button>
                <button type="button" className="secondary-button" onClick={convertSelectedLead}>
                  Convert to client
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}

function ClientManagementPage() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const snapshot = adminStore.getSnapshot();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [attentionFilter, setAttentionFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");
  const [noteDraft, setNoteDraft] = useState("");
  const [recordVersion, setRecordVersion] = useState(0);
  const [isClientEditorOpen, setIsClientEditorOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clientDraft, setClientDraft] = useState(null);
  const [newClientForm, setNewClientForm] = useState(createEmptyClientForm());
  const [clientFormError, setClientFormError] = useState("");
  const [clientSavedMessage, setClientSavedMessage] = useState("");
  const [printMode, setPrintMode] = useState(null);

  const rows = snapshot.clients;
  const selectedClient = clientId
    ? rows.find((client) => client.id === clientId) || null
    : null;

  const filteredRows = useMemo(() => {
    return rows.filter((client) => {
      const target = `${client.displayName} ${client.businessName || ""} ${client.email} ${client.representative || ""}`.toLowerCase();
      const matchesSearch = !search || target.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || client.status === statusFilter;
      const matchesType = typeFilter === "All" || client.clientType === typeFilter;
      const matchesAttention = attentionFilter === "All" || (attentionFilter === "Needs Attention" && client.nextAction);
      return matchesSearch && matchesStatus && matchesType && matchesAttention;
    });
  }, [rows, search, statusFilter, typeFilter, attentionFilter]);

  const summary = [
    { label: "Active Clients", value: rows.filter((client) => client.status === "Active").length },
    { label: "Needs Attention", value: rows.filter((client) => client.status === "Onboarding" || client.status === "Waiting on Client").length },
    { label: "Inactive", value: rows.filter((client) => client.status === "Inactive").length },
    { label: "Business Clients", value: rows.filter((client) => client.clientType === "Business").length },
    { label: "Individual Clients", value: rows.filter((client) => client.clientType === "Individual").length },
  ];

  const clientNotes = selectedClient
    ? adminStore.getSnapshot().notes.filter((note) => note.relatedType === "client" && note.relatedId === selectedClient.id)
    : [];
  const clientTasks = selectedClient
    ? snapshot.tasks.filter((task) => task.clientId === selectedClient.id)
    : [];
  const clientDocuments = selectedClient
    ? snapshot.documents.filter((document) => document.clientId === selectedClient.id)
    : [];
  const clientAppointments = selectedClient
    ? snapshot.appointments.filter((appointment) => appointment.clientId === selectedClient.id)
    : [];
  const clientEngagements = selectedClient
    ? snapshot.engagements.filter((engagement) => engagement.clientId === selectedClient.id)
    : [];
  const clientInvoices = selectedClient
    ? snapshot.invoices.filter((invoice) => invoice.clientId === selectedClient.id)
    : [];
  const clientActivity = selectedClient
    ? snapshot.activity.filter((entry) => entry.clientId === selectedClient.id)
    : [];

  const refreshClientState = () => setRecordVersion((current) => current + 1);

  useEffect(() => {
    if (!selectedClient) {
      setClientDraft(null);
      return;
    }

    setClientDraft({
      ...selectedClient,
      authorizedUsers: Array.isArray(selectedClient.authorizedUsers)
        ? selectedClient.authorizedUsers.join(", ")
        : selectedClient.authorizedUsers || "",
    });
  }, [selectedClient, recordVersion]);

  const handleAddNote = () => {
    if (!selectedClient) return;
    const content = noteDraft.trim();
    if (!content) return;

    adminStore.addInternalNote({
      relatedType: "client",
      relatedId: selectedClient.id,
      author: "Owner / Administrator",
      content,
    });
    setNoteDraft("");
    refreshClientState();
  };

  const saveClientProfile = () => {
    if (!selectedClient || !clientDraft) return;

    adminStore.updateClientProfile(selectedClient.id, {
      displayName: clientDraft.displayName?.trim() || selectedClient.displayName,
      businessName: clientDraft.businessName?.trim() || "",
      email: clientDraft.email?.trim() || "",
      phone: clientDraft.phone?.trim() || "",
      preferredContactMethod: clientDraft.preferredContactMethod || "Email",
      status: clientDraft.status || selectedClient.status,
      portalStatus: clientDraft.portalStatus || selectedClient.portalStatus,
      nextAction: clientDraft.nextAction?.trim() || selectedClient.nextAction,
      representative: clientDraft.representative?.trim() || selectedClient.representative || selectedClient.displayName,
      authorizedUsers: clientDraft.authorizedUsers || selectedClient.authorizedUsers || selectedClient.displayName,
    });

    setIsClientEditorOpen(false);
    refreshClientState();
  };

  const handleCreateClient = () => {
    try {
      const payload = {
        clientType: newClientForm.clientType,
        displayName: newClientForm.displayName,
        businessName: newClientForm.clientType === "Business" ? newClientForm.businessName || newClientForm.legalBusinessName : newClientForm.businessName,
        legalBusinessName: newClientForm.legalBusinessName,
        dbaName: newClientForm.dbaName,
        email: newClientForm.email,
        phone: newClientForm.phone,
        businessEmail: newClientForm.businessEmail,
        businessPhone: newClientForm.businessPhone,
        preferredContactMethod: newClientForm.preferredContactMethod,
        status: newClientForm.status,
        portalStatus: newClientForm.portalStatus,
        representative: newClientForm.representative,
        authorizedUsers: newClientForm.authorizedUsers,
        businessAddress: newClientForm.businessAddress,
        notes: newClientForm.notes,
      };

      const createdClient = adminStore.createClient(payload);
      setClientSavedMessage(`Client added: ${createdClient.displayName}`);
      setClientFormError("");
      setNewClientForm(createEmptyClientForm());
      setIsAddClientOpen(false);
      refreshClientState();
      navigate(`/admin/clients/${createdClient.id}`);
    } catch (error) {
      setClientFormError(error.message || "Unable to create this client.");
      setClientSavedMessage("");
    }
  };

  const buildClientExport = (mode = "summary") => {
    if (!selectedClient) return null;

    const clientSnapshot = adminStore.getSnapshot();
    const clientNotes = clientSnapshot.notes.filter(
      (note) => note.relatedType === "client" && note.relatedId === selectedClient.id,
    );
    const clientActivity = clientSnapshot.activity.filter((entry) => entry.clientId === selectedClient.id);
    const clientTasks = clientSnapshot.tasks.filter((task) => task.clientId === selectedClient.id);
    const clientDocuments = clientSnapshot.documents.filter((document) => document.clientId === selectedClient.id);
    const clientAppointments = clientSnapshot.appointments.filter((appointment) => appointment.clientId === selectedClient.id);
    const clientEngagements = clientSnapshot.engagements.filter((engagement) => engagement.clientId === selectedClient.id);
    const clientInvoices = clientSnapshot.invoices.filter((invoice) => invoice.clientId === selectedClient.id);

    return {
      exportedAt: new Date().toISOString(),
      mode,
      client: selectedClient,
      engagements: clientEngagements,
      tasks: clientTasks,
      documents: clientDocuments,
      appointments: clientAppointments,
      invoices: clientInvoices,
      notes: mode === "full" ? clientNotes : [],
      activity: mode === "full" ? clientActivity : [],
    };
  };

  const exportClientRecord = (mode = "summary") => {
    const payload = buildClientExport(mode);
    if (!payload) return;

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedClient.id}-${mode === "full" ? "full-dossier" : "summary"}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const printClientRecord = (mode = "summary") => {
    if (!selectedClient) return;
    setPrintMode(mode);
    setTimeout(() => window.print(), 50);
  };

  const handleArchiveClient = () => {
    if (!selectedClient) return;
    adminStore.archiveRecord({ collection: "clients", id: selectedClient.id });
    navigate("/admin/clients");
    refreshClientState();
  };

  const renderClientDetail = () => {
    if (!selectedClient) return null;

    const fullPrintDetail = buildClientExport("full");

    return (
      <div className="client-record-print-shell">
        <div className="client-print-sheet" data-mode={printMode || "summary"}>
          <div className="client-print-header">
            <div>
              <span className="section-kicker">Client record</span>
              <h2>{selectedClient.displayName}</h2>
            </div>
            <span>{printMode === "full" ? "Full dossier" : "Summary"}</span>
          </div>

          <div className="client-print-grid">
            <div className="detail-block">
              <h3>Profile</h3>
              <dl>
                <div><dt>Client name</dt><dd>{selectedClient.displayName}</dd></div>
                <div><dt>Business</dt><dd>{selectedClient.businessName || "—"}</dd></div>
                <div><dt>Type</dt><dd>{selectedClient.clientType}</dd></div>
                <div><dt>Status</dt><dd>{selectedClient.status}</dd></div>
              </dl>
            </div>
            <div className="detail-block">
              <h3>Contact</h3>
              <dl>
                <div><dt>Email</dt><dd>{selectedClient.email || "—"}</dd></div>
                <div><dt>Phone</dt><dd>{selectedClient.phone || "—"}</dd></div>
                <div><dt>Representative</dt><dd>{selectedClient.representative || "—"}</dd></div>
                <div><dt>Preferred contact</dt><dd>{selectedClient.preferredContactMethod || "Email"}</dd></div>
              </dl>
            </div>
            <div className="detail-block full-width">
              <h3>Overview</h3>
              <dl>
                <div><dt>Next action</dt><dd>{selectedClient.nextAction || "Review"}</dd></div>
                <div><dt>Portal status</dt><dd>{selectedClient.portalStatus || "Active"}</dd></div>
                <div><dt>Authorized users</dt><dd>{selectedClient.authorizedUsers?.join(", ") || "None listed"}</dd></div>
                <div><dt>Last activity</dt><dd>{formatDate(selectedClient.lastActivity)}</dd></div>
              </dl>
            </div>
            {printMode === "full" && fullPrintDetail ? (
              <>
                <div className="detail-block full-width">
                  <h3>Internal notes</h3>
                  {fullPrintDetail.notes.length ? (
                    <ul className="detail-list">
                      {fullPrintDetail.notes.map((note) => (
                        <li key={note.id}><div className="note-header"><strong>{note.author}</strong><span>{formatDate(note.timestamp)}</span></div><p>{note.content}</p></li>
                      ))}
                    </ul>
                  ) : (
                    <p>No internal notes.</p>
                  )}
                </div>
                <div className="detail-block full-width">
                  <h3>Activity timeline</h3>
                  {fullPrintDetail.activity.length ? (
                    <ul className="detail-list">
                      {fullPrintDetail.activity.map((entry) => (
                        <li key={entry.id}><div className="note-header"><strong>{entry.actorName}</strong><span>{formatDate(entry.timestamp)}</span></div><p>{entry.summary}</p></li>
                      ))}
                    </ul>
                  ) : (
                    <p>No client activity.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="record-shell-core admin-module">
          <header className="client-workspace-header">
            <div className="client-workspace-back">
              <Link to="/admin/clients">← Back to client roster</Link>
            </div>
            <div className="client-workspace-title-wrap">
              <span className="section-kicker">Client workspace</span>
              <h1>{selectedClient.displayName}</h1>
            </div>
            <div className="admin-header-actions">
              <button type="button" className="secondary-button" onClick={() => navigate("/admin/clients")}>Roster</button>
              <button type="button" className="secondary-button" onClick={() => printClientRecord("summary")}>Print summary</button>
              <button type="button" className="secondary-button" onClick={() => printClientRecord("full")}>Print full dossier</button>
              <button type="button" className="secondary-button" onClick={() => exportClientRecord("summary")}>Export summary</button>
              <button type="button" className="primary-button" onClick={() => exportClientRecord("full")}>Export dossier</button>
              <button type="button" className="secondary-button" onClick={() => setIsClientEditorOpen((current) => !current)}>{isClientEditorOpen ? "Close editor" : "Edit record"}</button>
              <button type="button" className="primary-button" onClick={handleArchiveClient}>Archive client</button>
            </div>
          </header>

          <div className="client-workspace-summary">
            <div className="detail-block">
              <h3>Primary profile</h3>
              <dl>
                <div><dt>Client type</dt><dd>{selectedClient.clientType}</dd></div>
                <div><dt>Business</dt><dd>{selectedClient.businessName || "—"}</dd></div>
                <div><dt>Status</dt><dd><AdminStatusBadge status={selectedClient.status} tone={statusTone[selectedClient.status] || "neutral"} /></dd></div>
              </dl>
            </div>
            <div className="detail-block">
              <h3>Contact</h3>
              <dl>
                <div><dt>Email</dt><dd>{selectedClient.email || "Not provided"}</dd></div>
                <div><dt>Phone</dt><dd>{selectedClient.phone || "Not provided"}</dd></div>
                <div><dt>Representative</dt><dd>{selectedClient.representative || "—"}</dd></div>
              </dl>
            </div>
            <div className="detail-block">
              <h3>Operational snapshot</h3>
              <dl>
                <div><dt>Next action</dt><dd>{selectedClient.nextAction || "Review"}</dd></div>
                <div><dt>Last activity</dt><dd>{formatDate(selectedClient.lastActivity)}</dd></div>
                <div><dt>Portal status</dt><dd>{selectedClient.portalStatus || "Active"}</dd></div>
              </dl>
            </div>
          </div>

          {isClientEditorOpen && clientDraft ? (
            <div className="detail-block client-detail-editor">
              <h3>Client record details</h3>
              <div className="client-detail-editor-grid">
                <label>
                  <span>Display name</span>
                  <input type="text" value={clientDraft.displayName || ""} onChange={(event) => setClientDraft((current) => ({ ...current, displayName: event.target.value }))} />
                </label>
                <label>
                  <span>Business name</span>
                  <input type="text" value={clientDraft.businessName || ""} onChange={(event) => setClientDraft((current) => ({ ...current, businessName: event.target.value }))} />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={clientDraft.email || ""} onChange={(event) => setClientDraft((current) => ({ ...current, email: event.target.value }))} />
                </label>
                <label>
                  <span>Phone</span>
                  <input type="tel" value={clientDraft.phone || ""} onChange={(event) => setClientDraft((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label>
                  <span>Preferred contact method</span>
                  <select value={clientDraft.preferredContactMethod || "Email"} onChange={(event) => setClientDraft((current) => ({ ...current, preferredContactMethod: event.target.value }))}>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="Text">Text</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={clientDraft.status || "Active"} onChange={(event) => setClientDraft((current) => ({ ...current, status: event.target.value }))}>
                    {['Prospect', 'Onboarding', 'Active', 'Waiting on Client', 'Paused', 'Completed', 'Inactive'].map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Portal status</span>
                  <select value={clientDraft.portalStatus || "Active"} onChange={(event) => setClientDraft((current) => ({ ...current, portalStatus: event.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Invited">Invited</option>
                    <option value="Paused">Paused</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  <span>Representative</span>
                  <input type="text" value={clientDraft.representative || ""} onChange={(event) => setClientDraft((current) => ({ ...current, representative: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Authorized users</span>
                  <input type="text" value={clientDraft.authorizedUsers || ""} onChange={(event) => setClientDraft((current) => ({ ...current, authorizedUsers: event.target.value }))} placeholder="Comma-separated names" />
                </label>
                <label className="full-span">
                  <span>Next action</span>
                  <input type="text" value={clientDraft.nextAction || ""} onChange={(event) => setClientDraft((current) => ({ ...current, nextAction: event.target.value }))} />
                </label>
              </div>
              <div className="admin-header-actions">
                <button type="button" className="secondary-button" onClick={() => setIsClientEditorOpen(false)}>Cancel</button>
                <button type="button" className="primary-button" onClick={saveClientProfile}>Save changes</button>
              </div>
            </div>
          ) : null}

          <AdminTabs
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "services", label: "Services" },
              { id: "tasks", label: "Tasks" },
              { id: "documents", label: "Documents" },
              { id: "appointments", label: "Appointments" },
              { id: "billing", label: "Billing" },
              { id: "notes", label: "Internal Notes" },
              { id: "activity", label: "Activity" },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "overview" ? (
            <div className="admin-detail-grid">
              <div className="detail-block">
                <h3>Overview</h3>
                <dl>
                  <div><dt>Client name</dt><dd>{selectedClient.displayName}</dd></div>
                  <div><dt>Business name</dt><dd>{selectedClient.businessName || "Not applicable"}</dd></div>
                  <div><dt>Type</dt><dd>{selectedClient.clientType}</dd></div>
                  <div><dt>Status</dt><dd>{selectedClient.status}</dd></div>
                  <div><dt>Preferred contact method</dt><dd>{selectedClient.preferredContactMethod || "Email"}</dd></div>
                </dl>
              </div>
              <div className="detail-block">
                <h3>Business info</h3>
                <dl>
                  <div><dt>Authorized users</dt><dd>{selectedClient.authorizedUsers?.join(", ") || "None listed"}</dd></div>
                  <div><dt>Primary contact</dt><dd>{selectedClient.representative || "—"}</dd></div>
                  <div><dt>Portal access</dt><dd>{selectedClient.portalStatus || "Active"}</dd></div>
                  <div><dt>Active services</dt><dd>{selectedClient.activeServices || 0}</dd></div>
                </dl>
              </div>
              <div className="detail-block full-width">
                <h3>Service engagements</h3>
                {clientEngagements.length ? (
                  <ul className="detail-list">
                    {clientEngagements.map((engagement) => (
                      <li key={engagement.id}>
                        <div className="note-header">
                          <strong>{engagement.serviceName}</strong>
                          <span>{engagement.status}</span>
                        </div>
                        <p>{engagement.summary}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No active engagements on file.</p>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === "services" ? (
            <div className="detail-block">
              <h3>Active services</h3>
              {clientEngagements.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Stage</th>
                        <th>Assigned To</th>
                        <th>Target Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientEngagements.map((engagement) => (
                        <tr key={engagement.id}>
                          <td>{engagement.serviceName}</td>
                          <td><AdminStatusBadge status={engagement.status} tone={statusTone[engagement.status] || "neutral"} /></td>
                          <td>{engagement.currentStage}</td>
                          <td>{engagement.assignedTo}</td>
                          <td>{formatDate(engagement.targetDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No service engagements are associated with this client.</p>
              )}
            </div>
          ) : null}

          {activeTab === "tasks" ? (
            <div className="detail-block">
              <h3>Client task queue</h3>
              {clientTasks.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Owner</th>
                        <th>Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientTasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td>{task.assignedTo}</td>
                          <td>{formatDate(task.dueDate)}</td>
                          <td><AdminStatusBadge status={task.status} tone={statusTone[task.status] || "neutral"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No active tasks for this client.</p>
              )}
            </div>
          ) : null}

          {activeTab === "documents" ? (
            <div className="detail-block">
              <h3>Document requests</h3>
              {clientDocuments.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Assigned Reviewer</th>
                        <th>Service</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientDocuments.map((document) => (
                        <tr key={document.id}>
                          <td>{document.name}</td>
                          <td><AdminStatusBadge status={document.status} tone={statusTone[document.status] || "neutral"} /></td>
                          <td>{document.assignedReviewer || "—"}</td>
                          <td>{document.serviceName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No documents are associated with this client.</p>
              )}
            </div>
          ) : null}

          {activeTab === "appointments" ? (
            <div className="detail-block">
              <h3>Appointment history</h3>
              {clientAppointments.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td>{appointment.title}</td>
                          <td>{appointment.type}</td>
                          <td>{formatDate(appointment.date)}</td>
                          <td>{appointment.time || "—"}</td>
                          <td><AdminStatusBadge status={appointment.status} tone={statusTone[appointment.status] || "neutral"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No appointments have been scheduled for this client yet.</p>
              )}
            </div>
          ) : null}

          {activeTab === "billing" ? (
            <div className="detail-block">
              <h3>Billing activity</h3>
              {clientInvoices.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>{invoice.id}</td>
                          <td>{formatCurrency(invoice.amount)}</td>
                          <td><AdminStatusBadge status={invoice.status} tone={statusTone[invoice.status] || "neutral"} /></td>
                          <td>{formatDate(invoice.dueAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No billing records are attached to this client.</p>
              )}
            </div>
          ) : null}

          {activeTab === "notes" ? (
            <div className="detail-block">
              <h3>Internal notes</h3>
              {clientNotes.length ? (
                <ul className="detail-list">
                  {clientNotes.map((note) => (
                    <li key={note.id}>
                      <div className="note-header">
                        <strong>{note.author}</strong>
                        <span>{formatDate(note.timestamp)}</span>
                      </div>
                      <p>{note.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No internal notes for this client yet.</p>
              )}
              <label className="admin-filter admin-note-entry">
                <span>Add internal note</span>
                <textarea rows="4" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add an internal note for the team" />
              </label>
              <button type="button" className="primary-button" onClick={handleAddNote}>Save note</button>
            </div>
          ) : null}

          {activeTab === "activity" ? (
            <div className="detail-block">
              <h3>Recent client activity</h3>
              {clientActivity.length ? (
                <ul className="detail-list">
                  {clientActivity.map((entry) => (
                    <li key={entry.id}>
                      <div className="note-header">
                        <strong>{entry.actorName}</strong>
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                      <p>{entry.summary}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No activity recorded for this client.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (selectedClient) {
    return renderClientDetail();
  }

  return (
    <div className="admin-module">
      <AdminPageHeader
        eyebrow="Client management"
        title="Client management"
        summary="Track client relationships, service work, upcoming dates, and operational follow-up."
        actions={[{ label: "+ Add Client", primary: true, onClick: () => setIsAddClientOpen(true) }]}
      />
      {clientSavedMessage ? <div className="admin-toast success">{clientSavedMessage}</div> : null}
      {clientFormError ? <div className="admin-toast error">{clientFormError}</div> : null}
      <AdminMetrics items={summary.map((item) => ({ label: item.label, value: item.value, hint: "Current" }))} />
      <AdminToolbar
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: ["All", "Prospect", "Onboarding", "Active", "Waiting on Client", "Paused", "Completed", "Inactive"].map((option) => ({ value: option, label: option })),
          },
          {
            label: "Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: ["All", "Business", "Individual"].map((option) => ({ value: option, label: option })),
          },
          {
            label: "Attention",
            value: attentionFilter,
            onChange: setAttentionFilter,
            options: ["All", "Needs Attention"].map((option) => ({ value: option, label: option })),
          },
        ]}
      />

      <AdminSection title="Client roster">
        {filteredRows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Primary Contact</th>
                  <th>Active Services</th>
                  <th>Status</th>
                  <th>Next Action</th>
                  <th>Upcoming Date</th>
                  <th>Billing Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link className="client-record-link" to={`/admin/clients/${client.id}`}>
                        {client.displayName}
                      </Link>
                    </td>
                    <td>{client.clientType}</td>
                    <td>{client.representative || client.email || "—"}</td>
                    <td>{client.activeServices || 0}</td>
                    <td><AdminStatusBadge status={client.status} tone={statusTone[client.status] || "neutral"} /></td>
                    <td>{client.nextAction || "Review"}</td>
                    <td>{client.lastActivity ? formatDate(client.lastActivity) : "—"}</td>
                    <td>{client.portalStatus || "Active"}</td>
                    <td>
                      <div className="table-actions">
                        <Link className="link-button" to={`/admin/clients/${client.id}`}>View</Link>
                        <button type="button" className="link-button" onClick={() => navigate(`/admin/clients/${client.id}`)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="No clients match the selected filters." description="Try a broader search or add a new client record." actionLabel="Add Client" onAction={() => setIsAddClientOpen(true)} />
        )}
      </AdminSection>

      {isAddClientOpen ? (
        <div className="admin-detail-overlay" onClick={() => setIsAddClientOpen(false)}>
          <aside className="admin-detail-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="admin-detail-header">
              <h2>Add client</h2>
              <button type="button" className="secondary-button" onClick={() => setIsAddClientOpen(false)}>Close</button>
            </div>
            <div className="admin-detail-body">
              <div className="client-detail-editor-grid">
                <label>
                  <span>Client type</span>
                  <select value={newClientForm.clientType} onChange={(event) => setNewClientForm((current) => ({ ...current, clientType: event.target.value }))}>
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                  </select>
                </label>
                <label>
                  <span>{newClientForm.clientType === "Business" ? "Business name" : "Client name"}</span>
                  <input type="text" value={newClientForm.displayName} onChange={(event) => setNewClientForm((current) => ({ ...current, displayName: event.target.value }))} />
                </label>
                {newClientForm.clientType === "Business" ? (
                  <>
                    <label>
                      <span>Legal business name</span>
                      <input type="text" value={newClientForm.legalBusinessName} onChange={(event) => setNewClientForm((current) => ({ ...current, legalBusinessName: event.target.value }))} />
                    </label>
                    <label>
                      <span>DBA / trade name</span>
                      <input type="text" value={newClientForm.dbaName} onChange={(event) => setNewClientForm((current) => ({ ...current, dbaName: event.target.value }))} />
                    </label>
                    <label>
                      <span>Business email</span>
                      <input type="email" value={newClientForm.businessEmail} onChange={(event) => setNewClientForm((current) => ({ ...current, businessEmail: event.target.value }))} />
                    </label>
                    <label>
                      <span>Business phone</span>
                      <input type="tel" value={newClientForm.businessPhone} onChange={(event) => setNewClientForm((current) => ({ ...current, businessPhone: event.target.value }))} />
                    </label>
                    <label className="full-span">
                      <span>Business address</span>
                      <input type="text" value={newClientForm.businessAddress} onChange={(event) => setNewClientForm((current) => ({ ...current, businessAddress: event.target.value }))} />
                    </label>
                  </>
                ) : null}
                <label>
                  <span>Email</span>
                  <input type="email" value={newClientForm.email} onChange={(event) => setNewClientForm((current) => ({ ...current, email: event.target.value }))} />
                </label>
                <label>
                  <span>Phone</span>
                  <input type="tel" value={newClientForm.phone} onChange={(event) => setNewClientForm((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label>
                  <span>Preferred contact method</span>
                  <select value={newClientForm.preferredContactMethod} onChange={(event) => setNewClientForm((current) => ({ ...current, preferredContactMethod: event.target.value }))}>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="Text">Text</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={newClientForm.status} onChange={(event) => setNewClientForm((current) => ({ ...current, status: event.target.value }))}>
                    {['Prospect', 'Onboarding', 'Active', 'Waiting on Client', 'Paused', 'Completed', 'Inactive'].map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Portal status</span>
                  <select value={newClientForm.portalStatus} onChange={(event) => setNewClientForm((current) => ({ ...current, portalStatus: event.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Invited">Invited</option>
                    <option value="Paused">Paused</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  <span>Primary representative</span>
                  <input type="text" value={newClientForm.representative} onChange={(event) => setNewClientForm((current) => ({ ...current, representative: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Authorized representatives</span>
                  <input type="text" value={newClientForm.authorizedUsers} onChange={(event) => setNewClientForm((current) => ({ ...current, authorizedUsers: event.target.value }))} placeholder="Comma-separated names" />
                </label>
                <label className="full-span">
                  <span>Notes</span>
                  <textarea rows="3" value={newClientForm.notes} onChange={(event) => setNewClientForm((current) => ({ ...current, notes: event.target.value }))} />
                </label>
              </div>
              {clientFormError ? <div className="admin-toast error">{clientFormError}</div> : null}
              <div className="admin-header-actions">
                <button type="button" className="secondary-button" onClick={() => setIsAddClientOpen(false)}>Cancel</button>
                <button type="button" className="primary-button" onClick={handleCreateClient}>Create client</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function ServiceManagementPage() {
  const snapshot = adminStore.getSnapshot();
  const [tab, setTab] = useState("catalog");
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [billingFilter, setBillingFilter] = useState("All");
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState(createEmptyServiceForm());
  const [serviceError, setServiceError] = useState("");
  const [serviceSavedMessage, setServiceSavedMessage] = useState("");
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceDraft, setServiceDraft] = useState(null);

  const catalog = (snapshot.services || []).map((service) => ({
    ...service,
    activeEngagements: snapshot.engagements.filter((engagement) => engagement.serviceName === service.serviceName || engagement.serviceCode === service.serviceCode).length,
    addOnCount: Array.isArray(service.addOns) ? service.addOns.length : 0,
  }));

  const filteredCatalog = useMemo(() => {
    return catalog.filter((service) => {
      const text = `${service.serviceCode} ${service.serviceName} ${service.category || ""} ${service.shortDescription || ""}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesAudience = audienceFilter === "All" || service.audience === audienceFilter;
      const matchesStatus = statusFilter === "All" || service.status === statusFilter;
      const matchesBilling = billingFilter === "All" || service.billingType === billingFilter;
      return matchesSearch && matchesAudience && matchesStatus && matchesBilling;
    });
  }, [catalog, search, audienceFilter, statusFilter, billingFilter]);

  const openServiceEditor = (service) => {
    setEditingServiceId(service.id);
    setServiceDraft({
      ...service,
      defaultDuration: String(service.defaultDuration || "60"),
      defaultPrice: service.defaultPrice == null ? "" : String(service.defaultPrice),
      defaultDepositAmount: service.defaultDepositAmount == null ? "" : String(service.defaultDepositAmount),
      minimumCharge: service.minimumCharge == null ? "" : String(service.minimumCharge),
      addOns: Array.isArray(service.addOns) ? service.addOns.map((addOn) => ({
        ...addOn,
        defaultPrice: addOn.defaultPrice == null ? "" : String(addOn.defaultPrice),
      })) : [],
    });
  };

  const saveServiceForm = () => {
    try {
      const payload = {
        ...serviceForm,
        defaultDuration: Number(serviceForm.defaultDuration || 0),
        defaultPrice: serviceForm.billingType === "Custom / Scope of Work" ? null : Number(serviceForm.defaultPrice || 0),
        defaultDepositAmount: serviceForm.defaultDepositAmount ? Number(serviceForm.defaultDepositAmount) : null,
        minimumCharge: serviceForm.minimumCharge ? Number(serviceForm.minimumCharge) : null,
        addOns: parseAddOnInput(serviceForm.addOns),
      };

      const created = adminStore.createService(payload);
      setServiceSavedMessage(`Service added: ${created.serviceName}`);
      setServiceError("");
      setIsNewServiceOpen(false);
      setServiceForm(createEmptyServiceForm());
    } catch (error) {
      setServiceError(error.message || "Unable to create this service.");
      setServiceSavedMessage("");
    }
  };

  const saveEditedService = () => {
    if (!editingServiceId || !serviceDraft) return;

    const payload = {
      ...serviceDraft,
      defaultDuration: Number(serviceDraft.defaultDuration || 0),
      defaultPrice: serviceDraft.billingType === "Custom / Scope of Work" ? null : Number(serviceDraft.defaultPrice || 0),
      defaultDepositAmount: serviceDraft.defaultDepositAmount ? Number(serviceDraft.defaultDepositAmount) : null,
      minimumCharge: serviceDraft.minimumCharge ? Number(serviceDraft.minimumCharge) : null,
      addOns: Array.isArray(serviceDraft.addOns) ? serviceDraft.addOns.map((addOn) => ({
        ...addOn,
        defaultPrice: addOn.defaultPrice == null || addOn.defaultPrice === "" ? null : Number(addOn.defaultPrice),
        active: addOn.active !== false,
      })) : [],
    };

    adminStore.updateService(editingServiceId, payload);
    setServiceSavedMessage(`Service updated: ${payload.serviceName}`);
    setServiceError("");
    setEditingServiceId(null);
    setServiceDraft(null);
  };

  const renderCatalog = () => (
    <>
      <div className="admin-toolbar">
        <label className="admin-search">
          <span>Search</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search service catalog" />
        </label>
        <div className="admin-filter-row">
          <label className="admin-filter">
            <span>Audience</span>
            <select value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)}>
              {['All', 'Individual', 'Business', 'Both'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="admin-filter">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {['All', 'Active', 'Inactive', 'Planned', 'Archived'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="admin-filter">
            <span>Billing</span>
            <select value={billingFilter} onChange={(event) => setBillingFilter(event.target.value)}>
              {['All', 'Fixed Fee', 'Hourly', 'Per Appointment', 'Per Filing / Per Return', 'Project-Based', 'Retainer', 'Recurring Monthly', 'Recurring Quarterly', 'Recurring Annual', 'Custom / Scope of Work'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Service Code</th>
              <th>Service</th>
              <th>Audience</th>
              <th>Status</th>
              <th>Default Duration</th>
              <th>Billing Type</th>
              <th>Default Price</th>
              <th>Add-ons</th>
              <th>Active Engagements</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCatalog.map((item) => (
              <tr key={item.id}>
                <td>{item.serviceCode}</td>
                <td>{item.serviceName}</td>
                <td>{item.audience}</td>
                <td><AdminStatusBadge status={item.status} tone={statusTone[item.status] || "neutral"} /></td>
                <td>{item.defaultDuration ? `${item.defaultDuration} min` : "—"}</td>
                <td>{item.billingType}</td>
                <td>{item.defaultPrice == null ? "Custom / SOW" : formatCurrency(item.defaultPrice)}</td>
                <td>{Array.isArray(item.addOns) ? item.addOns.length : 0}</td>
                <td>{item.activeEngagements}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="link-button" onClick={() => openServiceEditor(item)}>View</button>
                    <button type="button" className="link-button" onClick={() => openServiceEditor(item)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {serviceSavedMessage ? <div className="admin-toast success">{serviceSavedMessage}</div> : null}
      {serviceError ? <div className="admin-toast error">{serviceError}</div> : null}
    </>
  );

  const renderEngagements = () => (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Service</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>Target Date</th>
            <th>Owner</th>
            <th>Open Tasks</th>
            <th>Billing Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.engagements.map((engagement) => {
            const client = snapshot.clients.find((entry) => entry.id === engagement.clientId);
            return (
              <tr key={engagement.id}>
                <td>{client?.displayName || "Unknown client"}</td>
                <td>{engagement.serviceName}</td>
                <td><AdminStatusBadge status={engagement.status} tone={statusTone[engagement.status] || "neutral"} /></td>
                <td>{formatDate(engagement.startedAt)}</td>
                <td>{formatDate(engagement.targetDate)}</td>
                <td>{engagement.assignedTo}</td>
                <td>{snapshot.tasks.filter((task) => task.engagementId === engagement.id && task.status !== "Completed").length}</td>
                <td>{engagement.status === "Completed" ? "Paid" : "Open"}</td>
                <td><div className="table-actions"><button type="button" className="link-button">View</button></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="admin-module">
      <AdminPageHeader eyebrow="Service management" title="Service management" summary="Review the service catalog and active client engagements across the delivery pipeline." actions={[{ label: "+ New Service", primary: true, onClick: () => setIsNewServiceOpen(true) }]} />
      <AdminTabs tabs={[{ id: "catalog", label: "Service Catalog" }, { id: "engagements", label: "Active Engagements" }]} activeTab={tab} onChange={setTab} />
      <AdminSection title={tab === "catalog" ? "Service catalog" : "Active engagements"}>
        {tab === "catalog" ? renderCatalog() : renderEngagements()}
      </AdminSection>

      {isNewServiceOpen ? (
        <div className="admin-detail-overlay" onClick={() => setIsNewServiceOpen(false)}>
          <aside className="admin-detail-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="admin-detail-header">
              <h2>Add service</h2>
              <button type="button" className="secondary-button" onClick={() => setIsNewServiceOpen(false)}>Close</button>
            </div>
            <div className="admin-detail-body">
              <div className="client-detail-editor-grid">
                <label>
                  <span>Service code</span>
                  <input type="text" value={serviceForm.serviceCode} onChange={(event) => setServiceForm((current) => ({ ...current, serviceCode: event.target.value }))} />
                </label>
                <label>
                  <span>Service name</span>
                  <input type="text" value={serviceForm.serviceName} onChange={(event) => setServiceForm((current) => ({ ...current, serviceName: event.target.value }))} />
                </label>
                <label>
                  <span>Audience</span>
                  <select value={serviceForm.audience} onChange={(event) => setServiceForm((current) => ({ ...current, audience: event.target.value }))}>
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Both">Both</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={serviceForm.status} onChange={(event) => setServiceForm((current) => ({ ...current, status: event.target.value }))}>
                    {['Active', 'Inactive', 'Planned', 'Archived'].map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Category</span>
                  <input type="text" value={serviceForm.category} onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value }))} />
                </label>
                <label>
                  <span>Default duration (minutes)</span>
                  <input type="number" min="15" step="15" value={serviceForm.defaultDuration} onChange={(event) => setServiceForm((current) => ({ ...current, defaultDuration: event.target.value }))} />
                </label>
                <label>
                  <span>Billing type</span>
                  <select value={serviceForm.billingType} onChange={(event) => setServiceForm((current) => ({ ...current, billingType: event.target.value }))}>
                    {['Fixed Fee', 'Hourly', 'Per Appointment', 'Per Filing / Per Return', 'Project-Based', 'Retainer', 'Recurring Monthly', 'Recurring Quarterly', 'Recurring Annual', 'Custom / Scope of Work'].map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Default price</span>
                  <input type="number" min="0" step="1" value={serviceForm.defaultPrice} disabled={serviceForm.billingType === 'Custom / Scope of Work'} onChange={(event) => setServiceForm((current) => ({ ...current, defaultPrice: event.target.value }))} />
                </label>
                <label>
                  <span>Currency</span>
                  <input type="text" value={serviceForm.currency} onChange={(event) => setServiceForm((current) => ({ ...current, currency: event.target.value }))} />
                </label>
                <label>
                  <span>Deposit required</span>
                  <select value={serviceForm.depositRequired ? "Yes" : "No"} onChange={(event) => setServiceForm((current) => ({ ...current, depositRequired: event.target.value === "Yes" }))}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </label>
                <label>
                  <span>Default deposit amount</span>
                  <input type="number" min="0" step="1" value={serviceForm.defaultDepositAmount} onChange={(event) => setServiceForm((current) => ({ ...current, defaultDepositAmount: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Short internal description</span>
                  <textarea rows="3" value={serviceForm.shortDescription} onChange={(event) => setServiceForm((current) => ({ ...current, shortDescription: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Default billing description</span>
                  <textarea rows="2" value={serviceForm.defaultBillingDescription} onChange={(event) => setServiceForm((current) => ({ ...current, defaultBillingDescription: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Internal pricing notes</span>
                  <textarea rows="2" value={serviceForm.internalPricingNotes} onChange={(event) => setServiceForm((current) => ({ ...current, internalPricingNotes: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Add-ons (one per line: code|name|price|notes)</span>
                  <textarea rows="4" value={serviceForm.addOns} onChange={(event) => setServiceForm((current) => ({ ...current, addOns: event.target.value }))} />
                </label>
              </div>
              {serviceError ? <div className="admin-toast error">{serviceError}</div> : null}
              <div className="admin-header-actions">
                <button type="button" className="secondary-button" onClick={() => setIsNewServiceOpen(false)}>Cancel</button>
                <button type="button" className="primary-button" onClick={saveServiceForm}>Create service</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {editingServiceId && serviceDraft ? (
        <div className="admin-detail-overlay" onClick={() => { setEditingServiceId(null); setServiceDraft(null); }}>
          <aside className="admin-detail-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="admin-detail-header">
              <h2>Edit service</h2>
              <button type="button" className="secondary-button" onClick={() => { setEditingServiceId(null); setServiceDraft(null); }}>Close</button>
            </div>
            <div className="admin-detail-body">
              <div className="client-detail-editor-grid">
                <label>
                  <span>Service code</span>
                  <input type="text" value={serviceDraft.serviceCode} readOnly />
                </label>
                <label>
                  <span>Service name</span>
                  <input type="text" value={serviceDraft.serviceName} onChange={(event) => setServiceDraft((current) => ({ ...current, serviceName: event.target.value }))} />
                </label>
                <label>
                  <span>Audience</span>
                  <select value={serviceDraft.audience} onChange={(event) => setServiceDraft((current) => ({ ...current, audience: event.target.value }))}>
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Both">Both</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={serviceDraft.status} onChange={(event) => setServiceDraft((current) => ({ ...current, status: event.target.value }))}>
                    {['Active', 'Inactive', 'Planned', 'Archived'].map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Duration</span>
                  <input type="number" min="15" step="15" value={serviceDraft.defaultDuration} onChange={(event) => setServiceDraft((current) => ({ ...current, defaultDuration: event.target.value }))} />
                </label>
                <label>
                  <span>Billing type</span>
                  <select value={serviceDraft.billingType} onChange={(event) => setServiceDraft((current) => ({ ...current, billingType: event.target.value }))}>
                    {['Fixed Fee', 'Hourly', 'Per Appointment', 'Per Filing / Per Return', 'Project-Based', 'Retainer', 'Recurring Monthly', 'Recurring Quarterly', 'Recurring Annual', 'Custom / Scope of Work'].map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Default price</span>
                  <input type="number" min="0" step="1" value={serviceDraft.defaultPrice} disabled={serviceDraft.billingType === 'Custom / Scope of Work'} onChange={(event) => setServiceDraft((current) => ({ ...current, defaultPrice: event.target.value }))} />
                </label>
                <label>
                  <span>Currency</span>
                  <input type="text" value={serviceDraft.currency || "USD"} onChange={(event) => setServiceDraft((current) => ({ ...current, currency: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Description</span>
                  <textarea rows="3" value={serviceDraft.shortDescription || ""} onChange={(event) => setServiceDraft((current) => ({ ...current, shortDescription: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Billing description</span>
                  <textarea rows="2" value={serviceDraft.defaultBillingDescription || ""} onChange={(event) => setServiceDraft((current) => ({ ...current, defaultBillingDescription: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Internal notes</span>
                  <textarea rows="2" value={serviceDraft.internalPricingNotes || ""} onChange={(event) => setServiceDraft((current) => ({ ...current, internalPricingNotes: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Add-ons</span>
                  <textarea rows="4" value={(serviceDraft.addOns || []).map((addOn) => `${addOn.addOnCode || addOn.addOnName}|${addOn.addOnName || addOn.addOnCode}|${addOn.defaultPrice ?? ""}|${addOn.internalNotes || ""}`).join("\n")} onChange={(event) => setServiceDraft((current) => ({ ...current, addOns: parseAddOnInput(event.target.value) }))} />
                </label>
              </div>
              <div className="admin-header-actions">
                <button type="button" className="secondary-button" onClick={() => { setEditingServiceId(null); setServiceDraft(null); }}>Cancel</button>
                <button type="button" className="primary-button" onClick={saveEditedService}>Save changes</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function TaskManagementPage() {
  const snapshot = adminStore.getSnapshot();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [rows, setRows] = useState(snapshot.tasks);

  const filteredRows = useMemo(() => {
    return rows.filter((task) => {
      const target = `${task.title} ${task.clientId || ""} ${task.serviceName || ""} ${task.assignedTo || ""}`.toLowerCase();
      const matchesSearch = !search || target.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      const matchesService = serviceFilter === "All" || task.serviceName === serviceFilter;
      const matchesOwner = ownerFilter === "All" || task.assignedTo === ownerFilter;
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesService && matchesOwner && matchesPriority;
    });
  }, [rows, search, statusFilter, serviceFilter, ownerFilter, priorityFilter]);

  const serviceOptions = ["All", ...Array.from(new Set(rows.map((task) => task.serviceName).filter(Boolean)))];
  const ownerOptions = ["All", ...Array.from(new Set(rows.map((task) => task.assignedTo).filter(Boolean)))];

  const updateStatus = (taskId, nextStatus) => {
    setRows((current) => current.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)));
  };

  return (
    <div className="admin-module">
      <AdminPageHeader eyebrow="Task management" title="Task management" summary="Manage action items, service dependencies, and completion status across client work." actions={[{ label: "+ New Task", primary: true, onClick: () => null }]} />
      <AdminToolbar
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { label: "Status", value: statusFilter, onChange: setStatusFilter, options: ["All", ...taskStatuses].map((option) => ({ value: option, label: option })) },
          { label: "Service", value: serviceFilter, onChange: setServiceFilter, options: serviceOptions.map((option) => ({ value: option, label: option })) },
          { label: "Owner", value: ownerFilter, onChange: setOwnerFilter, options: ownerOptions.map((option) => ({ value: option, label: option })) },
          { label: "Priority", value: priorityFilter, onChange: setPriorityFilter, options: ["All", "Low", "Normal", "High", "Urgent"].map((option) => ({ value: option, label: option })) },
        ]}
      />
      <AdminSection title="Work queue">
        {filteredRows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Owner</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Dependency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{snapshot.clients.find((client) => client.id === task.clientId)?.displayName || "—"}</td>
                    <td>{task.serviceName}</td>
                    <td>{task.assignedTo}</td>
                    <td>{task.priority}</td>
                    <td>{formatDate(task.dueDate)}</td>
                    <td><AdminStatusBadge status={task.status} tone={statusTone[task.status] || "neutral"} /></td>
                    <td>{task.category || "—"}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button">Edit</button>
                        <select className="inline-select" value={task.status} onChange={(event) => updateStatus(task.id, event.target.value)}>
                          {taskStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="No tasks due in this view." description="Adjust the filters or create a new work item." actionLabel="New Task" onAction={() => null} />
        )}
      </AdminSection>
    </div>
  );
}

function DocumentManagementPage() {
  const snapshot = adminStore.getSnapshot();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState("All");

  const rows = snapshot.documents;

  const filteredRows = useMemo(() => {
    return rows.filter((document) => {
      const target = `${document.name} ${document.serviceName || ""} ${document.assignedReviewer || ""}`.toLowerCase();
      const matchesSearch = !search || target.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || document.status === statusFilter;
      const matchesClient = clientFilter === "All" || snapshot.clients.find((client) => client.id === document.clientId)?.displayName === clientFilter;
      const matchesService = serviceFilter === "All" || document.serviceName === serviceFilter;
      const matchesVisibility = visibilityFilter === "All" || document.visibility === visibilityFilter;
      return matchesSearch && matchesStatus && matchesClient && matchesService && matchesVisibility;
    });
  }, [rows, search, statusFilter, clientFilter, serviceFilter, visibilityFilter]);

  const clientOptions = ["All", ...Array.from(new Set(snapshot.clients.map((client) => client.displayName)))];
  const serviceOptions = ["All", ...Array.from(new Set(rows.map((document) => document.serviceName).filter(Boolean)))];

  return (
    <div className="admin-module">
      <AdminPageHeader eyebrow="Document review" title="Document control" summary="Track requested records, received files, active review work, and record visibility." actions={[{ label: "+ Register Document", primary: true, onClick: () => null }, { label: "+ Request Document", onClick: () => null }]} />
      <AdminToolbar
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { label: "Status", value: statusFilter, onChange: setStatusFilter, options: ["All", ...documentStatuses].map((option) => ({ value: option, label: option })) },
          { label: "Client", value: clientFilter, onChange: setClientFilter, options: clientOptions.map((option) => ({ value: option, label: option })) },
          { label: "Service", value: serviceFilter, onChange: setServiceFilter, options: serviceOptions.map((option) => ({ value: option, label: option })) },
          { label: "Visibility", value: visibilityFilter, onChange: setVisibilityFilter, options: ["All", "Internal Only", "Client Visible"].map((option) => ({ value: option, label: option })) },
        ]}
      />
      <AdminSection title="Document records">
        {filteredRows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Requested Date</th>
                  <th>Received Date</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Next Action</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((document) => (
                  <tr key={document.id}>
                    <td>{document.name}</td>
                    <td>{snapshot.clients.find((client) => client.id === document.clientId)?.displayName || "—"}</td>
                    <td>{document.serviceName}</td>
                    <td>{document.category}</td>
                    <td>{formatDate(document.requestedAt)}</td>
                    <td>{formatDate(document.receivedAt)}</td>
                    <td><AdminStatusBadge status={document.status} tone={statusTone[document.status] || "neutral"} /></td>
                    <td>{document.visibility || "Internal Only"}</td>
                    <td>{document.status === "Requested" ? "Follow up" : "Review"}</td>
                    <td><div className="table-actions"><button type="button" className="link-button">View</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="No documents are awaiting review." description="There are no records matching the current controls." actionLabel="Register Document" onAction={() => null} />
        )}
      </AdminSection>
    </div>
  );
}

function AppointmentManagementPage() {
  const snapshot = adminStore.getSnapshot();
  const [appointments, setAppointments] = useState(snapshot.appointments);
  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(() => {
    const baseDate = snapshot.appointments.find((appointment) => appointment.date) || {
      date: new Date().toISOString().slice(0, 10),
    };
    return new Date(`${baseDate.date}T12:00:00`);
  });
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState("next30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [prepFilter, setPrepFilter] = useState("All");
  const [followUpFilter, setFollowUpFilter] = useState("All");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(snapshot.appointments[0]?.id || null);
  const [formMode, setFormMode] = useState("create");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Client requested");

  const clientOptions = ["All", ...Array.from(new Set(snapshot.clients.map((client) => client.displayName)))];
  const serviceOptions = ["All", ...Array.from(new Set(appointments.map((appointment) => appointment.serviceName).filter(Boolean)))];
  const typeOptions = ["All", ...Array.from(new Set(appointments.map((appointment) => appointment.type).filter(Boolean)))];
  const ownerOptions = ["All", ...Array.from(new Set(appointments.map((appointment) => appointment.assignedTo || "Owner / Administrator").filter(Boolean)))];
  const locationOptions = ["All", ...Array.from(new Set(appointments.map((appointment) => appointment.deliveryMethod || "Virtual").filter(Boolean)))];

  const toDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const addDays = (date, amount) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + amount);
    return nextDate;
  };

  const cloneDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const toTimeInputValue = (value) => {
    const match = (value || "9:00 AM").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
      const fallback = (value || "09:00").split(":");
      const hour = Number(fallback[0]) || 9;
      const minutes = Number(fallback[1]) || 0;
      return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    const [, rawHour, rawMinutes, meridiem] = match;
    let hour = Number(rawHour);
    const minutes = rawMinutes;

    if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;
    if (meridiem.toUpperCase() === "PM" && hour < 12) hour += 12;

    return `${String(hour).padStart(2, "0")}:${minutes}`;
  };

  const formatDisplayTime = (value) => {
    const normalized = toTimeInputValue(value);
    const [hourString, minuteString] = normalized.split(":");
    let hour = Number(hourString);
    const minutes = Number(minuteString);
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const parseTimeValue = (value) => {
    const normalized = toTimeInputValue(value);
    const [hourString, minuteString] = normalized.split(":");
    return Number(hourString) * 60 + Number(minuteString);
  };

  const getStartOfWeek = (date) => {
    const nextDate = cloneDate(date);
    const day = nextDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    nextDate.setDate(nextDate.getDate() + diff);
    return nextDate;
  };

  const getMonthDays = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const leading = start.getDay() === 0 ? 6 : start.getDay() - 1;
    const totalCells = Math.ceil((leading + end.getDate()) / 7) * 7;
    const cells = [];
    for (let index = 0; index < totalCells; index += 1) {
      const cellDate = addDays(start, index - leading);
      cells.push(cellDate);
    }
    return cells;
  };

  const getDateRange = (mode, date) => {
    if (mode === "month") {
      return {
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    }
    if (mode === "week") {
      const start = getStartOfWeek(date);
      return {
        start,
        end: addDays(start, 6),
      };
    }
    if (mode === "day") {
      return {
        start: cloneDate(date),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999),
      };
    }
    return {
      start: cloneDate(date),
      end: addDays(cloneDate(date), 30),
    };
  };

  const getTimeframeRange = () => {
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (timeframe === "today") {
      return { start: normalizedToday, end: addDays(normalizedToday, 0) };
    }
    if (timeframe === "tomorrow") {
      const start = addDays(normalizedToday, 1);
      return { start, end: addDays(start, 0) };
    }
    if (timeframe === "week") {
      return { start: getStartOfWeek(normalizedToday), end: addDays(getStartOfWeek(normalizedToday), 6) };
    }
    if (timeframe === "next7") {
      return { start: normalizedToday, end: addDays(normalizedToday, 6) };
    }
    if (timeframe === "month") {
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999) };
    }
    if (timeframe === "next30") {
      return { start: normalizedToday, end: addDays(normalizedToday, 29) };
    }
    if (timeframe === "past") {
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: addDays(normalizedToday, -1) };
    }
    if (timeframe === "custom") {
      return {
        start: customStart ? new Date(`${customStart}T00:00:00`) : null,
        end: customEnd ? new Date(`${customEnd}T23:59:59`) : null,
      };
    }
    return { start: null, end: null };
  };

  const matchesTimeframe = (appointmentDate) => {
    const date = new Date(`${appointmentDate}T12:00:00`);
    const { start, end } = getTimeframeRange();
    if (!start || !end) return true;
    return date >= start && date <= end;
  };

  const appointmentMatchesFilters = (appointment) => {
    const targetClient = snapshot.clients.find((client) => client.id === appointment.clientId)?.displayName || "";
    const target = `${appointment.title} ${appointment.type} ${appointment.serviceName || ""} ${targetClient} ${appointment.deliveryMethod || ""} ${appointment.assignedTo || "Owner / Administrator"}`.toLowerCase();
    const matchesSearch = !search || target.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || appointment.status === statusFilter;
    const matchesClient = clientFilter === "All" || targetClient === clientFilter;
    const matchesService = serviceFilter === "All" || appointment.serviceName === serviceFilter;
    const matchesType = typeFilter === "All" || appointment.type === typeFilter;
    const matchesOwner = ownerFilter === "All" || (appointment.assignedTo || "Owner / Administrator") === ownerFilter;
    const matchesLocation = locationFilter === "All" || (appointment.deliveryMethod || "Virtual") === locationFilter;
    const matchesPrep = prepFilter === "All" || (prepFilter === "Required" ? Boolean(appointment.needsPreparation) : !appointment.needsPreparation);
    const matchesFollowUp = followUpFilter === "All" || (followUpFilter === "Required" ? Boolean(appointment.followUpRequired) : !appointment.followUpRequired);
    const matchesInTimeframe = matchesTimeframe(appointment.date);
    return matchesSearch && matchesStatus && matchesClient && matchesService && matchesType && matchesOwner && matchesLocation && matchesPrep && matchesFollowUp && matchesInTimeframe;
  };

  const filteredAppointments = useMemo(() => {
    return [...appointments].filter(appointmentMatchesFilters).sort((left, right) => {
      const leftDate = new Date(`${left.date}T${toTimeInputValue(left.time || "09:00 AM")}`).getTime();
      const rightDate = new Date(`${right.date}T${toTimeInputValue(right.time || "09:00 AM")}`).getTime();
      return leftDate - rightDate;
    });
  }, [appointments, search, timeframe, customStart, customEnd, statusFilter, clientFilter, serviceFilter, typeFilter, ownerFilter, locationFilter, prepFilter, followUpFilter]);

  const selectedAppointment = filteredAppointments.find((appointment) => appointment.id === selectedAppointmentId) || appointments.find((appointment) => appointment.id === selectedAppointmentId) || filteredAppointments[0] || appointments[0] || null;

  const moveView = (direction) => {
    setCurrentDate((previousDate) => {
      const delta = viewMode === "month" ? 30 : viewMode === "week" ? 7 : 1;
      return addDays(previousDate, direction * delta);
    });
  };

  const visualDateLabel = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
    if (viewMode === "week") {
      const start = getStartOfWeek(currentDate);
      const end = addDays(start, 6);
      return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}–${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (viewMode === "day") {
      return currentDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    }
    return "Agenda";
  };

  const baseDraft = (appointment = null) => ({
    clientId: appointment?.clientId || "",
    type: appointment?.type || "Consultation",
    serviceName: appointment?.serviceName || "Business Advisory",
    date: appointment?.date || toDateString(currentDate),
    startTime: toTimeInputValue(appointment?.time || "10:00 AM"),
    duration: appointment?.duration || 60,
    location: appointment?.deliveryMethod || "Virtual",
    status: appointment?.status || "Scheduled",
    assignedTo: appointment?.assignedTo || "Owner / Administrator",
    notes: appointment?.notes || "",
    needsPreparation: Boolean(appointment?.needsPreparation),
    followUpRequired: Boolean(appointment?.followUpRequired),
  });

  const openDraftForm = (mode, appointment = null) => {
    setFormMode(mode);
    setIsFormOpen(true);
    setCancelReason("Client requested");
    setSelectedAppointmentId(appointment?.id || selectedAppointmentId);
    setDraftState(baseDraft(appointment));
  };

  const [draftState, setDraftState] = useState(baseDraft());

  const setDraftField = (field, value) => {
    setDraftState((current) => ({ ...current, [field]: value }));
  };

  const saveAppointment = () => {
    if (!draftState.clientId) {
      return;
    }

    if (formMode === "create") {
      const nextAppointment = {
        id: `appt-${Date.now()}`,
        clientId: draftState.clientId,
        title: `${snapshot.clients.find((client) => client.id === draftState.clientId)?.displayName || "Client"} ${draftState.type}`,
        type: draftState.type,
        serviceName: draftState.serviceName,
        date: draftState.date,
        time: formatDisplayTime(draftState.startTime),
        duration: Number(draftState.duration) || 60,
        deliveryMethod: draftState.location,
        status: draftState.status,
        assignedTo: draftState.assignedTo,
        notes: draftState.notes,
        needsPreparation: draftState.needsPreparation,
        followUpRequired: draftState.followUpRequired,
      };
      setAppointments((current) => [nextAppointment, ...current]);
      setSelectedAppointmentId(nextAppointment.id);
    }

    if (formMode === "edit") {
      setAppointments((current) => current.map((appointment) => (appointment.id === selectedAppointmentId ? {
        ...appointment,
        clientId: draftState.clientId,
        title: `${snapshot.clients.find((client) => client.id === draftState.clientId)?.displayName || "Client"} ${draftState.type}`,
        type: draftState.type,
        serviceName: draftState.serviceName,
        date: draftState.date,
        time: formatDisplayTime(draftState.startTime),
        duration: Number(draftState.duration) || 60,
        deliveryMethod: draftState.location,
        status: draftState.status,
        assignedTo: draftState.assignedTo,
        notes: draftState.notes,
        needsPreparation: draftState.needsPreparation,
        followUpRequired: draftState.followUpRequired,
      } : appointment)));
    }

    if (formMode === "reschedule") {
      setAppointments((current) => current.map((appointment) => (appointment.id === selectedAppointmentId ? {
        ...appointment,
        date: draftState.date,
        time: formatDisplayTime(draftState.startTime),
        duration: Number(draftState.duration) || 60,
        status: appointment.status === "Needs Reschedule" ? "Scheduled" : appointment.status,
      } : appointment)));
    }

    setIsFormOpen(false);
  };

  const confirmCancel = () => {
    setAppointments((current) => current.map((appointment) => (appointment.id === selectedAppointmentId ? {
      ...appointment,
      status: "Cancelled",
      cancellationReason: cancelReason,
    } : appointment)));
    setIsFormOpen(false);
  };

  const changeStatus = (appointmentId, nextStatus) => {
    setAppointments((current) => current.map((appointment) => (appointment.id === appointmentId ? { ...appointment, status: nextStatus } : appointment)));
  };

  const dailyAppointments = useMemo(() => {
    const map = new Map();
    filteredAppointments.forEach((appointment) => {
      const key = appointment.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(appointment);
    });
    return map;
  }, [filteredAppointments]);

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

  const setAppointmentFromCalendar = (date) => {
    setCurrentDate(date);
    setDraftState(baseDraft({ date: toDateString(date), time: "10:00 AM" }));
    setFormMode("create");
    setIsFormOpen(true);
  };

  const renderAppointmentCard = (appointment, compact = false) => (
    <button
      key={appointment.id}
      type="button"
      className={`calendar-event ${appointment.status.toLowerCase().replace(/\s+/g, "-")}${compact ? " compact" : ""}`}
      onClick={() => setSelectedAppointmentId(appointment.id)}
    >
      <span>{formatDisplayTime(appointment.time)}</span>
      <strong>{snapshot.clients.find((client) => client.id === appointment.clientId)?.displayName || "Client"}</strong>
      <small>{appointment.type || appointment.serviceName}</small>
    </button>
  );

  const detailAppointment = selectedAppointment || filteredAppointments[0] || appointments[0] || null;

  return (
    <div className="admin-module appointments-module">
      <AdminPageHeader
        eyebrow="Appointments"
        title="Appointments"
        summary="Internal scheduling workspace for consultations, follow-ups, service meetings, and operational calendar commitments."
        actions={[{ label: "+ Schedule Appointment", primary: true, onClick: () => openDraftForm("create") }]}
      />

      <AdminMetrics items={[
        { label: "Upcoming", value: appointments.filter((item) => item.status !== "Cancelled" && item.status !== "Completed" && new Date(`${item.date}T12:00:00`) >= new Date(new Date().setHours(0, 0, 0, 0))).length, hint: "Future schedule" },
        { label: "Confirmed", value: appointments.filter((item) => item.status === "Confirmed").length, hint: "Confirmed" },
        { label: "Needs Reschedule", value: appointments.filter((item) => item.status === "Needs Reschedule").length, hint: "Reschedule queue" },
        { label: "Follow-up Required", value: appointments.filter((item) => item.followUpRequired).length, hint: "Follow-up" },
      ]} />

      <div className="scheduler-toolbar">
        <div className="scheduler-nav-group">
          <button type="button" className="secondary-button" onClick={() => setTimeframe("today")}>Today</button>
          <button type="button" className="secondary-button" onClick={() => moveView(-1)}>Previous</button>
          <button type="button" className="secondary-button" onClick={() => moveView(1)}>Next</button>
        </div>

        <div className="scheduler-date-label">{visualDateLabel()}</div>

        <div className="scheduler-view-switcher">
          {['month', 'week', 'day', 'agenda'].map((mode) => (
            <button
              key={mode}
              type="button"
              className={viewMode === mode ? "primary-button" : "secondary-button"}
              onClick={() => setViewMode(mode)}
            >
              {mode === "agenda" ? "Agenda" : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <button type="button" className="primary-button" onClick={() => openDraftForm("create")}>+ Schedule Appointment</button>
      </div>

      <div className="scheduler-filter-row">
        <select value={timeframe} onChange={(event) => setTimeframe(event.target.value)}>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="week">This Week</option>
          <option value="next7">Next 7 Days</option>
          <option value="month">This Month</option>
          <option value="next30">Next 30 Days</option>
          <option value="past">Past Appointments</option>
          <option value="custom">Custom Range</option>
        </select>
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search appointments" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {['All', ...appointmentStatuses].map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
          {clientOptions.map((option) => (
            <option key={option} value={option}>{option === "All" ? "All clients" : option}</option>
          ))}
        </select>
        <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
          {serviceOptions.map((option) => (
            <option key={option} value={option}>{option === "All" ? "All services" : option}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          {typeOptions.map((option) => (
            <option key={option} value={option}>{option === "All" ? "All types" : option}</option>
          ))}
        </select>
        <button type="button" className="secondary-button" onClick={() => {
          setSearch("");
          setStatusFilter("All");
          setClientFilter("All");
          setServiceFilter("All");
          setTypeFilter("All");
          setOwnerFilter("All");
          setLocationFilter("All");
          setPrepFilter("All");
          setFollowUpFilter("All");
          setTimeframe("next30");
          setCustomStart("");
          setCustomEnd("");
        }}>Clear Filters</button>
        <button type="button" className="secondary-button" onClick={() => { setViewMode("week"); setCurrentDate(new Date()); }}>Reset View</button>
      </div>

      {timeframe === "custom" ? (
        <div className="scheduler-custom-range">
          <label>
            <span>Start Date</span>
            <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
          </label>
          <label>
            <span>End Date</span>
            <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
          </label>
        </div>
      ) : null}

      <div className="scheduler-layout">
        <div className="scheduler-main">
          {viewMode === "month" ? (
            <div className="calendar-grid month-grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                <div key={label} className="calendar-header-cell">{label}</div>
              ))}
              {monthDays.map((day) => {
                const dateKey = toDateString(day);
                const dayAppointments = dailyAppointments.get(dateKey) || [];
                return (
                  <button key={dateKey} type="button" className={`calendar-day ${day.getMonth() !== currentDate.getMonth() ? "muted" : ""}`} onClick={() => setAppointmentFromCalendar(day)}>
                    <div className="calendar-day-header">
                      <span>{day.getDate()}</span>
                    </div>
                    <div className="calendar-day-events">
                      {dayAppointments.slice(0, 2).map((appointment) => renderAppointmentCard(appointment, true))}
                      {dayAppointments.length > 2 ? <span className="more-events">+ {dayAppointments.length - 2} more</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {viewMode === "week" ? (
            <div className="week-schedule">
              <div className="week-time-column">
                <div className="week-time-header" />
                {Array.from({ length: 12 }, (_, index) => 8 + index).map((hour) => (
                  <div key={hour} className="time-row-label">{new Date(2026, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" })}</div>
                ))}
              </div>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => {
                const weekdayDate = addDays(getStartOfWeek(currentDate), index);
                const dateKey = toDateString(weekdayDate);
                const dayAppointments = (dailyAppointments.get(dateKey) || []).sort((left, right) => {
                  const leftTime = parseTimeValue(left.time || "09:00 AM");
                  const rightTime = parseTimeValue(right.time || "09:00 AM");
                  return leftTime - rightTime;
                });
                return (
                  <div key={label} className="week-day-column">
                    <div className="week-day-header">{label}<small>{weekdayDate.getDate()}</small></div>
                    <div className="week-day-body">
                      {dayAppointments.length ? dayAppointments.map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          className={`week-event ${appointment.status.toLowerCase().replace(/\s+/g, "-")}`}
                          style={{ top: `${((parseTimeValue(appointment.time || "09:00 AM") - 8 * 60) / 60) * 80}px` }}
                          onClick={() => setSelectedAppointmentId(appointment.id)}
                        >
                          <span>{appointment.time}</span>
                          <strong>{snapshot.clients.find((client) => client.id === appointment.clientId)?.displayName || "Client"}</strong>
                          <small>{appointment.type}</small>
                        </button>
                      )) : <button type="button" className="empty-slot" onClick={() => setAppointmentFromCalendar(weekdayDate)}>+ Add</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {viewMode === "day" ? (
            <div className="day-schedule">
              {Array.from({ length: 12 }, (_, index) => 8 + index).map((hour) => (
                <div key={hour} className="day-time-row">
                  <div className="day-time-label">{new Date(2026, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" })}</div>
                  <div className="day-slot">
                    {(dailyAppointments.get(toDateString(currentDate)) || []).filter((appointment) => {
                      const normalized = parseTimeValue(appointment.time || "09:00 AM") / 60;
                      return normalized >= hour && normalized < hour + 1;
                    }).map((appointment) => (
                      <button key={appointment.id} type="button" className={`day-event ${appointment.status.toLowerCase().replace(/\s+/g, "-")}`} onClick={() => setSelectedAppointmentId(appointment.id)}>
                        <span>{appointment.time}</span>
                        <strong>{appointment.type}</strong>
                        <small>{snapshot.clients.find((client) => client.id === appointment.clientId)?.displayName || "Client"}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {viewMode === "agenda" ? (
            <div className="agenda-schedule">
              {Array.from(new Set(filteredAppointments.map((appointment) => appointment.date))).sort().map((date) => (
                <div key={date} className="agenda-day-group">
                  <h3>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3>
                  {filteredAppointments.filter((appointment) => appointment.date === date).map((appointment) => (
                    <button key={appointment.id} type="button" className="agenda-entry" onClick={() => setSelectedAppointmentId(appointment.id)}>
                      <span>{appointment.time}</span>
                      <div>
                        <strong>{appointment.type}</strong>
                        <small>{snapshot.clients.find((client) => client.id === appointment.clientId)?.displayName || "Client"}</small>
                        <small>{appointment.serviceName}</small>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {detailAppointment ? (
          <aside className="scheduler-detail-panel">
            <div className="scheduler-detail-header">
              <h3>{detailAppointment.type}</h3>
              <button type="button" className="secondary-button" onClick={() => setSelectedAppointmentId(null)}>Close</button>
            </div>

            <div className="scheduler-detail-body">
              <div className="detail-summary-row">
                <strong>{snapshot.clients.find((client) => client.id === detailAppointment.clientId)?.displayName || "Client"}</strong>
                <AdminStatusBadge status={detailAppointment.status} tone={statusTone[detailAppointment.status] || "neutral"} />
              </div>

              <dl className="detail-list">
                <div><dt>Service</dt><dd>{detailAppointment.serviceName}</dd></div>
                <div><dt>Date</dt><dd>{formatDate(detailAppointment.date)}</dd></div>
                <div><dt>Time</dt><dd>{detailAppointment.time}</dd></div>
                <div><dt>Location</dt><dd>{detailAppointment.deliveryMethod || "Virtual"}</dd></div>
                <div><dt>Owner</dt><dd>{detailAppointment.assignedTo || "Owner / Administrator"}</dd></div>
                <div><dt>Preparation required</dt><dd>{detailAppointment.needsPreparation ? "Yes" : "No"}</dd></div>
                <div><dt>Follow-up required</dt><dd>{detailAppointment.followUpRequired ? "Yes" : "No"}</dd></div>
                <div><dt>Notes</dt><dd>{detailAppointment.notes || "No internal notes recorded."}</dd></div>
              </dl>

              <div className="scheduler-actions-grid">
                <button type="button" className="secondary-button" onClick={() => openDraftForm("edit", detailAppointment)}>Edit</button>
                <button type="button" className="secondary-button" onClick={() => openDraftForm("reschedule", detailAppointment)}>Reschedule</button>
                {detailAppointment.status !== "Cancelled" ? (
                  <button type="button" className="secondary-button" onClick={() => { setFormMode("cancel"); setIsFormOpen(true); setSelectedAppointmentId(detailAppointment.id); }}>Cancel</button>
                ) : null}
                {detailAppointment.status === "Scheduled" ? (
                  <button type="button" className="primary-button" onClick={() => changeStatus(detailAppointment.id, "Confirmed")}>Mark Confirmed</button>
                ) : null}
                {detailAppointment.status !== "Completed" && detailAppointment.status !== "Cancelled" ? (
                  <button type="button" className="primary-button" onClick={() => changeStatus(detailAppointment.id, "Completed")}>Mark Completed</button>
                ) : null}
                {detailAppointment.followUpRequired && detailAppointment.status !== "Cancelled" ? (
                  <button type="button" className="secondary-button" onClick={() => changeStatus(detailAppointment.id, "Follow-up Required")}>Mark Follow-Up Complete</button>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      <AdminSection title="Appointment list">
        {filteredAppointments.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Service</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Preparation</th>
                  <th>Follow-up</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{formatDate(appointment.date)}</td>
                    <td>{appointment.time}</td>
                    <td>{snapshot.clients.find((client) => client.id === appointment.clientId)?.displayName || "—"}</td>
                    <td>{appointment.type}</td>
                    <td>{appointment.serviceName}</td>
                    <td>{appointment.deliveryMethod || "Virtual"}</td>
                    <td><AdminStatusBadge status={appointment.status} tone={statusTone[appointment.status] || "neutral"} /></td>
                    <td>{appointment.needsPreparation ? "Required" : "Not required"}</td>
                    <td>{appointment.followUpRequired ? "Required" : "Not required"}</td>
                    <td>{appointment.assignedTo || "Owner / Administrator"}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button" onClick={() => setSelectedAppointmentId(appointment.id)}>View</button>
                        <button type="button" className="link-button" onClick={() => openDraftForm("edit", appointment)}>Edit</button>
                        <button type="button" className="link-button" onClick={() => openDraftForm("reschedule", appointment)}>Reschedule</button>
                        <button type="button" className="link-button" onClick={() => { setFormMode("cancel"); setSelectedAppointmentId(appointment.id); setIsFormOpen(true); }}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="No appointments match the current filters." description="Try changing the date range, clearing the filters, or creating a new appointment." actionLabel="Schedule Appointment" onAction={() => openDraftForm("create")} />
        )}
      </AdminSection>

      {isFormOpen ? (
        <div className="scheduler-modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <div className="scheduler-modal" onClick={(event) => event.stopPropagation()}>
            <div className="scheduler-modal-header">
              <h3>{formMode === "create" ? "Schedule Appointment" : formMode === "edit" ? "Edit Appointment" : formMode === "reschedule" ? "Reschedule Appointment" : "Cancel Appointment"}</h3>
              <button type="button" className="secondary-button" onClick={() => setIsFormOpen(false)}>Close</button>
            </div>

            {formMode === "cancel" ? (
              <div className="scheduler-modal-body">
                <p><strong>{snapshot.clients.find((client) => client.id === (selectedAppointment || {}).clientId)?.displayName || "Client"}</strong> on {formatDate((selectedAppointment || {}).date)} at {(selectedAppointment || {}).time}</p>
                <label>
                  <span>Cancellation reason</span>
                  <select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
                    <option value="Client requested">Client requested</option>
                    <option value="Admin requested">Admin requested</option>
                    <option value="Scheduling conflict">Scheduling conflict</option>
                    <option value="No longer needed">No longer needed</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <div className="scheduler-action-row">
                  <button type="button" className="secondary-button" onClick={() => setIsFormOpen(false)}>Keep appointment</button>
                  <button type="button" className="primary-button" onClick={confirmCancel}>Confirm Cancellation</button>
                </div>
              </div>
            ) : (
              <div className="scheduler-modal-body form-grid">
                <label>
                  <span>Client</span>
                  <select value={draftState.clientId} onChange={(event) => setDraftField("clientId", event.target.value)}>
                    <option value="">Select client</option>
                    {snapshot.clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.displayName}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Appointment type</span>
                  <select value={draftState.type} onChange={(event) => setDraftField("type", event.target.value)}>
                    {Array.from(new Set(appointments.map((appointment) => appointment.type).filter(Boolean))).map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Service</span>
                  <select value={draftState.serviceName} onChange={(event) => setDraftField("serviceName", event.target.value)}>
                    {Array.from(new Set(snapshot.engagements.map((engagement) => engagement.serviceName).concat(appointments.map((appointment) => appointment.serviceName))).filter(Boolean)).map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Date</span>
                  <input type="date" value={draftState.date} onChange={(event) => setDraftField("date", event.target.value)} />
                </label>
                <label>
                  <span>Start time</span>
                  <input type="time" value={draftState.startTime} onChange={(event) => setDraftField("startTime", event.target.value)} />
                </label>
                <label>
                  <span>Duration</span>
                  <input type="number" min="15" step="15" value={draftState.duration} onChange={(event) => setDraftField("duration", event.target.value)} />
                </label>
                <label>
                  <span>Location</span>
                  <select value={draftState.location} onChange={(event) => setDraftField("location", event.target.value)}>
                    <option value="Virtual">Virtual</option>
                    <option value="Phone">Phone</option>
                    <option value="In Person">In Person</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={draftState.status} onChange={(event) => setDraftField("status", event.target.value)}>
                    {appointmentStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Owner</span>
                  <select value={draftState.assignedTo} onChange={(event) => setDraftField("assignedTo", event.target.value)}>
                    {ownerOptions.filter((option) => option !== "All").map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="checkbox-field">
                  <input type="checkbox" checked={draftState.needsPreparation} onChange={(event) => setDraftField("needsPreparation", event.target.checked)} />
                  <span>Preparation required</span>
                </label>
                <label className="checkbox-field">
                  <input type="checkbox" checked={draftState.followUpRequired} onChange={(event) => setDraftField("followUpRequired", event.target.checked)} />
                  <span>Follow-up required</span>
                </label>
                <label className="full-span">
                  <span>Internal notes</span>
                  <textarea rows="4" value={draftState.notes} onChange={(event) => setDraftField("notes", event.target.value)} />
                </label>
                <div className="scheduler-action-row full-span">
                  <button type="button" className="secondary-button" onClick={() => setIsFormOpen(false)}>Cancel</button>
                  <button type="button" className="primary-button" onClick={saveAppointment}>{formMode === "create" ? "Create Appointment" : "Save Changes"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const createEmptyInvoiceLine = (overrides = {}) => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  serviceCode: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  billingType: "Custom",
  referenceType: "custom",
  relatedServiceId: null,
  relatedEngagementId: null,
  isAddOn: false,
  ...overrides,
});

const getInvoiceCalculatedTotals = (invoice) => {
  const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  const subtotal = lineItems.reduce((sum, lineItem) => sum + Number(lineItem.amount || Number(lineItem.quantity || 1) * Number(lineItem.unitPrice || 0)), 0);
  const adjustments = Number(invoice?.adjustments || 0);
  const creditsApplied = Number(invoice?.creditsApplied || 0);
  const paidAmount = Number(invoice?.paidAmount || invoice?.payments || 0);
  const total = Math.max(subtotal + adjustments - creditsApplied, 0);
  const balance = Math.max(total - paidAmount, 0);
  return { subtotal, adjustments, creditsApplied, paidAmount, total, balance };
};

const getEffectiveInvoiceStatus = (invoice) => {
  if (!invoice) return "Draft";
  if (invoice.status === "Void") return "Void";
  if (invoice.status === "Draft") return "Draft";

  const { total, paidAmount, balance } = getInvoiceCalculatedTotals(invoice);
  const due = invoice.dueAt ? new Date(`${invoice.dueAt}T23:59:59`) : null;
  const today = new Date();

  if (total > 0 && paidAmount >= total) return "Paid";
  if (total > 0 && paidAmount > 0 && paidAmount < total) return "Partially Paid";
  if (due && today > due && balance > 0) return "Past Due";

  return invoice.status === "Issued" || invoice.status === "Open" ? "Issued" : invoice.status || "Issued";
};

function BillingManagementPage() {
  const navigate = useNavigate();
  const snapshot = adminStore.getSnapshot();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState({
    clientId: snapshot.clients[0]?.id || "",
    engagementId: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
    notes: "",
    internalMemo: "",
    paymentTerms: "Net 14",
    adjustments: 0,
    creditsApplied: 0,
    lines: [createEmptyInvoiceLine()],
  });
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceMessage, setInvoiceMessage] = useState("");

  const selectedClient = snapshot.clients.find((client) => client.id === invoiceDraft.clientId) || null;
  const engagementOptions = useMemo(() => {
    if (!invoiceDraft.clientId) return [];
    return snapshot.engagements.filter((engagement) => engagement.clientId === invoiceDraft.clientId);
  }, [snapshot.engagements, invoiceDraft.clientId]);

  const filterRows = useMemo(() => {
    return snapshot.invoices.filter((invoice) => {
      const client = snapshot.clients.find((entry) => entry.id === invoice.clientId)?.displayName || "";
      const engagement = snapshot.engagements.find((entry) => entry.id === invoice.engagementId)?.serviceName || "";
      const renderedStatus = getEffectiveInvoiceStatus(invoice);
      const target = `${invoice.invoiceNumber || invoice.id} ${client} ${engagement} ${invoice.serviceName || ""}`.toLowerCase();
      return (!search || target.includes(search.toLowerCase())) && (statusFilter === "All" || renderedStatus === statusFilter) && (clientFilter === "All" || client === clientFilter);
    });
  }, [search, statusFilter, clientFilter, snapshot]);

  const clientOptions = ["All", ...Array.from(new Set(snapshot.clients.map((client) => client.displayName)))];

  const openBalance = snapshot.invoices.filter((invoice) => !["Paid", "Void"].includes(getEffectiveInvoiceStatus(invoice))).reduce((sum, invoice) => sum + getInvoiceCalculatedTotals(invoice).balance, 0);
  const pastDue = snapshot.invoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === "Past Due").reduce((sum, invoice) => sum + getInvoiceCalculatedTotals(invoice).balance, 0);
  const paidThisPeriod = snapshot.payments.filter((payment) => {
    const paymentDate = new Date(`${payment.date}T12:00:00`);
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return paymentDate >= start;
  }).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const applySelectedEngagement = (engagementId) => {
    setInvoiceDraft((current) => {
      const engagement = snapshot.engagements.find((entry) => entry.id === engagementId);
      if (!engagement) return { ...current, engagementId: "" };

      const service = snapshot.services.find((entry) => entry.serviceName === engagement.serviceName) || null;
      const defaultPrice = service?.defaultPrice ?? 0;
      const negotiatedPrice = Number(engagement.negotiatedPrice || engagement.contractValue || defaultPrice || 0);

      return {
        ...current,
        engagementId,
        lines: [
          createEmptyInvoiceLine({
            serviceCode: service?.serviceCode || "",
            description: service?.serviceName || engagement.serviceName,
            quantity: 1,
            unitPrice: negotiatedPrice,
            amount: negotiatedPrice,
            billingType: service?.billingType || "Project-Based",
            referenceType: "engagement",
            relatedServiceId: service?.id || null,
            relatedEngagementId: engagement.id,
          }),
        ],
      };
    });
  };

  const updateLine = (lineId, field, value) => {
    setInvoiceDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.id !== lineId) return line;
        const nextLine = { ...line, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const quantity = Number(nextLine.quantity || 1);
          const unitPrice = Number(nextLine.unitPrice || 0);
          nextLine.amount = quantity * unitPrice;
        }
        if (field === "amount") {
          nextLine.amount = Number(value || 0);
        }
        return nextLine;
      }),
    }));
  };

  const addLineItem = () => {
    setInvoiceDraft((current) => ({
      ...current,
      lines: [...current.lines, createEmptyInvoiceLine()],
    }));
  };

  const removeLineItem = (lineId) => {
    setInvoiceDraft((current) => ({
      ...current,
      lines: current.lines.length > 1 ? current.lines.filter((line) => line.id !== lineId) : current.lines,
    }));
  };

  const saveInvoice = (asDraft = true) => {
    const clientId = invoiceDraft.clientId;
    if (!clientId) {
      setInvoiceError("Select a client before saving the invoice.");
      return;
    }

    const resolvedLines = invoiceDraft.lines
      .filter((line) => line.description || line.serviceCode)
      .map((line) => ({
        id: line.id,
        serviceCode: line.serviceCode || "",
        description: line.description || "Custom invoice line",
        quantity: Number(line.quantity || 1),
        unitPrice: Number(line.unitPrice || 0),
        amount: Number(line.amount || Number(line.quantity || 1) * Number(line.unitPrice || 0)),
        billingType: line.billingType || "Custom",
        referenceType: line.referenceType || "custom",
        relatedServiceId: line.relatedServiceId || null,
        relatedEngagementId: line.relatedEngagementId || invoiceDraft.engagementId || null,
      }));

    if (!resolvedLines.length) {
      setInvoiceError("Add at least one invoice line item.");
      return;
    }

    let invoice;
    try {
      invoice = adminStore.createInvoiceDraft({
        clientId,
        engagementId: invoiceDraft.engagementId || null,
        amount: resolvedLines.reduce((sum, line) => sum + Number(line.amount || 0), 0) + Number(invoiceDraft.adjustments || 0) - Number(invoiceDraft.creditsApplied || 0),
        dueDate: invoiceDraft.dueDate,
        status: asDraft ? "Draft" : "Issued",
        lineItems: resolvedLines,
        invoiceDate: invoiceDraft.invoiceDate,
        notes: invoiceDraft.notes,
        internalMemo: invoiceDraft.internalMemo,
        paymentTerms: invoiceDraft.paymentTerms,
        adjustments: Number(invoiceDraft.adjustments || 0),
        creditsApplied: Number(invoiceDraft.creditsApplied || 0),
        serviceName: resolvedLines[0]?.description || "General",
        businessName: selectedClient?.businessName || selectedClient?.displayName || "",
        relatedClientName: selectedClient?.displayName,
      });
    } catch (error) {
      setInvoiceError(error.message || "Unable to create the invoice.");
      return;
    }

    setInvoiceError("");
    setInvoiceMessage(asDraft ? `Draft invoice ${invoice.invoiceNumber} created.` : `Invoice ${invoice.invoiceNumber} issued.`);
    setIsCreateOpen(false);
    setInvoiceDraft({
      clientId: snapshot.clients[0]?.id || "",
      engagementId: "",
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
      notes: "",
      internalMemo: "",
      paymentTerms: "Net 14",
      adjustments: 0,
      creditsApplied: 0,
      lines: [createEmptyInvoiceLine()],
    });

    navigate(`/admin/billing/invoices/${invoice.id}`);
  };

  return (
    <div className="admin-module">
      <AdminPageHeader eyebrow="Billing" title="Billing" summary="Track invoices, payments, and outstanding obligations with current operational records." actions={[{ label: "+ Create Invoice", primary: true, onClick: () => setIsCreateOpen(true) }]} />
      <AdminMetrics items={[
        { label: "Open Balance", value: formatCurrency(openBalance), hint: "Current" },
        { label: "Past Due", value: formatCurrency(pastDue), hint: "Outstanding" },
        { label: "Paid This Period", value: formatCurrency(paidThisPeriod), hint: "Current month" },
        { label: "Open Invoices", value: snapshot.invoices.filter((invoice) => !["Paid", "Void"].includes(getEffectiveInvoiceStatus(invoice))).length, hint: "Count" },
      ]} />
      <AdminToolbar searchValue={search} onSearchChange={setSearch} filters={[
        { label: "Status", value: statusFilter, onChange: setStatusFilter, options: ["All", ...billingStatuses].map((option) => ({ value: option, label: option })) },
        { label: "Client", value: clientFilter, onChange: setClientFilter, options: clientOptions.map((option) => ({ value: option, label: option })) },
      ]} />
      {invoiceMessage ? <div className="admin-toast success">{invoiceMessage}</div> : null}
      <AdminSection title="Invoice tracker">
        {filterRows.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Subtotal</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterRows.map((invoice) => {
                  const status = getEffectiveInvoiceStatus(invoice);
                  const totals = getInvoiceCalculatedTotals(invoice);
                  return (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber || invoice.id}</td>
                      <td>{snapshot.clients.find((client) => client.id === invoice.clientId)?.displayName || "—"}</td>
                      <td>{invoice.serviceName || invoice.lineItems?.[0]?.description || "General"}</td>
                      <td>{formatDate(invoice.issuedAt)}</td>
                      <td>{formatDate(invoice.dueAt)}</td>
                      <td>{formatCurrency(totals.total)}</td>
                      <td>{formatCurrency(totals.paidAmount)}</td>
                      <td>{formatCurrency(totals.balance)}</td>
                      <td><AdminStatusBadge status={status} tone={statusTone[status] || "neutral"} /></td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="link-button" onClick={() => navigate(`/admin/billing/invoices/${invoice.id}`)}>View</button>
                          <button type="button" className="link-button" onClick={() => navigate(`/admin/billing/invoices/${invoice.id}`)}>Print</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="No invoices found." description="There are no billing records matching the current filter." actionLabel="Create Invoice" onAction={() => setIsCreateOpen(true)} />
        )}
      </AdminSection>

      {isCreateOpen ? (
        <div className="admin-detail-overlay" onClick={() => setIsCreateOpen(false)}>
          <aside className="admin-detail-drawer invoice-builder" onClick={(event) => event.stopPropagation()}>
            <div className="admin-detail-header">
              <h2>Create invoice</h2>
              <button type="button" className="secondary-button" onClick={() => setIsCreateOpen(false)}>Close</button>
            </div>
            <div className="admin-detail-body">
              <div className="client-detail-editor-grid">
                <label>
                  <span>Client</span>
                  <input list="billing-client-list" value={snapshot.clients.find((client) => client.id === invoiceDraft.clientId)?.displayName || ""} onChange={(event) => {
                    const match = snapshot.clients.find((client) => client.displayName.toLowerCase() === event.target.value.toLowerCase());
                    setInvoiceDraft((current) => ({ ...current, clientId: match ? match.id : current.clientId, engagementId: "" }));
                  }} placeholder="Search client" />
                  <datalist id="billing-client-list">
                    {snapshot.clients.map((client) => (
                      <option key={client.id} value={client.displayName} />
                    ))}
                  </datalist>
                </label>
                <label>
                  <span>Engagement / SOW</span>
                  <select value={invoiceDraft.engagementId} onChange={(event) => {
                    const nextValue = event.target.value;
                    setInvoiceDraft((current) => ({ ...current, engagementId: nextValue }));
                    if (nextValue) applySelectedEngagement(nextValue);
                  }}>
                    <option value="">No engagement</option>
                    {engagementOptions.map((engagement) => (
                      <option key={engagement.id} value={engagement.id}>{engagement.serviceName}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Invoice date</span>
                  <input type="date" value={invoiceDraft.invoiceDate} onChange={(event) => setInvoiceDraft((current) => ({ ...current, invoiceDate: event.target.value }))} />
                </label>
                <label>
                  <span>Due date</span>
                  <input type="date" value={invoiceDraft.dueDate} onChange={(event) => setInvoiceDraft((current) => ({ ...current, dueDate: event.target.value }))} />
                </label>
                <label>
                  <span>Payment terms</span>
                  <input type="text" value={invoiceDraft.paymentTerms} onChange={(event) => setInvoiceDraft((current) => ({ ...current, paymentTerms: event.target.value }))} />
                </label>
                <label>
                  <span>Adjustments</span>
                  <input type="number" min="0" step="1" value={invoiceDraft.adjustments} onChange={(event) => setInvoiceDraft((current) => ({ ...current, adjustments: Number(event.target.value || 0) }))} />
                </label>
                <label>
                  <span>Credits / deposits applied</span>
                  <input type="number" min="0" step="1" value={invoiceDraft.creditsApplied} onChange={(event) => setInvoiceDraft((current) => ({ ...current, creditsApplied: Number(event.target.value || 0) }))} />
                </label>
                <label className="full-span">
                  <span>Client-facing notes</span>
                  <textarea rows="2" value={invoiceDraft.notes} onChange={(event) => setInvoiceDraft((current) => ({ ...current, notes: event.target.value }))} />
                </label>
                <label className="full-span">
                  <span>Internal memo</span>
                  <textarea rows="2" value={invoiceDraft.internalMemo} onChange={(event) => setInvoiceDraft((current) => ({ ...current, internalMemo: event.target.value }))} />
                </label>
              </div>

              <div className="admin-section-header">
                <h3>Line items</h3>
                <button type="button" className="secondary-button" onClick={addLineItem}>+ Add line</button>
              </div>

              {invoiceDraft.lines.map((line, index) => (
                <div key={line.id} className="invoice-line-row">
                  <input type="text" value={line.serviceCode} placeholder="Service code" onChange={(event) => updateLine(line.id, "serviceCode", event.target.value)} />
                  <input type="text" value={line.description} placeholder="Description" onChange={(event) => updateLine(line.id, "description", event.target.value)} />
                  <input type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.id, "quantity", Number(event.target.value || 1))} />
                  <input type="number" min="0" step="1" value={line.unitPrice} onChange={(event) => updateLine(line.id, "unitPrice", Number(event.target.value || 0))} />
                  <input type="number" min="0" step="1" value={line.amount} onChange={(event) => updateLine(line.id, "amount", Number(event.target.value || 0))} />
                  <select value={line.billingType} onChange={(event) => updateLine(line.id, "billingType", event.target.value)}>
                    <option value="Fixed Fee">Fixed Fee</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Project-Based">Project-Based</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <button type="button" className="secondary-button" onClick={() => removeLineItem(line.id)} disabled={invoiceDraft.lines.length === 1}>Remove</button>
                </div>
              ))}

              <div className="payment-totals-box">
                <div><span>Subtotal</span><strong>{formatCurrency(invoiceDraft.lines.reduce((sum, line) => sum + Number(line.amount || Number(line.quantity || 1) * Number(line.unitPrice || 0)), 0))}</strong></div>
                <div><span>Adjustments</span><strong>{formatCurrency(invoiceDraft.adjustments)}</strong></div>
                <div><span>Credits / deposits</span><strong>{formatCurrency(invoiceDraft.creditsApplied)}</strong></div>
                <div><span>Invoice total</span><strong>{formatCurrency(invoiceDraft.lines.reduce((sum, line) => sum + Number(line.amount || Number(line.quantity || 1) * Number(line.unitPrice || 0)), 0) + Number(invoiceDraft.adjustments || 0) - Number(invoiceDraft.creditsApplied || 0))}</strong></div>
              </div>

              {invoiceError ? <div className="admin-toast error">{invoiceError}</div> : null}
              <div className="admin-header-actions">
                <button type="button" className="secondary-button" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="button" className="secondary-button" onClick={() => saveInvoice(true)}>Save draft</button>
                <button type="button" className="primary-button" onClick={() => saveInvoice(false)}>Issue invoice</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const snapshot = adminStore.getSnapshot();
  const invoice = snapshot.invoices.find((entry) => entry.id === invoiceId || entry.invoiceNumber === invoiceId) || null;
  const [recordPayment, setRecordPayment] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), methodLabel: "ACH / Bank Transfer", reference: "", note: "" });
  const [paymentError, setPaymentError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  const invoiceSnapshot = useMemo(() => {
    if (!invoice) return null;
    return snapshot.invoices.find((entry) => entry.id === invoice.id) || invoice;
  }, [invoice, snapshot, refreshIndex]);

  if (!invoiceSnapshot) {
    return (
      <div className="admin-module">
        <AdminPageHeader eyebrow="Invoice" title="Invoice not found" summary="The requested invoice could not be found in the active billing records." actions={[{ label: "← Back to billing", primary: false, onClick: () => navigate("/admin/billing") }]} />
      </div>
    );
  }

  const client = snapshot.clients.find((entry) => entry.id === invoiceSnapshot.clientId) || null;
  const engagement = snapshot.engagements.find((entry) => entry.id === invoiceSnapshot.engagementId) || null;
  const paymentRecords = snapshot.payments.filter((payment) => payment.invoiceId === invoiceSnapshot.id);
  const totals = getInvoiceCalculatedTotals(invoiceSnapshot);

  const handleRecordPayment = () => {
    const amount = Number(recordPayment.amount || 0);
    if (!amount || amount <= 0) {
      setPaymentError("Enter a valid payment amount.");
      return;
    }

    try {
      adminStore.recordPayment(invoiceSnapshot.id, {
        amount,
        date: recordPayment.date,
        methodLabel: recordPayment.methodLabel,
        reference: recordPayment.reference,
        note: recordPayment.note,
      });
      setPaymentError("");
      setPaymentMessage(`Payment of ${formatCurrency(amount)} recorded.`);
      setRecordPayment({ amount: "", date: new Date().toISOString().slice(0, 10), methodLabel: "ACH / Bank Transfer", reference: "", note: "" });
      setRefreshIndex((current) => current + 1);
    } catch (error) {
      setPaymentError(error.message || "Unable to record this payment.");
      setPaymentMessage("");
    }
  };

  const effectiveStatus = getEffectiveInvoiceStatus(invoiceSnapshot);

  return (
    <div className="admin-module">
      <AdminPageHeader eyebrow="Billing" title={`Invoice ${invoiceSnapshot.invoiceNumber || invoiceSnapshot.id}`} summary="Operational invoice detail and payment history." actions={[{ label: "← Back to billing", primary: false, onClick: () => navigate("/admin/billing") }, { label: "Print / Export", primary: true, onClick: () => window.print() }]} />
      <div className="admin-detail-grid">
        <div className="detail-block">
          <h3>Invoice summary</h3>
          <dl>
            <div><dt>Invoice number</dt><dd>{invoiceSnapshot.invoiceNumber || invoiceSnapshot.id}</dd></div>
            <div><dt>Status</dt><dd><AdminStatusBadge status={effectiveStatus} tone={statusTone[effectiveStatus] || "neutral"} /></dd></div>
            <div><dt>Invoice date</dt><dd>{formatDate(invoiceSnapshot.issuedAt)}</dd></div>
            <div><dt>Due date</dt><dd>{formatDate(invoiceSnapshot.dueAt)}</dd></div>
            <div><dt>Client</dt><dd>{client?.displayName || "Unknown client"}</dd></div>
            <div><dt>Business name</dt><dd>{client?.businessName || "—"}</dd></div>
            <div><dt>Engagement / SOW</dt><dd>{engagement?.serviceName || "Not linked"}</dd></div>
          </dl>
        </div>
        <div className="detail-block">
          <h3>Totals</h3>
          <dl>
            <div><dt>Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
            <div><dt>Adjustments</dt><dd>{formatCurrency(totals.adjustments)}</dd></div>
            <div><dt>Credits / deposits</dt><dd>{formatCurrency(totals.creditsApplied)}</dd></div>
            <div><dt>Payments</dt><dd>{formatCurrency(totals.paidAmount)}</dd></div>
            <div><dt>Outstanding</dt><dd>{formatCurrency(totals.balance)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="detail-block full-width">
        <h3>Line items</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service code</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoiceSnapshot.lineItems || []).map((lineItem) => (
                <tr key={lineItem.id}>
                  <td>{lineItem.serviceCode || "—"}</td>
                  <td>{lineItem.description || "Custom invoice line"}</td>
                  <td>{lineItem.quantity || 1}</td>
                  <td>{formatCurrency(lineItem.unitPrice || 0)}</td>
                  <td>{formatCurrency(lineItem.amount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div className="detail-block">
          <h3>Record payment</h3>
          <div className="client-detail-editor-grid">
            <label>
              <span>Amount</span>
              <input type="number" min="0" step="1" value={recordPayment.amount} onChange={(event) => setRecordPayment((current) => ({ ...current, amount: event.target.value }))} />
            </label>
            <label>
              <span>Payment date</span>
              <input type="date" value={recordPayment.date} onChange={(event) => setRecordPayment((current) => ({ ...current, date: event.target.value }))} />
            </label>
            <label>
              <span>Method</span>
              <select value={recordPayment.methodLabel} onChange={(event) => setRecordPayment((current) => ({ ...current, methodLabel: event.target.value }))}>
                <option value="ACH / Bank Transfer">ACH / Bank Transfer</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
                <option value="Card / External Processor">Card / External Processor</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              <span>Reference</span>
              <input type="text" value={recordPayment.reference} onChange={(event) => setRecordPayment((current) => ({ ...current, reference: event.target.value }))} />
            </label>
            <label className="full-span">
              <span>Internal note</span>
              <textarea rows="2" value={recordPayment.note} onChange={(event) => setRecordPayment((current) => ({ ...current, note: event.target.value }))} />
            </label>
          </div>
          {paymentError ? <div className="admin-toast error">{paymentError}</div> : null}
          {paymentMessage ? <div className="admin-toast success">{paymentMessage}</div> : null}
          <div className="admin-header-actions">
            <button type="button" className="primary-button" onClick={handleRecordPayment}>Record payment</button>
          </div>
        </div>

        <div className="detail-block">
          <h3>Payment history</h3>
          {paymentRecords.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRecords.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.date)}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.methodLabel || "Manual payment"}</td>
                      <td>{payment.reference || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No payments have been recorded for this invoice yet.</p>
          )}
        </div>
      </div>

      <div className="detail-block full-width">
        <h3>Notes and activity</h3>
        <p><strong>Client-facing notes:</strong> {invoiceSnapshot.notes || "No client-facing note provided."}</p>
        <p><strong>Internal memo:</strong> {invoiceSnapshot.internalMemo || "No internal billing note recorded."}</p>
      </div>
    </div>
  );
}

function ContentManagementPage() {
  const [tab, setTab] = useState("pages");
  const snapshot = adminStore.getSnapshot();

  const pageRows = [
    { page: "Homepage", route: "/", status: "Published", seo: "Healthy", updated: "2026-02-12", editor: "Owner" },
    { page: "Services", route: "/services", status: "Published", seo: "Healthy", updated: "2026-02-11", editor: "Owner" },
    { page: "Why Alchemize", route: "/why-alchemize", status: "Draft", seo: "Needs review", updated: "2026-01-28", editor: "Operations" },
  ];

  const resourceRows = [
    { title: "Estimated Taxes: Questions to Ask Before You Ignore Them", category: "Tax", audience: "Individual", status: "Published", featured: "Yes", published: "2026-02-13", updated: "2026-02-13" },
    { title: "Questions to Ask Before Choosing Insurance", category: "Insurance", audience: "Individual", status: "Published", featured: "No", published: "2026-02-09", updated: "2026-02-10" },
  ];

  const seoRows = [
    { page: "Homepage", title: "Alchemize Business Services", description: "Business services for documentation, operations, and tax planning.", canonical: "/", image: "Present", index: "Indexed", health: "Healthy" },
    { page: "Resources", title: "Resource Library", description: "Guides and checklists for business owners and individuals.", canonical: "/resources", image: "Missing", index: "Indexed", health: "Warning" },
  ];

  const noticeRows = [
    { title: "Tax-season reminder", type: "Tax Season", placement: "Homepage", status: "Scheduled", start: "2026-02-01", end: "2026-04-15" },
    { title: "Consultation availability", type: "Consultation Availability", placement: "Services", status: "Active", start: "2026-02-10", end: "2026-12-31" },
  ];

  const contentTabs = [
    { id: "pages", label: "Pages" },
    { id: "resources", label: "Resources" },
    { id: "featured", label: "Featured" },
    { id: "seo", label: "SEO" },
    { id: "notices", label: "Site Notices" },
  ];

  const contentTables = {
    pages: (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Page</th><th>Route</th><th>Status</th><th>Last Updated</th><th>SEO Status</th><th>Last Editor</th><th>Actions</th></tr></thead>
          <tbody>{pageRows.map((row) => <tr key={row.page}><td>{row.page}</td><td>{row.route}</td><td><AdminStatusBadge status={row.status} tone={row.status === "Published" ? "success" : "warning"} /></td><td>{row.updated}</td><td>{row.seo}</td><td>{row.editor}</td><td><div className="table-actions"><button type="button" className="link-button">Preview</button></div></td></tr>)}</tbody>
        </table>
      </div>
    ),
    resources: (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Category</th><th>Audience</th><th>Status</th><th>Featured</th><th>Published</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>{resourceRows.map((row) => <tr key={row.title}><td>{row.title}</td><td>{row.category}</td><td>{row.audience}</td><td><AdminStatusBadge status={row.status} tone="success" /></td><td>{row.featured}</td><td>{row.published}</td><td>{row.updated}</td><td><div className="table-actions"><button type="button" className="link-button">View</button><button type="button" className="link-button">Edit</button></div></td></tr>)}</tbody>
        </table>
      </div>
    ),
    featured: (
      <div className="admin-section-empty">
        <p>Current featured resources are managed from the content configuration layer. This panel shows the active highlights and ordering controls.</p>
        <ul className="detail-list">
          <li><strong>Estimated Taxes: Questions to Ask Before You Ignore Them</strong><span>Position 1</span></li>
          <li><strong>Questions to Ask Before Choosing Insurance</strong><span>Position 2</span></li>
        </ul>
      </div>
    ),
    seo: (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Page / Resource</th><th>Meta Title</th><th>Meta Description</th><th>Canonical</th><th>Social Image</th><th>Index Status</th><th>Health</th><th>Actions</th></tr></thead>
          <tbody>{seoRows.map((row) => <tr key={row.page}><td>{row.page}</td><td>{row.title}</td><td>{row.description}</td><td>{row.canonical}</td><td>{row.image}</td><td>{row.index}</td><td><AdminStatusBadge status={row.health === "Healthy" ? "Healthy" : "Warning"} tone={row.health === "Healthy" ? "success" : "warning"} /></td><td><div className="table-actions"><button type="button" className="link-button">Edit metadata</button></div></td></tr>)}</tbody>
        </table>
      </div>
    ),
    notices: (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Type</th><th>Placement</th><th>Status</th><th>Start Date</th><th>End Date</th><th>Actions</th></tr></thead>
          <tbody>{noticeRows.map((row) => <tr key={row.title}><td>{row.title}</td><td>{row.type}</td><td>{row.placement}</td><td><AdminStatusBadge status={row.status} tone={row.status === "Active" ? "success" : "info"} /></td><td>{row.start}</td><td>{row.end}</td><td><div className="table-actions"><button type="button" className="link-button">Edit</button></div></td></tr>)}</tbody>
        </table>
      </div>
    ),
  };

  return (
    <div className="admin-module">
      <AdminPageHeader eyebrow="Content management" title="Content management" summary="Review page health, resource configuration, featured placements, and notice scheduling." actions={[{ label: "+ New Page", primary: true, onClick: () => null }]} />
      <AdminTabs tabs={contentTabs} activeTab={tab} onChange={setTab} />
      <AdminSection title={contentTabs.find((item) => item.id === tab)?.label || "Content"}>{contentTables[tab] || null}</AdminSection>
    </div>
  );
}

function ReportsPage() {
  const snapshot = adminStore.getSnapshot();
  const reportTypes = [
    "Overview",
    "Leads",
    "Clients",
    "Services / Engagements",
    "Tasks",
    "Documents",
    "Appointments",
    "Billing",
    "Cross-Module / Operational",
  ];

  const dateRangeOptions = [
    { value: "today", label: "Today" },
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "month", label: "This month" },
    { value: "lastMonth", label: "Last month" },
    { value: "quarter", label: "This quarter" },
    { value: "year", label: "This year" },
    { value: "custom", label: "Custom range" },
  ];

  const reportColumnOptions = {
    Overview: ["name", "status", "date", "owner", "service"],
    Leads: ["name", "type", "service", "source", "date", "status", "owner", "nextAction"],
    Clients: ["name", "clientType", "status", "service", "activeServices", "lastActivity", "nextAction"],
    "Services / Engagements": ["name", "client", "service", "status", "owner", "startDate", "targetDate", "billingStatus"],
    Tasks: ["title", "client", "service", "status", "priority", "assignedTo", "dueDate"],
    Documents: ["name", "client", "service", "status", "type", "requestedAt", "receivedAt", "reviewer"],
    Appointments: ["title", "client", "service", "date", "time", "status", "type", "location"],
    Billing: ["invoiceId", "client", "service", "invoiceDate", "dueDate", "amount", "paid", "outstanding", "status"],
    "Cross-Module / Operational": ["name", "type", "status", "service", "client", "date", "owner"],
  };

  const defaultColumns = {
    Overview: ["name", "status", "date", "owner", "service"],
    Leads: ["name", "service", "status", "date", "owner"],
    Clients: ["name", "status", "clientType", "lastActivity"],
    "Services / Engagements": ["name", "client", "status", "targetDate"],
    Tasks: ["title", "status", "dueDate", "assignedTo"],
    Documents: ["name", "status", "requestedAt", "reviewer"],
    Appointments: ["title", "date", "status", "client"],
    Billing: ["invoiceId", "client", "amount", "status", "outstanding"],
    "Cross-Module / Operational": ["name", "type", "status", "date"],
  };

  const filterConfig = {
    Overview: ["status", "client", "service", "owner"],
    Leads: ["status", "type", "service", "source", "owner"],
    Clients: ["status", "clientType", "service", "owner"],
    "Services / Engagements": ["status", "service", "audience", "owner"],
    Tasks: ["status", "priority", "client", "service", "owner"],
    Documents: ["status", "client", "service", "type", "owner"],
    Appointments: ["status", "client", "service", "type", "owner"],
    Billing: ["status", "client", "service", "owner"],
    "Cross-Module / Operational": ["status", "client", "service", "owner"],
  };

  const [reportType, setReportType] = useState("Overview");
  const [datePreset, setDatePreset] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [groupBy, setGroupBy] = useState("none");
  const [selectedColumns, setSelectedColumns] = useState(defaultColumns["Overview"]);
  const [reportVersion, setReportVersion] = useState(0);

  const getClientName = (clientId) =>
    snapshot.clients.find((client) => client.id === clientId)?.displayName || "Client";

  const getClientTypeCount = (type) =>
    snapshot.clients.filter((client) => client.clientType === type).length;

  const getDateBounds = () => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    let start = null;
    let end = null;

    if (datePreset === "today") {
      start = startOfToday;
      end = endOfToday;
    }
    if (datePreset === "7") {
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 6);
      end = endOfToday;
    }
    if (datePreset === "30") {
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 29);
      end = endOfToday;
    }
    if (datePreset === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    if (datePreset === "lastMonth") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    }
    if (datePreset === "quarter") {
      start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      end = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999);
    }
    if (datePreset === "year") {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    if (datePreset === "custom") {
      if (customStart) {
        start = new Date(customStart);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
    }

    return { start, end };
  };

  const isWithinSelectedRange = (value) => {
    if (!value) return true;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return true;
    const { start, end } = getDateBounds();
    if (!start || !end) return true;
    return date >= start && date <= end;
  };

  const buildRows = () => {
    const reportRows = [];
    const recordDate = (value) => value || null;

    snapshot.leads.forEach((lead) => {
      reportRows.push({
        id: lead.id,
        type: "Lead",
        name: lead.name,
        status: lead.status,
        client: lead.name,
        service: lead.serviceInterest,
        source: lead.source,
        audience: lead.audience,
        date: recordDate(lead.receivedAt),
        owner: lead.assignedTo,
        nextAction: lead.nextAction,
        typeValue: lead.audience,
        rowKind: "lead",
      });
    });

    snapshot.clients.forEach((client) => {
      const outstanding = snapshot.invoices
        .filter((invoice) => invoice.clientId === client.id && !["Paid", "Cancelled"].includes(invoice.status))
        .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

      reportRows.push({
        id: client.id,
        type: "Client",
        name: client.displayName,
        status: client.status,
        client: client.displayName,
        service: client.activeServices ? `${client.activeServices} active service${client.activeServices > 1 ? "s" : ""}` : "No active services",
        date: recordDate(client.lastActivity),
        owner: client.representative || client.displayName,
        nextAction: client.nextAction,
        clientType: client.clientType,
        activeServices: client.activeServices,
        outstandingBalance: outstanding,
        rowKind: "client",
      });
    });

    snapshot.engagements.forEach((engagement) => {
      const client = snapshot.clients.find((entry) => entry.id === engagement.clientId);
      reportRows.push({
        id: engagement.id,
        type: "Service / Engagement",
        name: engagement.serviceName,
        status: engagement.status,
        client: client?.displayName || getClientName(engagement.clientId),
        service: engagement.serviceName,
        audience: engagement.audience,
        date: recordDate(engagement.startedAt || engagement.targetDate),
        owner: engagement.assignedTo,
        targetDate: engagement.targetDate,
        startDate: engagement.startedAt,
        billingStatus: snapshot.invoices.some((invoice) => invoice.engagementId === engagement.id && ["Open", "Past Due"].includes(invoice.status)) ? "Open" : "Clear",
        rowKind: "engagement",
      });
    });

    snapshot.tasks.forEach((task) => {
      reportRows.push({
        id: task.id,
        type: "Task",
        name: task.title,
        title: task.title,
        status: task.status,
        client: getClientName(task.clientId),
        service: task.serviceName,
        priority: task.priority,
        date: recordDate(task.dueDate || task.createdAt),
        owner: task.assignedTo,
        dueDate: task.dueDate,
        rowKind: "task",
      });
    });

    snapshot.documents.forEach((document) => {
      reportRows.push({
        id: document.id,
        type: "Document",
        name: document.name,
        status: document.status,
        client: getClientName(document.clientId),
        service: document.serviceName,
        type: document.category,
        date: recordDate(document.requestedAt || document.receivedAt),
        owner: document.assignedReviewer,
        requestedAt: document.requestedAt,
        receivedAt: document.receivedAt,
        reviewer: document.assignedReviewer,
        rowKind: "document",
      });
    });

    snapshot.appointments.forEach((appointment) => {
      reportRows.push({
        id: appointment.id,
        type: "Appointment",
        name: appointment.title,
        title: appointment.title,
        status: appointment.status,
        client: getClientName(appointment.clientId),
        service: appointment.serviceName,
        type: appointment.type,
        date: recordDate(appointment.date),
        owner: appointment.assignedTo || "Owner / Administrator",
        time: appointment.time,
        location: appointment.deliveryMethod,
        rowKind: "appointment",
      });
    });

    snapshot.invoices.forEach((invoice) => {
      const outstanding = Math.max(Number(invoice.amount || 0) - Number(invoice.paidAmount || 0), 0);
      reportRows.push({
        id: invoice.id,
        type: "Invoice",
        name: invoice.id,
        invoiceId: invoice.id,
        status: invoice.status,
        client: getClientName(invoice.clientId),
        service: snapshot.engagements.find((engagement) => engagement.id === invoice.engagementId)?.serviceName || "General",
        date: recordDate(invoice.issuedAt),
        owner: "Owner / Administrator",
        dueDate: invoice.dueAt,
        invoiceDate: invoice.issuedAt,
        amount: Number(invoice.amount || 0),
        paid: Number(invoice.paidAmount || 0),
        outstanding: outstanding,
        rowKind: "billing",
      });
    });

    if (reportType === "Cross-Module / Operational") {
      const crossRows = [];

      snapshot.clients.forEach((client) => {
        const clientEngagements = snapshot.engagements.filter((engagement) => engagement.clientId === client.id);
        const openTasks = snapshot.tasks.filter((task) => task.clientId === client.id && task.status !== "Completed");
        const openInvoices = snapshot.invoices.filter((invoice) => invoice.clientId === client.id && !["Paid", "Cancelled"].includes(invoice.status));
        const upcomingAppointments = snapshot.appointments.filter((appointment) => appointment.clientId === client.id && appointment.status !== "Cancelled");
        const docs = snapshot.documents.filter((document) => document.clientId === client.id && !["Archive", "Completed"].includes(document.status));

        crossRows.push({
          id: `ops-${client.id}`,
          type: "Client Work Summary",
          name: client.displayName,
          status: client.status,
          client: client.displayName,
          service: clientEngagements.length ? clientEngagements.map((engagement) => engagement.serviceName).join(", ") : "No active service",
          date: recordDate(client.lastActivity),
          owner: client.representative || client.displayName,
          activeServices: clientEngagements.length,
          openTasks: openTasks.length,
          documentRequests: docs.length,
          upcomingAppointments: upcomingAppointments.length,
          openInvoices: openInvoices.length,
          outstandingBalance: openInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0),
          rowKind: "cross",
        });
      });
      return crossRows;
    }

    return reportRows;
  };

  const allRows = useMemo(() => buildRows(), [snapshot, reportType]);

  const availableOptions = {
    status: {
      Overview: ["all", "New", "Contacted", "Qualified", "Converted", "Waiting on Client", "In Progress", "Open", "Past Due", "Confirmed"],
      Leads: ["all", ...new Set(snapshot.leads.map((lead) => lead.status))],
      Clients: ["all", ...new Set(snapshot.clients.map((client) => client.status))],
      "Services / Engagements": ["all", ...new Set(snapshot.engagements.map((engagement) => engagement.status))],
      Tasks: ["all", ...new Set(snapshot.tasks.map((task) => task.status))],
      Documents: ["all", ...new Set(snapshot.documents.map((document) => document.status))],
      Appointments: ["all", ...new Set(snapshot.appointments.map((appointment) => appointment.status))],
      Billing: ["all", ...new Set(snapshot.invoices.map((invoice) => invoice.status))],
      "Cross-Module / Operational": ["all", ...new Set([...snapshot.leads.map((lead) => lead.status), ...snapshot.clients.map((client) => client.status), ...snapshot.tasks.map((task) => task.status), ...snapshot.invoices.map((invoice) => invoice.status)])],
    },
    type: {
      Leads: ["all", ...new Set(snapshot.leads.map((lead) => lead.audience))],
      Documents: ["all", ...new Set(snapshot.documents.map((document) => document.category))],
      Appointments: ["all", ...new Set(snapshot.appointments.map((appointment) => appointment.type))],
      Clients: ["all", ...new Set(snapshot.clients.map((client) => client.clientType))],
      "Services / Engagements": ["all", ...new Set(snapshot.engagements.map((engagement) => engagement.audience))],
      Tasks: ["all", ...new Set(snapshot.tasks.map((task) => task.priority))],
      Billing: ["all", ...new Set(snapshot.invoices.map((invoice) => invoice.status))],
      Overview: ["all", "Lead", "Client", "Service / Engagement", "Task", "Document", "Appointment", "Invoice"],
      "Cross-Module / Operational": ["all", "Client Work Summary", "Client", "Lead", "Task", "Invoice"],
    },
    service: {
      Overview: ["all", ...new Set([...snapshot.leads.map((lead) => lead.serviceInterest), ...snapshot.engagements.map((engagement) => engagement.serviceName), ...snapshot.tasks.map((task) => task.serviceName), ...snapshot.documents.map((document) => document.serviceName)])],
      Leads: ["all", ...new Set(snapshot.leads.map((lead) => lead.serviceInterest))],
      Clients: ["all", ...new Set(snapshot.engagements.map((engagement) => engagement.serviceName))],
      "Services / Engagements": ["all", ...new Set(snapshot.engagements.map((engagement) => engagement.serviceName))],
      Tasks: ["all", ...new Set(snapshot.tasks.map((task) => task.serviceName))],
      Documents: ["all", ...new Set(snapshot.documents.map((document) => document.serviceName))],
      Appointments: ["all", ...new Set(snapshot.appointments.map((appointment) => appointment.serviceName))],
      Billing: ["all", ...new Set(snapshot.engagements.map((engagement) => engagement.serviceName))],
      "Cross-Module / Operational": ["all", ...new Set([...snapshot.engagements.map((engagement) => engagement.serviceName), ...snapshot.tasks.map((task) => task.serviceName)])],
    },
    client: {
      Overview: ["all", ...new Set([...snapshot.clients.map((client) => client.displayName), ...snapshot.leads.map((lead) => lead.name)])],
      Leads: ["all", ...new Set(snapshot.leads.map((lead) => lead.name))],
      Clients: ["all", ...new Set(snapshot.clients.map((client) => client.displayName))],
      "Services / Engagements": ["all", ...new Set(snapshot.clients.map((client) => client.displayName))],
      Tasks: ["all", ...new Set(snapshot.clients.map((client) => client.displayName))],
      Documents: ["all", ...new Set(snapshot.clients.map((client) => client.displayName))],
      Appointments: ["all", ...new Set(snapshot.clients.map((client) => client.displayName))],
      Billing: ["all", ...new Set(snapshot.clients.map((client) => client.displayName))],
      "Cross-Module / Operational": ["all", ...new Set(snapshot.clients.map((client) => client.displayName))],
    },
    owner: {
      Overview: ["all", ...new Set([...snapshot.leads.map((lead) => lead.assignedTo), ...snapshot.engagements.map((engagement) => engagement.assignedTo), ...snapshot.tasks.map((task) => task.assignedTo), ...snapshot.documents.map((document) => document.assignedReviewer), ...snapshot.appointments.map((appointment) => appointment.assignedTo || "Owner / Administrator")])],
      Leads: ["all", ...new Set(snapshot.leads.map((lead) => lead.assignedTo))],
      Clients: ["all", ...new Set(snapshot.clients.map((client) => client.representative || client.displayName))],
      "Services / Engagements": ["all", ...new Set(snapshot.engagements.map((engagement) => engagement.assignedTo))],
      Tasks: ["all", ...new Set(snapshot.tasks.map((task) => task.assignedTo))],
      Documents: ["all", ...new Set(snapshot.documents.map((document) => document.assignedReviewer))],
      Appointments: ["all", ...new Set(snapshot.appointments.map((appointment) => appointment.assignedTo || "Owner / Administrator"))],
      Billing: ["all", "Owner / Administrator"],
      "Cross-Module / Operational": ["all", ...new Set(snapshot.clients.map((client) => client.representative || client.displayName))],
    },
  };

  const activeFilterKeys = filterConfig[reportType] || ["status", "client", "service", "owner"];

  const buildFilterValue = (key) => {
    if (key === "status") return statusFilter;
    if (key === "client") return clientFilter;
    if (key === "service") return serviceFilter;
    if (key === "type") return typeFilter;
    if (key === "owner") return ownerFilter;
    return "all";
  };

  const setFilterValue = (key, value) => {
    if (key === "status") setStatusFilter(value);
    if (key === "client") setClientFilter(value);
    if (key === "service") setServiceFilter(value);
    if (key === "type") setTypeFilter(value);
    if (key === "owner") setOwnerFilter(value);
  };

  const matchReportFilters = (row) => {
    if (!isWithinSelectedRange(row.date)) return false;

    if (searchValue.trim()) {
      const haystack = [
        row.name,
        row.title,
        row.status,
        row.client,
        row.service,
        row.type,
        row.owner,
        row.source,
        row.priority,
        row.invoiceId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(searchValue.trim().toLowerCase())) {
        return false;
      }
    }

    const selectedStatus = buildFilterValue("status");
    const selectedClient = buildFilterValue("client");
    const selectedService = buildFilterValue("service");
    const selectedType = buildFilterValue("type");
    const selectedOwner = buildFilterValue("owner");

    if (selectedStatus !== "all" && row.status !== selectedStatus) return false;
    if (selectedClient !== "all" && row.client !== selectedClient) return false;
    if (selectedService !== "all" && row.service !== selectedService) return false;
    if (selectedType !== "all" && (row.typeValue || row.type || row.type || row.category) !== selectedType) return false;
    if (selectedOwner !== "all" && row.owner !== selectedOwner) return false;

    if (reportType === "Leads") {
      if (row.rowKind !== "lead") return false;
    }
    if (reportType === "Clients") {
      if (row.rowKind !== "client") return false;
    }
    if (reportType === "Services / Engagements") {
      if (row.rowKind !== "engagement") return false;
    }
    if (reportType === "Tasks") {
      if (row.rowKind !== "task") return false;
    }
    if (reportType === "Documents") {
      if (row.rowKind !== "document") return false;
    }
    if (reportType === "Appointments") {
      if (row.rowKind !== "appointment") return false;
    }
    if (reportType === "Billing") {
      if (row.rowKind !== "billing") return false;
    }
    if (reportType === "Cross-Module / Operational") {
      if (row.rowKind !== "cross") return false;
    }

    return true;
  };

  const filteredRows = useMemo(() => {
    const rows = allRows.filter((row) => {
      if (reportType === "Overview") return matchReportFilters(row);
      return matchReportFilters(row);
    });

    const sortValue = (row) => {
      if (sortBy === "date") return row.date ? new Date(row.date).getTime() : 0;
      if (sortBy === "amount") return Number(row.amount || row.outstandingBalance || 0);
      if (sortBy === "status") return String(row.status || "");
      if (sortBy === "service") return String(row.service || "");
      if (sortBy === "client") return String(row.client || "");
      if (sortBy === "owner") return String(row.owner || "");
      if (sortBy === "name") return String(row.name || row.title || "");
      if (sortBy === "dueDate") return row.dueDate ? new Date(row.dueDate).getTime() : 0;
      return String(row.name || row.title || row.invoiceId || "");
    };

    const sorted = [...rows].sort((left, right) => {
      const leftValue = sortValue(left);
      const rightValue = sortValue(right);

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      const comparison = String(leftValue).localeCompare(String(rightValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });

    if (groupBy === "none") {
      return sorted;
    }

    const grouped = new Map();
    sorted.forEach((row) => {
      const key = row[groupBy] || "Unassigned";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    });

    return Array.from(grouped.entries()).flatMap(([label, entries]) => [{ __groupLabel: label, __groupRows: entries }, ...entries]);
  }, [allRows, reportType, searchValue, statusFilter, clientFilter, serviceFilter, typeFilter, ownerFilter, sortBy, sortDirection, groupBy, customStart, customEnd, datePreset]);

  const activeColumns = selectedColumns.length ? selectedColumns : defaultColumns[reportType] || ["name", "status", "date"];

  const getDisplayValue = (row, column) => {
    if (column === "name") return row.name || row.title || row.invoiceId || "—";
    if (column === "title") return row.title || row.name || "—";
    if (column === "type") return row.type || row.typeValue || "—";
    if (column === "status") return row.status || "—";
    if (column === "date") return row.date ? formatDate(row.date) : "—";
    if (column === "owner") return row.owner || "—";
    if (column === "client") return row.client || "—";
    if (column === "service") return row.service || "—";
    if (column === "source") return row.source || "—";
    if (column === "priority") return row.priority || "—";
    if (column === "nextAction") return row.nextAction || "—";
    if (column === "clientType") return row.clientType || "—";
    if (column === "lastActivity") return row.date ? formatDate(row.date) : "—";
    if (column === "startDate") return row.startDate ? formatDate(row.startDate) : "—";
    if (column === "targetDate") return row.targetDate ? formatDate(row.targetDate) : "—";
    if (column === "dueDate") return row.dueDate ? formatDate(row.dueDate) : "—";
    if (column === "requestedAt") return row.requestedAt ? formatDate(row.requestedAt) : "—";
    if (column === "receivedAt") return row.receivedAt ? formatDate(row.receivedAt) : "—";
    if (column === "reviewer") return row.reviewer || row.owner || "—";
    if (column === "invoiceId") return row.invoiceId || row.id || "—";
    if (column === "invoiceDate") return row.invoiceDate ? formatDate(row.invoiceDate) : "—";
    if (column === "amount") return row.amount !== undefined ? formatCurrency(row.amount) : "—";
    if (column === "paid") return row.paid !== undefined ? formatCurrency(row.paid) : "—";
    if (column === "outstanding") return row.outstanding !== undefined ? formatCurrency(row.outstanding) : "—";
    if (column === "time") return row.time || "—";
    if (column === "location") return row.location || "—";
    if (column === "activeServices") return row.activeServices ?? "—";
    if (column === "billingStatus") return row.billingStatus || "—";
    if (column === "serviceName") return row.service || "—";
    return row[column] || "—";
  };

  const summaryMetrics = useMemo(() => {
    if (reportType === "Leads") {
      return [
        { label: "Matching leads", value: filteredRows.length, hint: "Current results" },
        { label: "Open leads", value: snapshot.leads.filter((lead) => ["New", "Contacted", "Consultation Scheduled", "Qualified"].includes(lead.status)).length, hint: "Pipeline" },
        { label: "Converted", value: snapshot.leads.filter((lead) => lead.status === "Converted").length, hint: "Total converted" },
        { label: "New this period", value: snapshot.leads.filter((lead) => isWithinSelectedRange(lead.receivedAt)).length, hint: "Current date range" },
      ];
    }
    if (reportType === "Clients") {
      return [
        { label: "Matching clients", value: filteredRows.length, hint: "Current results" },
        { label: "Active clients", value: snapshot.clients.filter((client) => client.status === "Active").length, hint: "Live roster" },
        { label: "Onboarding", value: snapshot.clients.filter((client) => client.status === "Onboarding").length, hint: "Needs attention" },
        { label: "Business clients", value: getClientTypeCount("Business"), hint: "Business segment" },
      ];
    }
    if (reportType === "Tasks") {
      return [
        { label: "Matching tasks", value: filteredRows.length, hint: "Current results" },
        { label: "Open tasks", value: snapshot.tasks.filter((task) => task.status !== "Completed").length, hint: "Open work" },
        { label: "High priority", value: snapshot.tasks.filter((task) => task.priority === "High" && task.status !== "Completed").length, hint: "Priority queue" },
        { label: "Waiting on client", value: snapshot.tasks.filter((task) => task.status === "Waiting on Client").length, hint: "Client dependent" },
      ];
    }
    if (reportType === "Billing") {
      return [
        { label: "Matching invoices", value: filteredRows.length, hint: "Current results" },
        { label: "Outstanding", value: formatCurrency(snapshot.invoices.filter((invoice) => !["Paid", "Cancelled"].includes(invoice.status)).reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)), hint: "Open balance" },
        { label: "Past due", value: formatCurrency(snapshot.invoices.filter((invoice) => invoice.status === "Past Due").reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)), hint: "Past due balance" },
        { label: "Paid", value: formatCurrency(snapshot.invoices.filter((invoice) => invoice.status === "Paid").reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)), hint: "Revenue to date" },
      ];
    }
    const topSummary = [
      { label: "Active clients", value: snapshot.clients.filter((client) => client.status === "Active").length, hint: "Current roster" },
      { label: "Open leads", value: snapshot.leads.filter((lead) => !["Converted", "Closed / Not Moving Forward"].includes(lead.status)).length, hint: "Pipeline" },
      { label: "Open tasks", value: snapshot.tasks.filter((task) => task.status !== "Completed").length, hint: "Open work" },
      { label: "Upcoming appointments", value: snapshot.appointments.filter((item) => item.status !== "Cancelled" && item.status !== "Completed" && isWithinSelectedRange(item.date)).length, hint: "This range" },
      { label: "Outstanding balance", value: formatCurrency(snapshot.invoices.filter((invoice) => !["Paid", "Cancelled"].includes(invoice.status)).reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)), hint: "Open invoices" },
      { label: "Past due balance", value: formatCurrency(snapshot.invoices.filter((invoice) => invoice.status === "Past Due").reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)), hint: "Past due" },
    ];
    return topSummary;
  }, [reportType, filteredRows.length, snapshot, datePreset, customStart, customEnd]);

  const resetFilters = () => {
    setReportType("Overview");
    setDatePreset("30");
    setCustomStart("");
    setCustomEnd("");
    setSearchValue("");
    setStatusFilter("all");
    setClientFilter("all");
    setServiceFilter("all");
    setTypeFilter("all");
    setOwnerFilter("all");
    setSortBy("date");
    setSortDirection("desc");
    setGroupBy("none");
    setSelectedColumns(defaultColumns["Overview"]);
  };

  const clearFilters = () => {
    setSearchValue("");
    setStatusFilter("all");
    setClientFilter("all");
    setServiceFilter("all");
    setTypeFilter("all");
    setOwnerFilter("all");
    setSortBy("date");
    setSortDirection("desc");
  };

  const commonReports = [
    { id: "open-leads", label: "Open Leads", reportType: "Leads", preset: () => { setReportType("Leads"); setStatusFilter("all"); setDatePreset("30"); setClientFilter("all"); setServiceFilter("all"); setTypeFilter("all"); setOwnerFilter("all"); setSortBy("date"); setSortDirection("desc"); } },
    { id: "leads-this-month", label: "Leads This Month", reportType: "Leads", preset: () => { setReportType("Leads"); setDatePreset("month"); setStatusFilter("all"); setSortBy("date"); setSortDirection("desc"); } },
    { id: "clients-attention", label: "Clients Needing Attention", reportType: "Clients", preset: () => { setReportType("Clients"); setStatusFilter("Onboarding"); setDatePreset("30"); setSortBy("date"); setSortDirection("desc"); } },
    { id: "active-engagements", label: "Active Engagements", reportType: "Services / Engagements", preset: () => { setReportType("Services / Engagements"); setStatusFilter("In Progress"); setDatePreset("30"); } },
    { id: "overdue-tasks", label: "Overdue Tasks", reportType: "Tasks", preset: () => { setReportType("Tasks"); setStatusFilter("Waiting on Client"); setDatePreset("30"); setSortBy("dueDate"); setSortDirection("asc"); } },
    { id: "documents-awaiting-upload", label: "Documents Awaiting Upload", reportType: "Documents", preset: () => { setReportType("Documents"); setStatusFilter("Awaiting Upload"); setDatePreset("30"); } },
    { id: "upcoming-appointments", label: "Upcoming Appointments", reportType: "Appointments", preset: () => { setReportType("Appointments"); setDatePreset("30"); setStatusFilter("Confirmed"); setSortBy("date"); setSortDirection("asc"); } },
    { id: "past-due-invoices", label: "Past Due Invoices", reportType: "Billing", preset: () => { setReportType("Billing"); setStatusFilter("Past Due"); setDatePreset("30"); setSortBy("dueDate"); setSortDirection("asc"); } },
    { id: "service-pipeline", label: "Service Pipeline", reportType: "Services / Engagements", preset: () => { setReportType("Services / Engagements"); setStatusFilter("all"); setGroupBy("status"); setSortBy("date"); setSortDirection("asc"); } },
  ];

  const toggleColumn = (column) => {
    setSelectedColumns((current) => {
      if (current.includes(column)) {
        return current.filter((entry) => entry !== column);
      }
      return [...current, column];
    });
  };

  const columnOptions = reportColumnOptions[reportType] || defaultColumns[reportType] || ["name", "status", "date"];

  const handleExportCsv = () => {
    const headers = activeColumns.map((column) => column.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase()));
    const rows = filteredRows.map((row) => activeColumns.map((column) => `"${String(getDisplayValue(row, column)).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const activeFilterSummary = [
    reportType !== "Overview" ? `Report: ${reportType}` : null,
    datePreset !== "custom" ? `Range: ${dateRangeOptions.find((option) => option.value === datePreset)?.label || "Custom"}` : customStart && customEnd ? `Range: ${formatDate(customStart)} - ${formatDate(customEnd)}` : "Range: Custom",
    searchValue ? `Search: ${searchValue}` : null,
    statusFilter !== "all" ? `Status: ${statusFilter}` : null,
    clientFilter !== "all" ? `Client: ${clientFilter}` : null,
    serviceFilter !== "all" ? `Service: ${serviceFilter}` : null,
    ownerFilter !== "all" ? `Owner: ${ownerFilter}` : null,
  ].filter(Boolean);

  const reportRows = filteredRows.filter((row) => !row.__groupLabel);
  const resultsLabel = groupBy === "none" ? "Report results" : `Report results · grouped by ${groupBy}`;

  return (
    <div className="admin-module reports-module">
      <AdminPageHeader eyebrow="Reports" title="Reports" summary="Operational reporting for leads, clients, tasks, appointments, documents, and billing across the active admin datasets." />

      <AdminMetrics items={summaryMetrics.map((metric) => ({ label: metric.label, value: metric.value, hint: metric.hint }))} />

      <div className="report-control-card">
        <div className="report-controls-grid">
          <label className="report-control">
            <span>Report Type</span>
            <select value={reportType} onChange={(event) => { setReportType(event.target.value); setSelectedColumns(defaultColumns[event.target.value] || ["name", "status", "date"]); }}>
              {reportTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="report-control">
            <span>Date Range</span>
            <select value={datePreset} onChange={(event) => setDatePreset(event.target.value)}>
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="report-control report-search-control">
            <span>Search</span>
            <input type="search" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search results" />
          </label>
        </div>

        <div className="report-filter-grid">
          {activeFilterKeys.map((key) => {
            const value = buildFilterValue(key);
            const options = availableOptions[key]?.[reportType] || ["all"];
            const label = key === "status" ? "Status" : key === "client" ? "Client" : key === "service" ? "Service" : key === "type" ? "Type" : key === "owner" ? "Owner" : key;

            if (key === "client" || key === "service" || key === "owner") {
              const datalistId = `${key}-datalist`;
              const listValues = options.filter((option) => option !== "all");
              return (
                <label key={key} className="report-control">
                  <span>{label}</span>
                  <input list={datalistId} value={value} onChange={(event) => setFilterValue(key, event.target.value)} placeholder={label} />
                  <datalist id={datalistId}>
                    {listValues.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>
              );
            }

            return (
              <label key={key} className="report-control">
                <span>{label}</span>
                <select value={value} onChange={(event) => setFilterValue(key, event.target.value)}>
                  {options.map((option) => (
                    <option key={option} value={option}>{option === "all" ? "All" : option}</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>

        {datePreset === "custom" ? (
          <div className="report-custom-date-row">
            <label className="report-control">
              <span>Start Date</span>
              <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
            </label>
            <label className="report-control">
              <span>End Date</span>
              <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </label>
          </div>
        ) : null}

        <div className="report-actions-row">
          <button type="button" className="secondary-button" onClick={clearFilters}>Clear Filters</button>
          <button type="button" className="secondary-button" onClick={resetFilters}>Reset Report</button>
          <button type="button" className="primary-button" onClick={() => setReportVersion((value) => value + 1)}>Run Report</button>
        </div>
      </div>

      <div className="report-shelf">
        <section className="admin-section report-quick-section">
          <div className="admin-section-header">
            <h2>Common reports</h2>
          </div>
          <div className="report-preset-grid">
            {commonReports.map((report) => (
              <button key={report.id} type="button" className="report-preset-button" onClick={report.preset}>
                {report.label}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-section report-quick-section">
          <div className="admin-section-header">
            <h2>Saved reports</h2>
          </div>
          <div className="saved-report-ui">
            <div className="saved-report-list">
              <span className="saved-report-item disabled">Monthly Lead Pipeline</span>
              <span className="saved-report-item disabled">Tax Clients With Open Tasks</span>
              <span className="saved-report-item disabled">Past Due Accounts</span>
            </div>
            <button type="button" className="primary-button disabled-button" disabled>
              Save report unavailable
            </button>
            <small>Saved report persistence is not currently available in the existing admin data layer.</small>
          </div>
        </section>
      </div>

      <div className="report-results-card">
        <div className="admin-section-header">
          <h2>{resultsLabel}</h2>
          <div className="report-results-actions">
            <label className="report-control compact-control">
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="service">Service</option>
                <option value="client">Client</option>
                <option value="owner">Owner</option>
                <option value="status">Status</option>
                <option value="amount">Amount</option>
                <option value="dueDate">Due date</option>
              </select>
            </label>
            <button type="button" className="secondary-button" onClick={() => setSortDirection((current) => current === "asc" ? "desc" : "asc")}>{sortDirection === "asc" ? "Ascending" : "Descending"}</button>
            <label className="report-control compact-control">
              <span>Group by</span>
              <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                <option value="none">None</option>
                <option value="status">Status</option>
                <option value="service">Service</option>
                <option value="client">Client</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <button type="button" className="secondary-button" onClick={handleExportCsv}>CSV Export</button>
            <button type="button" className="secondary-button" onClick={() => window.print()}>Print</button>
          </div>
        </div>

        <div className="report-result-meta">
          <strong>{reportRows.length} records</strong>
          <span>{activeFilterSummary.length ? activeFilterSummary.join(" • ") : "No active filters"}</span>
        </div>

        <div className="report-column-picker">
          {columnOptions.map((column) => (
            <label key={column} className="report-column-toggle">
              <input type="checkbox" checked={activeColumns.includes(column)} onChange={() => toggleColumn(column)} />
              <span>{column.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}</span>
            </label>
          ))}
          <button type="button" className="secondary-button" onClick={() => setSelectedColumns(columnOptions)}>Select all</button>
          <button type="button" className="secondary-button" onClick={() => setSelectedColumns([])}>Clear all</button>
        </div>

        {reportRows.length ? (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  {activeColumns.map((column) => (
                    <th key={column}>{column.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={`${row.rowKind}-${row.id}`}>
                    {activeColumns.map((column) => (
                      <td key={`${row.id}-${column}`}>{getDisplayValue(row, column)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dashboard-empty-state report-empty-state">
            No records match the current report filters.
            <button type="button" className="primary-button" onClick={clearFilters}>Clear Filters</button>
          </div>
        )}
      </div>

      {reportType === "Overview" ? (
        <div className="report-visual-summaries">
          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Lead summary</h2>
            </div>
            <div className="chart-list">
              {[
                { label: "New", value: snapshot.leads.filter((lead) => lead.status === "New").length },
                { label: "Contacted", value: snapshot.leads.filter((lead) => lead.status === "Contacted").length },
                { label: "Qualified", value: snapshot.leads.filter((lead) => lead.status === "Qualified").length },
                { label: "Converted", value: snapshot.leads.filter((lead) => lead.status === "Converted").length },
              ].map((item) => (
                <div key={item.label} className="chart-row">
                  <div className="chart-label-row"><span>{item.label}</span><strong>{item.value}</strong></div>
                  <div className="chart-bar"><span style={{ width: `${50 + (item.value / Math.max(1, Math.max(...[...snapshot.leads.map((lead) => lead.status === "New" ? 1 : 0), 1])) * 50)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Billing summary</h2>
            </div>
            <div className="chart-list">
              {[
                { label: "Open", value: snapshot.invoices.filter((invoice) => invoice.status === "Open").length },
                { label: "Past Due", value: snapshot.invoices.filter((invoice) => invoice.status === "Past Due").length },
                { label: "Paid", value: snapshot.invoices.filter((invoice) => invoice.status === "Paid").length },
              ].map((item) => (
                <div key={item.label} className="chart-row">
                  <div className="chart-label-row"><span>{item.label}</span><strong>{item.value}</strong></div>
                  <div className="chart-bar"><span style={{ width: `${(item.value / Math.max(1, snapshot.invoices.length)) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {reportVersion}
    </div>
  );
}

function SettingsPage() {
  const [tab, setTab] = useState("team");

  const settingsTabs = [
    { id: "team", label: "Team Access" },
    { id: "workflow", label: "Workflow Defaults" },
    { id: "documents", label: "Document Rules" },
    { id: "alerts", label: "Alerts & Reminders" },
    { id: "service", label: "Service Defaults" },
    { id: "lead", label: "Lead Defaults" },
  ];

  const settingsContent = {
    team: (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th></tr></thead>
          <tbody>
            <tr><td>Owner / Administrator</td><td>owner@alchemize.example</td><td>Owner</td><td><AdminStatusBadge status="Active" tone="success" /></td><td>Today</td></tr>
            <tr><td>Jordan Martin</td><td>jordan@alchemize.example</td><td>Operations</td><td><AdminStatusBadge status="Active" tone="success" /></td><td>2 days ago</td></tr>
          </tbody>
        </table>
      </div>
    ),
    workflow: (
      <div className="setting-group">
        <label><span>New lead status</span><select defaultValue="Contacted"><option>Contacted</option><option>New</option><option>Qualified</option></select></label>
        <label><span>Default task priority</span><select defaultValue="Normal"><option>Normal</option><option>Low</option><option>High</option><option>Urgent</option></select></label>
        <label><span>Default appointment status</span><select defaultValue="Scheduled"><option>Scheduled</option><option>Confirmed</option><option>Needs Reschedule</option></select></label>
      </div>
    ),
    documents: (
      <div className="setting-group">
        <label><span>Default visibility</span><select defaultValue="Internal Only"><option>Internal Only</option><option>Client Visible</option></select></label>
        <label><span>Archive behavior</span><select defaultValue="Review before archive"><option>Review before archive</option><option>Archive immediately</option></select></label>
      </div>
    ),
    alerts: (
      <div className="setting-group">
        <label><span>Task due reminders</span><input type="checkbox" defaultChecked /></label>
        <label><span>Appointment reminders</span><input type="checkbox" defaultChecked /></label>
        <label><span>Past-due billing alerts</span><input type="checkbox" defaultChecked /></label>
      </div>
    ),
    service: (
      <div className="setting-group">
        <label><span>Default service status</span><select defaultValue="Active"><option>Active</option><option>Pending</option><option>Paused</option></select></label>
        <label><span>Default owner</span><select defaultValue="Owner / Administrator"><option>Owner / Administrator</option><option>Jordan Martin</option><option>Support</option></select></label>
      </div>
    ),
    lead: (
      <div className="setting-group">
        <label><span>Default owner</span><select defaultValue="Owner / Administrator"><option>Owner / Administrator</option><option>Operations</option></select></label>
        <label><span>Follow-up interval</span><input type="text" defaultValue="2 business days" /></label>
      </div>
    ),
  };

  return (
    <div className="admin-module">
      <AdminPageHeader eyebrow="Settings" title="Settings" summary="Use the operational defaults that keep the admin workflow consistent across leads, services, reminders, and document handling." />
      <AdminTabs tabs={settingsTabs} activeTab={tab} onChange={setTab} />
      <AdminSection title={settingsTabs.find((item) => item.id === tab)?.label || "Settings"}>{settingsContent[tab] || null}</AdminSection>
    </div>
  );
}

export {
  LeadManagementPage,
  ClientManagementPage,
  ServiceManagementPage,
  TaskManagementPage,
  DocumentManagementPage,
  AppointmentManagementPage,
  BillingManagementPage,
  InvoiceDetailPage,
  ContentManagementPage,
  ReportsPage,
  SettingsPage,
};

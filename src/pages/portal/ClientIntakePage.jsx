import { useEffect, useMemo, useRef, useState } from "react";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { portalApi } from "../../services/portal-api.js";
import "./portal.css";

const humanize = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.valueOf())
    ? String(value)
    : new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date);
};

const hasAnswer = (entry) =>
  entry?.applicability === "already_on_file" ||
  entry?.applicability === "not_applicable" ||
  (entry?.value !== "" &&
    entry?.value != null &&
    (!Array.isArray(entry.value) || entry.value.length > 0));

const clientStatus = (assignment) => {
  const status = assignment.status;
  if (status === "changes_requested" || status === "waiting_on_client") {
    return {
      key: "update_requested",
      label: "Update requested",
      detail:
        assignment.blocking_reason || "Alchemize needs an update from you.",
      action: true,
    };
  }
  if (["submitted", "under_review", "waiting_on_alchemize"].includes(status)) {
    return {
      key: "under_review",
      label: "Under review by Alchemize",
      detail: "Your required action is complete for now.",
      action: false,
    };
  }
  if (["approved", "completed"].includes(status)) {
    return {
      key: "complete",
      label: "Complete",
      detail: "No further action is required for this intake stage.",
      action: false,
    };
  }
  if (Number(assignment.completion_percentage) >= 100) {
    return {
      key: "ready",
      label: "Ready to submit",
      detail: "Your required information is complete.",
      action: true,
    };
  }
  return {
    key: "action_needed",
    label: "Action needed",
    detail: "Continue providing the requested information.",
    action: true,
  };
};

const documentStatus = (status) => {
  const states = {
    missing: ["Upload needed", true],
    requested: ["Upload needed", true],
    awaiting_upload: ["Upload needed", true],
    provided: ["Uploaded — under review", false],
    uploaded: ["Uploaded — under review", false],
    received: ["Uploaded — under review", false],
    under_review: ["Under review by Alchemize", false],
    accepted: ["Accepted — complete", false],
    already_on_file: ["Already saved", false],
    replacement_requested: ["Replacement requested", true],
    not_applicable: ["Not needed", false],
  };
  const [label, action] = states[status] || [humanize(status), false];
  return { label, action };
};

const blankAddress = {
  address_type: "business",
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "United States",
  is_primary: false,
};

const blankPerson = {
  name: "",
  role_type: "owner",
  title: "",
  email: "",
  phone: "",
  ownership_percentage: "",
  is_authorized_contact: false,
  is_decision_maker: false,
  is_primary: false,
  client_notes: "",
};

function ProfileReferences({ type, entry, profile, onChange, onRefresh }) {
  const people = type === "person_refs";
  const records = people ? profile.people || [] : profile.addresses || [];
  const [editing, setEditing] = useState(null);
  const selected = Array.isArray(entry.value) ? entry.value : [];

  const save = async (event) => {
    event.preventDefault();
    const api = people
      ? portalApi.saveProfilePerson
      : portalApi.saveProfileAddress;
    await api(editing.id || null, editing);
    setEditing(null);
    await onRefresh();
  };

  const remove = async (record) => {
    const api = people
      ? portalApi.removeProfilePerson
      : portalApi.removeProfileAddress;
    await api(record.id);
    onChange({
      ...entry,
      value: selected.filter((id) => id !== record.id),
    });
    await onRefresh();
  };

  return (
    <div className="intake-profile-editor">
      <p className="intake-profile-note">
        <strong>Using your saved profile</strong>
        Select the {people ? "owners or contacts" : "address"} that applies to
        this service. Changes made here update your reusable profile.
      </p>
      <div className="intake-profile-cards">
        {records.map((record) => (
          <article
            key={record.id}
            className={selected.includes(record.id) ? "selected" : ""}
          >
            <label>
              <input
                type="checkbox"
                checked={selected.includes(record.id)}
                onChange={(event) =>
                  onChange({
                    ...entry,
                    value: event.target.checked
                      ? [...selected, record.id]
                      : selected.filter((id) => id !== record.id),
                  })
                }
              />
              <strong>
                {people
                  ? record.name
                  : record.label || humanize(record.address_type)}
              </strong>
            </label>
            <p>
              {people
                ? `${humanize(record.role_type)}${record.title ? ` · ${record.title}` : ""}${record.ownership_percentage != null ? ` · ${record.ownership_percentage}%` : ""}`
                : `${record.line1}, ${record.city}, ${record.state} ${record.postal_code}`}
            </p>
            <small>Saved to your profile</small>
            <div className="portal-action-group">
              <button type="button" onClick={() => setEditing({ ...record })}>
                Edit
              </button>
              <button type="button" onClick={() => remove(record)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
      {!records.length ? (
        <p>No saved {people ? "owners or contacts" : "addresses"} yet.</p>
      ) : null}
      <button
        type="button"
        className="portal-action-button"
        onClick={() =>
          setEditing(people ? { ...blankPerson } : { ...blankAddress })
        }
      >
        Add {people ? "owner or contact" : "another address"}
      </button>
      {editing ? (
        <form className="intake-inline-editor" onSubmit={save}>
          {people ? (
            <>
              <label>
                <span>Full name</span>
                <input
                  required
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Relationship</span>
                <select
                  value={editing.role_type}
                  onChange={(event) =>
                    setEditing({ ...editing, role_type: event.target.value })
                  }
                >
                  {[
                    "owner",
                    "member",
                    "manager",
                    "officer",
                    "authorized_representative",
                    "authorized_contact",
                    "decision_maker",
                    "administrative_contact",
                    "other",
                  ].map((value) => (
                    <option key={value} value={value}>
                      {humanize(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Role / title</span>
                <input
                  value={editing.title || ""}
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={editing.email || ""}
                  onChange={(event) =>
                    setEditing({ ...editing, email: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  type="tel"
                  value={editing.phone || ""}
                  onChange={(event) =>
                    setEditing({ ...editing, phone: event.target.value })
                  }
                />
              </label>
              {["owner", "member"].includes(editing.role_type) ? (
                <label>
                  <span>Ownership percentage (if already determined)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editing.ownership_percentage ?? ""}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        ownership_percentage: event.target.value,
                      })
                    }
                  />
                </label>
              ) : null}
              <label className="intake-check-label">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_authorized_contact)}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      is_authorized_contact: event.target.checked,
                    })
                  }
                />
                Authorized contact
              </label>
              <label className="intake-check-label">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_decision_maker)}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      is_decision_maker: event.target.checked,
                    })
                  }
                />
                Primary decision maker
              </label>
            </>
          ) : (
            <>
              <label>
                <span>Address type</span>
                <select
                  value={editing.address_type}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      address_type: event.target.value,
                    })
                  }
                >
                  {[
                    "principal",
                    "business",
                    "mailing",
                    "registered_office",
                    "operating_location",
                    "billing",
                    "other",
                  ].map((value) => (
                    <option key={value} value={value}>
                      {humanize(value)}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["label", "Label (optional)"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2"],
                ["city", "City"],
                ["state", "State / province"],
                ["postal_code", "Postal code"],
                ["country", "Country"],
              ].map(([key, fieldLabel]) => (
                <label key={key}>
                  <span>{fieldLabel}</span>
                  <input
                    required={!["label", "line2"].includes(key)}
                    value={editing[key] || ""}
                    onChange={(event) =>
                      setEditing({ ...editing, [key]: event.target.value })
                    }
                  />
                </label>
              ))}
            </>
          )}
          <div className="portal-action-group">
            <button>Save to profile</button>
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function Field({
  field,
  response,
  onChange,
  profile,
  onProfileChanged,
  locked,
}) {
  const entry = response || {
    value: field.type === "multiselect" ? [] : "",
    applicability: field.required ? "required" : "optional",
  };
  const setValue = (value) => onChange({ ...entry, value });
  const common = {
    id: field.key,
    value: entry.value ?? "",
    onChange: (event) => setValue(event.target.value),
    required: field.required,
    disabled:
      locked ||
      ["already_on_file", "not_applicable"].includes(entry.applicability),
    "aria-describedby": field.helper ? `${field.key}-help` : undefined,
  };
  const reference = ["address_refs", "person_refs"].includes(field.type);
  const saved = entry.applicability === "already_on_file";

  return (
    <div className="intake-field" id={`field-${field.key}`}>
      <label htmlFor={reference ? undefined : field.key}>
        <strong>{field.label}</strong>
        <small>{field.required ? "Required" : "Optional"}</small>
      </label>
      {field.helper ? (
        <p className="intake-field-help" id={`${field.key}-help`}>
          {field.helper}
        </p>
      ) : null}
      {saved ? (
        <p className="intake-saved-note">
          <strong>Already saved in your profile.</strong> This information is
          being reused for this service.
        </p>
      ) : null}
      {["textarea", "people", "addresses"].includes(field.type) ? (
        <textarea {...common} rows={4} />
      ) : null}
      {reference ? (
        <ProfileReferences
          type={field.type}
          entry={entry}
          profile={profile}
          onChange={onChange}
          onRefresh={onProfileChanged}
        />
      ) : null}
      {field.type === "select" ? (
        <select {...common}>
          <option value="">Select an answer</option>
          {field.options?.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {field.type === "multiselect" ? (
        <div className="intake-options">
          {field.options?.map((option) => (
            <label key={option.value}>
              <input
                type="checkbox"
                disabled={locked}
                checked={(entry.value || []).includes(option.value)}
                onChange={(event) =>
                  setValue(
                    event.target.checked
                      ? [...(entry.value || []), option.value]
                      : (entry.value || []).filter(
                          (item) => item !== option.value,
                        ),
                  )
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : null}
      {![
        "textarea",
        "people",
        "addresses",
        "address_refs",
        "person_refs",
        "select",
        "multiselect",
      ].includes(field.type) ? (
        <input {...common} type={field.type || "text"} />
      ) : null}
      {!field.required && !hasAnswer(entry) ? (
        <small className="intake-optional-note">
          You may leave this blank if it does not apply.
        </small>
      ) : null}
    </div>
  );
}

function IntakeCard({ item, onOpen }) {
  const status = clientStatus(item);
  const remaining = Math.max(
    0,
    Math.ceil((100 - Number(item.completion_percentage || 0)) / 10),
  );
  return (
    <article
      className={`intake-service-card ${status.key === "complete" ? "intake-card-complete" : ""}`}
    >
      <div>
        <span className={`intake-client-status ${status.key}`}>
          {status.label}
        </span>
        <h2>{item.engagement_title}</h2>
        <p>{status.detail}</p>
        <progress
          className="portal-intake-progress"
          aria-label={`${item.engagement_title} completion`}
          value={Number(item.completion_percentage) || 0}
          max={100}
        />
        <div className="intake-service-meta">
          <span>
            {item.completion_percentage}% of your information complete
          </span>
          {item.due_date ? <span>Due {formatDate(item.due_date)}</span> : null}
          {item.submitted_at ? (
            <span>Submitted {formatDate(item.submitted_at)}</span>
          ) : null}
        </div>
        {status.action && remaining ? (
          <small>Continue to review the remaining required items.</small>
        ) : null}
      </div>
      <button className="portal-action-button" onClick={() => onOpen(item.id)}>
        {["submitted", "under_review", "approved", "completed"].includes(
          item.status,
        )
          ? "View submission"
          : Number(item.completion_percentage) >= 100
            ? "Review and submit"
            : "Continue intake"}
      </button>
    </article>
  );
}

export default function ClientIntakePage() {
  const [list, setList] = useState(null);
  const [current, setCurrent] = useState(null);
  const [responses, setResponses] = useState({});
  const [section, setSection] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const summaryRef = useRef(null);

  const loadList = () => portalApi.intakes().then(setList);
  const open = async (id) => {
    const data = await portalApi.intake(id);
    setCurrent(data);
    setResponses(data.responses || {});
    setSection(0);
    setConfirmation(null);
    setFeedback("");
  };

  useEffect(() => {
    portalApi.intakes().then((data) => {
      setList(data);
      const assignment = new window.URLSearchParams(window.location.search).get(
        "assignment",
      );
      if (assignment && data.items.some((item) => item.id === assignment)) {
        open(assignment);
      }
    });
  }, []);

  const refreshCurrent = async () => {
    const id = current.assignment.public_id || current.assignment.id;
    const data = await portalApi.intake(id);
    setCurrent(data);
    setResponses(data.responses || {});
  };

  const uploadRequirement = async (requirement, moduleKey) => {
    const assignmentId = current.assignment.public_id || current.assignment.id;
    const result = await portalApi.prepareRequirementUpload(
      assignmentId,
      requirement.id,
    );
    const returnPath = `/client-portal/intake?assignment=${encodeURIComponent(assignmentId)}&section=${encodeURIComponent(moduleKey)}`;
    const context = `${requirement.requirement_name} — ${current.assignment.engagement_title}`;
    window.location.assign(
      `/client-portal/documents?upload=${encodeURIComponent(result.document_id)}&return=${encodeURIComponent(returnPath)}&context=${encodeURIComponent(context)}`,
    );
  };

  const useExisting = async (requirement, documentId) => {
    if (!documentId) return;
    const assignmentId = current.assignment.public_id || current.assignment.id;
    await portalApi.useExistingForRequirement(
      assignmentId,
      requirement.id,
      documentId,
    );
    await open(assignmentId);
  };

  const values = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(responses).map(([key, item]) => [key, item.value]),
      ),
    [responses],
  );
  const modules = current?.definition.modules || [];
  const active = modules[section];
  const visible = (field) =>
    !field.show_when ||
    values[field.show_when.field] === field.show_when.equals;
  const visibleFields = (active?.fields || []).filter(visible);
  const locked = current
    ? ["submitted", "under_review", "approved", "completed"].includes(
        current.assignment.status,
      )
    : false;

  useEffect(() => {
    if (!current) return;
    const sectionKey = new window.URLSearchParams(window.location.search).get(
      "section",
    );
    const index = modules.findIndex((module) => module.key === sectionKey);
    if (index >= 0) setSection(index);
  }, [current, modules]);

  const missingItems = useMemo(() => {
    if (!current) return [];
    const missing = [];
    modules.forEach((module, moduleIndex) => {
      module.fields.filter(visible).forEach((field) => {
        if (field.required && !hasAnswer(responses[field.key])) {
          missing.push({
            key: `field-${field.key}`,
            label: field.label,
            section: module.title,
            sectionIndex: moduleIndex,
          });
        }
      });
      (module.requirements || []).forEach((definition) => {
        const requirement = current.requirements.find(
          (item) => item.requirement_key === definition.key,
        );
        if (
          requirement?.necessity === "required" &&
          documentStatus(requirement.status).action
        ) {
          missing.push({
            key: `requirement-${requirement.id}`,
            label: requirement.requirement_name,
            section: module.title,
            sectionIndex: moduleIndex,
          });
        }
      });
    });
    return missing;
  }, [current, modules, responses, values]);

  const save = async ({ announce = true } = {}) => {
    setBusy(true);
    setFeedback("");
    try {
      const result = await portalApi.saveIntake(
        current.assignment.public_id || current.assignment.id,
        responses,
      );
      if (announce) {
        setFeedback(
          `Your information is saved. ${result.completion_percentage}% of your required actions are complete.`,
        );
      }
      await refreshCurrent();
      return true;
    } catch (error) {
      setFeedback(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (missingItems.length) {
      setFeedback("Please complete the items that still need your attention.");
      summaryRef.current?.focus();
      return;
    }
    setBusy(true);
    setFeedback("");
    const assignment = current.assignment;
    try {
      await portalApi.saveIntake(
        assignment.public_id || assignment.id,
        responses,
      );
      await portalApi.submitIntake(assignment.public_id || assignment.id);
      setConfirmation({
        id: assignment.public_id || assignment.id,
        title: assignment.engagement_title,
        submittedAt: new Date().toISOString(),
      });
      await loadList();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (!list) {
    return (
      <div className="portal-page">
        <div className="portal-empty-state">Loading your services…</div>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="portal-page">
        <section className="intake-confirmation" role="status">
          <span className="intake-confirmation-mark" aria-hidden="true">
            ✓
          </span>
          <span className="section-kicker">Submitted successfully</span>
          <h1>Your intake has been submitted.</h1>
          <p className="intake-confirmation-service">{confirmation.title}</p>
          <p>Submitted {formatDate(confirmation.submittedAt)}</p>
          <div className="intake-next-step">
            <h2>What happens next</h2>
            <p>
              Alchemize will review the information and documents you provided.
              No additional action is required right now. If anything else is
              needed, it will appear here as an update request.
            </p>
          </div>
          <div className="portal-action-group">
            <button
              className="portal-action-button"
              onClick={() => {
                setConfirmation(null);
                setCurrent(null);
              }}
            >
              Return to your services
            </button>
            <button onClick={() => open(confirmation.id)}>
              View submitted intake
            </button>
            <Link to="/client-portal/documents">View documents</Link>
          </div>
        </section>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="portal-page">
        <header className="portal-page-header">
          <div>
            <span className="section-kicker">Your current services</span>
            <h1>Onboarding and intake</h1>
          </div>
          <p>
            Choose a service to continue. Information saved in your profile can
            be reused, so you do not need to enter it again for every project.
          </p>
        </header>
        {list.items.length ? (
          <div className="intake-service-grid">
            {list.items.map((item) => (
              <IntakeCard key={item.id} item={item} onOpen={open} />
            ))}
          </div>
        ) : (
          <div className="portal-empty-state">
            You do not have any active onboarding requests right now.
          </div>
        )}
      </div>
    );
  }

  const status = clientStatus(current.assignment);
  return (
    <div className="portal-page intake-workspace">
      <header className="portal-page-header intake-page-header">
        <div>
          <span className="section-kicker">{current.definition.label}</span>
          <h1>{current.assignment.engagement_title}</h1>
          <span className={`intake-client-status ${status.key}`}>
            {status.label}
          </span>
        </div>
        <div className="intake-progress-copy">
          <strong>{current.assignment.completion_percentage}%</strong>
          <span>of your required actions complete</span>
          {current.assignment.due_date ? (
            <small>Due {formatDate(current.assignment.due_date)}</small>
          ) : null}
        </div>
      </header>
      <p className="intake-status-explanation">{status.detail}</p>
      <div
        className="intake-progress"
        aria-label={`${current.assignment.completion_percentage}% of client actions complete`}
      >
        <span
          style={{ width: `${current.assignment.completion_percentage}%` }}
        />
      </div>

      {!locked && missingItems.length ? (
        <section
          className="intake-missing-summary"
          ref={summaryRef}
          tabIndex="-1"
          aria-labelledby="missing-title"
        >
          <h2 id="missing-title">
            {missingItems.length}{" "}
            {missingItems.length === 1 ? "item needs" : "items need"} your
            attention
          </h2>
          <ul>
            {missingItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setSection(item.sectionIndex)}
                >
                  {item.label} <span>— {item.section}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {locked ? (
        <div className="intake-review-notice">
          <strong>{status.label}</strong>
          <p>
            Your information is saved and cannot be edited while Alchemize is
            reviewing it.
          </p>
          {current.assignment.client_visible_review_note ? (
            <p>{current.assignment.client_visible_review_note}</p>
          ) : null}
        </div>
      ) : null}

      <div className="intake-layout">
        <nav aria-label="Intake sections">
          {modules.map((module, index) => (
            <button
              type="button"
              key={module.key}
              className={section === index ? "active" : ""}
              aria-current={section === index ? "step" : undefined}
              onClick={() => setSection(index)}
            >
              <span aria-hidden="true">{index < section ? "✓" : "○"}</span>{" "}
              {module.title}
            </button>
          ))}
        </nav>
        <section className="portal-record-panel">
          <span className="intake-section-scope">For this service</span>
          <h2>{active?.title}</h2>
          {active?.intro ? (
            <p className="intake-section-intro">{active.intro}</p>
          ) : null}
          {visibleFields.map((field) => (
            <Field
              key={field.key}
              field={field}
              response={responses[field.key]}
              onChange={(value) =>
                setResponses({ ...responses, [field.key]: value })
              }
              profile={current.profile}
              onProfileChanged={refreshCurrent}
              locked={locked}
            />
          ))}
          {active?.requirements?.length ? (
            <div className="intake-requirements">
              <h3>Requested documents and assets</h3>
              <p>
                Uploads use your secure Documents area. Files already accepted
                for your account may be reused when eligible.
              </p>
              {active.requirements.map((definition) => {
                const requirement = current.requirements.find(
                  (item) => item.requirement_key === definition.key,
                );
                if (!requirement) return null;
                const requirementStatus = documentStatus(requirement.status);
                return (
                  <article
                    className="intake-requirement-card"
                    id={`requirement-${requirement.id}`}
                    key={requirement.id}
                  >
                    <div>
                      <strong>{requirement.requirement_name}</strong>
                      <span
                        className={`intake-document-status ${requirementStatus.action ? "action" : "waiting"}`}
                      >
                        {requirementStatus.label}
                      </span>
                      <small>
                        {humanize(requirement.necessity)} for this service
                      </small>
                      {requirement.filename ? (
                        <p>{requirement.filename}</p>
                      ) : (
                        <p>No file is currently attached.</p>
                      )}
                      {requirement.notes ? (
                        <p className="portal-pending-note">
                          Alchemize note: {requirement.notes}
                        </p>
                      ) : null}
                    </div>
                    {!locked && requirementStatus.action ? (
                      <button
                        type="button"
                        onClick={() =>
                          uploadRequirement(requirement, active.key)
                        }
                      >
                        {requirement.status === "replacement_requested"
                          ? "Upload replacement"
                          : `Upload ${requirement.requirement_name}`}
                      </button>
                    ) : null}
                    {!locked &&
                    requirement.eligible_documents?.length &&
                    !["accepted", "already_on_file"].includes(
                      requirement.status,
                    ) ? (
                      <label>
                        <span>
                          Use a document already saved to your account
                        </span>
                        <select
                          defaultValue=""
                          onChange={(event) =>
                            useExisting(requirement, event.target.value)
                          }
                        >
                          <option value="">Choose an accepted file</option>
                          {requirement.eligible_documents.map((document) => (
                            <option key={document.id} value={document.id}>
                              {document.original_filename ||
                                document.document_name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
          {!locked ? (
            <div className="portal-action-group intake-workspace-actions">
              <button disabled={busy} onClick={() => save()}>
                Save and continue later
              </button>
              {section < modules.length - 1 ? (
                <button
                  className="portal-action-button"
                  disabled={busy}
                  onClick={async () => {
                    const saved = await save({ announce: false });
                    if (saved) setSection(section + 1);
                  }}
                >
                  Next section
                </button>
              ) : (
                <button
                  className="portal-action-button"
                  disabled={busy}
                  onClick={submit}
                >
                  Submit to Alchemize
                </button>
              )}
            </div>
          ) : null}
          {feedback ? (
            <p
              role={
                feedback.toLowerCase().includes("please") ? "alert" : "status"
              }
              className="portal-feedback"
            >
              {feedback}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

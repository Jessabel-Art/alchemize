import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminPageHeader } from "../../components/admin/admin-components.jsx";
import { settings, clients } from "../../services/admin-api.js";
import "./admin-settings.css";
import {
  TeamAccessSettings,
  AccountSecuritySettings,
} from "./AdminAccessSettings.jsx";
import AdminDataMaintenance from "./AdminDataMaintenance.jsx";

const sections = [
  ["business", "Business"],
  ["team-access", "Team & Access"],
  ["notifications", "Notifications"],
  ["account-security", "Account & Security"],
  ["data-maintenance", "Data Maintenance"],
  ["integrations", "System & Integrations"],
];
const formatIntegrationTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
};
const groups = [
  [
    "Business Identity",
    [
      [
        "business_name",
        "Business name",
        "text",
        { required: true, maxLength: 150 },
      ],
      [
        "business_email",
        "Business notification email",
        "email",
        { maxLength: 254 },
      ],
      [
        "default_client_language",
        "Default client language",
        [
          ["en", "English"],
          ["es", "Spanish"],
        ],
      ],
      ["timezone", "Timezone", "timezone"],
    ],
  ],
  [
    "Scheduling Defaults",
    [
      [
        "appointment_default_duration",
        "Default appointment duration (minutes)",
        "number",
        { min: 15, max: 480, required: true },
      ],
      [
        "default_meeting_method",
        "Default meeting method",
        [
          ["phone_call", "Phone call"],
          ["video_call", "Video call"],
          ["in_person", "In person"],
        ],
      ],
      [
        "appointment_reminder_minutes",
        "Default reminder timing (minutes before)",
        "number",
        { min: 1, max: 43200 },
      ],
    ],
  ],
  [
    "Ownership & Workflow Defaults",
    [
      ["default_owner_user_id", "Default owner / administrator", "owner"],
      ["default_lead_owner_user_id", "Default owner for new leads", "owner"],
      [
        "default_engagement_owner_user_id",
        "Default owner for new engagements",
        "owner",
      ],
      [
        "prospect_follow_up_days",
        "Default prospect follow-up period (calendar days)",
        "number",
        { min: 1, max: 365 },
      ],
      [
        "document_request_due_days",
        "Default document-request due period (calendar days)",
        "number",
        { min: 1, max: 365 },
      ],
    ],
  ],
  [
    "Billing Defaults",
    [
      [
        "invoice_payment_terms_days",
        "Default invoice payment terms (days; 0 = due on receipt)",
        "number",
        { min: 0, max: 365 },
      ],
      [
        "invoice_footer",
        "Default invoice memo / footer",
        "textarea",
        { maxLength: 2000 },
      ],
    ],
  ],
];

export default function AdminSettingsPage() {
  const [params, setParams] = useSearchParams();
  const section =
    sections.find(([id]) => id === params.get("section")) || sections[0];
  const [values, setValues] = useState(null);
  const [owners, setOwners] = useState([]);
  const [ownerError, setOwnerError] = useState("");
  const [businessEditGroup, setBusinessEditGroup] = useState(null);
  const [businessBaseline, setBusinessBaseline] = useState(null);
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: "",
    message: "",
  });
  const [integrationStatus, setIntegrationStatus] = useState({
    loading: true,
    error: "",
    data: null,
  });
  const [checking, setChecking] = useState({});
  const [checkResults, setCheckResults] = useState({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    settings
      .get()
      .then((data) => {
        if (active) {
          setValues(data);
          setState({ loading: false, saving: false, error: "", message: "" });
        }
      })
      .catch((error) => {
        if (active)
          setState({
            loading: false,
            saving: false,
            error: error.message,
            message: "",
          });
      });
    clients
      .team()
      .then((rows) => {
        if (active) {
          const nextRows = rows || [];
          setOwners(nextRows);
          setOwnerError("");
        }
      })
      .catch(() => {
        if (active) {
          setOwnerError(
            "Owner choices could not be loaded. Existing selections are retained.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (section[0] !== "business") {
      return undefined;
    }
    if (businessEditGroup === null) {
      setBusinessEditGroup(null);
    }
  }, [section, businessEditGroup]);
  useEffect(() => {
    if (section[0] !== "integrations") {
      return undefined;
    }
    let active = true;
    setIntegrationStatus({ loading: true, error: "", data: null });
    settings
      .integrations()
      .then((status) => {
        if (active)
          setIntegrationStatus({ loading: false, error: "", data: status });
      })
      .catch((error) => {
        if (active)
          setIntegrationStatus({
            loading: false,
            error: error.message || "Integration status could not be loaded.",
            data: null,
          });
      });
    return () => {
      active = false;
    };
  }, [section]);
  const runIntegrationCheck = async (slug) => {
    if (checking[slug]) return;
    setChecking((current) => ({ ...current, [slug]: true }));
    setCheckResults((current) => ({ ...current, [slug]: null }));
    try {
      const result = await settings.checkIntegration(slug);
      setIntegrationStatus((current) => ({
        ...current,
        data: {
          ...current.data,
          integrations: { ...current.data?.integrations, [slug]: result },
        },
      }));
      setCheckResults((current) => ({
        ...current,
        [slug]:
          result?.status === "Connected"
            ? { type: "success", message: "Connection successful." }
            : {
                type: "error",
                message: result?.last_error || "Connection check failed.",
              },
      }));
    } catch (error) {
      setCheckResults((current) => ({
        ...current,
        [slug]: {
          type: "error",
          message: error.message || "Connection check failed.",
        },
      }));
    } finally {
      setChecking((current) => ({ ...current, [slug]: false }));
    }
  };
  const change = (key, value) =>
    setValues((current) => ({ ...current, [key]: value }));
  const save = async (event, successMessage = "Settings saved.") => {
    event.preventDefault();
    setState((current) => ({
      ...current,
      saving: true,
      error: "",
      message: "",
    }));
    try {
      const saved = await settings.update(values);
      setValues(saved);
      setState({
        loading: false,
        saving: false,
        error: "",
        message: successMessage,
      });
    } catch (error) {
      setState({
        loading: false,
        saving: false,
        error: error.message,
        message: "",
      });
    }
  };
  const beginBusinessEdit = (title) => {
    setBusinessBaseline(JSON.parse(JSON.stringify(values || {})));
    setBusinessEditGroup(title);
  };
  const cancelBusinessEdit = () => {
    if (businessBaseline) {
      setValues(businessBaseline);
    }
    setBusinessEditGroup(null);
    setBusinessBaseline(null);
  };
  const field = ([key, label, type, attributes = {}]) => {
    let options = Array.isArray(type) ? type : null;
    if (type === "timezone")
      options = [
        ...new Set([values.timezone, ...Intl.supportedValuesOf("timeZone")]),
      ]
        .filter(Boolean)
        .map((zone) => [zone, zone.replaceAll("_", " ")]);
    if (type === "owner") {
      options = owners
        .filter(
          (owner) =>
            owner.status === "active" &&
            ["owner-admin", "administrator", "staff"].includes(owner.role_slug),
        )
        .map((owner) => [owner.id, owner.display_name]);
      if (values[key] && !options.some(([id]) => id === values[key]))
        options.push([values[key], "Previously selected owner (unavailable)"]);
    }
    const props = {
      id: `business-${key}`,
      value: values[key] ?? "",
      ...attributes,
      onChange: (event) =>
        change(
          key,
          type === "number"
            ? event.target.value === ""
              ? null
              : Number(event.target.value)
            : event.target.value ||
                (attributes.required || key === "business_email" ? "" : null),
        ),
    };
    return (
      <label key={key} htmlFor={props.id}>
        <span>{label}</span>
        {options ? (
          <select
            {...props}
            required={type === "timezone"}
            disabled={type === "owner" && Boolean(ownerError)}
          >
            {type !== "timezone" && <option value="">Not configured</option>}
            {options.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea {...props} rows={3} />
        ) : (
          <input
            {...props}
            type={type}
            step={type === "number" ? 1 : undefined}
          />
        )}
        {key === "business_email" && (
          <small>
            Operational notifications only. Your admin login email is separate.
          </small>
        )}
      </label>
    );
  };
  const formatSettingValue = (key, value) => {
    if (value === null || value === undefined || value === "") {
      return "Not configured";
    }
    if (key === "portal_message_email_notifications") {
      return value ? "Enabled" : "Disabled";
    }
    if (key === "staff_notification_delivery_mode") {
      return (
        {
          both: "Email + dashboard",
          email: "Email only",
          dashboard: "Dashboard only",
          disabled: "Disabled",
        }[value] || value
      );
    }
    if (key === "default_client_language") {
      return value === "en" ? "English" : value === "es" ? "Spanish" : value;
    }
    if (key === "default_meeting_method") {
      return (
        {
          phone_call: "Phone call",
          video_call: "Video call",
          in_person: "In person",
        }[value] || value
      );
    }
    if (key === "timezone") {
      return String(value).replaceAll("_", " ");
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };
  return (
    <div className="admin-module admin-settings-workspace">
      <AdminPageHeader
        eyebrow="Administration"
        title="Settings"
        summary="Business configuration and portal preferences."
      />
      <div className="settings-layout">
        <nav className="settings-navigation" aria-label="Settings sections">
          {sections.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-current={section[0] === id ? "page" : undefined}
              onClick={() =>
                setParams((current) => {
                  const next = new URLSearchParams(current);
                  next.set("section", id);
                  return next;
                })
              }
            >
              {label}
            </button>
          ))}
        </nav>
        <section
          className="settings-content"
          aria-labelledby="settings-section-title"
        >
          <h2 id="settings-section-title">{section[1]}</h2>
          {section[0] === "team-access" ? (
            <TeamAccessSettings />
          ) : section[0] === "notifications" ? (
            <>
              {state.loading ? (
                <p role="status">Loading notification settings…</p>
              ) : values ? (
                <form
                  className="business-settings-form"
                  onSubmit={(event) =>
                    save(event, "Notification settings saved.")
                  }
                >
                  <p className="settings-note">
                    Operational staff notifications are routed through the
                    existing Resend and dashboard notification infrastructure.
                    This page only controls which delivery channels are enabled.
                  </p>
                  <fieldset disabled={state.saving}>
                    <legend>Operational notification settings</legend>
                    <div className="business-fields">
                      <label htmlFor="notifications-staff_delivery_mode">
                        <span>Operational notification delivery mode</span>
                        <select
                          id="notifications-staff_delivery_mode"
                          value={
                            values.staff_notification_delivery_mode ?? "both"
                          }
                          onChange={(event) =>
                            change(
                              "staff_notification_delivery_mode",
                              event.target.value,
                            )
                          }
                        >
                          <option value="both">Email + Admin Dashboard</option>
                          <option value="email">Email only</option>
                          <option value="dashboard">
                            Admin Dashboard only
                          </option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </label>
                    </div>
                    <p>
                      Email routes to the configured business notification
                      email. Dashboard sends the same event into the existing
                      staff notification feed and read history.
                    </p>
                  </fieldset>
                  <div className="settings-save">
                    <button className="primary-button" disabled={state.saving}>
                      {state.saving ? "Saving…" : "Save notification settings"}
                    </button>
                    {state.message && <p role="status">{state.message}</p>}
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setState((current) => ({
                      ...current,
                      loading: true,
                      error: "",
                    }));
                    setAttempt((current) => current + 1);
                  }}
                >
                  Retry loading settings
                </button>
              )}
              {state.error && (
                <p role="alert" className="admin-feedback">
                  {state.error}
                </p>
              )}
            </>
          ) : section[0] === "data-maintenance" ? (
            <AdminDataMaintenance />
          ) : section[0] === "integrations" ? (
            <>
              <p className="settings-note">
                Safe operational status only. This page reports configuration
                and recent activity without exposing secrets, credentials, or
                raw provider payloads.
              </p>
              {integrationStatus.loading ? (
                <p role="status">Loading system status…</p>
              ) : integrationStatus.error ? (
                <p role="alert" className="admin-feedback">
                  {integrationStatus.error}
                </p>
              ) : (
                <div className="integrations-grid">
                  {[
                    ["resend", "Resend"],
                    ["stripe", "Stripe"],
                    ["google_calendar", "Google Calendar"],
                    ["google_drive", "Google Drive"],
                  ].map(([slug, label]) => {
                    const item = integrationStatus.data?.integrations?.[slug];
                    const isChecking = Boolean(checking[slug]);
                    const result = checkResults[slug];
                    const status = isChecking
                      ? "Checking"
                      : item?.status || "Unknown";
                    return (
                      <div key={slug} className="integration-card">
                        <div className="integration-card-header">
                          <h3>{label}</h3>
                          <span
                            className={`status-pill status-${status
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {isChecking ? "Checking…" : status}
                          </span>
                        </div>
                        <dl>
                          <div>
                            <dt>Configured</dt>
                            <dd>{item?.configured ? "Yes" : "No"}</dd>
                          </div>
                          {slug === "google_calendar" ? (
                            <>
                              <div>
                                <dt>Calendar access</dt>
                                <dd>
                                  {item?.calendar_accessible === true
                                    ? "Available"
                                    : item?.calendar_accessible === false
                                      ? "Not available"
                                      : "Not yet checked"}
                                </dd>
                              </div>
                              <div>
                                <dt>Google Meet</dt>
                                <dd>
                                  {item?.meet_capable === true
                                    ? "Available"
                                    : item?.meet_capable === false
                                      ? "Not available"
                                      : "Not yet checked"}
                                </dd>
                              </div>
                            </>
                          ) : null}
                          <div>
                            <dt>Last check</dt>
                            <dd>
                              {formatIntegrationTimestamp(item?.last_check) ||
                                "Not available"}
                            </dd>
                          </div>
                          <div>
                            <dt>Last success</dt>
                            <dd>
                              {formatIntegrationTimestamp(item?.last_success) ||
                                "Not available"}
                            </dd>
                          </div>
                          <div>
                            <dt>Last error</dt>
                            <dd>{item?.last_error || "None recorded"}</dd>
                          </div>
                        </dl>
                        {result ? (
                          <p
                            role={result.type === "error" ? "alert" : "status"}
                            className={
                              result.type === "error"
                                ? "admin-feedback"
                                : "admin-feedback success"
                            }
                          >
                            {result.message}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={isChecking}
                          onClick={() => runIntegrationCheck(slug)}
                        >
                          {isChecking ? "Checking…" : "Check Connection"}
                        </button>
                      </div>
                    );
                  })}
                  <div className="integration-card system-card">
                    <div className="integration-card-header">
                      <h3>System</h3>
                      <span
                        className={`status-pill status-${(
                          integrationStatus.data?.system?.database?.status ||
                          "unknown"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {integrationStatus.data?.system?.database?.status ||
                          "Not available"}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>Database</dt>
                        <dd>
                          {integrationStatus.data?.system?.database?.status ||
                            "Not available"}
                        </dd>
                      </div>
                      <div>
                        <dt>Application version</dt>
                        <dd>
                          {integrationStatus.data?.system?.application
                            ?.version || "Not available"}
                        </dd>
                      </div>
                      <div>
                        <dt>Build</dt>
                        <dd>
                          {integrationStatus.data?.system?.application?.build ||
                            "Not available"}
                        </dd>
                      </div>
                      <div>
                        <dt>Runtime</dt>
                        <dd>
                          {integrationStatus.data?.system?.application
                            ?.runtime || "Not available"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </>
          ) : section[0] === "account-security" ? (
            <AccountSecuritySettings />
          ) : section[0] !== "business" ? (
            <p>This section is reserved for a later Settings phase.</p>
          ) : (
            <>
              {state.loading ? (
                <p role="status">Loading business settings…</p>
              ) : values ? (
                <form
                  className="business-settings-form"
                  onSubmit={(event) => save(event, "Settings saved.")}
                >
                  <p className="settings-note">
                    Additional defaults are saved here for the upcoming workflow
                    phases. Current workflows continue using their existing
                    behavior except for the existing appointment duration and
                    portal message email settings.
                  </p>
                  {groups.map(([title, fields]) => {
                    const isEditing = businessEditGroup === title;
                    return (
                      <fieldset key={title} disabled={state.saving}>
                        <div className="business-section-header">
                          <legend>{title}</legend>
                          <div className="business-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                isEditing
                                  ? cancelBusinessEdit()
                                  : beginBusinessEdit(title)
                              }
                            >
                              {isEditing
                                ? "Cancel"
                                : `Edit ${title.toLowerCase()}`}
                            </button>
                          </div>
                        </div>
                        {!isEditing && (
                          <dl className="business-summary">
                            {fields.map(([key, label]) => (
                              <div key={key} className="business-summary-row">
                                <dt>{label}</dt>
                                <dd>{formatSettingValue(key, values[key])}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        {isEditing && (
                          <div className="business-fields">
                            {fields.map(field)}
                          </div>
                        )}
                        {title === "Scheduling Defaults" && (
                          <p>
                            Business hours use the existing appointment
                            availability schedule.{" "}
                            <Link to="/admin/appointments">
                              Manage business hours in Appointments
                            </Link>
                            .
                          </p>
                        )}
                        {title === "Ownership & Workflow Defaults" &&
                          ownerError && <p role="status">{ownerError}</p>}
                      </fieldset>
                    );
                  })}
                  <fieldset disabled={state.saving}>
                    <legend>Portal Defaults</legend>
                    <label className="settings-checkbox">
                      <input
                        type="checkbox"
                        checked={
                          values.portal_message_email_notifications === true
                        }
                        onChange={(event) =>
                          change(
                            "portal_message_email_notifications",
                            event.target.checked,
                          )
                        }
                      />
                      <span>Email clients when a portal message is sent</span>
                    </label>
                    <p>
                      Portal session timeout and invitation expiration remain
                      managed by the existing authentication system.
                      Configuration will follow in a later phase.
                    </p>
                  </fieldset>
                  {businessEditGroup && (
                    <div className="settings-save">
                      <button
                        className="primary-button"
                        disabled={state.saving}
                      >
                        {state.saving ? "Saving…" : "Save Settings"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={cancelBusinessEdit}
                        disabled={state.saving}
                      >
                        Cancel
                      </button>
                      {state.message && <p role="status">{state.message}</p>}
                    </div>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setState((current) => ({
                      ...current,
                      loading: true,
                      error: "",
                    }));
                    setAttempt((current) => current + 1);
                  }}
                >
                  Retry loading settings
                </button>
              )}
              {state.error && (
                <p role="alert" className="admin-feedback">
                  {state.error}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

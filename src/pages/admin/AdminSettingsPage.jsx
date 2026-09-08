import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminPageHeader } from "../../components/admin/admin-components.jsx";
import { auth, settings, clients } from "../../services/admin-api.js";
import "./admin-settings.css";

const sections = [
  ["business", "Business"],
  ["team-access", "Team & Access"],
  ["notifications", "Notifications"],
  ["account-security", "Account & Security"],
  ["data-maintenance", "Data Maintenance"],
  ["integrations", "System & Integrations"],
];
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
  const [sessionUser, setSessionUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);
  const [businessEditGroup, setBusinessEditGroup] = useState(null);
  const [businessBaseline, setBusinessBaseline] = useState(null);
  const [accountProfile, setAccountProfile] = useState(null);
  const [accountEditMode, setAccountEditMode] = useState(false);
  const [accountEditBaseline, setAccountEditBaseline] = useState(null);
  const [accountState, setAccountState] = useState({
    loading: true,
    saving: false,
    error: "",
    message: "",
  });
  const [passwordState, setPasswordState] = useState({
    saving: false,
    error: "",
    message: "",
  });
  const [accountForm, setAccountForm] = useState({
    display_name: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: "",
    message: "",
  });
  const [teamState, setTeamState] = useState({
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
  const [maintenanceState, setMaintenanceState] = useState({
    loading: true,
    error: "",
    data: null,
    preview: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    auth
      .session()
      .then((payload) => {
        if (active) {
          setSessionUser(payload?.user || null);
        }
      })
      .catch(() => {
        if (active) setSessionUser(null);
      });
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
          const mappedRows = nextRows.map((row) => ({
            ...row,
            user_id: row.user_id ?? row.id,
          }));
          setTeamMembers(mappedRows);
          setSelectedTeamMemberId((current) => current ?? null);
          setOwnerError("");
          setTeamState({
            loading: false,
            saving: false,
            error: "",
            message: "",
          });
        }
      })
      .catch(() => {
        if (active) {
          setOwnerError(
            "Owner choices could not be loaded. Existing selections are retained.",
          );
          setTeamState({
            loading: false,
            saving: false,
            error: "Team access could not be loaded.",
            message: "",
          });
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
  useEffect(() => {
    if (section[0] !== "data-maintenance") {
      return undefined;
    }
    let active = true;
    const loadOverview = async () => {
      setMaintenanceState({
        loading: true,
        error: "",
        data: null,
        preview: null,
      });
      try {
        const next = await settings.maintenance("overview", {
          threshold_months: 6,
        });
        if (active) {
          setMaintenanceState({
            loading: false,
            error: "",
            data: next,
            preview: null,
          });
        }
      } catch (error) {
        if (active) {
          setMaintenanceState({
            loading: false,
            error: error.message || "Maintenance overview could not be loaded.",
            data: null,
            preview: null,
          });
        }
      }
    };
    loadOverview();
    return () => {
      active = false;
    };
  }, [section]);
  useEffect(() => {
    if (section[0] !== "account-security") {
      return undefined;
    }
    let active = true;
    setAccountState({ loading: true, saving: false, error: "", message: "" });

    const loadAccountProfile = async () => {
      try {
        const [sessionResult, accountResult] = await Promise.allSettled([
          auth.session(),
          auth.account(),
        ]);

        if (!active) return;

        const sessionUserData =
          sessionResult.status === "fulfilled"
            ? sessionResult.value?.user
            : null;
        const accountPayload =
          accountResult.status === "fulfilled" ? accountResult.value : null;
        const user =
          accountPayload?.user || sessionUserData || sessionUser || null;
        const profile = user
          ? {
              ...user,
              recent_activity: accountPayload?.recent_activity || [],
              security: accountPayload?.security || {},
            }
          : null;

        setAccountProfile(profile);
        setAccountForm({
          display_name: user?.display_name || "",
          email: user?.email || "",
        });

        if (user) {
          setSessionUser((current) => ({
            ...(current || {}),
            user_id: user.user_id,
            role_slug: user.role_slug,
            email: user.email,
            display_name: user.display_name,
            ...profile.security,
          }));
        }

        setAccountState({
          loading: false,
          saving: false,
          error: "",
          message: "",
        });
      } catch (error) {
        if (!active) return;
        setAccountProfile(null);
        setAccountForm({ display_name: "", email: "" });
        setAccountState({
          loading: false,
          saving: false,
          error: error?.message || "Account details could not be loaded.",
          message: "",
        });
      }
    };

    loadAccountProfile();
    return () => {
      active = false;
    };
  }, [section]);
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
  const beginAccountEdit = () => {
    setAccountEditBaseline({
      display_name: accountForm.display_name,
      email: accountForm.email,
    });
    setAccountEditMode(true);
  };
  const cancelAccountEdit = () => {
    if (accountEditBaseline) {
      setAccountForm({
        display_name: accountEditBaseline.display_name,
        email: accountEditBaseline.email,
      });
    }
    setAccountEditMode(false);
    setAccountEditBaseline(null);
  };
  const saveAccountProfile = async (event) => {
    event.preventDefault();
    setAccountState((current) => ({
      ...current,
      saving: true,
      error: "",
      message: "",
    }));
    try {
      const payload = await auth.updateAccount({
        display_name: accountForm.display_name,
        email: accountForm.email,
      });
      const nextProfile = payload?.user
        ? {
            ...payload.user,
            recent_activity: payload?.recent_activity || [],
            security: payload?.security || {},
          }
        : null;
      setAccountProfile(nextProfile);
      setAccountForm({
        display_name: nextProfile?.display_name || accountForm.display_name,
        email: nextProfile?.email || accountForm.email,
      });
      setAccountEditMode(false);
      setAccountEditBaseline(null);
      setAccountState({
        loading: false,
        saving: false,
        error: "",
        message: "Account profile saved.",
      });
      setSessionUser((current) => ({
        ...(current || {}),
        ...(payload?.user || {}),
        ...(nextProfile?.security || {}),
      }));
    } catch (error) {
      setAccountState({
        loading: false,
        saving: false,
        error: error.message,
        message: "",
      });
    }
  };
  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordState({ saving: true, error: "", message: "" });
    try {
      await auth.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "" });
      setPasswordState({
        saving: false,
        error: "",
        message: "Password updated.",
      });
    } catch (error) {
      setPasswordState({
        saving: false,
        error: error.message,
        message: "",
      });
    }
  };
  const [teamForm, setTeamForm] = useState({
    display_name: "",
    email: "",
    role_slug: "administrator",
    status: "active",
  });
  const [teamCreateMode, setTeamCreateMode] = useState(false);
  const handleTeamMemberChange = (userId, field, value) => {
    setTeamMembers((current) =>
      current.map((member) =>
        member.user_id === userId || member.id === userId
          ? { ...member, [field]: value }
          : member,
      ),
    );
  };
  const saveNewTeamMember = async (event) => {
    event.preventDefault();
    setTeamState((current) => ({
      ...current,
      saving: true,
      error: "",
      message: "",
    }));
    try {
      const created = await clients.createTeamMember(teamForm);
      const nextMembers =
        created?.team || created?.user
          ? [...teamMembers, created.user]
          : teamMembers;
      setTeamMembers(nextMembers);
      setTeamForm({
        display_name: "",
        email: "",
        role_slug: "administrator",
        status: "active",
      });
      setTeamCreateMode(false);
      setTeamState({
        loading: false,
        saving: false,
        error: "",
        message: "Administrator added.",
      });
    } catch (error) {
      setTeamState({
        loading: false,
        saving: false,
        error: error.message,
        message: "",
      });
    }
  };
  const saveTeamAccess = async (event) => {
    event.preventDefault();
    setTeamState((current) => ({
      ...current,
      saving: true,
      error: "",
      message: "",
    }));
    try {
      await Promise.all(
        teamMembers.map((member) =>
          clients.updateTeamMember({
            user_id: member.user_id ?? member.id,
            role_slug: member.role_slug,
            status: member.status,
          }),
        ),
      );
      setTeamState({
        loading: false,
        saving: false,
        error: "",
        message: "Team access updated.",
      });
    } catch (error) {
      setTeamState({
        loading: false,
        saving: false,
        error: error.message,
        message: "",
      });
    }
  };
  const reviewMaintenanceCategory = async (category) => {
    setMaintenanceState((current) => ({
      ...current,
      loading: true,
      error: "",
      preview: null,
    }));
    try {
      const preview = await settings.maintenance("preview", {
        category,
        limit: 10,
      });
      setMaintenanceState((current) => ({
        ...current,
        loading: false,
        error: "",
        preview,
      }));
    } catch (error) {
      setMaintenanceState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Maintenance review could not be loaded.",
        preview: null,
      }));
    }
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
            <>
              <p className="settings-note">
                Internal access is managed through the same role and user model
                used by the admin authentication layer. Only an owner or an
                administrator can update team roles and status.
              </p>
              {teamState.loading ? (
                <p role="status">Loading team access…</p>
              ) : (
                <div className="team-access-form">
                  <p className="settings-note">
                    Manage administrative access, roles, and account status.
                  </p>
                  {teamCreateMode && (
                    <form
                      className="business-settings-form"
                      onSubmit={saveNewTeamMember}
                    >
                      <fieldset>
                        <legend>Add administrator</legend>
                        <div className="business-fields">
                          <label htmlFor="team-new-display-name">
                            <span>Display name</span>
                            <input
                              id="team-new-display-name"
                              type="text"
                              value={teamForm.display_name}
                              onChange={(event) =>
                                setTeamForm((current) => ({
                                  ...current,
                                  display_name: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label htmlFor="team-new-email">
                            <span>Login email</span>
                            <input
                              id="team-new-email"
                              type="email"
                              value={teamForm.email}
                              onChange={(event) =>
                                setTeamForm((current) => ({
                                  ...current,
                                  email: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label htmlFor="team-new-role">
                            <span>Role</span>
                            <select
                              id="team-new-role"
                              value={teamForm.role_slug}
                              onChange={(event) =>
                                setTeamForm((current) => ({
                                  ...current,
                                  role_slug: event.target.value,
                                }))
                              }
                            >
                              <option value="owner-admin">
                                Owner / Administrator
                              </option>
                              <option value="administrator">
                                Administrator
                              </option>
                              <option value="staff">Staff</option>
                              <option value="read-only">Read only</option>
                            </select>
                          </label>
                        </div>
                      </fieldset>
                      <div className="settings-save">
                        <button
                          className="primary-button"
                          type="submit"
                          disabled={teamState.saving}
                        >
                          {teamState.saving
                            ? "Creating…"
                            : "Create administrator"}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setTeamCreateMode(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  {!teamCreateMode && (
                    <div className="settings-save">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => setTeamCreateMode(true)}
                      >
                        + Add administrator
                      </button>
                    </div>
                  )}
                  <div className="team-access-list">
                    {teamMembers.map((member) => {
                      const memberId = member.user_id ?? member.id;
                      const canEditRole =
                        sessionUser?.role_slug === "owner-admin" ||
                        (sessionUser?.role_slug === "administrator" &&
                          member.role_slug !== "owner-admin");
                      const isCurrentUser =
                        sessionUser &&
                        Number(sessionUser.user_id) === Number(memberId);
                      const isOwnerProtected =
                        member.role_slug === "owner-admin" &&
                        sessionUser?.role_slug !== "owner-admin";
                      const isSelected = selectedTeamMemberId === memberId;

                      return (
                        <div
                          key={memberId}
                          className={`team-access-row ${isSelected ? "is-selected" : ""}`}
                        >
                          <div className="team-member-meta">
                            <strong>{member.display_name}</strong>
                            <span>{member.email}</span>
                            <small>
                              {member.role_name || member.role_slug || "Staff"}
                            </small>
                          </div>
                          <div className="team-access-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                setSelectedTeamMemberId((current) =>
                                  current === memberId ? null : memberId,
                                )
                              }
                            >
                              {isSelected ? "Close" : "Manage"}
                            </button>
                          </div>
                          {isSelected && (
                            <div className="team-access-editor">
                              <label htmlFor={`team-role-${memberId}`}>
                                <span>Role for {member.display_name}</span>
                                <select
                                  id={`team-role-${memberId}`}
                                  value={member.role_slug || "staff"}
                                  onChange={(event) =>
                                    handleTeamMemberChange(
                                      memberId,
                                      "role_slug",
                                      event.target.value,
                                    )
                                  }
                                  disabled={
                                    teamState.saving ||
                                    !canEditRole ||
                                    isCurrentUser ||
                                    isOwnerProtected
                                  }
                                >
                                  <option value="owner-admin">
                                    Owner / Administrator
                                  </option>
                                  <option value="administrator">
                                    Administrator
                                  </option>
                                  <option value="staff">Staff</option>
                                  <option value="read-only">Read Only</option>
                                </select>
                              </label>
                              <label htmlFor={`team-status-${memberId}`}>
                                <span>Status for {member.display_name}</span>
                                <select
                                  id={`team-status-${memberId}`}
                                  value={member.status || "active"}
                                  onChange={(event) =>
                                    handleTeamMemberChange(
                                      memberId,
                                      "status",
                                      event.target.value,
                                    )
                                  }
                                  disabled={teamState.saving || isCurrentUser}
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="suspended">Suspended</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="settings-save">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={saveTeamAccess}
                      disabled={
                        teamState.saving ||
                        !sessionUser ||
                        !["owner-admin", "administrator"].includes(
                          sessionUser.role_slug,
                        )
                      }
                    >
                      {teamState.saving ? "Saving…" : "Save team access"}
                    </button>
                    {teamState.message && (
                      <p role="status">{teamState.message}</p>
                    )}
                  </div>
                  {teamState.error && (
                    <p role="alert" className="admin-feedback">
                      {teamState.error}
                    </p>
                  )}
                </div>
              )}
            </>
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
            <>
              <p className="settings-note">
                Review cleanup candidates before any archive or purge action.
                This phase is intentionally limited to safe maintenance actions
                for stale, temporary, and explicitly reviewed records.
              </p>
              <div className="maintenance-grid">
                <div className="business-settings-form">
                  {[
                    ["inactive_prospects", "Review inactive prospects"],
                    ["completed_engagements", "Review completed engagements"],
                    ["expired_links", "Review expired scheduling links"],
                    ["expired_invitations", "Review expired invitations"],
                  ].map(([category, label]) => (
                    <fieldset key={category}>
                      <legend>{label}</legend>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => reviewMaintenanceCategory(category)}
                        disabled={maintenanceState.loading}
                      >
                        {maintenanceState.preview?.category === category
                          ? `${maintenanceState.preview.count} candidate(s)`
                          : label}
                      </button>
                      {maintenanceState.preview?.category === category && (
                        <p role="status">
                          {maintenanceState.preview.count} record(s) ready for
                          review.
                        </p>
                      )}
                    </fieldset>
                  ))}
                  <fieldset>
                    <legend>Maintenance history</legend>
                    <p>
                      Recent cleanup and archive activity is recorded through
                      the existing audit log.
                    </p>
                    {maintenanceState.data?.summary && (
                      <ul>
                        {Object.entries(maintenanceState.data.summary).map(
                          ([key, value]) => (
                            <li key={key}>
                              {key.replace(/_/g, " ")}: {value}
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                  </fieldset>
                </div>
              </div>
              {maintenanceState.error && (
                <p role="alert" className="admin-feedback">
                  {maintenanceState.error}
                </p>
              )}
            </>
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
                    return (
                      <div key={slug} className="integration-card">
                        <div className="integration-card-header">
                          <h3>{label}</h3>
                          <span
                            className={`status-pill status-${String(
                              item?.status || "Unknown",
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {item?.status || "Unknown"}
                          </span>
                        </div>
                        <dl>
                          <div>
                            <dt>Configured</dt>
                            <dd>{item?.configured ? "Yes" : "No"}</dd>
                          </div>
                          <div>
                            <dt>Last success</dt>
                            <dd>{item?.last_success || "Not available"}</dd>
                          </div>
                          <div>
                            <dt>Last error</dt>
                            <dd>{item?.last_error || "None recorded"}</dd>
                          </div>
                        </dl>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => settings.checkIntegration(slug)}
                        >
                          Check Connection
                        </button>
                      </div>
                    );
                  })}
                  <div className="integration-card system-card">
                    <div className="integration-card-header">
                      <h3>System</h3>
                      <span className="status-pill status-connected">
                        {integrationStatus.data?.system?.database?.status ||
                          "Unknown"}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>Database</dt>
                        <dd>
                          {integrationStatus.data?.system?.database?.status ||
                            "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt>Application version</dt>
                        <dd>
                          {integrationStatus.data?.system?.application
                            ?.version || "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt>Runtime</dt>
                        <dd>
                          {integrationStatus.data?.system?.application
                            ?.runtime || "Unknown"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </>
          ) : section[0] === "account-security" ? (
            <>
              {accountState.loading ? (
                <p role="status">Loading account details…</p>
              ) : accountProfile ? (
                <div className="account-security-layout">
                  <form
                    className="business-settings-form"
                    onSubmit={saveAccountProfile}
                  >
                    <p className="settings-note">
                      Your personal admin account is managed through the
                      existing authentication layer. This screen only updates
                      the currently signed-in user and enforces backend
                      validation.
                    </p>
                    {!accountEditMode ? (
                      <>
                        <fieldset>
                          <legend>Account profile</legend>
                          <div className="business-fields">
                            <label htmlFor="account-display-name-readonly">
                              <span>Display name</span>
                              <input
                                id="account-display-name-readonly"
                                type="text"
                                value={
                                  accountProfile?.display_name ||
                                  accountForm.display_name ||
                                  ""
                                }
                                readOnly
                              />
                            </label>
                            <label htmlFor="account-email-readonly">
                              <span>Login email</span>
                              <input
                                id="account-email-readonly"
                                type="email"
                                value={
                                  accountProfile?.email ||
                                  accountForm.email ||
                                  ""
                                }
                                readOnly
                              />
                            </label>
                          </div>
                        </fieldset>
                        <div className="settings-save">
                          <button
                            type="button"
                            className="primary-button"
                            onClick={beginAccountEdit}
                          >
                            Edit account profile
                          </button>
                          {accountState.message && (
                            <p role="status">{accountState.message}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <fieldset disabled={accountState.saving}>
                          <legend>Account profile</legend>
                          <div className="business-fields">
                            <label htmlFor="account-display-name">
                              <span>Display name</span>
                              <input
                                id="account-display-name"
                                type="text"
                                value={accountForm.display_name}
                                onChange={(event) =>
                                  setAccountForm((current) => ({
                                    ...current,
                                    display_name: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label htmlFor="account-email">
                              <span>Login email</span>
                              <input
                                id="account-email"
                                type="email"
                                value={accountForm.email}
                                onChange={(event) =>
                                  setAccountForm((current) => ({
                                    ...current,
                                    email: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          </div>
                        </fieldset>
                        <div className="settings-save">
                          <button
                            className="primary-button"
                            type="submit"
                            disabled={accountState.saving}
                          >
                            {accountState.saving
                              ? "Saving…"
                              : "Save account profile"}
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={cancelAccountEdit}
                            disabled={accountState.saving}
                          >
                            Cancel
                          </button>
                          {accountState.message && (
                            <p role="status">{accountState.message}</p>
                          )}
                        </div>
                      </>
                    )}
                    {accountState.error && (
                      <p role="alert" className="admin-feedback">
                        {accountState.error}
                      </p>
                    )}
                  </form>

                  <form
                    className="business-settings-form"
                    onSubmit={savePassword}
                  >
                    <fieldset disabled={passwordState.saving}>
                      <legend>Security</legend>
                      <div className="business-fields">
                        <label htmlFor="account-current-password">
                          <span>Current password</span>
                          <input
                            id="account-current-password"
                            type="password"
                            value={passwordForm.current_password}
                            onChange={(event) =>
                              setPasswordForm((current) => ({
                                ...current,
                                current_password: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label htmlFor="account-new-password">
                          <span>New password</span>
                          <input
                            id="account-new-password"
                            type="password"
                            value={passwordForm.new_password}
                            onChange={(event) =>
                              setPasswordForm((current) => ({
                                ...current,
                                new_password: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>
                    </fieldset>
                    <div className="settings-save">
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={passwordState.saving}
                      >
                        {passwordState.saving ? "Updating…" : "Change password"}
                      </button>
                      {passwordState.message && (
                        <p role="status">{passwordState.message}</p>
                      )}
                    </div>
                    {passwordState.error && (
                      <p role="alert" className="admin-feedback">
                        {passwordState.error}
                      </p>
                    )}
                  </form>

                  <div className="business-settings-form">
                    <fieldset>
                      <legend>Security details</legend>
                      <div className="business-fields">
                        <label>
                          <span>Last login</span>
                          <input
                            type="text"
                            readOnly
                            value={
                              accountProfile.last_login_at
                                ? new Date(
                                    accountProfile.last_login_at,
                                  ).toLocaleString()
                                : "Never"
                            }
                          />
                        </label>
                        <label>
                          <span>Password last changed</span>
                          <input
                            type="text"
                            readOnly
                            value={
                              accountProfile.password_changed_at
                                ? new Date(
                                    accountProfile.password_changed_at,
                                  ).toLocaleString()
                                : "Never"
                            }
                          />
                        </label>
                      </div>
                      <p>
                        {accountProfile?.security?.session_note ||
                          "Current browser session is managed by secure cookies and can be ended by signing out."}
                      </p>
                      <p>MFA is not configured for this workspace yet.</p>
                    </fieldset>
                    {Array.isArray(accountProfile?.recent_activity) &&
                      accountProfile.recent_activity.length > 0 && (
                        <fieldset>
                          <legend>Recent activity</legend>
                          <ul>
                            {accountProfile.recent_activity.map(
                              (item, index) => (
                                <li key={`${item.event_type}-${index}`}>
                                  <strong>{item.event_type}</strong>
                                  <div>{item.action_summary}</div>
                                  <small>
                                    {item.created_at
                                      ? new Date(
                                          item.created_at,
                                        ).toLocaleString()
                                      : ""}
                                  </small>
                                </li>
                              ),
                            )}
                          </ul>
                        </fieldset>
                      )}
                  </div>
                </div>
              ) : (
                <p role="alert" className="admin-feedback">
                  {accountState.error || "Account details could not be loaded."}
                </p>
              )}
            </>
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

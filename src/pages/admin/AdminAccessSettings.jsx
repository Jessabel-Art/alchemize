import { useEffect, useState } from "react";
import { auth, clients } from "../../services/admin-api.js";
import "./admin-access-settings.css";

const roles = {
  "owner-admin": "Owner",
  administrator: "Administrator",
  staff: "Staff",
  "read-only": "Read only",
};
const dateLabel = (value) =>
  value
    ? new Date(value.replace(" ", "T")).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not recorded";
const humanize = (value) => {
  const text = String(value || "Account activity").replace(/[._-]+/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
function RoleOptions({ owner }) {
  return Object.entries(roles)
    .filter(([key]) => owner || key !== "owner-admin")
    .map(([key, name]) => (
      <option key={key} value={key}>
        {name}
      </option>
    ));
}
function Feedback({ error, message }) {
  return (
    <>
      {error && (
        <p role="alert" className="admin-feedback">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </>
  );
}

export function TeamAccessSettings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editor, setEditor] = useState(null);
  const empty = { display_name: "", email: "", role_slug: "administrator" };
  const [draft, setDraft] = useState(empty);
  const load = async () => {
    const [session, members, invitations] = await Promise.all([
      auth.session(),
      clients.team(),
      clients.teamInvitations(),
    ]);
    return { user: session.user, members, invitations };
  };
  useEffect(() => {
    let active = true;
    load()
      .then((next) => {
        if (active) setData(next);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const owner = data?.user?.role_slug === "owner-admin";
  const manager = owner || data?.user?.role_slug === "administrator";
  const canManage = (row) =>
    manager && (owner || row.role_slug !== "owner-admin");
  const perform = async (action, success) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      setCreating(false);
      setDraft(empty);
      setEditor(null);
      setMessage(
        result?.email_delivery
          ? result.email_delivery === "sent"
            ? "Invitation sent. Access begins after password setup."
            : "Invitation saved, but email delivery did not complete. Use Resend invitation to retry."
          : success,
      );
      setData(await load());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const members = data?.members.filter((row) => row.status !== "invited") || [];
  return (
    <div className="access-settings">
      <p>
        Invite people to the Admin Portal and manage their access. Invitations
        expire after 72 hours.
      </p>
      <Feedback error={error} message={message} />
      {!data ? (
        <p>
          {error ? "Team access could not be loaded." : "Loading team access…"}
        </p>
      ) : (
        <>
          {manager && !creating && (
            <button
              type="button"
              className="primary-button"
              disabled={busy}
              onClick={() => {
                setCreating(true);
                setError("");
              }}
            >
              + Add administrator
            </button>
          )}
          {creating && (
            <form
              className="business-settings-form"
              onSubmit={(e) => {
                e.preventDefault();
                perform(() => clients.createTeamMember(draft));
              }}
            >
              <fieldset disabled={busy}>
                <legend>Invite administrator</legend>
                <div className="business-fields">
                  <label>
                    Name
                    <input
                      required
                      maxLength={150}
                      value={draft.display_name}
                      onChange={(e) =>
                        setDraft({ ...draft, display_name: e.target.value })
                      }
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      required
                      type="email"
                      maxLength={254}
                      value={draft.email}
                      onChange={(e) =>
                        setDraft({ ...draft, email: e.target.value })
                      }
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={draft.role_slug}
                      onChange={(e) =>
                        setDraft({ ...draft, role_slug: e.target.value })
                      }
                    >
                      <RoleOptions owner={owner} />
                    </select>
                  </label>
                </div>
              </fieldset>
              <div className="settings-save">
                <button className="primary-button" disabled={busy}>
                  {busy ? "Sending…" : "Send invitation"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => {
                    setCreating(false);
                    setDraft(empty);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <section aria-labelledby="active-admins">
            <h3 id="active-admins">Active administrators</h3>
            <p className="settings-note">
              Accounts that have completed setup. Inactive or suspended access
              is labeled below.
            </p>
            <div className="team-access-list">
              {members.map((member) => (
                <article className="access-member" key={member.user_id}>
                  <div>
                    <strong>{member.display_name}</strong>
                    <p>{member.email}</p>
                    <span>
                      {roles[member.role_slug]} · {humanize(member.status)}
                    </span>
                  </div>
                  {canManage(member) &&
                    Number(member.user_id) !== Number(data.user.user_id) && (
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={busy}
                        onClick={() => setEditor({ ...member })}
                      >
                        Manage
                      </button>
                    )}
                  {Number(member.user_id) === Number(data.user.user_id) && (
                    <small>Your account</small>
                  )}
                  {editor?.user_id === member.user_id && (
                    <form
                      className="business-settings-form access-member-editor"
                      onSubmit={(e) => {
                        e.preventDefault();
                        perform(
                          () =>
                            clients.updateTeamMember({
                              user_id: editor.user_id,
                              role_slug: editor.role_slug,
                              status: editor.status,
                            }),
                          "Access updated.",
                        );
                      }}
                    >
                      <fieldset disabled={busy}>
                        <legend>Manage {member.display_name}</legend>
                        <div className="business-fields">
                          <label>
                            Role
                            <select
                              value={editor.role_slug}
                              onChange={(e) =>
                                setEditor({
                                  ...editor,
                                  role_slug: e.target.value,
                                })
                              }
                            >
                              <RoleOptions owner={owner} />
                            </select>
                          </label>
                          <label>
                            Access status
                            <select
                              value={editor.status}
                              onChange={(e) =>
                                setEditor({ ...editor, status: e.target.value })
                              }
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </label>
                        </div>
                      </fieldset>
                      <div className="settings-save">
                        <button className="primary-button" disabled={busy}>
                          Save changes
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={busy}
                          onClick={() => setEditor(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              ))}
            </div>
          </section>
          <section aria-labelledby="pending-admins">
            <h3 id="pending-admins">Pending invitations</h3>
            {!data.invitations.length ? (
              <p>No pending invitations.</p>
            ) : (
              <div className="access-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {[
                        "Name",
                        "Email",
                        "Role",
                        "Invited",
                        "Expires",
                        "Status",
                        "Actions",
                      ].map((name) => (
                        <th key={name}>{name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.invitations.map((row) => (
                      <tr key={row.user_id}>
                        <td>{row.display_name}</td>
                        <td>{row.email}</td>
                        <td>{roles[row.role_slug]}</td>
                        <td>{dateLabel(row.invited_at)}</td>
                        <td>{dateLabel(row.expires_at)}</td>
                        <td>{humanize(row.invitation_status)}</td>
                        <td>
                          {canManage(row) && (
                            <div className="settings-save">
                              <button
                                className="secondary-button"
                                disabled={busy}
                                onClick={() =>
                                  perform(() =>
                                    clients.teamInvitationAction({
                                      user_id: row.user_id,
                                      action: "resend",
                                    }),
                                  )
                                }
                              >
                                Resend invitation
                              </button>
                              {row.invitation_status !== "revoked" && (
                                <button
                                  className="secondary-button"
                                  disabled={busy}
                                  onClick={() =>
                                    perform(
                                      () =>
                                        clients.teamInvitationAction({
                                          user_id: row.user_id,
                                          action: "revoke",
                                        }),
                                      "Invitation revoked. Its link can no longer be used.",
                                    )
                                  }
                                >
                                  Revoke invitation
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function AccountSecuritySettings() {
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(false);
  const [passwordEdit, setPasswordEdit] = useState(false);
  const [profile, setProfile] = useState({});
  const emptyPasswords = {
    current_password: "",
    new_password: "",
    confirm_password: "",
  };
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    auth
      .account()
      .then((next) => {
        if (active) setData(next);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await auth.updateAccount(profile);
      setData(next);
      setEdit(false);
      setProfile({});
      setMessage(
        next.email_change
          ? next.email_change.email_delivery === "sent"
            ? "Profile saved. Confirm the link sent to your new email address to change your login email."
            : "Profile saved. Email confirmation could not be sent; your login email is unchanged. Edit profile to retry."
          : "Profile saved.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const savePassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (passwords.new_password !== passwords.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await auth.changePassword(passwords);
      setData((current) => ({
        ...current,
        user: {
          ...current.user,
          password_changed_at: result.password_changed_at,
        },
      }));
      setPasswords(emptyPasswords);
      setPasswordEdit(false);
      setMessage("Password updated.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="access-settings">
      <Feedback error={error} message={message} />
      {!data ? (
        <p>
          {error
            ? "Account details could not be loaded."
            : "Loading account details…"}
        </p>
      ) : (
        <>
          <section aria-labelledby="account-profile-title">
            <h3 id="account-profile-title">Account profile</h3>
            {!edit ? (
              <>
                <dl className="access-metadata">
                  <div>
                    <dt>Display name</dt>
                    <dd>{data.user.display_name}</dd>
                  </div>
                  <div>
                    <dt>Login email</dt>
                    <dd>{data.user.email}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setProfile({
                      display_name: data.user.display_name,
                      email: data.user.email,
                      current_password: "",
                    });
                    setEdit(true);
                    setError("");
                    setMessage("");
                  }}
                >
                  Edit profile
                </button>
              </>
            ) : (
              <form className="business-settings-form" onSubmit={saveProfile}>
                <fieldset disabled={busy}>
                  <legend>Edit profile</legend>
                  <div className="business-fields">
                    <label>
                      Display name
                      <input
                        required
                        maxLength={150}
                        value={profile.display_name}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            display_name: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Login email
                      <input
                        required
                        type="email"
                        maxLength={254}
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                      />
                    </label>
                    {profile.email.trim().toLowerCase() !== data.user.email && (
                      <label>
                        Current password to change email
                        <input
                          type="password"
                          autoComplete="current-password"
                          required
                          value={profile.current_password}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              current_password: e.target.value,
                            })
                          }
                        />
                        <small>
                          Your login email changes only after you confirm the
                          new address.
                        </small>
                      </label>
                    )}
                  </div>
                </fieldset>
                <div className="settings-save">
                  <button className="primary-button" disabled={busy}>
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => {
                      setEdit(false);
                      setProfile({});
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
          <section aria-labelledby="account-security-title">
            <h3 id="account-security-title">Security</h3>
            <dl className="access-metadata">
              <div>
                <dt>Password last changed</dt>
                <dd>{dateLabel(data.user.password_changed_at)}</dd>
              </div>
              <div>
                <dt>Last login</dt>
                <dd>{dateLabel(data.user.last_login_at)}</dd>
              </div>
            </dl>
            {!passwordEdit ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setPasswordEdit(true);
                  setError("");
                  setMessage("");
                }}
              >
                Change password
              </button>
            ) : (
              <form className="business-settings-form" onSubmit={savePassword}>
                <fieldset disabled={busy}>
                  <legend>Change password</legend>
                  <div className="business-fields">
                    {[
                      ["current_password", "Current password"],
                      ["new_password", "New password"],
                      ["confirm_password", "Confirm new password"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          required
                          type="password"
                          minLength={
                            key === "current_password" ? undefined : 12
                          }
                          autoComplete={
                            key === "current_password"
                              ? "current-password"
                              : "new-password"
                          }
                          value={passwords[key]}
                          onChange={(e) =>
                            setPasswords({
                              ...passwords,
                              [key]: e.target.value,
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <p className="settings-note">Use at least 12 characters.</p>
                </fieldset>
                <div className="settings-save">
                  <button className="primary-button" disabled={busy}>
                    Update password
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => {
                      setPasswords(emptyPasswords);
                      setPasswordEdit(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <p className="settings-note">{data.security?.session_note}</p>
            <p className="settings-note">
              MFA is not configured for this workspace yet.
            </p>
          </section>
          <section aria-labelledby="recent-account-activity">
            <h3 id="recent-account-activity">Recent activity</h3>
            {data.recent_activity?.length ? (
              <ol className="access-timeline">
                {data.recent_activity.map((item, index) => (
                  <li key={index}>
                    <strong>{humanize(item.event_type)}</strong>
                    <p>{item.action_summary}</p>
                    <time>{dateLabel(item.created_at)}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No recent activity.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

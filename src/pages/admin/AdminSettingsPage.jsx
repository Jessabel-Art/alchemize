import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminSection,
} from "../../components/admin/admin-components.jsx";
import { settings } from "../../services/admin-api.js";

const defaults = {
  business_name: "Alchemize Business Services",
  business_email: "",
  timezone: "America/New_York",
  appointment_default_duration: 60,
  portal_message_email_notifications: true,
};

export default function AdminSettingsPage() {
  const [values, setValues] = useState(defaults);
  const [state, setState] = useState({
    loading: true,
    saving: false,
    message: "",
  });

  useEffect(() => {
    settings
      .get()
      .then((data) => setValues({ ...defaults, ...(data || {}) }))
      .catch((error) =>
        setState({ loading: false, saving: false, message: error.message }),
      )
      .finally(() => setState((current) => ({ ...current, loading: false })));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setState({ loading: false, saving: true, message: "" });
    try {
      const saved = await settings.update(values);
      setValues({ ...defaults, ...(saved || {}) });
      setState({ loading: false, saving: false, message: "Settings saved." });
    } catch (error) {
      setState({ loading: false, saving: false, message: error.message });
    }
  };

  return (
    <div className="admin-module admin-settings-workspace">
      <AdminPageHeader
        eyebrow="Settings"
        title="Settings"
        summary="Manage safe business and scheduling defaults used by the Admin and Client Portals."
      />
      <AdminSection title="Business and portal defaults">
        {state.loading ? (
          <p>Loading settings…</p>
        ) : (
          <form className="setting-group admin-settings-form" onSubmit={save}>
            <fieldset>
              <legend>Business identity</legend>{" "}
              <label>
                <span>Business name</span>
                <input
                  required
                  value={values.business_name}
                  onChange={(event) =>
                    setValues({ ...values, business_name: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Business notification email</span>
                <input
                  type="email"
                  value={values.business_email}
                  onChange={(event) =>
                    setValues({ ...values, business_email: event.target.value })
                  }
                />
              </label>
            </fieldset>
            <fieldset>
              <legend>Scheduling and notifications</legend>{" "}
              <label>
                <span>Timezone</span>
                <select
                  value={values.timezone}
                  onChange={(event) =>
                    setValues({ ...values, timezone: event.target.value })
                  }
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </label>
              <label>
                <span>Default appointment duration</span>
                <select
                  value={values.appointment_default_duration}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      appointment_default_duration: Number(event.target.value),
                    })
                  }
                >
                  {[30, 45, 60, 90].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={values.portal_message_email_notifications}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      portal_message_email_notifications: event.target.checked,
                    })
                  }
                />
                <span>Email clients when a portal message is sent</span>
              </label>
            </fieldset>{" "}
            {state.message ? (
              <p className="admin-feedback" role="status">
                {state.message}
              </p>
            ) : null}
            <button className="primary-button" disabled={state.saving}>
              {state.saving ? "Saving…" : "Save Settings"}
            </button>
          </form>
        )}
      </AdminSection>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  AdminPageHeader,
  AdminStatusBadge,
} from "../../components/admin/admin-components.jsx";
import { clients, engagements, intakeAdmin } from "../../services/admin-api.js";

export default function AdminIntakePage() {
  const [data, setData] = useState({ items: [], definitions: [] });
  const [clientRows, setClients] = useState([]);
  const [engagementRows, setEngagements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    client_id: "",
    engagement_id: "",
    family_key: "web_digital",
    module_keys: [],
    due_date: "",
  });
  const [feedback, setFeedback] = useState("");
  const load = async () => {
    const [intakes, clientData, engagementData] = await Promise.all([
      intakeAdmin.list(),
      clients.list(),
      engagements.list(),
    ]);
    setData(intakes);
    setClients(clientData || []);
    setEngagements(engagementData || []);
  };
  useEffect(() => {
    load().catch((e) => setFeedback(e.message));
  }, []);
  const definition = data.definitions.find(
    (item) => item.key === form.family_key,
  );
  const availableEngagements = useMemo(() => {
    const selectedClient = clientRows.find(
      (client) => (client.public_id || client.id) === form.client_id,
    );
    return engagementRows.filter(
      (item) =>
        !selectedClient || Number(item.client_id) === Number(selectedClient.id),
    );
  }, [clientRows, engagementRows, form.client_id]);
  const filteredItems = useMemo(
    () =>
      statusFilter === "all"
        ? data.items
        : data.items.filter((item) => item.status === statusFilter),
    [data.items, statusFilter],
  );
  const assign = async (event) => {
    event.preventDefault();
    try {
      await intakeAdmin.assign({
        ...form,
        module_keys: form.module_keys.length
          ? form.module_keys
          : definition.modules.map((m) => m.key),
      });
      setFeedback("Intake assigned.");
      await load();
    } catch (e) {
      setFeedback(e.message);
    }
  };
  const open = async (id) => setSelected(await intakeAdmin.get(id));
  const review = async (status) => {
    await intakeAdmin.review(
      selected.assignment.public_id || selected.assignment.id,
      {
        status,
        client_visible_review_note: selected.clientNote || "",
        internal_review_notes: selected.internalNote || "",
        blocking_reason: selected.blocking || "",
      },
    );
    setSelected(null);
    await load();
  };
  const reviewRequirement = async (requirement, decision) => {
    const reason =
      decision === "replacement"
        ? window.prompt("Concise replacement reason for the client:")
        : "";
    if (decision === "replacement" && !reason) return;
    await intakeAdmin.reviewRequirement(
      selected.assignment.public_id || selected.assignment.id,
      requirement.id,
      decision,
      { reason },
    );
    setSelected(
      await intakeAdmin.get(
        selected.assignment.public_id || selected.assignment.id,
      ),
    );
    await load();
  };
  return (
    <div className="admin-module">
      <AdminPageHeader
        eyebrow="Client onboarding"
        title="Intake assignments"
        summary="Assign service-based intake, monitor missing information, and review submissions by engagement."
      />
      {feedback ? <p role="status">{feedback}</p> : null}
      <form className="admin-form-grid" onSubmit={assign}>
        <label>
          <span>Client</span>
          <select
            required
            value={form.client_id}
            onChange={(e) =>
              setForm({ ...form, client_id: e.target.value, engagement_id: "" })
            }
          >
            <option value="">Select client</option>
            {clientRows.map((c) => (
              <option key={c.public_id || c.id} value={c.public_id || c.id}>
                {c.display_name || c.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Engagement</span>
          <select
            required
            value={form.engagement_id}
            onChange={(e) =>
              setForm({ ...form, engagement_id: e.target.value })
            }
          >
            <option value="">Select engagement</option>
            {availableEngagements.map((eng) => (
              <option
                key={eng.public_id || eng.id}
                value={eng.public_id || eng.id}
              >
                {eng.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Intake family</span>
          <select
            value={form.family_key}
            onChange={(e) =>
              setForm({ ...form, family_key: e.target.value, module_keys: [] })
            }
          >
            {data.definitions.map((def) => (
              <option key={def.key} value={def.key}>
                {def.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Due date</span>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </label>
        <fieldset>
          <legend>Applicable modules</legend>
          {definition?.modules.map((module) => (
            <label key={module.key}>
              <input
                type="checkbox"
                checked={form.module_keys.includes(module.key)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    module_keys: e.target.checked
                      ? [...form.module_keys, module.key]
                      : form.module_keys.filter((key) => key !== module.key),
                  })
                }
              />
              {module.title}
            </label>
          ))}
        </fieldset>
        <button className="primary-button">Assign intake</button>
      </form>
      <label className="admin-inline-filter">
        <span>Intake status</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="waiting_on_client">Waiting on client</option>
          <option value="waiting_on_alchemize">Waiting on Alchemize</option>
          <option value="changes_requested">Changes requested</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="approved">Approved</option>
        </select>
      </label>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client / engagement</th>
              <th>Intake</th>
              <th>Progress</th>
              <th>Missing</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} onClick={() => open(item.id)}>
                <td>
                  {item.client_name}
                  <small>{item.engagement_title}</small>
                </td>
                <td>{item.family_key.replaceAll("_", " ")}</td>
                <td>{item.completion_percentage}%</td>
                <td>{item.missing_requirements}</td>
                <td>
                  <AdminStatusBadge status={item.status.replaceAll("_", " ")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <section className="admin-detail-panel">
          <h2>
            {selected.assignment.client_name} —{" "}
            {selected.assignment.engagement_title}
          </h2>
          <p>
            {selected.assignment.completion_percentage}% complete ·{" "}
            {selected.requirements.filter((r) => r.status === "missing").length}{" "}
            missing requirements
          </p>
          {Object.entries(selected.responses).map(([key, response]) => (
            <div key={key}>
              <strong>{key.replaceAll("_", " ")}</strong>
              <p>
                {Array.isArray(response.value)
                  ? response.value.join(", ")
                  : String(response.value ?? "")}
              </p>
            </div>
          ))}
          <h3>Document / asset requirements</h3>
          <div className="intake-requirements">
            {selected.requirements.map((requirement) => (
              <article className="intake-requirement-card" key={requirement.id}>
                <div>
                  <strong>{requirement.requirement_name}</strong>
                  <p>{requirement.status.replaceAll("_", " ")}</p>
                  {requirement.filename ? (
                    <small>
                      {requirement.filename} · uploaded{" "}
                      {requirement.uploaded_at}
                    </small>
                  ) : null}
                  {requirement.notes ? <p>{requirement.notes}</p> : null}
                </div>
                <div className="portal-action-group">
                  {requirement.submission_id ? (
                    <a
                      href={portalAdmin.documentDownloadUrl(
                        requirement.submission_id,
                      )}
                    >
                      View document
                    </a>
                  ) : null}
                  {["under_review", "provided"].includes(requirement.status) ? (
                    <>
                      <button
                        onClick={() => reviewRequirement(requirement, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          reviewRequirement(requirement, "replacement")
                        }
                      >
                        Request replacement
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <label>
            <span>Client-visible review note</span>
            <textarea
              value={selected.clientNote || ""}
              onChange={(e) =>
                setSelected({ ...selected, clientNote: e.target.value })
              }
            />
          </label>
          <label>
            <span>Internal review notes</span>
            <textarea
              value={selected.internalNote || ""}
              onChange={(e) =>
                setSelected({ ...selected, internalNote: e.target.value })
              }
            />
          </label>
          <label>
            <span>Blocking reason</span>
            <input
              value={selected.blocking || ""}
              onChange={(e) =>
                setSelected({ ...selected, blocking: e.target.value })
              }
            />
          </label>
          <div className="portal-action-group">
            <button onClick={() => review("under_review")}>Under review</button>
            <button onClick={() => review("changes_requested")}>
              Request changes
            </button>
            <button onClick={() => review("approved")}>Approve</button>
            <button onClick={() => setSelected(null)}>Close</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

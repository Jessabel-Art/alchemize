import { useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { publicSchedulingApi } from "../../services/public-scheduling-api.js";
import "./public-scheduling.css";

const today = new Date().toISOString().slice(0, 10);

export default function PublicSchedulingPage() {
  const { token } = useParams();
  const [context, setContext] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    note: "",
  });
  const [status, setStatus] = useState({
    loading: true,
    busy: false,
    error: "",
    confirmation: null,
  });

  useEffect(() => {
    publicSchedulingApi
      .context(token)
      .then((data) => {
        setContext(data);
        setForm((current) => ({
          ...current,
          name: data.recipient_name || "",
          email: data.recipient_email || "",
          phone: data.recipient_phone || "",
        }));
        setStatus((current) => ({ ...current, loading: false }));
      })
      .catch((error) =>
        setStatus({
          loading: false,
          busy: false,
          error: error.message,
          confirmation: null,
        }),
      );
  }, [token]);

  const loadDate = async (value) => {
    setDate(value);
    setSelected("");
    setSlots([]);
    if (!value) return;
    setStatus((current) => ({ ...current, busy: true, error: "" }));
    try {
      const data = await publicSchedulingApi.availability(token, value);
      setSlots(data.slots || []);
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    } finally {
      setStatus((current) => ({ ...current, busy: false }));
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!selected)
      return setStatus((current) => ({
        ...current,
        error: "Please select an available time.",
      }));
    setStatus((current) => ({ ...current, busy: true, error: "" }));
    try {
      const confirmation = await publicSchedulingApi.book(token, {
        ...form,
        selected_start: selected,
      });
      setStatus({ loading: false, busy: false, error: "", confirmation });
    } catch (error) {
      setStatus((current) => ({
        ...current,
        busy: false,
        error: error.message,
      }));
      if (error.code === "SLOT_UNAVAILABLE") await loadDate(date);
    }
  };

  if (status.loading)
    return (
      <main className="public-scheduler">
        <p>Loading scheduling invitation…</p>
      </main>
    );
  if (status.error && !context)
    return (
      <main className="public-scheduler">
        <h1>Scheduling link unavailable</h1>
        <p role="alert">{status.error}</p>
      </main>
    );
  if (status.confirmation)
    return (
      <main className="public-scheduler">
        <section className="scheduler-card scheduler-confirmation">
          <span className="eyebrow">Appointment confirmed</span>
          <h1>You’re scheduled with Alchemize.</h1>
          <p>{status.confirmation.appointment.type}</p>
          <p>
            {new Date(status.confirmation.appointment.start).toLocaleString(
              [],
              { dateStyle: "full", timeStyle: "short" },
            )}{" "}
            · {status.confirmation.appointment.timezone}
          </p>
          <p>
            Calendar: {status.confirmation.calendar_sync}. Email:{" "}
            {status.confirmation.email_delivery}.
          </p>
        </section>
      </main>
    );

  return (
    <main className="public-scheduler">
      <section className="scheduler-card">
        <header>
          <span className="eyebrow">Schedule with Alchemize</span>
          <h1>Select an appointment time.</h1>
          <div className="scheduler-context">
            <span>
              <CalendarDays /> {context.appointment_type}
            </span>
            <span>
              <MapPin /> {context.meeting_method}
            </span>
            <span>
              <Clock /> {context.duration_minutes} minutes · {context.timezone}
            </span>
          </div>
        </header>
        <form onSubmit={submit}>
          <div className="scheduler-step">
            <h2>1. Choose a date</h2>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(event) => loadDate(event.target.value)}
            />
          </div>
          <div className="scheduler-step">
            <h2>2. Choose an available time</h2>
            <div className="slot-grid">
              {slots.map((slot) => (
                <button
                  type="button"
                  className={selected === slot.start ? "selected" : ""}
                  key={slot.start}
                  onClick={() => setSelected(slot.start)}
                >
                  {slot.label}
                </button>
              ))}
              {date && !status.busy && slots.length === 0 ? (
                <p>No times are available on this date.</p>
              ) : null}
            </div>
          </div>
          <div className="scheduler-step">
            <h2>3. Confirm your details</h2>
            <div className="scheduler-fields">
              <label>
                <span>Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Phone (optional)</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </label>
              <label className="full">
                <span>Note or reason (optional)</span>
                <textarea
                  rows="3"
                  value={form.note}
                  onChange={(event) =>
                    setForm({ ...form, note: event.target.value })
                  }
                />
              </label>
            </div>
          </div>
          {status.error ? (
            <p className="scheduler-error" role="alert">
              {status.error}
            </p>
          ) : null}
          <button
            className="button button-primary"
            disabled={status.busy || !selected}
          >
            {status.busy ? "Confirming…" : "Confirm Appointment"}
          </button>
        </form>
      </section>
    </main>
  );
}

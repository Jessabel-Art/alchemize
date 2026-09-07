import { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { portalApi } from "../../services/portal-api.js";
import "./client-appointments.css";

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
const startOf = (item) => item.scheduled_start || item.scheduled_at;
const historical = (item) =>
  ["completed", "cancelled", "no_show"].includes(item.status) ||
  new Date(startOf(item)).getTime() < Date.now();
const displayDate = (value, timezone, time = false) =>
  new Date(value).toLocaleString(
    undefined,
    time
      ? { timeZone: timezone, hour: "numeric", minute: "2-digit" }
      : {
          timeZone: timezone,
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        },
  );
const today = (zone) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function ClientAppointments({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const refresh = async () => {
    const result = await portalApi.appointments();
    setItems(result.items || []);
    window.dispatchEvent(new Event("alchemize:portal-refresh"));
  };
  useEffect(() => {
    let active = true;
    portalApi
      .appointmentBooking()
      .then((data) => {
        if (active) setConfig(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const upcoming = items
    .filter((item) => !historical(item))
    .sort((a, b) => new Date(startOf(a)) - new Date(startOf(b)));
  const past = items
    .filter(historical)
    .sort((a, b) => new Date(startOf(b)) - new Date(startOf(a)));
  return (
    <div className="portal-workspace-grid appointments-workspace-grid">
      <div className="portal-workspace-primary">
        <div className="appointments-workspace">
          {success ? (
            <p role="status" className="portal-feedback success">
              <CheckCircle size={18} aria-hidden="true" />
              {success}
            </p>
          ) : null}
          <section aria-labelledby="upcoming-title">
            <h2 id="upcoming-title">Upcoming appointments</h2>
            {upcoming.length ? (
              <div className="appointment-rows">
                {upcoming.map((item) => (
                  <AppointmentRow key={item.id} item={item} refresh={refresh} />
                ))}
              </div>
            ) : (
              <div className="appointment-empty">
                <Calendar aria-hidden="true" />
                <div>
                  <h3>No appointments scheduled.</h3>
                  <p>
                    Choose an available time below whenever you'd like to meet
                    with us.
                  </p>
                  <a href="#book-appointment" className="portal-action-button">
                    Book an appointment
                  </a>
                </div>
              </div>
            )}
          </section>
          {past.length ? (
            <section aria-labelledby="past-title">
              <h2 id="past-title">Past appointments</h2>
              <div className="appointment-rows appointment-history">
                {past.map((item) => (
                  <AppointmentRow key={item.id} item={item} refresh={refresh} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
      <aside className="portal-workspace-utility">
        <section
          id="book-appointment"
          className="appointment-booking"
          aria-labelledby="booking-title"
        >
          <span className="section-kicker">Time with Alchemize</span>
          <h2 id="booking-title">Book an appointment</h2>
          {error ? (
            <p role="alert">{error}</p>
          ) : !config ? (
            <p role="status">Loading booking options...</p>
          ) : config.can_book === false ? (
            <p>
              Your account can view appointments. Contact your primary account
              holder or <a href="/client-portal/messages">send a message</a> to
              arrange a meeting.
            </p>
          ) : config.types?.length ? (
            <BookingForm
              config={config}
              onBooked={async () => {
                setSuccess("Your appointment is confirmed.");
                await refresh();
              }}
            />
          ) : (
            <p>
              Booking options are temporarily unavailable. Please{" "}
              <a href="/client-portal/messages">message Alchemize</a>.
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}

function SlotPicker({
  timezone,
  loadSlots,
  onSelect,
  selected,
  disabled = false,
}) {
  const [date, setDate] = useState(() => today(timezone));
  const [state, setState] = useState({ loading: true, slots: [], error: "" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ loading: true, slots: [], error: "" });
    loadSlots(date)
      .then((data) => {
        if (active)
          setState({ loading: false, slots: data.slots || [], error: "" });
      })
      .catch((err) => {
        if (active) setState({ loading: false, slots: [], error: err.message });
      });
    return () => {
      active = false;
    };
  }, [date, loadSlots, revision]);
  return (
    <div className="appointment-slot-picker">
      <label>
        Select a date
        <input
          type="date"
          min={today(timezone)}
          value={date}
          disabled={disabled}
          onChange={(event) => {
            setDate(event.target.value);
            onSelect(null);
          }}
        />
      </label>
      <p>Times shown in {timezone.replaceAll("_", " ")}.</p>
      <h3>Available times</h3>
      {state.error ? (
        <div role="alert">
          {state.error}
          <button
            type="button"
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry availability
          </button>
        </div>
      ) : state.loading ? (
        <p role="status">Checking availability...</p>
      ) : state.slots.length ? (
        <div className="appointment-slots">
          {state.slots.map((slot) => (
            <button
              type="button"
              key={slot.start}
              disabled={disabled}
              aria-pressed={selected?.start === slot.start}
              onClick={() => onSelect(slot)}
            >
              {slot.label || displayDate(slot.start, timezone, true)}
            </button>
          ))}
        </div>
      ) : (
        <p>
          No available times on this date. Choose another date or request
          another time below.
        </p>
      )}
    </div>
  );
}

function BookingForm({ config, onBooked }) {
  const requestedService = new URLSearchParams(window.location.search).get(
    "engagement",
  );
  const [service, setService] = useState(() =>
    config.services.some((item) => item.id === requestedService)
      ? requestedService
      : config.services.length === 1
        ? config.services[0].id
        : "",
  );
  const [type, setType] = useState(config.types[0].key);
  const [method, setMethod] = useState(config.default_method);
  const [slot, setSlot] = useState(null);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(false);
  const [revision, setRevision] = useState(0);
  const key = useRef(null);
  const selectedType = config.types.find((item) => item.key === type);
  // Stable callback so selecting a time does not restart availability requests.
  const loader = useCallback(
    (date) =>
      portalApi.appointmentAvailability({
        date,
        type,
        engagement_id: service,
        meeting_method: method,
      }),
    [type, service, method],
  );
  useEffect(() => {
    setSlot(null);
    key.current = null;
  }, [type, service, method, revision]);
  const book = async () => {
    if (busy) return;
    key.current ||= crypto.randomUUID();
    setBusy(true);
    setError("");
    try {
      const result = await portalApi.bookAppointment({
        type,
        engagement_id: service,
        meeting_method: method,
        selected_start: slot.start,
        note,
        booking_key: key.current,
      });
      if (result.status !== "confirmed")
        throw new Error(
          "This booking has changed. Review your appointments before booking again.",
        );
      setConfirm(false);
      setSlot(null);
      setNote("");
      setUncertain(false);
      key.current = null;
      await onBooked();
      setRevision((value) => value + 1);
    } catch (err) {
      setError(err.message);
      if (err.code === "SLOT_UNAVAILABLE") {
        setConfirm(false);
        setUncertain(false);
        setRevision((value) => value + 1);
      } else setUncertain(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <ol className="appointment-steps" aria-label="Booking progress">
        {["Service", "Appointment", "Date & time", "Confirm"].map(
          (step, index) => (
            <li
              key={step}
              aria-current={(confirm ? 3 : 2) === index ? "step" : undefined}
            >
              <span>{index + 1}</span>
              {step}
            </li>
          ),
        )}
      </ol>
      {error ? (
        <p role="alert" className="portal-feedback error">
          {error}
        </p>
      ) : null}
      {confirm ? (
        <div className="appointment-confirm">
          <h3>Confirm your appointment</h3>
          <BookingSummary
            type={selectedType.label}
            service={config.services.find((item) => item.id === service)?.title}
            slot={slot}
            timezone={config.timezone}
            duration={selectedType.duration_minutes}
            method={config.methods.find((item) => item.key === method)?.label}
          />
          <div className="portal-action-group">
            {!uncertain ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirm(false)}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              className="portal-action-button"
              disabled={busy}
              onClick={book}
            >
              {busy
                ? "Confirming..."
                : uncertain
                  ? "Retry this booking"
                  : "Confirm appointment"}
            </button>
          </div>
          {uncertain ? (
            <p>
              Retry to check this same booking without creating a duplicate. You
              can also <a href="/client-portal/messages">contact Alchemize</a>.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="appointment-booking-grid">
          <div className="appointment-fields">
            <label>
              Related service
              <select
                value={service}
                onChange={(event) => setService(event.target.value)}
              >
                <option value="">General / Not service-specific</option>
                {config.services.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Appointment type
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {config.types.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="appointment-duration">
              <Clock aria-hidden="true" />
              {selectedType.duration_minutes} minutes
            </p>
            {config.methods.length > 1 ? (
              <label>
                Meeting method
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                >
                  {config.methods.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p>Meeting method: {config.methods[0].label}</p>
            )}
            <label>
              Anything you'd like us to know?
              <textarea
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
          </div>
          <div>
            <SlotPicker
              key={type + service + method + revision}
              timezone={config.timezone}
              loadSlots={loader}
              selected={slot}
              onSelect={setSlot}
            />
            {slot ? (
              <button
                type="button"
                className="portal-action-button"
                onClick={() => setConfirm(true)}
              >
                Review appointment
              </button>
            ) : null}
          </div>
        </div>
      )}
      {!confirm ? (
        <div className="appointment-fallback">
          <p>Can't find a time that works?</p>
          <button
            type="button"
            aria-expanded={fallback}
            onClick={() => setFallback(!fallback)}
          >
            {fallback ? "Close request" : "Request another time"}
          </button>
          {fallback ? (
            <RequestTime config={config} engagement={service} />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function BookingSummary({ type, service, slot, timezone, duration, method }) {
  return (
    <div className="appointment-summary">
      <strong>{type}</strong>
      <p>{service || "General / Not service-specific"}</p>
      <p>{displayDate(slot.start, timezone)}</p>
      <p>
        {displayDate(slot.start, timezone, true)} –{" "}
        {displayDate(slot.end, timezone, true)} ({duration} minutes)
      </p>
      <p>
        {method} · {timezone}
      </p>
    </div>
  );
}

function AppointmentRow({ item, refresh }) {
  const [open, setOpen] = useState(
    () =>
      new URLSearchParams(window.location.search).get("appointment") ===
      item.id,
  );
  const [action, setAction] = useState("");
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loader] = useState(
    () => (date) => portalApi.rescheduleAvailability(item.id, date),
  );
  const run = async (name, payload = {}) => {
    setBusy(true);
    setMessage("");
    try {
      await portalApi.appointmentAction(item.id, name, payload);
      setMessage(
        name === "confirm"
          ? "Appointment confirmed."
          : "Your request was sent to Alchemize for review. Your appointment remains unchanged until approved.",
      );
      setAction("");
      await refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };
  const past = historical(item);
  const method = label(item.meeting_method || item.location_type);
  const safeMeeting = /^https:\/\//i.test(item.meeting_url || "");
  return (
    <article className="appointment-row">
      <Calendar className="appointment-icon" aria-hidden="true" />
      <div>
        <strong>{item.appointment_type}</strong>
        <p>{item.engagement_title || "General / Not service-specific"}</p>
        <p>
          {displayDate(startOf(item), item.timezone)}
          <br />
          {displayDate(startOf(item), item.timezone, true)}
          {item.scheduled_end
            ? ` – ${displayDate(item.scheduled_end, item.timezone, true)}`
            : ""}
          {item.duration_minutes ? ` · ${item.duration_minutes} minutes` : ""}
        </p>
        <small>
          {method} · {item.timezone}
        </small>
      </div>
      <span className="td-status">
        {item.status === "requested"
          ? "Awaiting confirmation"
          : label(item.status)}
      </span>
      <button
        type="button"
        className="portal-action-button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close details" : "View details"}
      </button>
      {open ? (
        <div className="appointment-details">
          {item.client_instructions ? (
            <p>
              <strong>Notes and instructions</strong>
              <br />
              {item.client_instructions}
            </p>
          ) : null}
          {item.location ? <p>Location: {item.location}</p> : null}
          {safeMeeting && !past ? (
            <a
              href={item.meeting_url}
              className="portal-action-button"
              target="_blank"
              rel="noreferrer"
            >
              <Video size={16} aria-hidden="true" />
              Join meeting
            </a>
          ) : null}
          {item.engagement_id ? (
            <a
              href={
                "/client-portal/services/" +
                encodeURIComponent(item.engagement_id)
              }
            >
              View service
            </a>
          ) : null}
          {item.pending_request ? (
            <p>
              Your {label(item.pending_request).toLowerCase()} request is
              awaiting Alchemize review.
            </p>
          ) : !past ? (
            <div className="portal-action-group">
              {item.status === "scheduled" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run("confirm")}
                >
                  Confirm appointment
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setAction("reschedule");
                  setSlot(null);
                }}
              >
                Request reschedule
              </button>
              <button type="button" onClick={() => setAction("cancel")}>
                Request cancellation
              </button>
            </div>
          ) : null}
          {message ? <p role="status">{message}</p> : null}
          {action === "cancel" ? (
            <div className="appointment-confirm">
              <h3>Request cancellation of this appointment?</h3>
              <p>
                {item.appointment_type} ·{" "}
                {displayDate(startOf(item), item.timezone)} at{" "}
                {displayDate(startOf(item), item.timezone, true)}
              </p>
              <p>
                Alchemize will review your request before cancelling the
                appointment.
              </p>
              <div className="portal-action-group">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAction("")}
                >
                  Keep appointment
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run("request-cancellation")}
                >
                  Send cancellation request
                </button>
              </div>
            </div>
          ) : null}
          {action === "reschedule" ? (
            <div className="appointment-confirm">
              <h3>Request a new time</h3>
              <p>
                Choose an available time. Alchemize must approve this change;
                this selection does not reserve a slot.
              </p>
              <SlotPicker
                timezone={item.timezone}
                loadSlots={loader}
                selected={slot}
                onSelect={setSlot}
              />
              <button
                type="button"
                className="portal-action-button"
                disabled={!slot || busy}
                onClick={() =>
                  run("request-reschedule", { requested_at: slot.start })
                }
              >
                Send reschedule request
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function RequestTime({ config, engagement }) {
  const [preferred, setPreferred] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="appointment-fields"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await portalApi.requestAppointment({
            engagement_id: engagement,
            preferred_at: preferred,
            appointment_type: config.types[0].label,
            location_type: config.default_method,
            reason: note,
          });
          setMessage(
            "Your request was sent to Alchemize. This is not a confirmed booking.",
          );
        } catch (err) {
          setMessage(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Preferred date and time ({config.timezone})
        <input
          required
          type="datetime-local"
          value={preferred}
          onChange={(event) => setPreferred(event.target.value)}
        />
      </label>
      <label>
        Anything you'd like us to know?
        <textarea
          value={note}
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button disabled={busy} className="portal-action-button">
        <MessageSquare size={16} aria-hidden="true" />
        Send time request
      </button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}

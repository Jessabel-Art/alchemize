import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageShell from "../../components/ui/PageShell.jsx";
import { initContactForm } from "../../../js/contact-form.js";
import "./contact.css";
import "./contact-integration.css";

const individualServiceOptions = [
  ["individual-tax", "Tax Preparation"],
  ["individual-insurance", "Insurance Solutions"],
  ["individual-notary", "Notary & Document Services"],
];

const businessServiceOptions = [
  ["business-advisory", "Business Advisory & Optimization"],
  ["business-operations", "Business Operations & Implementation"],
  ["business-digital", "Digital Business & Technology"],
  ["business-readiness", "Business Readiness & Growth"],
  ["business-financial", "Financial & Tax Support"],
];

const allServiceOptions = [...individualServiceOptions, ...businessServiceOptions];

function ContactPage() {
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get("service") ?? "";

  const currentService = useMemo(() => {
    return allServiceOptions.some(([value]) => value === requestedService)
      ? requestedService
      : "";
  }, [requestedService]);

  const defaultAudience = currentService
    ? currentService.startsWith("business-")
      ? "business"
      : "individual"
    : "";

  const [selectedAudience, setSelectedAudience] = useState(defaultAudience);

  useEffect(() => {
    setSelectedAudience(defaultAudience);
  }, [defaultAudience]);

  useEffect(() => initContactForm(), []);

  const visibleServiceOptions =
    selectedAudience === "business"
      ? businessServiceOptions
      : selectedAudience === "individual"
        ? individualServiceOptions
        : allServiceOptions;

  return (
    <div className="contact-page">
      <PageShell
        eyebrow="Start the conversation"
        title="Tell us what you are working through."
        summary="You do not need to identify the exact service before reaching out. Start with the situation, responsibility, or outcome in front of you."
      >
        <section className="contact-layout">
          <form className="contact-form" data-contact-form noValidate>
            <header>
              <span className="section-kicker">Consultation request</span>
              <h2>Tell us where you'd like to start.</h2>
            </header>

            <div
              id="contact-success"
              className="contact-success"
              role="status"
              aria-live="polite"
              hidden
            >
              <strong>Your request has been received.</strong>
              <p>
                Thank you for contacting Alchemize. We received your
                consultation request and will follow up with you within 24 hours
                to schedule your consultation.
              </p>
            </div>

            <div className="contact-fields">
              <label className="field">
                First name
                <input
                  id="first-name"
                  name="firstName"
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="field">
                Last name
                <input
                  id="last-name"
                  name="lastName"
                  autoComplete="family-name"
                  required
                />
              </label>
              <label className="field">
                Email address
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="field">
                Phone number
                <input id="phone" type="tel" name="phone" autoComplete="tel" />
              </label>
              <label className="field field-full">
                Who is this for?
                <select
                  id="audience"
                  name="audience"
                  value={selectedAudience}
                  onChange={(event) => setSelectedAudience(event.target.value)}
                  required
                >
                  <option value="">I'm not sure yet</option>
                  <option value="individual">Me / my household</option>
                  <option value="business">My business</option>
                </select>
              </label>
              <label className="field field-full">
                What do you need help with?
                <select id="service" name="service" defaultValue={currentService}>
                  <option value="">I'm not sure yet</option>
                  {visibleServiceOptions.map(([value, label], index) => (
                    <option value={value} key={`${value}-${index}`}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field field-full">
                Preferred contact
                <select id="contact-method" name="contactMethod" defaultValue="">
                  <option value="">No preference</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="either">Either</option>
                </select>
              </label>
              <label className="field field-full contact-message">
                What are you trying to accomplish, improve, or resolve?
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  minLength="10"
                  required
                />
              </label>
              <label className="contact-honeypot" aria-hidden="true">
                Website
                <input name="website" tabIndex="-1" autoComplete="off" />
              </label>
            </div>

            <div className="contact-submit-row">
              <button className="button button-primary" type="submit">
                Send Inquiry
              </button>
              <p
                id="form-status"
                className="contact-status"
                role="status"
                aria-live="polite"
                tabIndex="-1"
              />
            </div>

            <div className="contact-privacy" aria-live="polite">
              <span className="contact-privacy-label">Please don't send sensitive records here.</span>
              <p>
                Do not include Social Security numbers, tax records, banking
                information, medical information, identification documents, or
                other sensitive records in this form. If documents are needed,
                we'll provide the appropriate next step.
              </p>
            </div>
          </form>

          <aside className="contact-aside">
            <span className="eyebrow eyebrow--gold">What to expect</span>
            <h2>A clear first step.</h2>
            <ol>
              <li>
                <strong>Describe the need</strong>
                <p>
                  Tell us what is happening and what you need help moving
                  forward.
                </p>
              </li>
              <li>
                <strong>Identify the path</strong>
                <p>
                  We will determine whether the request fits Alchemize's scope
                  and what comes next.
                </p>
              </li>
              <li>
                <strong>Prepare the conversation</strong>
                <p>
                  If a consultation is appropriate, you will receive guidance
                  about what to have ready.
                </p>
              </li>
            </ol>
            <p className="contact-aside-note">
              Alchemize will follow up within 24 hours to schedule the
              consultation.
            </p>
          </aside>
        </section>
      </PageShell>
    </div>
  );
}

export default ContactPage;

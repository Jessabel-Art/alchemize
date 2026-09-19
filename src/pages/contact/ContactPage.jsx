import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import PageShell from "../../components/ui/PageShell.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import { businessContact, contactRouting } from "../../data/contactInfo.js";
import {
  initContactForm,
  normalizeServiceKey,
} from "../../../js/contact-form.js";
import { contactContent } from "./contactContent.js";
import { getContactServiceGroups } from "../services/publicServiceIndex.js";
import "./contact.css";
import "./contact-integration.css";

const AUDIENCES = ["individual", "business"];

// `business-digital` (Web & Digital Solutions) is reachable by both audiences,
// so its audience comes from the visitor (or the link); every other service
// belongs to the audience its key names.
function audienceForService(serviceKey, preferred) {
  if (!serviceKey) return AUDIENCES.includes(preferred) ? preferred : "";
  if (serviceKey === "business-digital") {
    return AUDIENCES.includes(preferred) ? preferred : "business";
  }
  return serviceKey.startsWith("business-") ? "business" : "individual";
}

function ContactPage() {
  const { language } = useLanguage();
  const content = contactContent[language];
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const groups = useMemo(() => getContactServiceGroups(language), [language]);
  // Legacy identifiers in old links resolve to their canonical key.
  const requestedService = normalizeServiceKey(
    searchParams.get("service") ?? "",
  );
  const requestedAudience = searchParams.get("audience") ?? "";
  const initialAudience = audienceForService(
    requestedService,
    requestedAudience,
  );
  const [selectedAudience, setSelectedAudience] = useState(initialAudience);
  const [selectedService, setSelectedService] = useState(requestedService);
  const [submitted, setSubmitted] = useState(false);
  const confirmationRef = useRef(null);
  const wasSubmitted = useRef(false);
  // Set by a service CTA on the page the visitor came from (router state belongs
  // to that one navigation): which page and CTA led here. Read by analytics only.
  const originRef = useRef(null);
  originRef.current = location.state?.leadOrigin ?? null;

  usePageMetadata({
    en: contactContent.en.metadata,
    es: contactContent.es.metadata,
  });
  useEffect(() => {
    setSelectedAudience(initialAudience);
    setSelectedService(requestedService);
  }, [initialAudience, requestedService]);
  const handleSuccess = useCallback(() => {
    setSelectedAudience("");
    setSelectedService("");
    setSubmitted(true);
  }, []);
  useEffect(
    () =>
      initContactForm(content.formMessages, {
        getOrigin: () => originRef.current,
        onSuccess: handleSuccess,
      }),
    [content.formMessages, handleSuccess],
  );
  // Focus follows the state change: to the confirmation once the request is
  // stored, back to the first field when the visitor starts another request.
  useEffect(() => {
    if (submitted) confirmationRef.current?.focus();
    else if (wasSubmitted.current)
      document.getElementById("first-name")?.focus();
    wasSubmitted.current = submitted;
  }, [submitted]);

  const handleAudienceChange = (audience) => {
    setSelectedAudience(audience);
    // keep the service only if it is offered to the newly chosen audience
    const stillOffered = groups
      .filter((group) => !audience || group.audience === audience)
      .some((group) =>
        group.items.some((item) => item.value === selectedService),
      );
    if (!stillOffered) setSelectedService("");
  };
  const handleServiceChange = (serviceKey) => {
    setSelectedService(serviceKey);
    if (serviceKey) {
      setSelectedAudience(audienceForService(serviceKey, selectedAudience));
    }
  };

  // With no audience chosen, both groups are shown; the Individuals -> Digital
  // Support alias is left out then so the shared key is listed once.
  const visibleGroups = groups
    .filter((group) => !selectedAudience || group.audience === selectedAudience)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => selectedAudience || !item.alias),
    }));

  return (
    <div className="contact-page">
      <PageShell
        eyebrow={content.page.eyebrow}
        title={content.page.title}
        summary={content.page.summary}
      >
        <section className="contact-layout">
          <form className="contact-form" data-contact-form noValidate>
            <input type="hidden" name="languagePreference" value={language} />
            <div className="contact-form-body" hidden={submitted}>
              <header>
                <span className="section-kicker">{content.form.kicker}</span>
                <h2>{content.form.title}</h2>
              </header>
              <div className="contact-fields">
                <label className="field">
                  {content.form.first}
                  <input
                    id="first-name"
                    name="firstName"
                    autoComplete="given-name"
                    required
                  />
                </label>
                <label className="field">
                  {content.form.last}
                  <input
                    id="last-name"
                    name="lastName"
                    autoComplete="family-name"
                    required
                  />
                </label>
                <label className="field">
                  {content.form.email}
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="field">
                  {content.form.phone}
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                  />
                </label>
                <label className="field field-full">
                  {content.form.audience}
                  <select
                    id="audience"
                    name="audience"
                    value={selectedAudience}
                    onChange={(event) =>
                      handleAudienceChange(event.target.value)
                    }
                    required
                  >
                    <option value="">{content.form.choose}</option>
                    <option value="individual">
                      {content.form.individual}
                    </option>
                    <option value="business">{content.form.business}</option>
                  </select>
                </label>
                <label className="field field-full">
                  {content.form.service}
                  <select
                    id="service"
                    name="service"
                    value={selectedService}
                    onChange={(event) =>
                      handleServiceChange(event.target.value)
                    }
                  >
                    <option value="">{content.form.unsure}</option>
                    {visibleGroups.map((group) => (
                      <optgroup
                        key={group.audience}
                        label={content.serviceGroups[group.audience]}
                      >
                        {group.items.map((item) => (
                          <option value={item.value} key={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="field field-full">
                  {content.form.contact}
                  <select
                    id="contact-method"
                    name="contactMethod"
                    defaultValue=""
                  >
                    <option value="">{content.form.none}</option>
                    <option value="email">{content.form.emailOption}</option>
                    <option value="phone">{content.form.phoneOption}</option>
                    <option value="either">{content.form.either}</option>
                  </select>
                </label>
                <label className="field field-full contact-message">
                  {content.form.message}
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    minLength="10"
                    required
                  />
                </label>
                <label className="contact-honeypot" aria-hidden="true">
                  {content.form.website}
                  <input name="website" tabIndex="-1" autoComplete="off" />
                </label>
              </div>
              <div className="contact-submit-row">
                <button className="button button-primary" type="submit">
                  {content.form.submit}
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
                <span className="contact-privacy-label">
                  {content.form.privacyLabel}
                </span>
                <p>{content.form.privacy}</p>
              </div>
            </div>
            <div
              className="contact-success"
              role="status"
              tabIndex="-1"
              ref={confirmationRef}
              hidden={!submitted}
            >
              <span className="section-kicker">
                {content.confirmation.kicker}
              </span>
              <h2>{content.confirmation.title}</h2>
              <p>{content.confirmation.body}</p>
              <p className="contact-success-next">{content.aside.note}</p>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setSubmitted(false)}
              >
                {content.confirmation.again}
              </button>
            </div>
          </form>
          <aside className="contact-aside">
            <span className="eyebrow eyebrow--gold">
              {content.aside.eyebrow}
            </span>
            <h2>{content.aside.title}</h2>
            <ol>
              {content.aside.steps.map(([title, text]) => (
                <li key={title}>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
            <p className="contact-aside-note">{content.aside.note}</p>
            <dl className="contact-directory">
              <div>
                <dt>{content.aside.contacts.general}</dt>
                <dd>
                  <a href={contactRouting.general.mailto}>
                    {contactRouting.general.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt>{content.aside.contacts.phone}</dt>
                <dd>
                  <a href={businessContact.phone.href}>
                    {businessContact.phone.display}
                  </a>
                </dd>
              </div>
              <div>
                <dt>{content.aside.contacts.newClients}</dt>
                <dd>
                  <a href={contactRouting.newClients.mailto}>
                    {contactRouting.newClients.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt>{content.aside.contacts.support}</dt>
                <dd>
                  <a href={contactRouting.support.mailto}>
                    {contactRouting.support.email}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="contact-language-availability">
              {content.aside.language}
            </p>
          </aside>
        </section>
      </PageShell>
    </div>
  );
}

export default ContactPage;

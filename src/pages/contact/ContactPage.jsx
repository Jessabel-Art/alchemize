import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageShell from "../../components/ui/PageShell.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import { businessContact, contactRouting } from "../../data/contactInfo.js";
import { initContactForm } from "../../../js/contact-form.js";
import { contactContent } from "./contactContent.js";
import { contactServiceGroups } from "../services/serviceCatalog.js";
import "./contact.css";
import "./contact-integration.css";

function ContactPage() {
  const { language } = useLanguage();
  const content = contactContent[language];
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get("service") ?? "";
  const allValues = contactServiceGroups.flatMap((group) =>
    group.items.map((item) => item.value),
  );
  const currentService = useMemo(
    () => (allValues.includes(requestedService) ? requestedService : ""),
    [requestedService],
  );
  const defaultAudience = currentService
    ? currentService.startsWith("business-")
      ? "business"
      : "individual"
    : "";
  const [selectedAudience, setSelectedAudience] = useState(defaultAudience);

  usePageMetadata({
    en: contactContent.en.metadata,
    es: contactContent.es.metadata,
  });
  useEffect(() => setSelectedAudience(defaultAudience), [defaultAudience]);
  useEffect(
    () => initContactForm(content.formMessages),
    [content.formMessages],
  );

  const visibleGroups = selectedAudience
    ? contactServiceGroups.filter(
        (group) => group.audience === selectedAudience,
      )
    : contactServiceGroups;

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
                <input id="phone" type="tel" name="phone" autoComplete="tel" />
              </label>
              <label className="field field-full">
                {content.form.audience}
                <select
                  id="audience"
                  name="audience"
                  value={selectedAudience}
                  onChange={(event) => setSelectedAudience(event.target.value)}
                  required
                >
                  <option value="">{content.form.unsure}</option>
                  <option value="individual">{content.form.individual}</option>
                  <option value="business">{content.form.business}</option>
                </select>
              </label>
              <label className="field field-full">
                {content.form.service}
                <select
                  id="service"
                  name="service"
                  defaultValue={currentService}
                >
                  <option value="">{content.form.unsure}</option>
                  {visibleGroups.map((group) => (
                    <optgroup
                      key={group.audience}
                      label={content.serviceGroups[group.audience]}
                    >
                      {group.items.map((item) => (
                        <option value={item.value} key={item.value}>
                          {content.services[item.value] || item.label}
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

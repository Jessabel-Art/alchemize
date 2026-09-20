import { ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal.jsx";
import LocalizedLink from "../../i18n/LocalizedLink.jsx";
import {
  describeTier,
  formatPercent,
  publicServicePricing,
} from "../../data/publicServicePricing.js";

// Reusable modules for the editorial service page. Each takes the matching
// block of a service's `detail` (see serviceDetail.en.js / serviceDetail.es.js)
// and renders nothing when that block is absent, so a page uses only the
// modules that help its buying decision.

export const moduleLabels = {
  en: {
    fit: "Is this for you?",
    does: "What Alchemize does",
    options: "How it is scoped",
    pricing: "Pricing",
    seePricing: "See pricing",
    process: "What to expect",
    processTitle: "How the work moves.",
    compare: "How it differs",
    faq: "Questions",
    thisService: "This service",
    viewService: "View service",
    proofLabel: "Experience behind the work",
    proofLink: "Meet the Founder",
  },
  es: {
    fit: "¿Es para usted?",
    does: "Lo que hace Alchemize",
    options: "Cómo se define el alcance",
    pricing: "Precios",
    seePricing: "Ver precios",
    process: "Qué esperar",
    processTitle: "Cómo avanza el trabajo.",
    compare: "En qué se diferencia",
    faq: "Preguntas",
    thisService: "Este servicio",
    viewService: "Ver servicio",
    proofLabel: "La experiencia detrás del trabajo",
    proofLink: "Conozca a la fundadora",
  },
};

export function ServiceFit({ fit, language }) {
  if (!fit?.items?.length) return null;
  const labels = moduleLabels[language] ?? moduleLabels.en;
  return (
    <section className="editorial-service-fit">
      <div className="content-shell editorial-service-fit-grid">
        <Reveal>
          <span className="eyebrow">{labels.fit}</span>
          <h2>{fit.title}</h2>
        </Reveal>
        <Reveal delay={70}>
          <ul className="editorial-service-fit-list">
            {fit.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

// Scope as titled groups, inside the existing dark scope band.
export function ServiceScopeGroups({ does, language }) {
  const labels = moduleLabels[language] ?? moduleLabels.en;
  return (
    <section className="editorial-service-scope editorial-service-scope--groups">
      <div className="content-shell editorial-service-scope-grid">
        <Reveal>
          <span className="eyebrow eyebrow--gold">{labels.does}</span>
          <h2>{does.title}</h2>
          {does.intro ? <p>{does.intro}</p> : null}
        </Reveal>
        <div className="editorial-service-scope-groups">
          {does.groups.map((group) => (
            <div key={group.title} className="editorial-service-scope-group">
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServiceOptions({ options, language }) {
  if (!options?.items?.length) return null;
  const labels = moduleLabels[language] ?? moduleLabels.en;
  return (
    <section className="editorial-service-options">
      <div className="content-shell">
        <Reveal className="editorial-service-module-head">
          <div>
            <span className="eyebrow">{labels.options}</span>
            <h2>{options.title}</h2>
          </div>
          {options.intro ? <p>{options.intro}</p> : null}
        </Reveal>
        <ol className="editorial-service-option-grid">
          {options.items.map((item) => (
            <li key={item.name} className="editorial-service-option">
              {item.tag ? (
                <span className="editorial-service-option-tag">{item.tag}</span>
              ) : null}
              <h3>{item.name}</h3>
              <p>{item.text}</p>
              {item.to ? (
                <LocalizedLink className="text-link" to={item.to}>
                  {labels.viewService}: {item.name}
                </LocalizedLink>
              ) : null}
            </li>
          ))}
        </ol>
        {options.note ? (
          <p className="editorial-service-module-note">{options.note}</p>
        ) : null}
      </div>
    </section>
  );
}

// Public pricing. Only the services in publicServicePricing.js may render this;
// amounts are read from that module, never typed into content.
export function ServicePricing({ serviceKey, pricing, language, ctaProps }) {
  const data = publicServicePricing[serviceKey];
  if (!pricing || !data) return null;
  const labels = moduleLabels[language] ?? moduleLabels.en;
  const rush = data.rushSurcharge ? formatPercent(data.rushSurcharge) : "";
  return (
    <section id="pricing" className="editorial-service-pricing">
      <div className="content-shell">
        <Reveal className="editorial-service-module-head">
          <div>
            <span className="eyebrow">{labels.pricing}</span>
            <h2>{pricing.title}</h2>
          </div>
          {pricing.intro ? <p>{pricing.intro}</p> : null}
        </Reveal>
        <div className="editorial-service-price-grid">
          {pricing.tiers.map((tier) => {
            const price = describeTier(serviceKey, tier.id, language);
            if (!price) return null;
            return (
              <article key={tier.id} className="editorial-service-price-card">
                <h3>{tier.name}</h3>
                <p className="editorial-service-price">
                  {price.additive ? <span aria-hidden="true">+</span> : null}
                  <strong>{price.price}</strong>
                  <span>{price.unit}</span>
                </p>
                {price.limit || price.minimum ? (
                  <p className="editorial-service-price-meta">
                    {[price.limit, price.minimum].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                <p>{tier.text}</p>
                {tier.points?.length ? (
                  <ul>
                    {tier.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
        <div className="editorial-service-pricing-foot">
          <dl className="editorial-service-pricing-extras">
            {pricing.extras?.map(({ label, text }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{text.replace("{rush}", rush)}</dd>
              </div>
            ))}
          </dl>
          {pricing.separate ? (
            <div className="editorial-service-pricing-separate">
              <h3>{pricing.separate.title}</h3>
              <ul>
                {pricing.separate.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {ctaProps ? (
          <LocalizedLink className="button button-primary" {...ctaProps}>
            {pricing.cta}
          </LocalizedLink>
        ) : null}
      </div>
    </section>
  );
}

// Numbered steps for services whose page otherwise shows a "what to bring"
// panel instead of a process.
export function ServiceSteps({ steps, language }) {
  if (!steps?.length) return null;
  const labels = moduleLabels[language] ?? moduleLabels.en;
  return (
    <section className="editorial-service-steps">
      <div className="content-shell">
        <div className="editorial-service-specific-heading">
          <span className="eyebrow">{labels.process}</span>
          <h2>{labels.processTitle}</h2>
        </div>
        <ol className="editorial-service-process">
          {steps.map(([name, description], index) => (
            <li key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{name}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ServiceCompare({ compare, language }) {
  if (!compare?.rows?.length) return null;
  const labels = moduleLabels[language] ?? moduleLabels.en;
  return (
    <section className="editorial-service-compare">
      <div className="content-shell editorial-service-compare-grid">
        <Reveal>
          <span className="eyebrow">{labels.compare}</span>
          <h2>{compare.title}</h2>
          {compare.intro ? <p>{compare.intro}</p> : null}
        </Reveal>
        <ul className="editorial-service-compare-list">
          {compare.rows.map((row) => (
            <li
              key={row.label}
              className={row.current ? "is-current" : undefined}
            >
              <strong>
                {row.label}
                {row.current ? <em>{labels.thisService}</em> : null}
              </strong>
              <p>{row.text}</p>
              {row.to ? (
                <LocalizedLink className="text-link" to={row.to}>
                  {labels.viewService}: {row.label}
                </LocalizedLink>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ServiceFaq({ faq, language }) {
  if (!faq?.items?.length) return null;
  const labels = moduleLabels[language] ?? moduleLabels.en;
  return (
    <section className="editorial-service-faq">
      <div className="content-shell editorial-service-faq-grid">
        <Reveal>
          <span className="eyebrow">{labels.faq}</span>
          <h2>{faq.title}</h2>
        </Reveal>
        <div className="editorial-service-faq-list">
          {faq.items.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// Related services with a line of context. Labels come from each
// destination's canonical title (see the catalogs).
export function ServiceRelated({ items, heading }) {
  const rows = items.filter(([, to]) => Boolean(to)).slice(0, 4);
  if (!rows.length) return null;
  return (
    <section>
      <h3>{heading}</h3>
      <div className="editorial-service-links editorial-service-links--noted">
        {rows.map(([label, to, note]) => (
          <LocalizedLink key={to} to={to}>
            <span>
              <strong>{label}</strong>
              {note ? <small>{note}</small> : null}
            </span>
            <ArrowRight aria-hidden="true" />
          </LocalizedLink>
        ))}
      </div>
    </section>
  );
}

// One restrained line of relevant experience, shown only where it adds value
// (Advisory, Foundation, Operations, Bookkeeping). It sits in the closing
// block, just above the request, instead of becoming a section of its own.
export function ServiceProof({ proof, language }) {
  if (!proof?.text) return null;
  const labels = moduleLabels[language] ?? moduleLabels.en;
  return (
    <p className="editorial-service-proof">
      <strong>{labels.proofLabel}</strong>
      <span>{proof.text}</span>
      <LocalizedLink className="text-link" to="/resources/meet-the-founder">
        {labels.proofLink}
      </LocalizedLink>
    </p>
  );
}

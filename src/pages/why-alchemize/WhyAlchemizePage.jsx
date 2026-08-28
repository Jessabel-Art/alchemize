import {
  ClipboardCheck,
  Compass,
  Focus,
  FolderTree,
  Link2,
  MoveRight,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Reveal from "../../components/ui/Reveal.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import { whyContent } from "./whyContent.js";
import "./why-alchemize.css";

const approachIcons = [Search, FolderTree, Focus, MoveRight];
const principleIcons = [Compass, Link2, ClipboardCheck, ShieldCheck, RefreshCw];

const continuityRoutes = {
  "Tax Preparation": "/services/individuals/tax-preparation",
  "Notary & Documents": "/services/individuals/notary-document-services",
  "Translation & Apostille": [
    { label: "Translation", to: "/services/individuals/translation-services" },
    { label: "Apostille", to: "/services/individuals/apostille-services" },
  ],
  "Digital Support": "/web-digital",
  "Preparation & Organization": "/services/individuals",
  "Startup Support": "/services/businesses/readiness-growth",
  "Bookkeeping & Payroll": [
    { label: "Bookkeeping", to: "/services/businesses/bookkeeping-financial-reporting" },
    { label: "Payroll", to: "/services/businesses/payroll-processing" },
  ],
  "Business Tax Support": "/services/businesses/business-tax-support",
  "Operations & Administration": "/services/businesses/operations-implementation",
  Advisory: "/services/businesses/advisory-optimization",
};

function WhyAlchemizePage() {
  const { language } = useLanguage();
  const content = whyContent[language];
  usePageMetadata({ en: whyContent.en.metadata, es: whyContent.es.metadata });

  return (
    <article className="why-page">
      <section className="why-hero">
        <div className="why-hero-field" aria-hidden="true" />
        <div className="content-shell why-hero-grid">
          <Reveal className="why-hero-copy">
            <span className="eyebrow">{content.hero.eyebrow}</span>
            <h1>
              {content.hero.start} <em>{content.hero.emphasis}</em>
            </h1>
            <p>{content.hero.copy}</p>
            <div className="why-actions">
              <Link className="button button-primary" to="/contact">
                {content.hero.primary}
              </Link>
              <a className="button button-outline" href="#difference">
                {content.hero.secondary}
              </a>
            </div>
          </Reveal>
          <div className="why-orbit" aria-hidden="true">
            <span className="why-orbit-ring why-orbit-ring--outer" />
            <span className="why-orbit-ring why-orbit-ring--inner" />
            <span className="why-orbit-core">A</span>
            {content.hero.orbit.map((item) => (
              <i key={item}>{item}</i>
            ))}
          </div>
        </div>
      </section>

      <section className="why-problem" id="difference">
        <div className="content-shell why-problem-grid">
          <Reveal>
            <span className="eyebrow">{content.problem.eyebrow}</span>
            <h2>{content.problem.title}</h2>
          </Reveal>
          <Reveal className="why-problem-copy">
            {content.problem.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </Reveal>
          <ul className="why-sequence">
            {content.problem.sequence.map((item, index) => (
              <Reveal as="li" delay={index * 70} key={item}>
                {item}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="why-audiences">
        <div className="why-audiences-grid">
          <div className="why-audience why-audience--light">
            <Reveal>
              <span className="eyebrow">
                {content.audiences.individual.eyebrow}
              </span>
              <h2>{content.audiences.individual.title}</h2>
              <p>{content.audiences.individual.copy}</p>
              <Link className="text-link" to="/services/individuals">
                {content.audiences.individual.link}
              </Link>
            </Reveal>
          </div>
          <div className="why-audience-principle">
            <span>{content.audiences.principle.label}</span>
            <strong>{content.audiences.principle.text}</strong>
          </div>
          <div className="why-audience why-audience--dark">
            <Reveal>
              <span className="eyebrow eyebrow--gold">
                {content.audiences.business.eyebrow}
              </span>
              <h2>{content.audiences.business.title}</h2>
              <p>{content.audiences.business.copy}</p>
              <Link
                className="text-link why-light-link"
                to="/services/businesses"
              >
                {content.audiences.business.link}
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="why-approach">
        <div className="content-shell">
          <Reveal className="why-section-intro">
            <span className="eyebrow">{content.approach.eyebrow}</span>
            <h2>{content.approach.title}</h2>
          </Reveal>
          <div className="why-approach-steps">
            {content.approach.items.map(([title, copy], index) => {
              const Icon = approachIcons[index];
              return (
                <Reveal as="article" delay={index * 70} key={title}>
                  <Icon
                    className="why-process-icon"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="why-principles">
        <div className="content-shell">
          <Reveal className="why-section-intro">
            <span className="eyebrow eyebrow--gold">
              {content.principles.eyebrow}
            </span>
            <h2>{content.principles.title}</h2>
          </Reveal>
          <div className="why-principle-list">
            {content.principles.items.map(([title, copy], index) => {
              const Icon = principleIcons[index];
              return (
                <Reveal as="article" delay={(index % 2) * 70} key={title}>
                  <Icon
                    className="why-principle-icon"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="why-continuity">
        <div className="why-continuity-watermark" aria-hidden="true">
          ALCHEMIZE
        </div>
        <div className="content-shell">
          <Reveal className="why-continuity-copy">
            <span className="eyebrow eyebrow--gold">
              {content.continuity.eyebrow}
            </span>
            <h2>{content.continuity.title}</h2>
            <p>{content.continuity.copy}</p>
          </Reveal>
          <div className="why-pathways">
            <span className="why-pathways-origin" aria-hidden="true" />
            <div className="why-pathways-grid">
              {content.continuity.paths.map(
                ([label, audience, stages], pathIndex) => (
                  <Reveal
                    as="article"
                    className={`why-pathway why-pathway--${audience}`}
                    delay={pathIndex * 100}
                    key={label}
                  >
                    <h3>{label}</h3>
                    <ol className="why-pathway-list">
                      {stages.map((stage) => {
                        const route = continuityRoutes[stage] ?? "/services";
                        const isSplitLabel = Array.isArray(route);

                        return (
                          <li key={stage} className="why-pathway-item">
                            <span
                              className="why-pathway-node"
                              aria-hidden="true"
                            />
                            {isSplitLabel ? (
                              <span className="why-pathway-stage why-pathway-stage--split">
                                {route.map((item, index) => (
                                  <span
                                    key={item.label}
                                    className="why-pathway-inline"
                                  >
                                    <Link
                                      className="why-pathway-link"
                                      to={item.to}
                                    >
                                      {item.label}
                                    </Link>
                                    {index < route.length - 1 && (
                                      <span
                                        className="why-pathway-separator"
                                        aria-hidden="true"
                                      >
                                        &
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <Link className="why-pathway-link" to={route}>
                                <span className="why-pathway-stage">{stage}</span>
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </Reveal>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="why-final">
        <div className="content-shell why-final-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {content.final.eyebrow}
            </span>
            <h2>{content.final.title}</h2>
          </Reveal>
          <Reveal>
            <p>{content.final.copy}</p>
            <div className="why-actions">
              <Link className="button button-primary" to="/contact">
                {content.final.primary}
              </Link>
              <Link className="button button--light" to="/services">
                {content.final.secondary}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default WhyAlchemizePage;

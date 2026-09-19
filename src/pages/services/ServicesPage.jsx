import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Reveal from "../../components/ui/Reveal.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import LocalizedLink from "../../i18n/LocalizedLink.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import { categoryByKey } from "../../data/serviceTaxonomy.js";
import { getServiceCategories } from "./publicServiceIndex.js";
import { servicesContent } from "./servicesContent.js";
import "./services.css";

const audienceOrder = ["individuals", "businesses"];

// The hash selects an audience ("#businesses") or deep-links to a category row
// ("#bookkeeping-payroll-support"), which belongs to one audience.
const audienceFromHash = (hash) => {
  const id = hash.replace(/^#/, "");
  if (audienceOrder.includes(id)) return id;
  return categoryByKey.get(id)?.audience ?? null;
};
const getInitialAudience = () =>
  (typeof window !== "undefined" && audienceFromHash(window.location.hash)) ||
  "individuals";

function ServicesPage() {
  const { language } = useLanguage();
  const content = servicesContent[language];
  const location = useLocation();
  const [audience, setAudience] = useState(getInitialAudience);
  const [hasInteracted, setHasInteracted] = useState(false);
  const catalogRef = useRef(null);
  const tabRefs = useRef([]);
  usePageMetadata({
    en: servicesContent.en.metadata,
    es: servicesContent.es.metadata,
  });

  useEffect(() => {
    const sync = () => {
      const nextAudience = getInitialAudience();
      setAudience(nextAudience);
      if (nextAudience === "businesses") setHasInteracted(true);
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Client-side navigation to a category deep link (footer, breadcrumb, home)
  // changes the hash without a hashchange event: show its audience, then scroll
  // to the row once the panel is visible.
  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    const category = categoryByKey.get(id);
    if (!category) return undefined;
    setAudience(category.audience);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  useEffect(() => {
    if (!hasInteracted) return;
    const frame = window.requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [audience, hasInteracted]);

  const chooseAudience = (nextAudience) => {
    setHasInteracted(true);
    setAudience(nextAudience);
    const url = new URL(window.location.href);
    url.hash = nextAudience;
    window.history.replaceState({}, "", url);
  };

  const moveTabFocus = (event, currentIndex) => {
    const keyOffsets = { ArrowRight: 1, ArrowLeft: -1 };
    let nextIndex;
    if (event.key in keyOffsets) {
      nextIndex =
        (currentIndex + keyOffsets[event.key] + audienceOrder.length) %
        audienceOrder.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = audienceOrder.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    chooseAudience(audienceOrder[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <article className="services-page">
      <section className="services-hero">
        <div className="content-shell">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {content.hero.eyebrow}
            </span>
            <h1>{content.hero.title}</h1>
            <p>{content.hero.text}</p>
          </Reveal>
        </div>
      </section>
      <section
        className="services-choice"
        aria-labelledby="services-choice-title"
      >
        <div className="content-shell">
          <Reveal className="services-choice-header">
            <span className="eyebrow">{content.choice.eyebrow}</span>
            <h2 id="services-choice-title">{content.choice.title}</h2>
          </Reveal>
          <div
            className="services-choice-grid"
            role="tablist"
            aria-label={content.choice.label}
          >
            {audienceOrder.map((option, index) => {
              const selected = audience === option;
              const item = content.choice[option];
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  id={`${option}-tab`}
                  aria-selected={selected}
                  aria-controls={`${option}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className={selected ? "is-selected" : ""}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  onClick={() => chooseAudience(option)}
                  onKeyDown={(event) => moveTabFocus(event, index)}
                >
                  <span>{item.short}</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      <section ref={catalogRef} className="services-catalog" aria-live="polite">
        {audienceOrder.map((option) => (
          <div
            key={option}
            role="tabpanel"
            id={`${option}-panel`}
            aria-labelledby={`${option}-tab`}
            hidden={audience !== option}
          >
            <div className="content-shell services-catalog-inner">
              <Reveal className="services-catalog-intro">
                <span className="eyebrow">
                  {content.audience[option].eyebrow}
                </span>
                <h2>{content.audience[option].heading}</h2>
                <p>{content.audience[option].description}</p>
              </Reveal>
              <div className="services-list">
                {getServiceCategories(option, language).map(
                  (category, index) => {
                    const capabilitiesWord =
                      language === "es" ? "capacidades" : "capabilities";
                    if (category.services.length === 1) {
                      const [service] = category.services;
                      return (
                        <Reveal
                          as={LocalizedLink}
                          className="service-row"
                          delay={index * 40}
                          id={category.key}
                          key={category.key}
                          to={category.route}
                          state={category.linkState}
                        >
                          <div className="service-row-copy">
                            <h3>{category.name}</h3>
                            <p>{category.summary ?? service.statement}</p>
                            <ul
                              aria-label={`${category.name}: ${capabilitiesWord}`}
                            >
                              {service.capabilities.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <span
                            className="service-row-arrow"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </Reveal>
                      );
                    }
                    return (
                      <Reveal
                        as="article"
                        className="service-group"
                        delay={index * 40}
                        id={category.key}
                        key={category.key}
                        aria-labelledby={`${category.key}-title`}
                      >
                        <header className="service-group-head">
                          <h3 id={`${category.key}-title`}>{category.name}</h3>
                          <p className="service-group-count">
                            {content.groupCount(category.services.length)}
                          </p>
                        </header>
                        {category.summary ? (
                          <p className="service-group-descriptor">
                            {category.summary}
                          </p>
                        ) : null}
                        <div className="service-group-children">
                          {category.services.map((service) => (
                            <LocalizedLink
                              className="service-child"
                              key={service.serviceKey}
                              to={service.route}
                            >
                              <div className="service-child-copy">
                                <h4>{service.title}</h4>
                                <p>{service.statement}</p>
                                <ul
                                  aria-label={`${service.title}: ${capabilitiesWord}`}
                                >
                                  {service.capabilities.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                              <span
                                className="service-row-arrow"
                                aria-hidden="true"
                              >
                                →
                              </span>
                            </LocalizedLink>
                          ))}
                        </div>
                      </Reveal>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
      <section className="services-close">
        <div className="content-shell services-close-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {content.close.eyebrow}
            </span>
            <h2>{content.close.title}</h2>
          </Reveal>
          <Reveal>
            <p>{content.close.text}</p>
            <LocalizedLink className="button button-primary" to="/contact">
              {content.close.cta}
            </LocalizedLink>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default ServicesPage;

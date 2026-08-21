import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../../components/ui/Reveal.jsx";
import { serviceGroups } from "./serviceCatalog.js";
import "./services.css";

const audienceOrder = ["individuals", "businesses"];

function getInitialAudience() {
  if (typeof window === "undefined") return "individuals";
  const hash = window.location.hash.slice(1);
  if (hash === "businesses") return "businesses";
  if (hash === "individuals") return "individuals";
  return "individuals";
}

function ServicesPage() {
  const [audience, setAudience] = useState(getInitialAudience);
  const [hasInteracted, setHasInteracted] = useState(false);
  const catalogRef = useRef(null);

  useEffect(() => {
    document.title = "Services | Alchemize Business Services";
    let meta = document.head.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content =
      "Explore professional services for individuals and businesses, including tax, insurance, notary, advisory, operations, technology, readiness, and financial support.";
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = "https://getalchemize.com/services";
  }, []);

  useEffect(() => {
    const sync = () => {
      const nextAudience = getInitialAudience();
      setAudience(nextAudience);
      if (nextAudience === "businesses") {
        setHasInteracted(true);
      }
    };

    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

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
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = nextAudience;
      window.history.replaceState({}, "", url);
    }
  };

  const services = serviceGroups[audience];
  const audienceMeta = {
    individuals: {
      eyebrow: "Individual services",
      heading:
        "Support for the responsibilities that affect you and your family.",
      description:
        "Clear, organized assistance for tax, protection, documents, and related personal responsibilities.",
    },
    businesses: {
      eyebrow: "Business services",
      heading:
        "Build a stronger business. Improve how it operates. Prepare for what comes next.",
      description:
        "Practical support that moves from assessment and recommendations into implementation where Alchemize can help.",
    },
  }[audience];

  return (
    <article className="services-page">
      <section className="services-hero">
        <div className="content-shell">
          <Reveal>
            <span className="eyebrow eyebrow--gold">Services</span>
            <h1>Start with what you need.</h1>
            <p>
              Whether you know exactly what you need or simply know something
              needs to work better, Alchemize can help identify the appropriate
              path forward.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="services-choice" aria-labelledby="services-choice-title">
        <div className="content-shell">
          <Reveal className="services-choice-header">
            <span className="eyebrow">Who are you here for?</span>
            <h2 id="services-choice-title">
              Choose the path that fits the responsibility in front of you.
            </h2>
          </Reveal>

          <div className="services-choice-grid" role="tablist" aria-label="Service audiences">
            {audienceOrder.map((option) => {
              const isSelected = audience === option;
              const isIndividuals = option === "individuals";

              return (
                <button
                  key={option}
                  type="button"
                  id={`${option}-tab`}
                  aria-selected={isSelected}
                  aria-controls={`${option}-panel`}
                  tabIndex={isSelected ? 0 : -1}
                  className={isSelected ? "is-selected" : ""}
                  aria-pressed={isSelected}
                  onClick={() => chooseAudience(option)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                      return;
                    }
                    event.preventDefault();
                    const currentIndex = audienceOrder.indexOf(audience);
                    const nextIndex =
                      event.key === "ArrowRight"
                        ? (currentIndex + 1) % audienceOrder.length
                        : (currentIndex - 1 + audienceOrder.length) % audienceOrder.length;
                    chooseAudience(audienceOrder[nextIndex]);
                  }}
                >
                  <span>{isIndividuals ? "For me" : "For my business"}</span>
                  <strong>
                    {isIndividuals ? "Individual Services" : "Business Services"}
                  </strong>
                  <p>
                    {isIndividuals
                      ? "Personal tax preparation, insurance, notary, and document support for responsibilities that affect you and your household."
                      : "Advisory, operations, technology, readiness, financial, and administrative support for entrepreneurs and growing businesses."}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        ref={catalogRef}
        className="services-catalog"
        aria-live="polite"
        aria-labelledby={`${audience}-tab`}
        role="tabpanel"
        id={`${audience}-panel`}
      >
        <div className="content-shell services-catalog-inner">
          <Reveal className="services-catalog-intro">
            <span className="eyebrow">{audienceMeta.eyebrow}</span>
            <h2>{audienceMeta.heading}</h2>
            <p>{audienceMeta.description}</p>
          </Reveal>

          <div className="services-list">
            {services.map(({ title, statement, capabilities, slug }, index) => {
              const detailRoute = `/services/${audience}/${slug}/`;

              return (
                <Reveal
                  as={Link}
                  className="service-row"
                  delay={index * 40}
                  key={title}
                  to={detailRoute}
                >
                  <div className="service-row-copy">
                    <h3>{title}</h3>
                    <p>{statement}</p>
                    <ul aria-label={`${title} capabilities`}>
                      {capabilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <span className="service-row-arrow" aria-hidden="true">
                    →
                  </span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="services-close">
        <div className="content-shell services-close-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              Start with the problem, not the service
            </span>
            <h2>Not sure where your needs fit?</h2>
          </Reveal>
          <Reveal>
            <p>
              Tell us what you are trying to accomplish, improve, organize, or
              resolve. We will help identify the appropriate next step—and point
              you in the right direction when the need falls outside our scope.
            </p>
            <Link className="button button-primary" to="/contact">
              Schedule a Consultation
            </Link>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default ServicesPage;

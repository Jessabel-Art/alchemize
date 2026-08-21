import { useEffect } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Download,
  FolderKanban,
  ListChecks,
  Search,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import Reveal from "../../components/ui/Reveal.jsx";
import { findService, legacyServiceRoutes } from "./serviceCatalog.js";
import "./services.css";

const SITE_URL = "https://getalchemize.com";
const processIcons = [Search, FolderKanban, ListChecks, CircleCheck];

function useServiceMetadata(service) {
  useEffect(() => {
    if (!service) return;
    const title = `${service.title} | Alchemize Business Services`;
    const description = service.overview.slice(0, 158);
    const canonical = `${SITE_URL}/services/${service.audience}/${service.slug}`;
    document.title = title;
    let meta = document.head.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = description;
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.append(link);
    }
    link.href = canonical;
    const script = document.createElement("script");
    script.id = "service-breadcrumb-data";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Services",
          item: `${SITE_URL}/services`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: service.audienceLabel,
          item: `${SITE_URL}/services#${service.audience}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: service.title,
          item: canonical,
        },
      ],
    });
    document.getElementById(script.id)?.remove();
    document.head.append(script);
    return () => script.remove();
  }, [service]);
}

function LinkList({ items, className = "service-link-list" }) {
  return (
    <div className={className}>
      {items.map(([label, to]) => (
        <Link key={label} to={to}>
          <span>{label}</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

function ServiceDetailPage() {
  const { audience, slug } = useParams();
  const legacy = audience === "businesses" ? legacyServiceRoutes[slug] : null;
  const service = findService(audience, slug);
  useServiceMetadata(service);
  if (legacy) return <Navigate to={legacy} replace />;
  if (!service) return <Navigate to="/services" replace />;
  const { Icon } = service;

  return (
    <article className={`service-detail service-detail--${service.audience}`}>
      <nav className="content-shell service-breadcrumb" aria-label="Breadcrumb">
        <Link to="/services">Services</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/services/#${service.audience}`}>
          {service.audienceLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{service.title}</span>
      </nav>
      <section className="service-detail-hero">
        <div className="content-shell service-detail-hero-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">{service.title}</span>
            <h1>{service.hero}</h1>
            <p>{service.overview}</p>
            <div className="service-detail-actions">
              <Link
                className="button button-primary"
                to={`/contact?service=${service.serviceKey}`}
              >
                Schedule a Consultation
              </Link>
              <a
                className="button service-download-button"
                href={service.checklist[1]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download aria-hidden="true" />
                {service.checklist[0]}
              </a>
            </div>
          </Reveal>
          <Reveal className="service-detail-mark" delay={100}>
            <Icon aria-hidden="true" strokeWidth={1.1} />
            <span>{service.statement}</span>
          </Reveal>
        </div>
      </section>

      <section className="service-section service-fit">
        <div className="content-shell service-two-column">
          <Reveal>
            <span className="eyebrow">Who this is for</span>
            <h2>Support built around a specific responsibility.</h2>
          </Reveal>
          <ul>
            {service.for.map((item) => (
              <li key={item}>
                <Check aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="service-section service-capabilities">
        <div className="content-shell">
          <Reveal className="service-section-heading">
            <span className="eyebrow eyebrow--gold">
              What Alchemize can help with
            </span>
            <h2>Defined work. Practical output.</h2>
            <p>{service.statement}</p>
          </Reveal>
          <div className="service-capability-grid">
            {service.helps.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="service-section service-situations">
        <div className="content-shell service-two-column">
          <Reveal>
            <span className="eyebrow">Common situations</span>
            <h2>When this service becomes useful.</h2>
          </Reveal>
          <div className="service-situation-list">
            {service.situations.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="service-section service-process">
        <div className="content-shell">
          <Reveal className="service-section-heading">
            <span className="eyebrow eyebrow--gold">How the work moves</span>
            <h2>A clear process from the starting point to the next action.</h2>
          </Reveal>
          <div className="service-process-row">
            {service.process.map(([name, text], index) => {
              const ProcessIcon = processIcons[index];
              return (
                <article key={name}>
                  <span aria-hidden="true">
                    <ProcessIcon strokeWidth={1.45} />
                  </span>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="service-section service-prepare">
        <div className="content-shell service-two-column">
          <Reveal>
            <span className="eyebrow">What to prepare</span>
            <h2>Bring the working context—not perfect records.</h2>
            <p>
              You do not need every item before contacting Alchemize. This list
              helps make the first conversation more productive.
            </p>
            <a
              className="text-link"
              href={service.checklist[1]}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download aria-hidden="true" /> Download {service.checklist[0]}
            </a>
          </Reveal>
          <ul>
            {service.prepare.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {service.status ? (
        <section className="service-status">
          <div className="content-shell">
            <span className="eyebrow eyebrow--gold">
              Status: {service.status.value}
            </span>
            <h2>{service.status.label}</h2>
            <p>{service.status.text}</p>
          </div>
        </section>
      ) : null}

      <section className="service-boundary">
        <div className="content-shell service-two-column">
          <div>
            <span className="eyebrow eyebrow--gold">Scope boundaries</span>
            <h2>Clear limits are part of professional service.</h2>
          </div>
          <p>{service.boundary}</p>
        </div>
      </section>

      <section className="service-section service-connections">
        <div className="content-shell service-connections-grid">
          <div>
            <span className="eyebrow">Related services</span>
            <h2>Connected responsibilities.</h2>
            <LinkList items={service.related} />
          </div>
          <div>
            <span className="eyebrow">Related resources</span>
            <h2>Prepare before the conversation.</h2>
            <LinkList items={service.resources} />
          </div>
        </div>
      </section>

      <section className="service-detail-cta">
        <div className="content-shell">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              Start the conversation
            </span>
            <h2>{service.cta}</h2>
            <p>
              Start with the situation in front of you. Alchemize will confirm
              fit, scope, and the appropriate next step.
            </p>
            <div>
              <Link
                className="button button-primary"
                to={`/contact?service=${service.serviceKey}`}
              >
                Schedule a Consultation
              </Link>
              <Link className="text-link" to={`/services/#${service.audience}`}>
                View all {service.audienceLabel}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default ServiceDetailPage;

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
import { Navigate, useParams } from "react-router-dom";
import Reveal from "../../components/ui/Reveal.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import LocalizedLink from "../../i18n/LocalizedLink.jsx";
import {
  buildBreadcrumbListSchema,
  buildServiceSchema,
  ensureJsonLd,
  ensureMeta,
  injectSiteEntitySchema,
  SITE_URL,
} from "../../seo/siteSchema.js";
import { findService, legacyServiceRoutes } from "./serviceCatalog.js";
import { findServiceEs } from "./serviceCatalog.es.js";
import { serviceDetailUi } from "./servicesContent.js";
import "./services.css";

const processIcons = [Search, FolderKanban, ListChecks, CircleCheck];

function useServiceMetadata(service, language) {
  useEffect(() => {
    if (!service) return undefined;
    const prefix = language === "es" ? "/es" : "";
    const canonical = `${SITE_URL}${prefix}/services/${service.audience}/${service.slug}`;
    const seoTitle = service.seoTitle || `${service.title} | Alchemize`;
    const seoDescription =
      service.seoDescription ||
      service.overview.replace(/\s+/g, " ").trim().slice(0, 158);

    document.title = seoTitle;
    let meta = document.head.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = seoDescription;

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.append(canonicalLink);
    }
    canonicalLink.href = canonical;

    ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: seoTitle,
    });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seoDescription,
    });
    ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonical,
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "article",
    });
    ensureMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: "Alchemize Business Services",
    });
    ensureMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: language === "es" ? "es_ES" : "en_US",
    });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    ensureMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seoTitle,
    });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seoDescription,
    });

    injectSiteEntitySchema();

    ensureJsonLd(
      `service-schema-${language}-${service.slug}`,
      {
        "@context": "https://schema.org",
        "@graph": [
          buildServiceSchema(service, language, canonical),
          buildBreadcrumbListSchema([
            [language === "es" ? "Servicios" : "Services", `${SITE_URL}${prefix}/services`],
            [service.audienceLabel, `${SITE_URL}${prefix}/services#${service.audience}`],
            [service.title, canonical],
          ]),
        ],
      },
    );

    return () => {
      document.head
        .querySelector(`script[data-schema-id="service-schema-${language}-${service.slug}"]`)
        ?.remove();
    };
  }, [service, language]);
}

function LinkList({ items }) {
  return (
    <div className="service-link-list">
      {items.map(([label, to]) => (
        <LocalizedLink key={label} to={to}>
          <span>{label}</span>
          <ArrowRight aria-hidden="true" />
        </LocalizedLink>
      ))}
    </div>
  );
}

function ServiceDetailPage() {
  const { audience, slug } = useParams();
  const { language, path } = useLanguage();
  const ui = serviceDetailUi[language];
  const legacy = audience === "businesses" ? legacyServiceRoutes[slug] : null;
  const service =
    language === "es"
      ? findServiceEs(audience, slug)
      : findService(audience, slug);
  useServiceMetadata(service, language);
  if (legacy) return <Navigate to={path(legacy)} replace />;
  if (!service) return <Navigate to={path("/services")} replace />;
  const { Icon } = service;

  return (
    <article className={`service-detail service-detail--${service.audience}`}>
      <nav
        className="content-shell service-breadcrumb"
        aria-label={ui.breadcrumb}
      >
        <LocalizedLink to="/services">
          {language === "es" ? "Servicios" : "Services"}
        </LocalizedLink>
        <span aria-hidden="true">/</span>
        <LocalizedLink to={`/services/#${service.audience}`}>
          {service.audienceLabel}
        </LocalizedLink>
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
              <LocalizedLink
                className="button button-primary"
                to={`/contact?service=${service.serviceKey}`}
              >
                {ui.consultation}
              </LocalizedLink>
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
            <span className="eyebrow">{ui.who}</span>
            <h2>{ui.fitTitle}</h2>
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
            <span className="eyebrow eyebrow--gold">{ui.helps}</span>
            <h2>{ui.helpsTitle}</h2>
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
            <span className="eyebrow">{ui.situations}</span>
            <h2>{ui.situationsTitle}</h2>
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
            <span className="eyebrow eyebrow--gold">{ui.process}</span>
            <h2>{ui.processTitle}</h2>
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
            <span className="eyebrow">{ui.prepare}</span>
            <h2>{ui.prepareTitle}</h2>
            <p>{ui.prepareText}</p>
            <a
              className="text-link"
              href={service.checklist[1]}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download aria-hidden="true" />
              {ui.download} {service.checklist[0]}
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
              {ui.status}: {service.status.value}
            </span>
            <h2>{service.status.label}</h2>
            <p>{service.status.text}</p>
          </div>
        </section>
      ) : null}
      <section className="service-boundary">
        <div className="content-shell service-two-column">
          <div>
            <span className="eyebrow eyebrow--gold">{ui.boundaries}</span>
            <h2>{ui.boundariesTitle}</h2>
          </div>
          <p>{service.boundary}</p>
        </div>
      </section>
      <section className="service-section service-connections">
        <div className="content-shell service-connections-grid">
          <div>
            <span className="eyebrow">{ui.relatedServices}</span>
            <h2>{ui.connected}</h2>
            <LinkList items={service.related} />
          </div>
          <div>
            <span className="eyebrow">{ui.relatedResources}</span>
            <h2>{ui.prepareConversation}</h2>
            <LinkList items={service.resources} />
          </div>
        </div>
      </section>
      <section className="service-detail-cta">
        <div className="content-shell">
          <Reveal>
            <span className="eyebrow eyebrow--gold">{ui.start}</span>
            <h2>{service.cta}</h2>
            <p>{ui.startText}</p>
            <div>
              <LocalizedLink
                className="button button-primary"
                to={`/contact?service=${service.serviceKey}`}
              >
                {ui.consultation}
              </LocalizedLink>
              <LocalizedLink
                className="text-link"
                to={`/services/#${service.audience}`}
              >
                {ui.viewAll} {service.audienceLabel.toLowerCase()}
              </LocalizedLink>
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default ServiceDetailPage;

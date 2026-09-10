import {
  Briefcase,
  ClipboardCheck,
  FileText,
  Focus,
  Monitor,
  Search,
  Settings,
  Sprout,
  TrendingUp,
  User,
  Wrench,
} from "lucide-react";
import Reveal from "../../components/ui/Reveal.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import { resourceBySlug } from "../resources/resourcesData.js";
import { resourceBySlugEs } from "../resources/resourcesData.es.js";
import { getDownloadableResource } from "../resources/downloadableResources.js";
import { trackResourceDownload } from "../../services/analytics.js";
import { homeContent } from "./homeContent.js";
import "./home.css";

const processIcons = [Search, Focus, Wrench];
const individualIcons = [FileText, User, TrendingUp];
const businessIcons = [Briefcase, Settings, Monitor, TrendingUp];

const BOTANICAL_IMAGE = "/assets/images/home/botanical-asset.png";

const RESOURCE_IMAGES = {
  "preparing-for-tax-season": {
    src: "/assets/images/home/tax-resource-organizer.png",
    position: "center 40%",
  },
  "starting-a-business-organization-checklist": {
    src: "/assets/images/home/home-services-highlight.png",
    position: "18% 62%",
  },
};

function resolveResourceCard(item, language) {
  if (item.kind === "download") {
    const download = getDownloadableResource(
      item.id,
      language === "es" ? "es" : "en",
    );
    return {
      to: download.download,
      external: true,
      resourceSlug: item.id,
      title: item.title,
      category: item.category,
      type: item.type,
      descriptor: item.descriptor,
      featured: false,
      image: "/assets/images/home/seo-metadata-resource.png",
      icon: ClipboardCheck,
      tone: "gold",
    };
  }
  const resourceMap = language === "es" ? resourceBySlugEs : resourceBySlug;
  const resource = resourceMap.get(item.slug);
  const visual = RESOURCE_IMAGES[item.slug];
  return {
    to: `/resources/${item.slug}`,
    external: false,
    title: resource.title,
    category: resource.category,
    type: resource.type,
    descriptor: item.descriptor,
    featured: !!resource.featured,
    image: visual ? visual.src : null,
    objectPosition: visual ? visual.position : undefined,
    icon: visual ? null : Sprout,
    tone: "green",
  };
}

function HomePage() {
  const { language } = useLanguage();
  const content = homeContent[language];
  const businessItems = content.capabilities.slice(0, 4);
  const resourceCards = content.resources.items.map((item) =>
    resolveResourceCard(item, language),
  );
  usePageMetadata({ en: homeContent.en.metadata, es: homeContent.es.metadata });

  return (
    <article className="home-page">
      <section className="home-hero">
        <div className="content-shell home-hero-grid">
          <Reveal className="home-hero-copy">
            <span className="eyebrow eyebrow--gold">
              {content.hero.eyebrow}
            </span>
            <span className="home-positioning-descriptor">
              {content.hero.descriptor}
            </span>
            <h1>
              {content.hero.titleStart} <em>{content.hero.titleEmphasis}</em>
            </h1>
            <p>{content.hero.copy}</p>
            <div className="home-actions">
              <Link className="button button-primary" to="/contact">
                {content.hero.primary}
              </Link>
              <Link className="button button--light" to="/services">
                {content.hero.secondary}
              </Link>
            </div>
          </Reveal>
          <Reveal as="figure" className="home-hero-image" delay={100}>
            <img
              src="/assets/images/home/alchemize-hero.webp"
              alt={content.hero.alt}
            />
            <figcaption>{content.hero.caption}</figcaption>
          </Reveal>
        </div>
      </section>

      <section className="home-paths">
        <img
          className="home-paths-botanical"
          src={BOTANICAL_IMAGE}
          alt=""
          aria-hidden="true"
          loading="eager"
        />
        <div className="content-shell">
          <Reveal className="home-paths-header">
            <div>
              <span className="eyebrow">{content.paths.eyebrow}</span>
              <h2>{content.paths.title}</h2>
            </div>
            <p>{content.paths.copy}</p>
          </Reveal>
          <div className="home-path-grid">
            <div className="home-path-bridge" aria-hidden="true">
              <span>A</span>
            </div>
            <Reveal as="article">
              <span>{content.paths.individualLabel}</span>
              <h3>{content.paths.individualTitle}</h3>
              <ul className="home-path-list">
                {content.paths.individualItems.map((label, index) => {
                  const Icon = individualIcons[index];
                  return (
                    <li key={label}>
                      <Icon aria-hidden="true" strokeWidth={1.5} />
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ul>
              <Link className="text-link" to="/services/#individuals">
                {content.paths.individualLink}
              </Link>
            </Reveal>
            <Reveal as="article" className="home-business-panel" delay={100}>
              <div className="home-business-content">
                <span>{content.paths.businessLabel}</span>
                <h3>{content.paths.businessTitle}</h3>
                <ul className="home-path-list">
                  {businessItems.map(([label], index) => {
                    const Icon = businessIcons[index];
                    return (
                      <li key={label}>
                        <Icon aria-hidden="true" strokeWidth={1.5} />
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
                <Link className="text-link" to="/services/#businesses">
                  {content.paths.businessLink}
                </Link>
              </div>
              <div className="home-business-image">
                <img
                  src="/assets/images/home/home-services-highlight.png"
                  alt={content.paths.businessTitle}
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="home-connect">
        <div className="home-watermark" aria-hidden="true">
          <span>Direction</span>
        </div>
        <div className="content-shell home-connect-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {content.connect.eyebrow}
            </span>
            <h2>{content.connect.title}</h2>
          </Reveal>
          <Reveal className="home-connect-copy">
            <div
              className="home-connect-process"
              aria-label={content.connect.aria}
            >
              {content.connect.stages.map(([label, statement], index) => {
                const Icon = processIcons[index];
                return (
                  <div className="home-connect-stage" key={label}>
                    <span className="home-connect-icon" aria-hidden="true">
                      <Icon strokeWidth={1.5} />
                    </span>
                    <div>
                      <strong>{label}</strong>
                      <p>{statement}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="home-connect-divider" aria-hidden="true" />
            <p>{content.connect.copy}</p>
          </Reveal>
        </div>
      </section>

      <section className="home-capabilities">
        <div className="home-capability-watermark" aria-hidden="true">
          Business
        </div>
        <div className="content-shell home-capabilities-grid">
          <Reveal className="home-capabilities-intro-block">
            <span className="eyebrow">{content.business.eyebrow}</span>
            <h2>{content.business.title}</h2>
            <p className="home-capabilities-intro">{content.business.copy}</p>
            <Link className="text-link" to="/services">
              {content.business.exploreAll}
            </Link>
          </Reveal>
          <div className="home-capability-groups">
            {content.capabilityGroups.map(([title, detail, to], index) => (
              <Reveal
                as={Link}
                className="home-capability-group"
                to={to}
                key={title}
                delay={index * 60}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-trust">
        <div className="content-shell home-trust-grid">
          <figure className="home-founder-frame">
            <img
              src="/assets/images/home/founder-hands.png"
              alt={content.trust.alt}
            />
          </figure>
          <Reveal>
            <span className="eyebrow">{content.trust.eyebrow}</span>
            <h2>{content.trust.title}</h2>
            <p>{content.trust.copy}</p>
            <Link className="text-link" to="/why-alchemize">
              {content.trust.link}
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="home-resources">
        <div className="content-shell home-resource-grid">
          <Reveal className="home-resource-intro">
            <span className="eyebrow eyebrow--gold">
              {content.resources.eyebrow}
            </span>
            <h2>{content.resources.title}</h2>
            <p>{content.resources.copy}</p>
            <Link className="button button--light" to="/resources">
              {content.resources.button}
            </Link>
          </Reveal>
          <div className="home-resource-card-grid">
            {resourceCards.map((card, index) => {
              const CardTag = card.external ? "a" : Link;
              const linkProps = card.external
                ? {
                    href: card.to,
                    onClick: () => trackResourceDownload(card.resourceSlug),
                  }
                : { to: card.to };
              const Icon = card.icon;
              return (
                <Reveal
                  as="div"
                  className="home-resource-card"
                  delay={index * 70}
                  key={card.title}
                >
                  <CardTag className="home-resource-card-link" {...linkProps}>
                    <div className="home-resource-card-media">
                      {card.image ? (
                        <img
                          src={card.image}
                          alt=""
                          loading="lazy"
                          style={{ objectPosition: card.objectPosition }}
                        />
                      ) : (
                        <span
                          className={`home-resource-card-icon tone-${card.tone}`}
                        >
                          <Icon aria-hidden="true" strokeWidth={1.5} />
                        </span>
                      )}
                    </div>
                    <div className="home-resource-card-body">
                      {card.featured ? (
                        <span className="home-resource-card-featured">
                          {content.resources.featuredLabel}
                        </span>
                      ) : null}
                      <span className="home-resource-card-tag">
                        {card.category} · {card.type}
                      </span>
                      <h3>{card.title}</h3>
                      <p>{card.descriptor}</p>
                      <span className="text-link">
                        {content.resources.readGuide}
                      </span>
                    </div>
                  </CardTag>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-final">
        <img
          className="home-final-botanical"
          src="/assets/images/home/resources-botanical-cta.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <div className="content-shell home-final-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {content.final.eyebrow}
            </span>
            <h2>{content.final.title}</h2>
          </Reveal>
          <Reveal>
            <p>{content.final.copy}</p>
            <Link className="button button-primary" to="/contact">
              {content.final.button}
            </Link>
            <p className="home-language-availability">
              {content.final.spanish}
            </p>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default HomePage;

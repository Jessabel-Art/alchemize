import {
  ArrowRight,
  FileDown,
  FileText,
  Focus,
  Search,
  Wrench,
} from "lucide-react";
import Reveal from "../../components/ui/Reveal.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import { homeContent } from "./homeContent.js";
import "./home.css";

const processIcons = [Search, Focus, Wrench];

function HomePage() {
  const { language } = useLanguage();
  const content = homeContent[language];
  const homeHighlights = content.capabilities.slice(0, 4);
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
            <p className="home-hero-difference">{content.hero.difference}</p>
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
        <div className="content-shell">
          <Reveal className="home-heading">
            <span className="eyebrow">{content.paths.eyebrow}</span>
            <h2>{content.paths.title}</h2>
          </Reveal>
          <div className="home-path-grid">
            <div className="home-path-bridge" aria-hidden="true">
              <span>A</span>
            </div>
            <Reveal as="article">
              <span>{content.paths.individualLabel}</span>
              <h3>{content.paths.individualTitle}</h3>
              <p>{content.paths.individualCopy}</p>
              <Link className="text-link" to="/services/#individuals">
                {content.paths.individualLink}
              </Link>
            </Reveal>
            <Reveal as="article" delay={100}>
              <span>{content.paths.businessLabel}</span>
              <h3>{content.paths.businessTitle}</h3>
              <p>{content.paths.businessCopy}</p>
              <ul>
                {homeHighlights.map(([title]) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
              <Link className="text-link" to="/services/#businesses">
                {content.paths.businessLink}
              </Link>
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
            <p>{content.connect.copy}</p>
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
          </Reveal>
        </div>
      </section>

      <section className="home-capabilities">
        <div className="home-capability-watermark" aria-hidden="true">
          Business
        </div>
        <div className="content-shell">
          <Reveal className="home-heading">
            <span className="eyebrow">{content.business.eyebrow}</span>
            <div>
              <h2>{content.business.title}</h2>
              <p className="home-capabilities-intro">{content.business.copy}</p>
            </div>
          </Reveal>
          <div className="home-capability-list">
            {content.capabilities.map(([title, to], index) => (
              <Reveal
                as={Link}
                className="home-capability-link"
                to={to}
                key={title}
                delay={index * 60}
                aria-label={`Explore ${title}`}
              >
                <h3>{title}</h3>
                <ArrowRight aria-hidden="true" strokeWidth={1.5} />
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
            <Link className="button button--light" to="/resources">
              {content.resources.button}
            </Link>
          </Reveal>
          <div className="home-resource-list">
            {content.resources.items.map(([category, title, href], index) => (
              <Reveal
                as="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                delay={index * 70}
                key={title}
                aria-label={`${title}, ${content.resources.pdfAria}`}
              >
                <span className="home-resource-category">{category}</span>
                <span className="home-resource-title">
                  <strong>{title}</strong>
                  <small>
                    <FileText aria-hidden="true" strokeWidth={1.5} />{" "}
                    {content.resources.pdfLabel}
                  </small>
                </span>
                <FileDown
                  className="home-resource-download"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-final">
        <div className="content-shell home-final-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {content.final.eyebrow}
            </span>
            <h2>{content.final.title}</h2>
          </Reveal>
          <Reveal>
            <p>{content.final.copy}</p>
            <p className="home-language-availability">
              {content.final.spanish}
            </p>
            <Link className="button button-primary" to="/contact">
              {content.final.button}
            </Link>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default HomePage;

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Printer } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import LocalizedLink from "../../i18n/LocalizedLink.jsx";
import { resourceBySlug } from "./resourcesData.js";
import { resourceBySlugEs } from "./resourcesData.es.js";
import { featuredContent } from "./resourcesContent.js";

function UtilityAction({ utility }) {
  if (!utility) return null;
  const Icon = utility.external ? ExternalLink : Printer;
  if (utility.external)
    return (
      <a
        className="resource-showcase-utility"
        href={utility.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon aria-hidden="true" /> {utility.label}
      </a>
    );
  return (
    <LocalizedLink className="resource-showcase-utility" to={utility.href}>
      <Icon aria-hidden="true" /> {utility.label}
    </LocalizedLink>
  );
}

export default function FeaturedResourcesHero() {
  const { language } = useLanguage();
  const content = featuredContent[language];
  const resourceMap = language === "es" ? resourceBySlugEs : resourceBySlug;
  const slides = content.slides.map((slide) => ({
    ...slide,
    resource: resourceMap.get(slide.slug),
  }));
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(null);
  const active = slides[activeIndex];
  const selectSlide = (next) =>
    setActiveIndex((next + slides.length) % slides.length);

  return (
    <section
      className="resource-showcase resource-showcase--navy-ivory"
      aria-label={content.label}
      aria-roledescription={language === "es" ? "carrusel" : "carousel"}
      tabIndex="0"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          selectSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (Math.abs(distance) >= 48)
          selectSlide(activeIndex + (distance < 0 ? 1 : -1));
      }}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {content.label} {activeIndex + 1} {language === "es" ? "de" : "of"}{" "}
        {slides.length}: {active.resource.title}
      </p>
      <div className="resource-showcase-grid">
        <div className="resource-showcase-main">
          <div className="resource-showcase-copy" key={`copy-${active.slug}`}>
            <span className="resource-showcase-label">{active.label}</span>
            <h1>{active.resource.title}</h1>
            <p>{active.summary}</p>
            <div className="resource-showcase-actions">
              <LocalizedLink
                className="button button-primary"
                to={`/resources/${active.slug}`}
              >
                {content.read}
              </LocalizedLink>
              <UtilityAction utility={active.utility} />
            </div>
          </div>
          <div
            className="resource-showcase-controls"
            aria-label={content.controls}
          >
            <button
              type="button"
              onClick={() => selectSlide(activeIndex - 1)}
              aria-label={`${content.previous}: ${slides[(activeIndex - 1 + slides.length) % slides.length].resource.title}`}
            >
              <ArrowLeft aria-hidden="true" />
              <span>{content.previous}</span>
            </button>
            <div className="resource-showcase-position" aria-hidden="true">
              <strong>{String(activeIndex + 1).padStart(2, "0")}</strong>
              <span>/</span>
              <span>{String(slides.length).padStart(2, "0")}</span>
              <i>
                {slides.map((slide, index) => (
                  <b
                    className={index === activeIndex ? "is-active" : ""}
                    key={slide.slug}
                  />
                ))}
              </i>
            </div>
            <button
              type="button"
              onClick={() => selectSlide(activeIndex + 1)}
              aria-label={`${content.next}: ${slides[(activeIndex + 1) % slides.length].resource.title}`}
            >
              <span>{content.next}</span>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
        <aside className="resource-showcase-panel" key={`panel-${active.slug}`}>
          <span>{active.panelLabel}</span>
          <div>
            {active.panelItems.map(([title, description]) => (
              <section key={title}>
                <h2>{title}</h2>
                <p>{description}</p>
              </section>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

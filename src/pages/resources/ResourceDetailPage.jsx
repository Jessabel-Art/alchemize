import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  Printer,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import Logo from "../../components/brand/Logo.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import LocalizedLink from "../../i18n/LocalizedLink.jsx";
import { resourceBySlug } from "./resourcesData.js";
import { resourceBySlugEs } from "./resourcesData.es.js";
import { resourcesUi } from "./resourcesContent.js";
import useResourceMetadata from "./useResourceMetadata.js";
import "./resources.css";

function SectionContent({ section, important }) {
  return (
    <section id={section.id} className="resource-article-section">
      <h2>{section.title}</h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {section.items && (
        <ul className="resource-checklist">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.ordered && (
        <ol className="resource-framework-list">
          {section.ordered.map((item) => (
            <li key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )}
      {section.terms && (
        <dl className="resource-terms">
          {section.terms.map(([term, definition]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </div>
          ))}
        </dl>
      )}
      {section.comparison && (
        <div className="resource-comparison">
          {section.comparison.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {section.table && (
        <div className="resource-table-wrap">
          <table>
            <thead>
              <tr>
                {section.table.headers.map((heading) => (
                  <th key={heading} scope="col">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, index) => (
                <tr key={`${section.id}-${index}`}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.callout && (
        <aside className="resource-callout">
          <strong>{important}</strong>
          <p>{section.callout}</p>
        </aside>
      )}
    </section>
  );
}

function RelatedRows({ slugs, map }) {
  return (
    <div className="resource-related-rows">
      {slugs.map((slug) => {
        const item = map.get(slug);
        return item ? (
          <LocalizedLink key={slug} to={`/resources/${slug}`}>
            <span>{item.category}</span>
            <strong>{item.title}</strong>
            <ArrowRight aria-hidden="true" />
          </LocalizedLink>
        ) : null;
      })}
    </div>
  );
}

export default function ResourceDetailPage({ resource }) {
  const location = useLocation();
  const { language } = useLanguage();
  const ui = resourcesUi[language].article;
  const map = language === "es" ? resourceBySlugEs : resourceBySlug;
  useResourceMetadata(resource, language);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("print") === "1") {
      const timer = window.setTimeout(() => window.print(), 350);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [location.search]);

  return (
    <article
      className={`resource-article${resource.reviewYear ? " resource-article--medicare" : ""}`}
    >
      <div className="resource-print-brand">
        <Logo surface="light" />
      </div>
      <header className="resource-article-hero">
        <div className="content-shell">
          <LocalizedLink className="resource-back-link" to="/resources">
            <ArrowLeft aria-hidden="true" /> {ui.back}
          </LocalizedLink>
          <span className="eyebrow eyebrow--gold">{resource.category}</span>
          <h1>{resource.title}</h1>
          <p>{resource.excerpt}</p>
          <div className="resource-meta">
            <span>
              {ui.updated} {resource.updated}
            </span>
            <span>{resource.readTime}</span>
            <span>{resource.type}</span>
            {resource.reviewYear && (
              <span>
                {ui.reviewed} {resource.reviewYear}
              </span>
            )}
          </div>
          <div className="resource-utilities" aria-label={ui.utilities}>
            <button type="button" onClick={() => window.print()}>
              <Printer aria-hidden="true" /> {ui.print}
            </button>
            {resource.download && (
              <a href={resource.download} download>
                <Download aria-hidden="true" /> {ui.download}
              </a>
            )}
          </div>
        </div>
      </header>
      <div className="content-shell resource-article-layout">
        <div className="resource-article-body">
          <p className="resource-article-intro">{ui.intro}</p>
          {resource.sections.map((section) => (
            <SectionContent
              section={section}
              important={ui.important}
              key={section.id}
            />
          ))}
          <section
            className="resource-next"
            aria-labelledby="resource-next-title"
          >
            <span className="eyebrow">{ui.next}</span>
            <h2 id="resource-next-title">{ui.nextTitle}</h2>
            <ol>
              {resource.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <LocalizedLink className="text-link" to="/services">
              {ui.serviceLink}
            </LocalizedLink>
          </section>
          <aside className="resource-disclaimer">
            <strong>{ui.notice}</strong>
            <p>{resource.disclaimer}</p>
          </aside>
          <section
            className="resource-related-end"
            aria-labelledby="related-title"
          >
            <span className="eyebrow">{ui.continue}</span>
            <h2 id="related-title">{ui.related}</h2>
            <RelatedRows slugs={resource.related} map={map} />
          </section>
        </div>
        <aside className="resource-rail" aria-label={ui.rail}>
          <nav aria-labelledby="guide-nav-title">
            <h2 id="guide-nav-title">{ui.inGuide}</h2>
            <ol>
              {resource.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          {resource.official.length > 0 && (
            <section className="resource-official">
              <h2>{ui.official}</h2>
              {resource.official.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{item.source}</span>
                  <strong>{item.title}</strong>
                  <ExternalLink aria-hidden="true" />
                  <small>{ui.external}</small>
                </a>
              ))}
            </section>
          )}
          <section className="resource-rail-related">
            <h2>{ui.relatedGuides}</h2>
            {resource.related.slice(0, 3).map((slug) => {
              const item = map.get(slug);
              return item ? (
                <LocalizedLink key={slug} to={`/resources/${slug}`}>
                  {item.title}
                </LocalizedLink>
              ) : null;
            })}
          </section>
        </aside>
      </div>
    </article>
  );
}

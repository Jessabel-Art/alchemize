import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  Printer,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../../components/brand/Logo.jsx";
import { resourceBySlug } from "./resourcesData.js";
import useResourceMetadata from "./useResourceMetadata.js";
import "./resources.css";

function SectionContent({ section }) {
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
          <strong>Important</strong>
          <p>{section.callout}</p>
        </aside>
      )}
    </section>
  );
}

function RelatedRows({ slugs }) {
  return (
    <div className="resource-related-rows">
      {slugs.map((slug) => {
        const item = resourceBySlug.get(slug);
        return item ? (
          <Link key={slug} to={`/resources/${slug}`}>
            <span>{item.category}</span>
            <strong>{item.title}</strong>
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : null;
      })}
    </div>
  );
}

export default function ResourceDetailPage({ resource }) {
  const location = useLocation();
  useResourceMetadata(resource);
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
          <Link className="resource-back-link" to="/resources">
            <ArrowLeft aria-hidden="true" /> Back to Resources
          </Link>
          <span className="eyebrow eyebrow--gold">{resource.category}</span>
          <h1>{resource.title}</h1>
          <p>{resource.excerpt}</p>
          <div className="resource-meta">
            <span>Updated {resource.updated}</span>
            <span>{resource.readTime}</span>
            <span>{resource.type}</span>
            {resource.reviewYear && (
              <span>Reviewed for {resource.reviewYear}</span>
            )}
          </div>
          <div className="resource-utilities" aria-label="Article utilities">
            <button type="button" onClick={() => window.print()}>
              <Printer aria-hidden="true" /> Print
            </button>
            {resource.download && (
              <a href={resource.download} download>
                <Download aria-hidden="true" /> Download PDF
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="content-shell resource-article-layout">
        <div className="resource-article-body">
          <p className="resource-article-intro">
            This guide is designed to help you understand the responsibility,
            organize useful information, and identify questions that require
            current official guidance or professional review.
          </p>
          {resource.sections.map((section) => (
            <SectionContent section={section} key={section.id} />
          ))}

          <section
            className="resource-next"
            aria-labelledby="resource-next-title"
          >
            <span className="eyebrow">What to do next</span>
            <h2 id="resource-next-title">
              Turn the guide into a useful next step.
            </h2>
            <ol>
              {resource.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Link className="text-link" to="/services">
              Need help organizing what comes next? Explore Services
            </Link>
          </section>
          <aside className="resource-disclaimer">
            <strong>Educational notice</strong>
            <p>{resource.disclaimer}</p>
          </aside>
          <section
            className="resource-related-end"
            aria-labelledby="related-title"
          >
            <span className="eyebrow">Continue learning</span>
            <h2 id="related-title">Related resources</h2>
            <RelatedRows slugs={resource.related} />
          </section>
        </div>

        <aside
          className="resource-rail"
          aria-label="Guide navigation and official resources"
        >
          <nav aria-labelledby="guide-nav-title">
            <h2 id="guide-nav-title">In this guide</h2>
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
              <h2>Official resources</h2>
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
                  <small>External government resource</small>
                </a>
              ))}
            </section>
          )}
          <section className="resource-rail-related">
            <h2>Related guides</h2>
            {resource.related.slice(0, 3).map((slug) => {
              const item = resourceBySlug.get(slug);
              return item ? (
                <Link key={slug} to={`/resources/${slug}`}>
                  {item.title}
                </Link>
              ) : null;
            })}
          </section>
        </aside>
      </div>
    </article>
  );
}

import { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import LocalizedLink from "../../i18n/LocalizedLink.jsx";
import { RESOURCE_CATEGORIES, resourcesForCategory } from "./resourcesData.js";
import {
  RESOURCE_CATEGORIES_ES,
  resourcesForCategoryEs,
} from "./resourcesData.es.js";
import FeaturedResourcesHero from "./FeaturedResourcesHero.jsx";
import { resourcesUi } from "./resourcesContent.js";
import useResourceMetadata from "./useResourceMetadata.js";
import "./resources.css";

export default function ResourcesPage() {
  const { language } = useLanguage();
  const ui = resourcesUi[language];
  const [category, setCategory] = useState("All");
  const categories =
    language === "es"
      ? RESOURCE_CATEGORIES_ES
      : RESOURCE_CATEGORIES.map((item) => [item, item]);
  const visible =
    language === "es"
      ? resourcesForCategoryEs(category)
      : resourcesForCategory(category);
  useResourceMetadata(null, language);

  return (
    <div className="resources-page">
      <FeaturedResourcesHero />
      <div className="resources-library content-shell">
        <section
          className="resource-directory"
          aria-labelledby="resource-directory-title"
        >
          <header>
            <span className="eyebrow">{ui.directory.eyebrow}</span>
            <h2 id="resource-directory-title">{ui.directory.title}</h2>
            <p>{ui.directory.text}</p>
          </header>
          <div
            className="resource-filters"
            role="group"
            aria-label={ui.directory.filters}
          >
            {categories.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={category === key}
                onClick={() => setCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="resource-result-count" aria-live="polite">
            {visible.length}{" "}
            {visible.length === 1
              ? ui.directory.resource
              : ui.directory.resources}
          </p>
          <div className="resource-rows">
            {visible.map((resource) => (
              <LocalizedLink
                to={`/resources/${resource.slug}`}
                className="resource-row"
                key={resource.slug}
                aria-label={`${ui.directory.read} ${resource.title}`}
              >
                <span className="resource-row-category">
                  {resource.category}
                </span>
                <div>
                  <span className="resource-row-type">
                    <FileText aria-hidden="true" />
                    {resource.type}
                  </span>
                  <h3>{resource.title}</h3>
                  <p>{resource.excerpt}</p>
                  <small>
                    {resource.readTime} · {ui.directory.updated}{" "}
                    {resource.updated}
                  </small>
                </div>
                <span className="resource-row-action">
                  {ui.directory.action} <ArrowRight aria-hidden="true" />
                </span>
              </LocalizedLink>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

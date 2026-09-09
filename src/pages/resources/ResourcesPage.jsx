import { useState } from "react";
import {
  ArrowRight,
  Calculator,
  FileText,
  FolderOpen,
  LayoutGrid,
  List,
  Monitor,
  PlusCircle,
  Search,
  Settings,
  Sprout,
} from "lucide-react";
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

// A small, deliberately short set of resources get editorial photography.
// Mapped by slug so the same lookup works for both languages.
const VISUAL_RESOURCE_IMAGES = {
  "preparing-for-tax-season":
    "/assets/images/resources/tax-resource-organizer.png",
  "professional-website-design-process":
    "/assets/images/resources/web-design-resource.png",
  "digital-presence-audit":
    "/assets/images/resources/digital-presence-audit-resource.png",
  "seo-and-website-metadata":
    "/assets/images/resources/seo-metadata-resource.png",
};

const CATEGORY_ICON = {
  Taxes: Calculator,
  "Web & Digital Solutions": Monitor,
  "Starting a Business": Sprout,
  "Business Operations": Settings,
  "Records & Administration": FolderOpen,
  "Guides & Checklists": FileText,
};
const CATEGORY_TONE = {
  Taxes: "green",
  "Web & Digital Solutions": "green",
  "Starting a Business": "green",
  "Business Operations": "gold",
  "Records & Administration": "gold",
  "Guides & Checklists": "green",
};

const PAGE_SIZE = 6;

function ResourceCard({ resource, ui, categoryKey }) {
  const image = VISUAL_RESOURCE_IMAGES[resource.slug];
  const Icon = CATEGORY_ICON[categoryKey] || FileText;
  const tone = CATEGORY_TONE[categoryKey] || "green";
  return (
    <LocalizedLink
      to={`/resources/${resource.slug}`}
      className="resource-card"
      aria-label={`${ui.directory.read} ${resource.title}`}
    >
      <div className="resource-card-media">
        {image ? (
          <img src={image} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className={`resource-card-icon tone-${tone}`}>
            <Icon aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="resource-card-body">
        <div className="resource-card-tags">
          <span className="resource-card-category">{resource.category}</span>
          <span className="resource-card-type">{resource.type}</span>
        </div>
        <h3>{resource.title}</h3>
        <p>{resource.excerpt}</p>
        <div className="resource-card-footer">
          <small>
            {resource.readTime} · {ui.directory.updated} {resource.updated}
          </small>
          <span className="resource-row-action">
            {ui.directory.action} <ArrowRight aria-hidden="true" />
          </span>
        </div>
      </div>
    </LocalizedLink>
  );
}

function ResourceRow({ resource, ui }) {
  return (
    <LocalizedLink
      to={`/resources/${resource.slug}`}
      className="resource-row"
      aria-label={`${ui.directory.read} ${resource.title}`}
    >
      <div>
        <div className="resource-card-tags">
          <span className="resource-card-category">{resource.category}</span>
          <span className="resource-card-type">{resource.type}</span>
        </div>
        <h3>{resource.title}</h3>
        <p>{resource.excerpt}</p>
        <small>
          {resource.readTime} · {ui.directory.updated} {resource.updated}
        </small>
      </div>
      <span className="resource-row-action">
        {ui.directory.action} <ArrowRight aria-hidden="true" />
      </span>
    </LocalizedLink>
  );
}

function sortResources(list, sort) {
  const sorted = [...list];
  if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort(
      (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
    );
  }
  return sorted;
}

export default function ResourcesPage() {
  const { language } = useLanguage();
  const ui = resourcesUi[language];
  const [category, setCategory] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categories =
    language === "es"
      ? RESOURCE_CATEGORIES_ES
      : RESOURCE_CATEGORIES.map((item) => [item, item]);
  const forCategory =
    language === "es" ? resourcesForCategoryEs : resourcesForCategory;
  const allInLanguage = forCategory("All");
  useResourceMetadata(null, language);

  const counts = new Map(
    categories.map(([key]) => [key, forCategory(key).length]),
  );
  const categoryKeyByLabel = new Map(
    categories.map(([key, label]) => [label, key]),
  );

  const typeOptions = Array.from(
    new Set(allInLanguage.map((resource) => resource.type)),
  ).sort((a, b) => a.localeCompare(b));

  const resetPage = () => setVisibleCount(PAGE_SIZE);
  const selectCategory = (key) => {
    setCategory(key);
    resetPage();
  };
  const scrollToLibrary = () => {
    document
      .getElementById("all-resources")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const trimmedQuery = query.trim().toLowerCase();
  const byCategory = category === "All" ? allInLanguage : forCategory(category);
  const byType =
    typeFilter === "All"
      ? byCategory
      : byCategory.filter((resource) => resource.type === typeFilter);
  const filtered = trimmedQuery
    ? byType.filter((resource) =>
        [resource.title, resource.excerpt, resource.category, resource.type]
          .join(" ")
          .toLowerCase()
          .includes(trimmedQuery),
      )
    : byType;
  const sorted = sortResources(filtered, sort);
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visible.length < sorted.length;

  const browseCategories = categories.filter(([key]) => key !== "All");

  return (
    <div className="resources-page">
      <FeaturedResourcesHero />

      <section
        className="resource-browse content-shell"
        aria-labelledby="resource-browse-title"
      >
        <div className="resource-browse-header">
          <div>
            <span className="eyebrow">{ui.browse.eyebrow}</span>
            <h2 id="resource-browse-title">{ui.browse.title}</h2>
            <p>{ui.browse.text}</p>
          </div>
          <button
            type="button"
            className="text-link resource-view-all"
            onClick={() => {
              selectCategory("All");
              scrollToLibrary();
            }}
          >
            {ui.browse.viewAll}
          </button>
        </div>
        <div className="resource-category-grid">
          {browseCategories.map(([key, label]) => {
            const Icon = CATEGORY_ICON[key] || FileText;
            const count = counts.get(key) || 0;
            return (
              <button
                key={key}
                type="button"
                className="resource-category-card"
                onClick={() => {
                  selectCategory(key);
                  scrollToLibrary();
                }}
              >
                <span
                  className={`resource-category-icon tone-${CATEGORY_TONE[key] || "green"}`}
                >
                  <Icon aria-hidden="true" />
                </span>
                <span className="resource-category-copy">
                  <strong>{label}</strong>
                  <span>{ui.browse.categories[key]}</span>
                  <small>
                    {count}{" "}
                    {count === 1
                      ? ui.directory.resource
                      : ui.directory.resources}
                  </small>
                </span>
                <ArrowRight
                  className="resource-category-arrow"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="resource-journey"
        aria-labelledby="resource-journey-title"
      >
        <div className="content-shell resource-journey-inner">
          <div className="resource-journey-intro">
            <span className="eyebrow">{ui.journey.eyebrow}</span>
            <h2 id="resource-journey-title">{ui.journey.title}</h2>
            <p>{ui.journey.text}</p>
          </div>
          <ol className="resource-journey-steps">
            {ui.journey.steps.map(([title, text], index) => (
              <li key={title}>
                <span className="resource-journey-marker">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="resource-directory content-shell"
        id="all-resources"
        aria-labelledby="resource-directory-title"
      >
        <header>
          <span className="eyebrow">{ui.library.eyebrow}</span>
          <h2 id="resource-directory-title">{ui.library.title}</h2>
          <p>{ui.library.text}</p>
        </header>

        <div className="resource-toolbar">
          <label className="resource-search">
            <Search aria-hidden="true" />
            <span className="sr-only">{ui.directory.search}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              placeholder={ui.directory.searchPlaceholder}
            />
          </label>
          <div className="resource-toolbar-controls">
            <label className="resource-select">
              <span className="sr-only">{ui.library.allTypes}</span>
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  resetPage();
                }}
              >
                <option value="All">{ui.library.allTypes}</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="resource-select">
              <span className="sr-only">{ui.library.allResponsibilities}</span>
              <select
                value={category}
                onChange={(event) => selectCategory(event.target.value)}
              >
                {categories.map(([key, label]) => (
                  <option key={key} value={key}>
                    {key === "All" ? ui.library.allResponsibilities : label}
                  </option>
                ))}
              </select>
            </label>
            <label className="resource-select">
              <span className="sr-only">{ui.library.sortLabel}</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="recent">{ui.library.sortRecent}</option>
                <option value="title">{ui.library.sortTitle}</option>
              </select>
            </label>
            <div
              className="resource-view-toggle"
              role="group"
              aria-label={ui.library.view}
            >
              <button
                type="button"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <LayoutGrid aria-hidden="true" />
                {ui.library.grid}
              </button>
              <button
                type="button"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <List aria-hidden="true" />
                {ui.library.list}
              </button>
            </div>
          </div>
        </div>

        <p className="resource-result-count" aria-live="polite">
          {sorted.length}{" "}
          {sorted.length === 1 ? ui.directory.resource : ui.directory.resources}
        </p>

        {sorted.length ? (
          <>
            {view === "grid" ? (
              <div className="resource-card-grid">
                {visible.map((resource) => (
                  <ResourceCard
                    resource={resource}
                    ui={ui}
                    categoryKey={categoryKeyByLabel.get(resource.category)}
                    key={resource.slug}
                  />
                ))}
              </div>
            ) : (
              <div className="resource-rows">
                {visible.map((resource) => (
                  <ResourceRow
                    resource={resource}
                    ui={ui}
                    key={resource.slug}
                  />
                ))}
              </div>
            )}
            {hasMore ? (
              <button
                type="button"
                className="resource-load-more"
                onClick={() =>
                  setVisibleCount((current) => current + PAGE_SIZE)
                }
              >
                <PlusCircle aria-hidden="true" />
                {ui.library.loadMore}
              </button>
            ) : null}
          </>
        ) : (
          <p className="resource-no-results">{ui.directory.noResults}</p>
        )}
      </section>

      <section className="resource-cta" aria-labelledby="resource-cta-title">
        <div className="resource-cta-media">
          <img
            src="/assets/images/resources/resources-botanical-cta.png"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="resource-cta-copy">
          <span className="eyebrow">{ui.directory.ctaEyebrow}</span>
          <h2 id="resource-cta-title">{ui.directory.ctaTitle}</h2>
          <p>{ui.directory.ctaText}</p>
          <div className="resource-cta-actions">
            <LocalizedLink to="/contact" className="button button-primary">
              {ui.directory.ctaPrimary}
            </LocalizedLink>
            <LocalizedLink to="/services" className="button button-secondary">
              {ui.directory.ctaSecondary}
            </LocalizedLink>
          </div>
          <small className="resource-cta-support">
            {ui.directory.ctaSupport}
          </small>
        </div>
      </section>
    </div>
  );
}

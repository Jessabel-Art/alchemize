import { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { RESOURCE_CATEGORIES, resourcesForCategory } from "./resourcesData.js";
import FeaturedResourcesHero from "./FeaturedResourcesHero.jsx";
import useResourceMetadata from "./useResourceMetadata.js";
import "./resources.css";

export default function ResourcesPage() {
  const [category, setCategory] = useState("All");
  const visible = resourcesForCategory(category);
  useResourceMetadata(null);

  return (
    <div className="resources-page">
      <FeaturedResourcesHero />

      <div className="resources-library content-shell">
        <section
          className="resource-directory"
          aria-labelledby="resource-directory-title"
        >
          <header>
            <span className="eyebrow">
              Understand · Prepare · Organize · Act
            </span>
            <h2 id="resource-directory-title">Resources by responsibility.</h2>
            <p>
              Browse practical guidance by the responsibility in front of you.
            </p>
          </header>
          <div
            className="resource-filters"
            role="group"
            aria-label="Filter resources by category"
          >
            {RESOURCE_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="resource-result-count" aria-live="polite">
            {visible.length} {visible.length === 1 ? "resource" : "resources"}
          </p>
          <div className="resource-rows">
            {visible.map((resource) => (
              <Link
                to={`/resources/${resource.slug}`}
                className="resource-row"
                key={resource.slug}
                aria-label={`Read ${resource.title}`}
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
                    {resource.readTime} · Updated {resource.updated}
                  </small>
                </div>
                <span className="resource-row-action">
                  Read resource <ArrowRight aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

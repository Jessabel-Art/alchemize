import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { resourceBySlug } from "./resourcesData.js";

const featuredSlides = [
  {
    slug: "preparing-for-tax-season",
    theme: "navy-ivory",
    label: "Featured guide · Taxes",
    summary:
      "A practical framework for organizing tax records before filing begins, identifying missing information, and reducing the last-minute search for documents.",
    panelLabel: "A calmer preparation sequence",
    panelItems: [
      ["Gather", "Collect income, expense, identity, and supporting records."],
      ["Reconcile", "Check for missing documents and unanswered questions."],
      ["Prepare", "Organize what your tax preparer will need before filing."],
    ],
    utility: {
      type: "internal",
      label: "Print checklist",
      href: "/resources/preparing-for-tax-season?print=1",
      Icon: Printer,
    },
  },
  {
    slug: "medicare-basics-coverage-choices",
    theme: "navy-ivory",
    label: "Featured guide · Medicare & Insurance",
    summary:
      "A clear starting point for understanding Medicare Parts A, B, C, and D, how Original Medicare differs from Medicare Advantage, and what questions matter before comparing coverage.",
    panelLabel: "Begin with the coverage picture",
    panelItems: [
      ["Understand Parts", "See how the basic parts relate."],
      ["Compare Coverage", "Review the two primary coverage paths."],
      [
        "Review Enrollment",
        "Confirm timing through current official guidance.",
      ],
    ],
    utility: {
      type: "external",
      label: "View official source",
      href: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options",
      Icon: ExternalLink,
    },
  },
  {
    slug: "your-first-year-in-business",
    theme: "navy-ivory",
    label: "Featured guide · Starting a Business",
    summary:
      "The first year creates the records, deadlines, and administrative habits the business will rely on later. Build a system before information becomes scattered.",
    panelLabel: "Foundations worth building early",
    panelItems: [
      ["Records", "Give important company information a dependable home."],
      ["Deadlines", "Track obligations before they become urgent."],
      ["Processes", "Document work the business will repeat."],
    ],
  },
  {
    slug: "business-needs-a-process",
    theme: "navy-ivory",
    label: "Featured framework · Business Operations",
    summary:
      "When the same problem keeps returning, the business may need a repeatable process, clear ownership, and a reliable place for information to live.",
    panelLabel: "Build the repeatable path",
    panelItems: [
      ["Trigger", "Name what starts the work."],
      ["Owner", "Assign responsibility for moving it forward."],
      ["Steps", "Define the actions and information required."],
      ["Review", "Improve what repeatedly creates friction."],
    ],
  },
].map((slide) => ({ ...slide, resource: resourceBySlug.get(slide.slug) }));

function UtilityAction({ utility }) {
  if (!utility) return null;
  const { Icon } = utility;
  if (utility.type === "external") {
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
  }
  return (
    <Link className="resource-showcase-utility" to={utility.href}>
      <Icon aria-hidden="true" /> {utility.label}
    </Link>
  );
}

export default function FeaturedResourcesHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(null);
  const active = featuredSlides[activeIndex];

  const selectSlide = (nextIndex) => {
    setActiveIndex((nextIndex + featuredSlides.length) % featuredSlides.length);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectSlide(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectSlide(activeIndex + 1);
    }
  };

  const handleTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) < 48) return;
    selectSlide(activeIndex + (distance < 0 ? 1 : -1));
  };

  return (
    <section
      className={`resource-showcase resource-showcase--${active.theme}`}
      aria-label="Featured resources"
      aria-roledescription="carousel"
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0].clientX;
      }}
      onTouchEnd={handleTouchEnd}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Featured resource {activeIndex + 1} of {featuredSlides.length}:{" "}
        {active.resource.title}
      </p>

      <div className="resource-showcase-grid">
        <div className="resource-showcase-main">
          <div className="resource-showcase-copy" key={`copy-${active.slug}`}>
            <span className="resource-showcase-label">{active.label}</span>
            <h1>{active.resource.title}</h1>
            <p>{active.summary}</p>
            <div className="resource-showcase-actions">
              <Link
                className="button button-primary"
                to={`/resources/${active.slug}`}
              >
                Read the guide
              </Link>
              <UtilityAction utility={active.utility} />
            </div>
          </div>

          <div
            className="resource-showcase-controls"
            aria-label="Featured resource controls"
          >
            <button
              type="button"
              onClick={() => selectSlide(activeIndex - 1)}
              aria-label={`Previous featured resource: ${featuredSlides[(activeIndex - 1 + featuredSlides.length) % featuredSlides.length].resource.title}`}
            >
              <ArrowLeft aria-hidden="true" /> <span>Previous</span>
            </button>
            <div className="resource-showcase-position" aria-hidden="true">
              <strong>{String(activeIndex + 1).padStart(2, "0")}</strong>
              <span>/</span>
              <span>{String(featuredSlides.length).padStart(2, "0")}</span>
              <i>
                {featuredSlides.map((slide, index) => (
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
              aria-label={`Next featured resource: ${featuredSlides[(activeIndex + 1) % featuredSlides.length].resource.title}`}
            >
              <span>Next</span> <ArrowRight aria-hidden="true" />
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

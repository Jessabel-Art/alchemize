import { Link } from "react-router-dom";
import {
  ArrowRight,
  FileDown,
  FileText,
  Focus,
  Search,
  Wrench,
} from "lucide-react";
import Reveal from "../../components/ui/Reveal.jsx";
import "./home.css";

const capabilities = [
  ["Advisory & Optimization", "/services/businesses/advisory-optimization"],
  [
    "Operations & Implementation",
    "/services/businesses/operations-implementation",
  ],
  [
    "Digital Business & Technology",
    "/services/businesses/digital-business-technology",
  ],
  ["Business Readiness & Growth", "/services/businesses/readiness-growth"],
  ["Financial & Tax Support", "/services/businesses/financial-tax-support"],
];

const connectedProcess = [
  ["Assess", "Assess what is happening.", Search],
  ["Identify", "Identify what needs to improve.", Focus],
  ["Implement", "Implement practical next steps.", Wrench],
];

const featuredResources = [
  [
    "Taxes",
    "Preparing for Tax Season",
    "/assets/downloads/alchemize-preparing-for-tax-season.pdf",
  ],
  [
    "Business",
    "Starting a Business: Organization Checklist",
    "/assets/downloads/alchemize-starting-a-business-organization-checklist.pdf",
  ],
  [
    "Getting started",
    "Documents to Bring to a Consultation",
    "/assets/downloads/alchemize-consultation-document-checklist.pdf",
  ],
];
function HomePage() {
  return (
    <article className="home-page">
      <section className="home-hero">
        <div className="content-shell home-hero-grid">
          <Reveal className="home-hero-copy">
            <span className="eyebrow eyebrow--gold">
              Alchemize Business Services
            </span>
            <h1>
              Transform Complexity Into <em>Opportunity.</em>
            </h1>
            <p>
              Practical business advisory, operations, technology, readiness,
              and financial support—organized around what needs to work better.
            </p>
            <div className="home-actions">
              <Link className="button button-primary" to="/contact">
                Schedule a Consultation
              </Link>
              <Link className="button button--light" to="/services">
                Explore Services
              </Link>
            </div>
          </Reveal>
          <Reveal as="figure" className="home-hero-image" delay={100}>
            <img
              src="/assets/images/home/alchemize-hero.webp"
              alt="Professional reviewing organized business materials at a desk"
            />
            <figcaption>Assess. Optimize. Implement.</figcaption>
          </Reveal>
        </div>
      </section>
      <section className="home-paths">
        <div className="content-shell">
          <Reveal className="home-heading">
            <span className="eyebrow">Start with what you need</span>
            <h2>Support for you. Structure for your business.</h2>
          </Reveal>
          <div className="home-path-grid">
            <Reveal as="article">
              <span>For me</span>
              <h3>Individual Services</h3>
              <p>
                Personal tax preparation, insurance solutions, and notary and
                document support.
              </p>
              <Link className="text-link" to="/services/#individuals">
                Explore individual services
              </Link>
            </Reveal>
            <Reveal as="article" delay={100}>
              <span>Entrepreneurs · Freelancers · Businesses</span>
              <h3>Business Services</h3>
              <ul>
                {capabilities.map(([title]) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
              <Link className="text-link" to="/services/#businesses">
                Explore business services
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
      <section className="home-connect">
        <div className="home-watermark" aria-hidden="true" />
        <div className="content-shell home-connect-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              Your responsibilities connect
            </span>
            <h2>Many important business and personal decisions overlap.</h2>
          </Reveal>
          <Reveal className="home-connect-copy">
            <p>
              A business question can affect tax preparation. A new opportunity
              can expose an operational gap. A better recommendation may still
              need someone to help put the solution in place.
            </p>
            <div
              className="home-connect-process"
              aria-label="Alchemize process"
            >
              {connectedProcess.map(([label, statement, Icon]) => (
                <div className="home-connect-stage" key={label}>
                  <span className="home-connect-icon" aria-hidden="true">
                    <Icon strokeWidth={1.5} />
                  </span>
                  <div>
                    <strong>{label}</strong>
                    <p>{statement}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <section className="home-capabilities">
        <div className="content-shell">
          <Reveal className="home-heading">
            <span className="eyebrow">Business capabilities</span>
            <h2>
              More than recommendations. Support for putting the work into
              place.
            </h2>
          </Reveal>
          <div className="home-capability-list">
            {capabilities.map(([title, to], index) => (
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
              alt="Jessy Santos working with business documents at a desk"
            />
          </figure>
          <Reveal>
            <span className="eyebrow">Clear guidance. Practical support.</span>
            <h2>Professional does not have to mean impersonal.</h2>
            <p>
              Alchemize combines organized processes and professional standards
              with clear, direct communication.
            </p>
            <Link className="text-link" to="/why-alchemize">
              Why Alchemize
            </Link>
          </Reveal>
        </div>
      </section>
      <section className="home-resources">
        <div className="content-shell home-resource-grid">
          <Reveal className="home-resource-intro">
            <span className="eyebrow eyebrow--gold">
              Prepare with confidence
            </span>
            <h2>Clear information for the decisions in front of you.</h2>
            <Link className="button button--light" to="/resources">
              Explore All Resources
            </Link>
          </Reveal>
          <div className="home-resource-list">
            {featuredResources.map(([category, title, href], index) => (
              <Reveal
                as="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                delay={index * 70}
                key={title}
                aria-label={`${title}, PDF guide, opens in a new tab`}
              >
                <span className="home-resource-category">{category}</span>
                <span className="home-resource-title">
                  <strong>{title}</strong>
                  <small>
                    <FileText aria-hidden="true" strokeWidth={1.5} /> PDF guide
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
            <span className="eyebrow eyebrow--gold">Start with the need</span>
            <h2>
              You do not need to identify the exact service before reaching out.
            </h2>
          </Reveal>
          <Reveal>
            <p>
              Tell us what you are trying to accomplish, improve, or resolve. We
              will help identify the appropriate next step.
            </p>
            <Link className="button button-primary" to="/contact">
              Schedule a Consultation
            </Link>
          </Reveal>
        </div>
      </section>
    </article>
  );
}
export default HomePage;

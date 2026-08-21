import { Link } from "react-router-dom";
import Reveal from "../../components/ui/Reveal.jsx";
import "./about.css";

const standards = [
  ["Clarity", "Explain what matters and what happens next."],
  [
    "Organization",
    "Create structure around information, responsibilities, and process.",
  ],
  [
    "Professional care",
    "Treat every interaction and entrusted detail with appropriate discretion.",
  ],
  [
    "Practical follow-through",
    "Focus on actions that move the responsibility forward.",
  ],
  ["Client context", "Understand the situation before determining the path."],
];

function AboutPage() {
  return (
    <article className="about-page">
      <section className="about-hero">
        <div className="content-shell about-hero-grid">
          <Reveal>
            <span className="eyebrow">About Alchemize</span>
            <h1>Built to make complex responsibilities easier to navigate.</h1>
            <p>
              Alchemize Business Services was created to bring more clarity,
              organization, and practical support to the responsibilities
              individuals and business owners manage every day.
            </p>
          </Reveal>
          <Reveal className="about-hero-note">
            <span>Company perspective</span>
            <strong>
              Professional support designed around real life and real business.
            </strong>
          </Reveal>
        </div>
      </section>
      <section className="about-origin">
        <div className="content-shell about-origin-grid">
          <Reveal>
            <span className="eyebrow">Why Alchemize exists</span>
            <h2>The goal is not to add another layer of complexity.</h2>
          </Reveal>
          <Reveal>
            <p>
              Important responsibilities are often spread across separate
              providers, systems, deadlines, and conversations. For individuals
              and small business owners, that fragmentation creates unnecessary
              complexity.
            </p>
            <p>
              Alchemize was created around a simpler idea: professional support
              should organize the situation, clarify what matters, and make the
              next step easier to understand.
            </p>
            <blockquote>
              The goal is to help make complexity more manageable.
            </blockquote>
          </Reveal>
        </div>
      </section>
      <section className="about-audiences">
        <div className="content-shell">
          <Reveal className="about-heading">
            <span className="eyebrow eyebrow--gold">Who we serve</span>
            <h2>Two audiences. One commitment to clarity.</h2>
          </Reveal>
          <div className="about-audience-grid">
            <Reveal as="article">
              <span>Individuals</span>
              <h3>Preparation and support for personal responsibilities.</h3>
              <p>
                Tax preparation, insurance solutions, and notary and document
                services.
              </p>
              <Link className="text-link" to="/services/individuals">
                Individual services
              </Link>
            </Reveal>
            <Reveal as="article" delay={100}>
              <span>Businesses</span>
              <h3>
                Structure behind starting, operating, and strengthening a
                business.
              </h3>
              <p>
                Formation, operations, technology, tax, readiness, advisory,
                insurance, and administrative support.
              </p>
              <Link className="text-link" to="/services/businesses">
                Business services
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
      <section className="about-founder">
        <div className="content-shell about-founder-grid">
          <div
            className="about-portrait"
            role="img"
            aria-label="Editorial founder monogram for Jessy Santos"
          >
            <span>Jessy Santos</span>
            <small>Founder · MBA</small>
          </div>
          <Reveal className="about-founder-copy">
            <span className="eyebrow">The founder</span>
            <h2>Jessy Santos</h2>
            <p className="about-founder-title">
              Founder
              <br />
              Alchemize Business Services LLC
              <br />
              <strong>MBA · 15+ Years of Professional Experience</strong>
            </p>
            <p>
              Experience across business operations, administration, client
              service, financial responsibilities, organization, and practical
              problem-solving created the perspective behind Alchemize.
            </p>
            <p>
              Important responsibilities become harder when they are spread
              across disconnected systems, providers, deadlines, documents, and
              decisions. Alchemize was built to create a more organized way
              forward.
            </p>
          </Reveal>
        </div>
        <Reveal as="blockquote" className="about-quote">
          “I built Alchemize around a simple belief: professional support should
          help people understand what is in front of them, organize what
          matters, and move forward with clearer next steps.”
          <footer>
            Jessy Santos <span>Founder, Alchemize Business Services</span>
          </footer>
        </Reveal>
      </section>
      <section className="about-meaning">
        <div className="content-shell about-meaning-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              The meaning behind Alchemize
            </span>
            <h2>Transformation starts with clarity.</h2>
          </Reveal>
          <div className="about-transform-list">
            {[
              ["Scattered information", "Organized records"],
              ["An idea", "A structured plan"],
              ["Uncertainty", "A clear decision"],
              ["Administrative burden", "A repeatable process"],
            ].map(([a, b], i) => (
              <Reveal key={a} delay={i * 70}>
                <span>{a}</span>
                <strong>{b}</strong>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="about-belief">
        <div className="content-shell">
          <Reveal>
            <span className="eyebrow">
              What professional service should feel like
            </span>
            <h2>
              Clear enough to understand.
              <br />
              Organized enough to trust.
              <br />
              <em>Practical enough to use.</em>
            </h2>
            <p>
              Clients should not need specialized vocabulary just to understand
              the process in front of them.
            </p>
          </Reveal>
        </div>
      </section>
      <section className="about-standards">
        <div className="content-shell about-standards-grid">
          <Reveal>
            <span className="eyebrow">Operating standards</span>
            <h2>The principles behind the work.</h2>
          </Reveal>
          <div className="about-standard-list">
            {standards.map(([title, text], i) => (
              <Reveal as="article" key={title} delay={(i % 2) * 70}>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="about-vision">
        <div className="content-shell about-vision-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              Built for what comes next
            </span>
            <h2>The company we are building.</h2>
            <p>
              A trusted professional resource where individuals and small
              businesses can find organized support, useful information, clear
              processes, and practical guidance across multiple stages of
              growth.
            </p>
          </Reveal>
          <Reveal className="about-mission">
            <article>
              <span>Mission</span>
              <p>
                To simplify complexity and turn administrative, financial, and
                business responsibilities into organized, practical next steps.
              </p>
            </article>
            <article>
              <span>Vision</span>
              <p>
                To help individuals and businesses navigate important
                responsibilities with greater clarity, organization, and
                confidence.
              </p>
            </article>
          </Reveal>
        </div>
      </section>
      <section className="about-final">
        <div className="content-shell about-final-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              Start the conversation
            </span>
            <h2>Tell us what you are working through.</h2>
          </Reveal>
          <Reveal>
            <p>
              You do not have to arrive with every answer. Start with what you
              are trying to solve.
            </p>
            <div className="about-actions">
              <Link className="button button-primary" to="/contact">
                Schedule a Consultation
              </Link>
              <Link className="button button--light" to="/why-alchemize">
                Why Alchemize
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}
export default AboutPage;

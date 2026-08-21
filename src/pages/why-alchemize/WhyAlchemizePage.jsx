import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Compass,
  Focus,
  FolderTree,
  Link2,
  MoveRight,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Reveal from "../../components/ui/Reveal.jsx";
import "./why-alchemize.css";

const principles = [
  [
    "Clear guidance",
    "Professional services should leave you with more clarity, not more questions.",
    Compass,
  ],
  [
    "Connected support",
    "Support should recognize the whole responsibility, not just one piece of it.",
    Link2,
  ],
  ["Practical solutions", "Useful answers. Clear actions.", ClipboardCheck],
  [
    "Professional care",
    "Treat every interaction and entrusted detail with appropriate discretion.",
    ShieldCheck,
  ],
  [
    "Professional continuity",
    "Support built to evolve with the need.",
    RefreshCw,
  ],
];

const approach = [
  [
    "Understand",
    "Start with the situation, responsibility, question, or goal.",
    Search,
  ],
  [
    "Organize",
    "Identify what information matters and what needs to be prepared.",
    FolderTree,
  ],
  [
    "Clarify",
    "Determine the appropriate service, options, and next steps.",
    Focus,
  ],
  [
    "Move Forward",
    "Take practical action with professional support where Alchemize can help.",
    MoveRight,
  ],
];

const continuityPaths = [
  [
    "For individuals",
    "individuals",
    ["Tax preparation", "Insurance", "Documents", "Preparation & organization"],
  ],
  [
    "For businesses",
    "businesses",
    [
      "Startup",
      "Operations",
      "Taxes",
      "Insurance",
      "Administration & advisory",
    ],
  ],
];

function WhyAlchemizePage() {
  return (
    <article className="why-page">
      <section className="why-hero">
        <div className="why-hero-field" aria-hidden="true" />
        <div className="content-shell why-hero-grid">
          <Reveal className="why-hero-copy">
            <span className="eyebrow">Why Alchemize</span>
            <h1>
              Clarity across the responsibilities that <em>connect.</em>
            </h1>
            <p>
              Your financial, business, and administrative decisions do not
              exist in isolation. Neither should the support behind them.
            </p>
            <div className="why-actions">
              <Link className="button button-primary" to="/contact">
                Schedule a Consultation
              </Link>
              <a className="button button-outline" href="#difference">
                See the difference
              </a>
            </div>
          </Reveal>
          <div className="why-orbit" aria-hidden="true">
            <span className="why-orbit-ring why-orbit-ring--outer" />
            <span className="why-orbit-ring why-orbit-ring--inner" />
            <span className="why-orbit-core">A</span>
            <i>Taxes</i>
            <i>Insurance</i>
            <i>Documents</i>
            <i>Business</i>
          </div>
        </div>
      </section>

      <section className="why-problem" id="difference">
        <div className="content-shell why-problem-grid">
          <Reveal>
            <span className="eyebrow">The reality</span>
            <h2>Important responsibilities rarely arrive one at a time.</h2>
          </Reveal>
          <Reveal className="why-problem-copy">
            <p>
              A tax question can affect a business decision. A new business
              creates administrative responsibilities. Insurance decisions
              connect to family and financial priorities.
            </p>
            <p>
              Yet these needs are commonly handled through disconnected
              providers, systems, and conversations.
            </p>
          </Reveal>
          <ul className="why-sequence">
            {[
              "Start with the situation.",
              "Organize what matters.",
              "Identify the right next step.",
              "Move forward with practical support.",
            ].map((item, index) => (
              <Reveal as="li" delay={index * 70} key={item}>
                {item}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="why-audiences">
        <div className="why-audiences-grid">
          <div className="why-audience why-audience--light">
            <Reveal>
              <span className="eyebrow">For individuals</span>
              <h2>Personal responsibilities deserve a clear process.</h2>
              <p>
                Taxes. Insurance. Notary. Documents. Preparation. Organization.
              </p>
              <Link className="text-link" to="/services/individuals">
                Explore individual services
              </Link>
            </Reveal>
          </div>
          <div className="why-audience-principle">
            <span>One principle</span>
            <strong>
              Make complex responsibilities easier to understand and act on.
            </strong>
          </div>
          <div className="why-audience why-audience--dark">
            <Reveal>
              <span className="eyebrow eyebrow--gold">For businesses</span>
              <h2>Structure behind every stage of the business.</h2>
              <p>
                Startup. Operations. Technology. Taxes. Readiness. Advisory.
              </p>
              <Link
                className="text-link why-light-link"
                to="/services/businesses"
              >
                Explore business services
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="why-approach">
        <div className="content-shell">
          <Reveal className="why-section-intro">
            <span className="eyebrow">The Alchemize approach</span>
            <h2>A clear progression from question to action.</h2>
          </Reveal>
          <div className="why-approach-steps">
            {approach.map(([title, copy, Icon], index) => (
              <Reveal as="article" delay={index * 70} key={title}>
                <Icon
                  className="why-process-icon"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
                <h3>{title}</h3>
                <p>{copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="why-principles">
        <div className="content-shell">
          <Reveal className="why-section-intro">
            <span className="eyebrow eyebrow--gold">
              Why the experience is different
            </span>
            <h2>
              Support designed to make the responsibility easier to understand
              and act on.
            </h2>
          </Reveal>
          <div className="why-principle-list">
            {principles.map(([title, copy, Icon], index) => (
              <Reveal as="article" delay={(index % 2) * 70} key={title}>
                <Icon
                  className="why-principle-icon"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
                <h3>{title}</h3>
                <p>{copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="why-founder">
        <div className="content-shell why-founder-shell">
          <div className="why-founder-grid">
            <Reveal className="why-founder-identity">
              <span className="eyebrow">The founder</span>
              <h2>Jessy Santos</h2>
              <p className="why-founder-title">
                Founder
                <br />
                Alchemize Business Services LLC
                <strong>MBA · 15+ Years of Professional Experience</strong>
              </p>
            </Reveal>
            <figure className="why-founder-portrait">
              <img
                src="/assets/images/about/founder-image.png"
                alt="Jessy Santos, founder of Alchemize Business Services"
              />
            </figure>
            <Reveal className="why-founder-narrative">
              <p className="why-founder-positioning">
                Business experience is most valuable when it can turn complexity
                into clear decisions and practical action.
              </p>
              <p>
                Jessy Santos brings more than 15 years of professional
                experience across business operations, administration, client
                service, financial responsibilities, organization, and practical
                problem-solving, supported by an MBA and a hands-on
                understanding of how businesses operate behind the scenes.
              </p>
              <p>
                Her experience has required more than completing individual
                tasks. It has involved managing competing priorities, working
                through operational challenges, organizing information,
                supporting financial and administrative responsibilities, and
                determining what needs to happen next when the path is not
                immediately clear.
              </p>
              <p>
                She founded Alchemize Business Services to bring that same
                practical, organized approach to individuals, entrepreneurs, and
                small businesses that need more than information. They need
                someone who can understand the situation, create structure
                around it, and help move the responsibility forward.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="why-continuity">
        <div className="why-continuity-watermark" aria-hidden="true">
          ALCHEMIZE
        </div>
        <div className="content-shell">
          <Reveal className="why-continuity-copy">
            <span className="eyebrow eyebrow--gold">
              One relationship. Changing needs.
            </span>
            <h2>Your needs will change. The support can evolve with them.</h2>
            <p>
              An individual may begin with tax preparation. An entrepreneur may
              begin with formation. What comes next can require a different kind
              of support.
            </p>
          </Reveal>
          <div className="why-pathways">
            <span className="why-pathways-origin" aria-hidden="true" />
            <div className="why-pathways-grid">
              {continuityPaths.map(([label, audience, stages], pathIndex) => (
                <Reveal
                  as="article"
                  className={`why-pathway why-pathway--${audience}`}
                  delay={pathIndex * 100}
                  key={label}
                >
                  <h3>{label}</h3>
                  <ol>
                    {stages.map((stage, stageIndex) => (
                      <li key={stage}>
                        <span
                          className="why-pathway-marker"
                          aria-hidden="true"
                        />
                        <span className="why-pathway-stage">{stage}</span>
                        {stageIndex < stages.length - 1 && (
                          <span
                            className="why-pathway-connector"
                            aria-hidden="true"
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="why-final">
        <div className="content-shell why-final-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              Start with what is in front of you
            </span>
            <h2>
              You do not need to have everything figured out before the
              conversation starts.
            </h2>
          </Reveal>
          <Reveal>
            <p>
              Tell us what you are working through, preparing for, or trying to
              accomplish. We can start by identifying the right next step.
            </p>
            <div className="why-actions">
              <Link className="button button-primary" to="/contact">
                Schedule a Consultation
              </Link>
              <Link className="button button--light" to="/services">
                Explore Services
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default WhyAlchemizePage;

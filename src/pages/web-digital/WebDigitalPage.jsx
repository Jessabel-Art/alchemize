import { useLocation } from "react-router-dom";
import Reveal from "../../components/ui/Reveal.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import {
  leadOriginState,
  trackServiceCtaClick,
} from "../../services/leadAnalytics.js";
import { webDigitalSummary } from "./webDigitalSummary.js";
import { webDigitalDetail } from "./webDigitalDetail.js";
import "./web-digital.css";

const BOTANICAL_IMAGE = "/assets/images/services/botanical-asset.png";
const BOTANICAL_CORNER_IMAGE =
  "/assets/images/services/resources-botanical-cta.png";
const HERO_VISUAL = "/assets/images/services/web-digital-hero.png";

// The three solution groups keep the summary's titles (so the Services page
// listing and this page agree); each carries the capability panels for it.
const solutionGroups = (lang) =>
  webDigitalSummary[lang].capabilities.map((title, index) => ({
    title,
    panels: webDigitalDetail[lang].panels[index],
  }));

const contentMap = {
  en: {
    metadata: {
      title: "Small Business Website Design & Digital Solutions | Alchemize",
      description: webDigitalDetail.en.metaDescription,
    },
    hero: {
      eyebrow: "Web & Digital Solutions",
      title: "Professional digital presence for the work that matters.",
      copy: webDigitalDetail.en.heroCopy,
      primary: "Request a Project Proposal",
      secondary: "See What We Build ↓",
    },
    positioning: {
      eyebrow: "A business-first approach",
      title: "A website should do more than exist.",
      copy: "It should explain the business, establish credibility, and guide people toward a clear action—while supporting the work happening behind the screen.",
      values: [
        [
          "Establish credibility",
          "Make the business look established, current, and trustworthy.",
        ],
        [
          "Explain your services",
          "Help visitors quickly understand what you offer and who it is for.",
        ],
        [
          "Generate action",
          "Create clear paths to call, inquire, schedule, request a quote, or purchase.",
        ],
        [
          "Support the business",
          "Connect the website to the tools and workflows used behind the scenes.",
        ],
      ],
    },
    audiences: {
      eyebrow: "Who we build for",
      copy: "Digital solutions shaped around the audience, the purpose, and how the business actually works.",
      items: [
        [
          "Small businesses",
          "Professional websites designed to establish credibility, explain services, generate inquiries, and connect with the systems used to run the business.",
        ],
        [
          "Entrepreneurs & independent professionals",
          "Professional digital presence for consultants, freelancers, agents, creators, and service providers who need their expertise and services presented clearly.",
        ],
        [
          "New & growing businesses",
          "A practical starting point for businesses that need the website, domain, email, local search presence, forms, and other digital foundations established together.",
        ],
      ],
    },
    solutions: {
      eyebrow: "Service architecture",
      title: "Website and digital solutions",
      copy: webDigitalSummary.en.statement,
      categories: solutionGroups("en"),
      lifecycle: webDigitalDetail.en.lifecycle,
      panelLabels: webDigitalDetail.en.panelLabels,
    },
    system: {
      eyebrow: "Around the website",
      titleStart: "The website is only one part of",
      titleEmphasis: "the system.",
      copy: "When appropriate, Alchemize can connect the pieces around the website so the digital presence does more than represent the business—it becomes part of how the business operates.",
      hub: "Your website",
      groups: [
        {
          label: "Attract",
          items: [
            "Local SEO",
            "Google Business Profile",
            "Search-ready content",
            "Social & profile connections",
          ],
        },
        {
          label: "Convert",
          items: [
            "Contact & lead forms",
            "Consultation requests",
            "Appointment scheduling",
            "Clear calls to action",
          ],
        },
        {
          label: "Operate",
          items: [
            "Business email",
            "Payments",
            "Selected integrations",
            "Administrative workflows",
          ],
        },
        {
          label: "Measure & maintain",
          items: [
            "Analytics",
            "Search monitoring",
            "Website maintenance",
            "Content updates",
          ],
        },
      ],
    },
    difference: {
      eyebrow: "The Alchemize difference",
      title: "Built with more than design in mind.",
      copy: "A good website has to work for the people visiting it and the business operating behind it. Alchemize brings experience in business operations, administrative workflows, client communication, service delivery, and user experience into the way each project is structured.",
      alt: "A laptop showing a clean website structure on a desk with books, plants, and a notebook",
      items: [
        "Business operations",
        "Client communication",
        "Administrative workflows",
        "Conversion paths",
        "Service delivery",
        "User experience",
      ],
    },
    process: {
      eyebrow: "Web project workflow",
      title: "Simple project process",
      copy: "A clear, structured path from first conversation to launch.",
      items: [
        [
          "Discover",
          "Understand the business, audience, goals, and current digital presence.",
        ],
        [
          "Scope",
          "Define what the project actually needs—and what it does not.",
        ],
        [
          "Design",
          "Establish structure, content flow, functionality, and visual direction.",
        ],
        ["Build", "Develop and connect the approved experience."],
        [
          "Review",
          "Test usability, responsiveness, content, forms, and functionality.",
        ],
        ["Launch", "Prepare the website and connected systems for go-live."],
      ],
    },
    after: {
      eyebrow: "After launch",
      title: "Digital support for what comes next.",
      intro: webDigitalDetail.en.after.intro,
      label: "Ongoing support may include",
      items: webDigitalDetail.en.after.items,
      closing:
        "Ongoing support can be included in the original scope or arranged separately as the business evolves.",
    },
    faq: webDigitalDetail.en.faq,
    final: {
      eyebrow: "Need more than a standard website?",
      title: "Not sure what your digital presence needs yet?",
      copy: webDigitalDetail.en.finalCopy,
      cta: "Request a Project Proposal",
    },
  },
  es: {
    metadata: {
      title: "Diseño de sitios web para pequeñas empresas | Alchemize",
      description: webDigitalDetail.es.metaDescription,
    },
    hero: {
      eyebrow: "Web y soluciones digitales",
      title: "Una presencia digital profesional para el trabajo que importa.",
      copy: webDigitalDetail.es.heroCopy,
      primary: "Solicitar una propuesta de proyecto",
      secondary: "Ver qué construimos ↓",
    },
    positioning: {
      eyebrow: "Un enfoque empresarial primero",
      title: "Un sitio web debe hacer más que existir.",
      copy: "Debe explicar el negocio, establecer credibilidad y guiar a las personas hacia una acción clara, mientras respalda el trabajo que ocurre detrás de la pantalla.",
      values: [
        [
          "Establecer credibilidad",
          "Que el negocio se vea establecido, actual y confiable.",
        ],
        [
          "Explicar sus servicios",
          "Ayude a los visitantes a entender rápidamente qué ofrece y para quién.",
        ],
        [
          "Generar acción",
          "Cree vías claras para llamar, consultar, programar, solicitar una cotización o comprar.",
        ],
        [
          "Respaldar el negocio",
          "Conecte el sitio web con las herramientas y flujos de trabajo utilizados detrás de escena.",
        ],
      ],
    },
    audiences: {
      eyebrow: "Para quién trabajamos",
      copy: "Soluciones digitales definidas por la audiencia, el propósito y la forma en que funciona el negocio.",
      items: [
        [
          "Pequeñas empresas",
          "Sitios web profesionales diseñados para establecer credibilidad, explicar servicios, generar consultas y conectarse con los sistemas utilizados para operar el negocio.",
        ],
        [
          "Emprendedores y profesionales independientes",
          "Presencia digital profesional para consultores, freelancers, agentes, creadores y proveedores de servicios que necesitan presentar su experiencia y servicios con claridad.",
        ],
        [
          "Negocios nuevos y en crecimiento",
          "Un punto de partida práctico para negocios que necesitan establecer juntos el sitio web, el dominio, el correo electrónico, la presencia en búsquedas locales, los formularios y otras bases digitales.",
        ],
      ],
    },
    solutions: {
      eyebrow: "Arquitectura de servicios",
      title: "Sitios web y soluciones digitales",
      copy: webDigitalSummary.es.statement,
      categories: solutionGroups("es"),
      lifecycle: webDigitalDetail.es.lifecycle,
      panelLabels: webDigitalDetail.es.panelLabels,
    },
    system: {
      eyebrow: "Alrededor del sitio web",
      titleStart: "El sitio web es solo una parte de",
      titleEmphasis: "el sistema.",
      copy: "Cuando corresponde, Alchemize puede conectar los elementos alrededor del sitio web para que la presencia digital haga más que representar el negocio: se convierte en parte de cómo opera el negocio.",
      hub: "Su sitio web",
      groups: [
        {
          label: "Atraer",
          items: [
            "SEO local",
            "Google Business Profile",
            "Contenido preparado para búsquedas",
            "Conexiones con redes y perfiles",
          ],
        },
        {
          label: "Convertir",
          items: [
            "Formularios de contacto y leads",
            "Solicitudes de consulta",
            "Programación de citas",
            "Llamadas a la acción claras",
          ],
        },
        {
          label: "Operar",
          items: [
            "Correo empresarial",
            "Pagos",
            "Integraciones seleccionadas",
            "Flujos administrativos",
          ],
        },
        {
          label: "Medir y mantener",
          items: [
            "Analíticas",
            "Monitoreo de búsquedas",
            "Mantenimiento del sitio web",
            "Actualizaciones de contenido",
          ],
        },
      ],
    },
    difference: {
      eyebrow: "La diferencia de Alchemize",
      title: "Creado pensando en más que el diseño.",
      copy: "Un buen sitio web debe funcionar tanto para las personas que lo visitan como para el negocio que opera detrás de él. Alchemize aporta experiencia en operaciones empresariales, flujos administrativos, comunicación con clientes, prestación de servicios y experiencia de usuario a la forma en que se estructura cada proyecto.",
      alt: "Una laptop mostrando una estructura de sitio web clara sobre un escritorio con libros, plantas y un cuaderno",
      items: [
        "Operaciones empresariales",
        "Comunicación con clientes",
        "Flujos administrativos",
        "Rutas de conversión",
        "Prestación de servicios",
        "Experiencia de usuario",
      ],
    },
    process: {
      eyebrow: "Flujo de trabajo del proyecto web",
      title: "Proceso simple de proyecto",
      copy: "Un camino claro y estructurado desde la primera conversación hasta el lanzamiento.",
      items: [
        [
          "Descubrir",
          "Comprender el negocio, la audiencia, los objetivos y la presencia digital actual.",
        ],
        [
          "Alcance",
          "Definir lo que el proyecto realmente necesita, y lo que no.",
        ],
        [
          "Diseño",
          "Establecer la estructura, el flujo de contenido, la funcionalidad y la dirección visual.",
        ],
        ["Construcción", "Desarrollar y conectar la experiencia aprobada."],
        [
          "Revisión",
          "Probar usabilidad, capacidad de respuesta, contenido, formularios y funcionalidad.",
        ],
        [
          "Lanzamiento",
          "Preparar el sitio web y los sistemas conectados para su salida en vivo.",
        ],
      ],
    },
    after: {
      eyebrow: "Después del lanzamiento",
      title: "Apoyo digital para lo que sigue.",
      intro: webDigitalDetail.es.after.intro,
      label: "El soporte continuo puede incluir",
      items: webDigitalDetail.es.after.items,
      closing:
        "El soporte continuo puede incluirse en el alcance original o coordinarse por separado a medida que el negocio evoluciona.",
    },
    faq: webDigitalDetail.es.faq,
    final: {
      eyebrow: "¿Necesita más que un sitio web estándar?",
      title: "¿No está seguro de lo que necesita su presencia digital?",
      copy: webDigitalDetail.es.finalCopy,
      cta: "Solicitar una propuesta de proyecto",
    },
  },
};

const processIcons = [
  <svg viewBox="0 0 24 24" aria-hidden="true" key="discover">
    <circle cx="11" cy="11" r="5.5" />
    <path d="M15.5 15.5L20 20" />
  </svg>,
  <svg viewBox="0 0 24 24" aria-hidden="true" key="scope">
    <path d="M4 8.5h6.5V4H20v11.5H13.5V20H4V8.5Z" />
    <path d="M10.5 8.5H13.5V11.5H16.5V14.5H10.5" />
  </svg>,
  <svg viewBox="0 0 24 24" aria-hidden="true" key="design">
    <path d="M4 18.5V6.5h16v12H4Z" />
    <path d="M8 15.5l2-2 2.5 2.5 5-5" />
    <path d="M15 5.5v3m-3-3h6" />
  </svg>,
  <svg viewBox="0 0 24 24" aria-hidden="true" key="build">
    <path d="M8 7 3.5 12 8 17" />
    <path d="M16 7l4.5 5L16 17" />
    <path d="M13.5 5l-3 14" />
  </svg>,
  <svg viewBox="0 0 24 24" aria-hidden="true" key="review">
    <circle cx="12" cy="12" r="7.5" />
    <path d="m8.8 12.3 2.2 2.2 4.2-5.1" />
  </svg>,
  <svg viewBox="0 0 24 24" aria-hidden="true" key="launch">
    <path d="M14 5.5h4.5V10" />
    <path d="M18.5 5.5 12 12" />
    <path d="M8.5 7.5H6.5A2 2 0 0 0 4.5 9.5v8A2 2 0 0 0 6.5 19.5h8a2 2 0 0 0 2-2v-2" />
  </svg>,
];

function WebDigitalPage() {
  const { language } = useLanguage();
  const content = contentMap[language];
  const location = useLocation();
  // Individual Services -> Digital Support is a second way into this same page.
  // Its links carry `entryAudience`, so the inquiry (and its measurement) keeps
  // the audience that asked; every other visit is a business inquiry.
  const audience =
    location.state?.entryAudience === "individual" ? "individual" : "business";
  const contactCta = (ctaLocation, ctaLabel) => ({
    to: `/contact?service=business-digital&audience=${audience}`,
    state: leadOriginState({ ctaLocation, serviceKey: "business-digital" }),
    onClick: () =>
      trackServiceCtaClick({
        serviceKey: "business-digital",
        audience,
        ctaLocation,
        ctaLabel,
        language,
      }),
  });
  usePageMetadata({
    en: contentMap.en.metadata,
    es: contentMap.es.metadata,
  });

  return (
    <article className="webx-page">
      {/* Public prospects enter through consultation. Service intake remains an
          authenticated, assigned client-portal workflow. */}
      <section className="webx-hero">
        <div className="content-shell webx-hero-grid">
          <Reveal className="webx-hero-copy">
            <span className="eyebrow eyebrow--gold">
              {content.hero.eyebrow}
            </span>
            <h1>{content.hero.title}</h1>
            <p>{content.hero.copy}</p>
            <div className="webx-actions">
              <Link
                className="button button-primary"
                {...contactCta("web_hero", content.hero.primary)}
              >
                {content.hero.primary}
              </Link>
              <a
                className="text-link webx-light-link webx-scroll-link"
                href="#solutions"
              >
                {content.hero.secondary}
              </a>
            </div>
          </Reveal>
          <Reveal className="webx-interface" delay={90} aria-hidden="true">
            <div className="webx-browser">
              <div className="webx-browser-bar">
                <i />
                <i />
                <i />
                <span>getalchemize.com</span>
              </div>
              <div className="webx-browser-page">
                <div className="webx-mini-nav">
                  <b>A</b>
                  <span />
                  <span />
                  <span />
                </div>
                <div className="webx-mini-hero">
                  <small>BUSINESS · DIGITAL</small>
                  <strong>
                    Clear structure.
                    <br />
                    Useful direction.
                  </strong>
                  <i />
                </div>
                <div className="webx-mini-grid">
                  <span>
                    <b />
                    <i />
                    <i />
                  </span>
                  <span>
                    <b />
                    <i />
                    <i />
                  </span>
                  <span>
                    <b />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            </div>
            <div className="webx-mobile-frame">
              <span />
              <strong>A</strong>
              <i />
              <i />
              <i />
            </div>
            <div className="webx-measure">RESPONSIVE DESIGN</div>
          </Reveal>
        </div>
      </section>

      <section className="webx-positioning">
        <div className="content-shell webx-positioning-grid">
          <Reveal>
            <span className="eyebrow">{content.positioning.eyebrow}</span>
            <h2>{content.positioning.title}</h2>
          </Reveal>
          <Reveal className="webx-positioning-copy" delay={70}>
            <p>{content.positioning.copy}</p>
            <ul>
              {content.positioning.values.map(([label, text]) => (
                <li key={label}>
                  <strong>{label}</strong>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="webx-audiences">
        <div className="content-shell">
          <Reveal className="webx-section-intro">
            <span className="eyebrow">{content.audiences.eyebrow}</span>
            <p>{content.audiences.copy}</p>
          </Reveal>
          <div className="webx-audience-grid">
            {content.audiences.items.map(([title, text], index) => (
              <Reveal as="article" delay={index * 60} key={title}>
                <div className="webx-audience-head">
                  <h2>{title}</h2>
                </div>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="webx-solutions">
        <div className="content-shell">
          <Reveal className="webx-heading-row">
            <div>
              <span className="eyebrow">{content.solutions.eyebrow}</span>
              <h2>{content.solutions.title}</h2>
            </div>
            <p>{content.solutions.copy}</p>
          </Reveal>
          <Reveal className="webx-lifecycle">
            <div className="webx-lifecycle-head">
              <span className="eyebrow">
                {content.solutions.lifecycle.eyebrow}
              </span>
              <p className="webx-lifecycle-title">
                {content.solutions.lifecycle.title}
              </p>
              <p>{content.solutions.lifecycle.intro}</p>
            </div>
            <ol className="webx-lifecycle-stages">
              {content.solutions.lifecycle.stages.map(
                ([label, text], index) => (
                  <li key={label}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{label}</strong>
                    <p>{text}</p>
                  </li>
                ),
              )}
            </ol>
          </Reveal>
          <div className="webx-solution-categories">
            {content.solutions.categories.map((category, catIndex) => (
              <Reveal
                as="div"
                className="webx-solution-category"
                delay={catIndex * 60}
                key={category.title}
              >
                <div className="webx-solution-category-head">
                  <h3>{category.title}</h3>
                </div>
                <div className="webx-solution-panels">
                  {category.panels.map((panel) => (
                    <article key={panel.name} className="webx-panel">
                      <header>
                        <span className="webx-panel-stage">{panel.stage}</span>
                        <h4>{panel.name}</h4>
                      </header>
                      <p className="webx-panel-lead">{panel.lead}</p>
                      {panel.projects ? (
                        <p className="webx-panel-projects">
                          <strong>
                            {content.solutions.panelLabels.projects}
                          </strong>{" "}
                          {panel.projects.join(" · ")}
                        </p>
                      ) : null}
                      <ul aria-label={content.solutions.panelLabels.includes}>
                        {panel.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                      {panel.note ? (
                        <p className="webx-panel-note">{panel.note}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="webx-enhancements">
        <img
          className="webx-enhancements-botanical"
          src={BOTANICAL_IMAGE}
          alt=""
          aria-hidden="true"
          loading="eager"
        />
        <div className="content-shell webx-enhancement-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {content.system.eyebrow}
            </span>
            <h2>
              {content.system.titleStart}{" "}
              <em>{content.system.titleEmphasis}</em>
            </h2>
            <p>{content.system.copy}</p>
          </Reveal>
          <div className="webx-system-diagram">
            <div className="webx-system-groups">
              {content.system.groups.map((group, index) => (
                <Reveal
                  as="article"
                  className="webx-system-group"
                  delay={index * 55}
                  key={group.label}
                >
                  <span className="webx-system-marker" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="webx-system-label">{group.label}</span>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
            <Reveal
              as="div"
              className="webx-system-hub"
              delay={230}
              aria-hidden="true"
            >
              {content.system.hub}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="webx-difference">
        <div className="content-shell webx-difference-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {content.difference.eyebrow}
            </span>
            <h2>{content.difference.title}</h2>
            <p>{content.difference.copy}</p>
          </Reveal>
          <Reveal as="figure" className="webx-difference-visual" delay={90}>
            <img
              src={HERO_VISUAL}
              alt={content.difference.alt}
              loading="lazy"
            />
          </Reveal>
          <div className="webx-difference-items">
            {content.difference.items.map((item, index) => (
              <Reveal
                as="div"
                className="webx-difference-item"
                delay={index * 40}
                key={item}
              >
                <p>{item}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="webx-process">
        <div className="content-shell">
          <Reveal className="webx-heading-row">
            <div>
              <span className="eyebrow">{content.process.eyebrow}</span>
              <h2>{content.process.title}</h2>
            </div>
            <p>{content.process.copy}</p>
          </Reveal>
          <ol className="webx-process-grid">
            {content.process.items.map(([label, text], index) => (
              <Reveal as="li" delay={(index % 3) * 45} key={label}>
                <article data-step={String(index + 1).padStart(2, "0")}>
                  <span className="webx-process-icon" aria-hidden="true">
                    {processIcons[index]}
                  </span>
                  <h3>{label}</h3>
                  <p>{text}</p>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="webx-after">
        <div className="content-shell webx-after-grid">
          <Reveal>
            <span className="eyebrow">{content.after.eyebrow}</span>
            <h2>{content.after.title}</h2>
          </Reveal>
          <Reveal delay={70} className="webx-after-copy">
            <p>{content.after.intro}</p>
            <span className="webx-after-label">{content.after.label}</span>
            <ul className="webx-after-list">
              {content.after.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="webx-after-closing">{content.after.closing}</p>
          </Reveal>
        </div>
      </section>

      <section className="webx-faq">
        <div className="content-shell webx-faq-grid">
          <Reveal>
            <span className="eyebrow">{content.faq.eyebrow}</span>
            <h2>{content.faq.title}</h2>
          </Reveal>
          <div className="webx-faq-list">
            {content.faq.items.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="webx-consult webx-consult--bottom">
        <img
          className="webx-consult-botanical"
          src={BOTANICAL_CORNER_IMAGE}
          alt=""
          aria-hidden="true"
          loading="eager"
        />
        <div className="content-shell webx-consult-grid">
          <Reveal>
            <span className="eyebrow">{content.final.eyebrow}</span>
            <h2>{content.final.title}</h2>
          </Reveal>
          <Reveal delay={70}>
            <p>{content.final.copy}</p>
            <Link
              className="button button-primary"
              {...contactCta("web_close", content.final.cta)}
            >
              {content.final.cta}
            </Link>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default WebDigitalPage;

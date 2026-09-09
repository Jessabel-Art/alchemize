import Reveal from "../../components/ui/Reveal.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import "./web-digital.css";

const BOTANICAL_IMAGE = "/assets/images/services/botanical-asset.png";
const BOTANICAL_CORNER_IMAGE =
  "/assets/images/services/resources-botanical-cta.png";
const HERO_VISUAL = "/assets/images/services/web-digital-hero.png";

const contentMap = {
  en: {
    metadata: {
      title: "Small Business Website Design & Digital Solutions | Alchemize",
      description:
        "Professional website design and connected digital systems for small businesses, entrepreneurs, and professionals who need a credible online presence and the practical tools behind it.",
    },
    hero: {
      eyebrow: "Web & Digital Solutions",
      title: "Professional digital presence for the work that matters.",
      copy: "Alchemize creates professional websites and connected digital systems for businesses, professionals, and independent service providers. From your website and local search presence to forms, scheduling, email, payments, and integrations, we build around how your business actually works.",
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
      copy: "Start with the website alone or build a broader digital foundation around it. Scope is based on what the business actually needs.",
      categories: [
        {
          title: "Website design & development",
          items: [
            [
              "Landing-page websites",
              "Focused websites designed to introduce a service or offering clearly.",
            ],
            [
              "Small-business websites",
              "Professional, well-structured sites that support credibility, inquiries, and client trust.",
            ],
            [
              "Professional & portfolio websites",
              "Clear presentation of services, projects, expertise, and contact information.",
            ],
            [
              "Website redesigns & refreshes",
              "Improve an existing digital presence without losing the business's core clarity.",
            ],
          ],
        },
        {
          title: "Visibility & digital presence",
          items: [
            [
              "Local SEO",
              "Improve local visibility with search-ready website structure.",
            ],
            [
              "Google Business Profile setup",
              "Establish or improve the business's presence in local Google results.",
            ],
            [
              "Search-ready website structure",
              "Build pages, metadata, and content hierarchy with search visibility in mind.",
            ],
            [
              "Responsive & mobile optimization",
              "Ensure the site remains easy to use and readable across devices.",
            ],
          ],
        },
        {
          title: "Systems & support",
          items: [
            [
              "Forms & lead capture",
              "Capture inquiries directly from the website.",
            ],
            [
              "Appointment scheduling integrations",
              "Connect booking tools clients can use directly.",
            ],
            [
              "Business email & domain configuration",
              "Set up a professional email and domain foundation.",
            ],
            [
              "Payment & selected third-party integrations",
              "Connect the tools the business already relies on.",
            ],
            [
              "Website maintenance & support",
              "Keep the site reliable after launch.",
            ],
          ],
        },
      ],
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
      eyebrow: "How we work",
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
      intro:
        "A website is not necessarily finished when it launches. Depending on the engagement, ongoing support can include:",
      label: "Ongoing support may include",
      items: [
        "Website updates",
        "Content changes",
        "Integration support",
        "Domain & DNS assistance",
        "Business email support",
        "Local search updates",
        "Analytics review",
        "Future improvements",
      ],
      closing:
        "Ongoing support can be included in the original scope or arranged separately as the business evolves.",
    },
    final: {
      eyebrow: "Need more than a standard website?",
      title: "Not sure what your digital presence needs yet?",
      copy: "You do not need to know whether you need a new website, redesign, SEO work, integrations, or a broader digital setup before contacting us. Tell us what you are trying to accomplish, and we will identify an appropriate starting point.",
      cta: "Request a Project Proposal",
    },
  },
  es: {
    metadata: {
      title: "Diseño de sitios web para pequeñas empresas | Alchemize",
      description:
        "Diseño de sitios web profesional y sistemas digitales conectados para pequeñas empresas, emprendedores y profesionales que necesitan una presencia en línea clara y confiable.",
    },
    hero: {
      eyebrow: "Web y soluciones digitales",
      title: "Una presencia digital profesional para el trabajo que importa.",
      copy: "Alchemize crea sitios web profesionales y sistemas digitales conectados para empresas, profesionales y proveedores de servicios independientes. Desde su sitio web y presencia en búsquedas locales hasta formularios, programación de citas, correo electrónico, pagos e integraciones, construimos alrededor de cómo funciona realmente su negocio.",
      primary: "Programar una consulta",
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
      copy: "Comience solo con el sitio web o desarrolle una base digital más amplia a su alrededor. El alcance se define según lo que el negocio realmente necesita.",
      categories: [
        {
          title: "Diseño y desarrollo de sitios web",
          items: [
            [
              "Sitios de aterrizaje",
              "Sitios enfocados diseñados para presentar un servicio u oferta con claridad.",
            ],
            [
              "Sitios para pequeñas empresas",
              "Sitios profesionales y bien estructurados que respaldan la credibilidad, las consultas y la confianza del cliente.",
            ],
            [
              "Sitios profesionales y de portafolio",
              "Presentación clara de servicios, proyectos, experiencia e información de contacto.",
            ],
            [
              "Rediseños y actualizaciones de sitios",
              "Mejore una presencia digital existente sin perder la claridad principal del negocio.",
            ],
          ],
        },
        {
          title: "Visibilidad y presencia digital",
          items: [
            [
              "SEO local",
              "Mejore la visibilidad local con una estructura de sitio preparada para búsquedas.",
            ],
            [
              "Configuración de Google Business Profile",
              "Establezca o mejore la presencia del negocio en los resultados locales de Google.",
            ],
            [
              "Estructura del sitio preparada para búsquedas",
              "Construya páginas, metadatos y jerarquía de contenido pensando en la visibilidad en buscadores.",
            ],
            [
              "Optimización responsive y móvil",
              "Garantice que el sitio siga siendo fácil de usar y leer en todos los dispositivos.",
            ],
          ],
        },
        {
          title: "Sistemas y soporte",
          items: [
            [
              "Formularios y captura de leads",
              "Capture consultas directamente desde el sitio web.",
            ],
            [
              "Integraciones de programación de citas",
              "Conecte herramientas de reserva que los clientes puedan usar directamente.",
            ],
            [
              "Configuración de correo empresarial y dominio",
              "Establezca una base profesional de correo electrónico y dominio.",
            ],
            [
              "Pagos e integraciones seleccionadas de terceros",
              "Conecte las herramientas que el negocio ya utiliza.",
            ],
            [
              "Mantenimiento y soporte del sitio web",
              "Mantenga el sitio confiable después del lanzamiento.",
            ],
          ],
        },
      ],
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
      eyebrow: "Cómo trabajamos",
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
      intro:
        "Un sitio web no necesariamente está terminado cuando se lanza. Según el proyecto, el soporte continuo puede incluir:",
      label: "El soporte continuo puede incluir",
      items: [
        "Actualizaciones del sitio web",
        "Cambios de contenido",
        "Soporte de integraciones",
        "Asistencia con dominio y DNS",
        "Soporte de correo empresarial",
        "Actualizaciones de búsqueda local",
        "Revisión de analíticas",
        "Mejoras futuras",
      ],
      closing:
        "El soporte continuo puede incluirse en el alcance original o coordinarse por separado a medida que el negocio evoluciona.",
    },
    final: {
      eyebrow: "¿Necesita más que un sitio web estándar?",
      title: "¿No está seguro de lo que necesita su presencia digital?",
      copy: "No necesita saber si requiere un sitio web nuevo, un rediseño, trabajo de SEO, integraciones o una configuración digital más amplia antes de contactarnos. Cuéntenos qué desea lograr y le ayudaremos a identificar un punto de partida adecuado.",
      cta: "Programar una consulta",
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
                to="/contact?service=business-digital&audience=business"
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
                  <span />
                  <span />
                  <span />
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
                  <span>{String(index + 1).padStart(2, "0")}</span>
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
          <div className="webx-solution-categories">
            {content.solutions.categories.map((category, catIndex) => (
              <Reveal
                as="div"
                className="webx-solution-category"
                delay={catIndex * 60}
                key={category.title}
              >
                <div className="webx-solution-category-head">
                  <span>{String(catIndex + 1).padStart(2, "0")}</span>
                  <h3>{category.title}</h3>
                </div>
                <div className="webx-solution-index">
                  {category.items.map(([title, text]) => (
                    <article key={title}>
                      <h4>{title}</h4>
                      <p>{text}</p>
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
                <span>{String(index + 1).padStart(2, "0")}</span>
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
              to="/contact?service=business-digital&audience=business"
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

import Reveal from "../../components/ui/Reveal.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import "./web-digital.css";

const content = {
  en: {
    metadata: {
      title: "Small Business Website Design & Digital Solutions | Alchemize",
      description:
        "Professional website design and digital support for small businesses, entrepreneurs, and professionals building a credible online presence with practical web solutions.",
    },
    hero: {
      eyebrow: "Web & Digital Solutions",
      title: "Professional digital presence for the work that matters.",
      copy: "Alchemize creates clean, credible websites and practical digital support for businesses, professionals, and individuals who need a stronger online presence without unnecessary complexity. We also help with local visibility and the digital systems that support the real work of the business.",
      primary: "Request a Project Proposal",
      secondary: "Explore the process",
    },
    audiences: {
      title: "Who we build for",
      businesses: {
        title: "Businesses",
        copy: "Professional websites that clearly explain your services, establish credibility, and make it easy for prospective clients to contact or engage your business.",
      },
      professionals: {
        title: "Professionals & Individuals",
        copy: "Portfolio, personal-brand, consulting, and professional websites that communicate expertise clearly and make a strong first impression.",
      },
    },
    solutions: {
      title: "Website and digital solutions",
      items: [
        [
          "Landing-page websites",
          "Focused, practical websites designed to introduce a service or offering clearly.",
        ],
        [
          "Small-business websites",
          "Professional, well-structured sites that support credibility, inquiries, and client trust.",
        ],
        [
          "Professional and portfolio websites",
          "Clear presentation of services, projects, expertise, and contact information.",
        ],
        [
          "Local SEO and Google Business Profile setup",
          "Improve local visibility with search-ready structure, profile setup, and clearer digital presence.",
        ],
        [
          "Website redesigns and refreshes",
          "Refresh and improve an existing digital presence without losing the business’s core clarity.",
        ],
        [
          "Business systems and integrations",
          "Connect forms, scheduling, and business tools so the digital experience works with the real work behind it.",
        ],
        [
          "Responsive/mobile optimization",
          "Sites that remain easy to use and readable across devices.",
        ],
        [
          "Website maintenance and support",
          "Keep content, forms, links, and digital basics reliable after launch with practical care after launch.",
        ],
      ],
    },
    enhancements: {
      title: "Digital enhancements",
      items: [
        "Appointment scheduling integrations",
        "Contact and lead forms",
        "Payment integrations where appropriate",
        "Domain configuration",
        "Business email configuration",
        "Analytics setup",
        "Basic search optimization",
        "Social and business profile connections",
        "Selected third-party integrations",
      ],
    },
    custom: {
      title: "Need more than a standard website?",
      copy: "Alchemize can evaluate custom digital requirements and determine the right approach for your business.",
      cta: "Request a Project Proposal",
    },
    process: {
      title: "Simple project process",
      items: [
        ["Discovery", "Define the goal, audience, and current digital needs."],
        ["Scope", "Clarify the website structure, features, and priorities."],
        ["Design", "Refine layout, content flow, and the visual presentation."],
        ["Build", "Develop the site with a clear business-focused approach."],
        ["Review", "Check usability, content, and final accuracy."],
        ["Launch", "Prepare the site for go-live and handoff."],
      ],
    },
    cta: {
      title: "Ready to plan the next step?",
      copy: "Tell us what you need the website or digital presence to accomplish. We can determine the right project path from there.",
      button: "Request a Project Proposal",
    },
  },
  es: {
    metadata: {
      title: "Diseño de sitios web para pequeñas empresas | Alchemize",
      description:
        "Diseño de sitios web profesional y apoyo digital para pequeñas empresas, emprendedores y profesionales que necesitan una presencia en línea clara y confiable.",
    },
    hero: {
      eyebrow: "Web y soluciones digitales",
      title: "Una presencia digital profesional para el trabajo que importa.",
      copy: "Alchemize crea sitios web claros y confiables, además de apoyo digital práctico para negocios, profesionales y personas que necesitan una presencia en línea más sólida sin complejidad innecesaria.",
      primary: "Programar una consulta",
      secondary: "Ver el proceso",
    },
    audiences: {
      title: "Para quién trabajamos",
      businesses: {
        title: "Empresas",
        copy: "Sitios web profesionales que explican claramente sus servicios, establecen credibilidad y facilitan que los clientes potenciales se comuniquen o contraten su negocio.",
      },
      professionals: {
        title: "Profesionales y personas",
        copy: "Sitios de portafolio, marca personal, consultoría y perfiles profesionales que comunican la experiencia de manera clara y sólida.",
      },
    },
    solutions: {
      title: "Soluciones para sitios web",
      items: [
        [
          "Sitios de aterrizaje",
          "Sitios enfocados y prácticos para presentar un servicio u oferta de manera clara.",
        ],
        [
          "Sitios para pequeñas empresas",
          "Sitios profesionales y bien estructurados que respaldan la credibilidad y las consultas.",
        ],
        [
          "Sitios profesionales y de portafolio",
          "Presentación clara de servicios, proyectos, experiencia e información de contacto.",
        ],
        [
          "Rediseños de sitios web",
          "Actualizar y mejorar una presencia digital existente sin perder claridad.",
        ],
        [
          "Optimización móvil y responsive",
          "Sitios fáciles de usar y leer en distintos dispositivos.",
        ],
        [
          "Formularios de contacto y generación de leads",
          "Vías simples para que los clientes potenciales se comuniquen con menos fricción.",
        ],
      ],
    },
    enhancements: {
      title: "Mejoras digitales",
      items: [
        "Integraciones de programación de citas",
        "Formularios de contacto y leads",
        "Integraciones de pago cuando corresponda",
        "Configuración de dominio",
        "Configuración de correo corporativo",
        "Configuración de analíticas",
        "Optimización básica de búsqueda",
        "Conexiones con redes sociales y perfiles empresariales",
        "Integraciones seleccionadas de terceros",
      ],
    },
    custom: {
      title: "¿Necesita más que un sitio web estándar?",
      copy: "Alchemize puede evaluar requisitos digitales personalizados y determinar el enfoque correcto para su negocio.",
      cta: "Programar una consulta",
    },
    process: {
      title: "Proceso simple de proyecto",
      items: [
        [
          "Descubrimiento",
          "Definir la meta, la audiencia y las necesidades digitales actuales.",
        ],
        [
          "Alcance",
          "Clarificar la estructura del sitio, las funciones y las prioridades.",
        ],
        [
          "Diseño",
          "Refinar distribución, flujo de contenido y presentación visual.",
        ],
        [
          "Construcción",
          "Desarrollar el sitio con un enfoque claro y orientado al negocio.",
        ],
        ["Revisión", "Comprobar usabilidad, contenido y precisión final."],
        [
          "Lanzamiento",
          "Preparar el sitio para el lanzamiento y apoyo continuo.",
        ],
      ],
    },
    cta: {
      title: "¿Listo para definir el siguiente paso?",
      copy: "Cuéntenos lo que necesita que el sitio web o la presencia digital logre. Podemos determinar el camino correcto del proyecto a partir de ahí.",
      button: "Solicitar una consulta del proyecto",
    },
  },
};

function WebDigitalPage() {
  const { language } = useLanguage();
  const content = contentMap[language];
  usePageMetadata({
    en: contentMap.en.metadata,
    es: contentMap.es.metadata,
  });

  const editorial =
    language === "es"
      ? {
          positioningEyebrow: "Un enfoque empresarial primero",
          positioningTitle: "Un sitio web debe hacer más que existir.",
          positioningCopy:
            "Debe explicar el negocio, establecer credibilidad y guiar a las personas hacia una acción clara, mientras respalda el trabajo que ocurre detrás de la pantalla.",
          values: [
            "Explicar claramente lo que hace el negocio",
            "Hacer que los servicios sean fáciles de entender",
            "Guiar a los visitantes hacia una acción",
            "Funcionar con claridad en todos los dispositivos",
          ],
          audienceCopy:
            "Soluciones digitales definidas por la audiencia, el propósito y la forma en que funciona el negocio.",
          solutionsEyebrow: "Arquitectura de servicios",
          enhancementsEyebrow: "Alrededor del sitio",
          enhancementsCopy:
            "Conectamos el sitio web con los sistemas prácticos que ayudan al negocio a comunicarse, operar y medir.",
          groups: ["Conectar", "Operar", "Medir"],
          customTitle:
            "¿No está seguro de lo que necesita su presencia digital?",
          customCopy:
            "Alchemize puede evaluar la configuración actual, identificar brechas prácticas y recomendar un punto de partida apropiado.",
          differenceEyebrow: "La diferencia de Alchemize",
          differenceTitle: "Creado pensando en más que el diseño.",
          differenceCopy:
            "Alchemize aborda los proyectos web con experiencia en operaciones empresariales, comunicación con clientes, flujos administrativos, prestación de servicios y experiencia de usuario. El sitio debe adaptarse a la forma en que realmente funciona el negocio.",
          differenceItems: [
            "Operaciones empresariales",
            "Comunicación con clientes",
            "Flujos administrativos",
            "Rutas de conversión",
            "Prestación de servicios",
            "Experiencia de usuario",
          ],
          processEyebrow: "Cómo trabajamos",
          afterEyebrow: "Después del lanzamiento",
          afterTitle: "Apoyo digital para lo que sigue.",
          afterCopy:
            "Según el proyecto, Alchemize puede ayudar con actualizaciones, cambios de contenido, integraciones seleccionadas, dominio y DNS, correo empresarial, mantenimiento digital y mejoras futuras del sitio.",
          finalTitle:
            "¿Listo para crear una presencia digital que se adapte al negocio?",
          finalCopy:
            "Cuéntenos qué necesita, qué existe actualmente y qué desea que logren el sitio o la configuración digital.",
          consultation: "Programar una consulta",
        }
      : {
          positioningEyebrow: "A business-first approach",
          positioningTitle: "A website should do more than exist.",
          positioningCopy:
            "It should explain the business, establish credibility, and guide people toward a clear action—while supporting the work happening behind the screen.",
          values: [
            "Explain what the business does clearly",
            "Make services easy to understand",
            "Guide visitors toward action",
            "Work clearly across every device",
          ],
          audienceCopy:
            "Digital solutions shaped around the audience, the purpose, and how the business actually works.",
          solutionsEyebrow: "Service architecture",
          enhancementsEyebrow: "Around the website",
          enhancementsCopy:
            "We connect the website to the practical systems that help the business communicate, operate, and measure.",
          groups: ["Connect", "Operate", "Measure"],
          customTitle: "Not sure what your digital presence needs yet?",
          customCopy:
            "Alchemize can evaluate the current setup, identify practical gaps, and recommend an appropriate starting point.",
          differenceEyebrow: "The Alchemize difference",
          differenceTitle: "Built with more than design in mind.",
          differenceCopy:
            "Alchemize approaches web projects with experience across business operations, client communication, administrative workflows, service delivery, and user experience. The website should fit how the business actually works.",
          differenceItems: [
            "Business operations",
            "Client communication",
            "Administrative workflows",
            "Conversion paths",
            "Service delivery",
            "User experience",
          ],
          processEyebrow: "How we work",
          afterEyebrow: "After launch",
          afterTitle: "Digital support for what comes next.",
          afterCopy:
            "Depending on the engagement, Alchemize may support updates, content changes, selected integrations, domain and DNS needs, business email, digital housekeeping, and future site improvements.",
          finalTitle:
            "Ready to build a digital presence that fits the business?",
          finalCopy:
            "Tell us what you need, what already exists, and what you want the site or digital setup to accomplish.",
          consultation: "Request a Project Proposal",
        };

  const enhancementGroups = [
    [
      content.enhancements.items[0],
      content.enhancements.items[1],
      content.enhancements.items[7],
    ],
    [
      content.enhancements.items[3],
      content.enhancements.items[4],
      content.enhancements.items[8],
      content.enhancements.items[2],
    ],
    [content.enhancements.items[5], content.enhancements.items[6]],
  ];

  const processIcons = {
    Discovery: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="5.5" />
        <path d="M15.5 15.5L20 20" />
      </svg>
    ),
    Scope: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8.5h6.5V4H20v11.5H13.5V20H4V8.5Z" />
        <path d="M10.5 8.5H13.5V11.5H16.5V14.5H10.5" />
      </svg>
    ),
    Design: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18.5V6.5h16v12H4Z" />
        <path d="M8 15.5l2-2 2.5 2.5 5-5" />
        <path d="M15 5.5v3m-3-3h6" />
      </svg>
    ),
    Build: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 7 3.5 12 8 17" />
        <path d="M16 7l4.5 5L16 17" />
        <path d="M13.5 5l-3 14" />
      </svg>
    ),
    Review: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" />
        <path d="m8.8 12.3 2.2 2.2 4.2-5.1" />
      </svg>
    ),
    Launch: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 5.5h4.5V10" />
        <path d="M18.5 5.5 12 12" />
        <path d="M8.5 7.5H6.5A2 2 0 0 0 4.5 9.5v8A2 2 0 0 0 6.5 19.5h8a2 2 0 0 0 2-2v-2" />
      </svg>
    ),
  };

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
              <a className="text-link webx-light-link" href="#process">
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
            <span className="eyebrow">{editorial.positioningEyebrow}</span>
            <h2>{editorial.positioningTitle}</h2>
          </Reveal>
          <Reveal className="webx-positioning-copy" delay={70}>
            <p>{editorial.positioningCopy}</p>
            <ul>
              {editorial.values.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="webx-audiences">
        <div className="content-shell">
          <Reveal className="webx-section-intro">
            <span className="eyebrow">{content.audiences.title}</span>
            <p>{editorial.audienceCopy}</p>
          </Reveal>
          <div className="webx-audience-grid">
            <Reveal as="article">
              <h2>{content.audiences.businesses.title}</h2>
              <p>{content.audiences.businesses.copy}</p>
            </Reveal>
            <Reveal as="article" delay={70}>
              <h2>{content.audiences.professionals.title}</h2>
              <p>{content.audiences.professionals.copy}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="webx-solutions">
        <div className="content-shell">
          <Reveal className="webx-heading-row">
            <div>
              <span className="eyebrow">{editorial.solutionsEyebrow}</span>
              <h2>{content.solutions.title}</h2>
            </div>
            <p>{content.hero.copy}</p>
          </Reveal>
          <div className="webx-solution-index">
            {content.solutions.items.map(([title, text]) => (
              <Reveal as="article" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="webx-enhancements">
        <div className="content-shell webx-enhancement-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {editorial.enhancementsEyebrow}
            </span>
            <h2>{content.enhancements.title}</h2>
            <p>{editorial.enhancementsCopy}</p>
          </Reveal>
          <div className="webx-enhancement-groups">
            {enhancementGroups.map((items, index) => (
              <Reveal
                as="article"
                delay={index * 55}
                key={editorial.groups[index]}
              >
                <span>{editorial.groups[index]}</span>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="webx-difference">
        <div className="content-shell webx-difference-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">
              {editorial.differenceEyebrow}
            </span>
            <h2>{editorial.differenceTitle}</h2>
            <p>{editorial.differenceCopy}</p>
          </Reveal>
          <ul>
            {editorial.differenceItems.map((item) => (
              <Reveal as="li" key={item}>
                {item}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="process" className="webx-process">
        <div className="content-shell">
          <Reveal className="webx-heading-row">
            <div>
              <span className="eyebrow">{editorial.processEyebrow}</span>
              <h2>{content.process.title}</h2>
            </div>
            <p>{content.cta.copy}</p>
          </Reveal>
          <ol className="webx-process-grid">
            {content.process.items.map(([label, text], index) => (
              <Reveal as="li" delay={(index % 3) * 45} key={label}>
                <article>
                  <span className="webx-process-icon" aria-hidden="true">
                    {processIcons[label]}
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
            <span className="eyebrow">{editorial.afterEyebrow}</span>
            <h2>{editorial.afterTitle}</h2>
          </Reveal>
          <Reveal delay={70}>
            <p>{editorial.afterCopy}</p>
          </Reveal>
        </div>
      </section>

      <section className="webx-consult webx-consult--bottom">
        <div className="content-shell webx-consult-grid">
          <Reveal>
            <span className="eyebrow">{content.custom.title}</span>
            <h2>{editorial.customTitle}</h2>
          </Reveal>
          <Reveal delay={70}>
            <p>{editorial.customCopy}</p>
            <Link
              className="button button-primary"
              to="/contact?service=business-digital&audience=business"
            >
              {content.custom.cta}
            </Link>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

export default WebDigitalPage;

const contentMap = {
  en: {
    ...content.en,
  },
  es: {
    ...content.es,
  },
};

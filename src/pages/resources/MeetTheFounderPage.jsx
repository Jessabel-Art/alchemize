import { useEffect } from "react";
import Reveal from "../../components/ui/Reveal.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import {
  buildPersonSchema,
  ensureJsonLd,
  SITE_URL,
} from "../../seo/siteSchema.js";
import "./meet-the-founder.css";

export default function MeetTheFounderPage() {
  const { language } = useLanguage();

  usePageMetadata({
    en: {
      title: "Meet the Founder | Business Operations & Digital Experience",
      description:
        "Meet Jessy Santos and learn how 15+ years in business operations, administration, client service, UX, and web development shape Alchemize's connected service model.",
    },
    es: {
      title: "Conozca a la fundadora | Experiencia en operaciones y digital",
      description:
        "Conozca a Jessy Santos y cómo más de 15 años en operaciones, administración, servicio al cliente, UX y desarrollo web dan forma al modelo conectado de Alchemize.",
    },
  });

  useEffect(() => {
    ensureJsonLd(
      "person-schema-founder",
      buildPersonSchema({
        name: "Jessy Santos",
        jobTitle: language === "es" ? "Fundadora" : "Founder",
        description:
          language === "es"
            ? "Fundadora de Alchemize Business Services con experiencia en operaciones empresariales, administración, servicio al cliente y presencia digital."
            : "Founder of Alchemize Business Services with experience across business operations, administration, client service, and digital support.",
        url: `${SITE_URL}/resources/meet-the-founder`,
        worksFor: {
          "@type": "Organization",
          name: "Alchemize Business Services",
          url: SITE_URL,
        },
      }),
    );

    return () => {
      document.head
        .querySelector('script[data-schema-id="person-schema-founder"]')
        ?.remove();
    };
  }, [language]);

  const content = {
    en: {
      eyebrow: "Meet the Founder",
      title: "Jessy Santos",
      role: "Founder, Alchemize Business Services LLC",
      summary:
        "Business consultant and founder with more than 15 years of professional experience across operations, administration, client service, digital business, and practical problem-solving.",
      credentials:
        "MBA · 15+ Years of Professional Experience · Business & Digital",
      portraitAlt:
        "Jessy Santos, founder of Alchemize Business Services, seated in a professional setting",
      backgroundEyebrow: "Professional Background",
      backgroundTitle: "Experience built across the work behind a business.",
      backgroundCopy: [
        "Jessy brings more than 15 years of professional experience across business operations, administration, client service, financial responsibilities, and business systems. Her work has meant coordinating responsibilities, managing recurring processes, and creating order around details that affect the larger business. Alchemize is the newer company; that experience was developed before and alongside it.",
        "Her MBA formalized and broadened that practical foundation with a deeper view of how businesses function and where structure makes work more manageable. Later UX and web-development study, and ongoing technical development, built on the professional background already in place.",
      ],
      approachEyebrow: "Why Alchemize Exists",
      approachTitle: "Business problems rarely stay in one lane.",
      approachCopy:
        "The same pattern kept appearing. A client-service problem was also a workflow problem. A digital project exposed a process gap. Administrative work revealed organizational and financial gaps. Alchemize was built around that reality: understand the broader need first, then choose the practical response that fits how the business actually works.",
      capabilitiesEyebrow: "Experience Across the Business",
      capabilitiesTitle: "Four areas of hands-on experience.",
      capabilitiesIntro:
        "Developed in professional roles before and alongside Alchemize, and the reason the company is organized the way it is.",
      capabilities: [
        {
          label: "Business operations & administration",
          title: "Operations & Administration",
          copy: "Process coordination, documentation, administrative systems, financial responsibilities, client service, and day-to-day operational support across functions.",
        },
        {
          label: "Systems, CRM & automation",
          title: "Systems, CRM & Automation",
          copy: "Supporting CRM creation and development and the workflow and process work around it, implementing automation, improving workflows, and supporting adoption of business systems.",
        },
        {
          label: "Internal digital systems",
          title: "Internal Digital Systems",
          copy: "Intranet additions and ongoing maintenance, organizing internal information, and internal digital resources that gave employees access to operational information.",
        },
        {
          label: "Web, e-commerce & digital",
          title: "Web, E-Commerce & Digital",
          copy: "Creating and managing websites, e-commerce website work and e-commerce management, digital content, SEO and visibility, and user experience.",
        },
      ],
      digitalEyebrow: "Business + Digital",
      digitalTitle:
        "Business experience and digital work have developed side by side.",
      digitalCopy: [
        "Jessy's digital experience predates her formal UX and web-development study. It began inside her professional roles: creating and managing websites, working on e-commerce websites and managing e-commerce, and working with online presence and SEO alongside her broader business responsibilities.",
        "UX study through Full Sail University then gave that background a more structured understanding of usability, information architecture, and how people interact with digital systems. Continued web-development work has expanded the technical side.",
        "That is why Alchemize does not treat technology and business operations as separate worlds. A website, CRM, or digital tool should fit how the business actually serves people and moves work forward, and each problem can be considered from both sides.",
      ],
      perspectiveEyebrow: "Perspective",
      perspectiveTitle: "The Perspective Behind Alchemize",
      perspectiveCopy:
        "The Alchemize model reflects that experience: administrative, financial, operational, and digital needs are considered in relation to one another rather than as isolated tasks. Connected does not mean unlimited. Alchemize defines its scope and points work that belongs with another professional in the right direction.",
      quote:
        "Business support works best when it brings clarity, order, and useful momentum to the work that matters most.",
      ctaCopy:
        "If you are weighing a business need, a project, or a digital presence, start by telling us what is going on.",
      ctaPrimary: "Tell Us What You Need",
      ctaSecondary: "Explore Services",
    },
    es: {
      eyebrow: "Conozca a la fundadora",
      title: "Jessy Santos",
      role: "Fundadora, Alchemize Business Services LLC",
      summary:
        "Consultora empresarial y fundadora con más de 15 años de experiencia profesional en operaciones, administración, servicio al cliente, negocios digitales y resolución práctica de problemas.",
      credentials:
        "MBA · Más de 15 años de experiencia profesional · Negocios y digital",
      portraitAlt:
        "Jessy Santos, fundadora de Alchemize Business Services, sentada en un entorno profesional",
      backgroundEyebrow: "Trayectoria Profesional",
      backgroundTitle:
        "Experiencia desarrollada en el trabajo detrás de un negocio.",
      backgroundCopy: [
        "Jessy aporta más de 15 años de experiencia profesional en operaciones empresariales, administración, servicio al cliente, responsabilidades financieras y sistemas empresariales. Su trabajo ha consistido en coordinar responsabilidades, administrar procesos recurrentes y crear orden alrededor de detalles que afectan al negocio en general. Alchemize es la empresa nueva; esa experiencia se desarrolló antes y durante su creación.",
        "Su MBA formalizó y amplió esa base práctica con una visión más profunda de cómo funcionan las empresas y dónde la estructura hace el trabajo más manejable. Los estudios posteriores de UX y desarrollo web, y su desarrollo técnico continuo, se apoyaron en la trayectoria profesional que ya tenía.",
      ],
      approachEyebrow: "Por Qué Existe Alchemize",
      approachTitle:
        "Los problemas empresariales rara vez se quedan en un solo carril.",
      approachCopy:
        "El mismo patrón se repetía. Un problema de servicio al cliente era también un problema de flujo de trabajo. Un proyecto digital dejaba al descubierto una brecha en los procesos. El trabajo administrativo revelaba brechas de organización y financieras. Alchemize se construyó en torno a esa realidad: primero entender la necesidad más amplia y luego elegir la respuesta práctica que se ajuste a cómo realmente funciona el negocio.",
      capabilitiesEyebrow: "Experiencia en Todo el Negocio",
      capabilitiesTitle: "Cuatro áreas de experiencia práctica.",
      capabilitiesIntro:
        "Desarrolladas en funciones profesionales antes y durante Alchemize, y la razón por la que la empresa está organizada como está.",
      capabilities: [
        {
          label: "Operaciones empresariales y administración",
          title: "Operaciones y Administración",
          copy: "Coordinación de procesos, documentación, sistemas administrativos, responsabilidades financieras, servicio al cliente y apoyo operativo diario en distintas funciones.",
        },
        {
          label: "Sistemas, CRM y automatización",
          title: "Sistemas, CRM y Automatización",
          copy: "Apoyo en la creación y el desarrollo de un CRM y en el trabajo de flujos y procesos que lo rodea, implementación de automatización, mejora de flujos de trabajo y apoyo a la adopción de sistemas empresariales.",
        },
        {
          label: "Sistemas digitales internos",
          title: "Sistemas Digitales Internos",
          copy: "Ampliación y mantenimiento continuo de una intranet, organización de la información interna y recursos digitales internos que daban a los empleados acceso a información operativa.",
        },
        {
          label: "Web, comercio electrónico y digital",
          title: "Web, Comercio Electrónico y Digital",
          copy: "Creación y administración de sitios web, trabajo en sitios de comercio electrónico y administración del comercio electrónico, contenido digital, SEO y visibilidad, y experiencia de usuario.",
        },
      ],
      digitalEyebrow: "Negocios + Digital",
      digitalTitle:
        "La experiencia empresarial y el trabajo digital se han desarrollado lado a lado.",
      digitalCopy: [
        "La experiencia digital de Jessy es anterior a sus estudios formales de UX y desarrollo web. Comenzó dentro de sus funciones profesionales: crear y administrar sitios web, trabajar en sitios de comercio electrónico y administrar el comercio electrónico, y trabajar con la presencia en línea y el SEO junto con sus responsabilidades empresariales más amplias.",
        "Los estudios de UX en Full Sail University dieron luego a esa base una comprensión más estructurada de la usabilidad, la arquitectura de la información y la forma en que las personas interactúan con los sistemas digitales. El trabajo continuo en desarrollo web ha ampliado el aspecto técnico.",
        "Por eso Alchemize no trata la tecnología y las operaciones empresariales como mundos separados. Un sitio web, un CRM o una herramienta digital debe ajustarse a cómo el negocio realmente atiende a las personas y hace avanzar el trabajo, y cada problema puede analizarse desde ambos lados.",
      ],
      perspectiveEyebrow: "Perspectiva",
      perspectiveTitle: "La Perspectiva Detrás de Alchemize",
      perspectiveCopy:
        "El modelo de Alchemize refleja esa experiencia: las necesidades administrativas, financieras, operativas y digitales se consideran en relación unas con otras, no como tareas aisladas. Conectado no significa ilimitado. Alchemize define su alcance y orienta hacia el profesional adecuado el trabajo que le corresponde a otro.",
      quote:
        "El apoyo empresarial funciona mejor cuando aporta claridad, orden e impulso útil al trabajo que más importa.",
      ctaCopy:
        "Si está evaluando una necesidad empresarial, un proyecto o una presencia digital, comience contándonos qué está ocurriendo.",
      ctaPrimary: "Cuéntenos qué necesita",
      ctaSecondary: "Explorar Servicios",
    },
  }[language];

  return (
    <article className="founder-profile">
      <section className="founder-hero">
        <div className="content-shell founder-hero-grid">
          <Reveal className="founder-identity">
            <span className="eyebrow">{content.eyebrow}</span>
            <h1>{content.title}</h1>
            <p className="founder-role">{content.role}</p>
            <p className="founder-summary">{content.summary}</p>
            <p className="founder-credential-line">{content.credentials}</p>
            <a
              className="text-link"
              href="https://jessabel.art"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Jessy's Portfolio
            </a>
          </Reveal>

          <Reveal as="figure" className="founder-photo-wrap" delay={80}>
            <img
              src="/assets/images/about/founder-image.png"
              alt={content.portraitAlt}
            />
          </Reveal>
        </div>
      </section>

      <section className="founder-background founder-section">
        <div className="founder-background-watermark" aria-hidden="true">
          Experience
        </div>
        <div className="content-shell founder-narrative-grid">
          <Reveal className="founder-section-heading">
            <span className="section-kicker">{content.backgroundEyebrow}</span>
            <h2>{content.backgroundTitle}</h2>
          </Reveal>
          <Reveal className="founder-copy-column" delay={70}>
            {content.backgroundCopy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Reveal>
          <div className="founder-experience-rule" aria-hidden="true">
            <span>15+</span>
            <span>MBA</span>
            <span>Business + Digital</span>
          </div>
        </div>
      </section>

      <section className="founder-approach founder-section">
        <div className="content-shell founder-approach-grid">
          <Reveal>
            <span className="section-kicker">{content.approachEyebrow}</span>
            <h2>{content.approachTitle}</h2>
          </Reveal>
          <Reveal as="p" delay={70}>
            {content.approachCopy}
          </Reveal>
        </div>
      </section>

      <section className="founder-experience founder-section">
        <div className="content-shell">
          <Reveal className="founder-capabilities-heading">
            <div>
              <span className="section-kicker">
                {content.capabilitiesEyebrow}
              </span>
              <h2>{content.capabilitiesTitle}</h2>
            </div>
            <p>{content.capabilitiesIntro}</p>
          </Reveal>

          <div className="founder-experience-axis" aria-hidden="true">
            <span>Business experience</span>
            <i>A</i>
            <span>Digital experience</span>
          </div>
          <div className="founder-capabilities founder-capabilities--four">
            {content.capabilities.map((item, index) => (
              <Reveal
                as="article"
                className={`founder-capability founder-capability--${index + 1}`}
                delay={(index % 3) * 45}
                key={item.title}
              >
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="founder-digital founder-section">
        <div className="content-shell founder-narrative-grid">
          <Reveal className="founder-section-heading">
            <span className="section-kicker">{content.digitalEyebrow}</span>
            <h2>{content.digitalTitle}</h2>
            <div className="founder-intersection" aria-hidden="true">
              <span>Business</span>
              <i>A</i>
              <span>Digital</span>
            </div>
          </Reveal>
          <div className="founder-copy-column founder-digital-copy">
            {content.digitalCopy.map((paragraph, index) => (
              <Reveal as="p" delay={index * 45} key={paragraph}>
                {paragraph}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="founder-perspective founder-section">
        <div className="founder-perspective-watermark" aria-hidden="true">
          Alchemize
        </div>
        <div className="content-shell founder-perspective-composition">
          <div className="founder-perspective-grid">
            <Reveal>
              <span className="section-kicker">
                {content.perspectiveEyebrow}
              </span>
              <h2>{content.perspectiveTitle}</h2>
            </Reveal>
            <Reveal as="p" delay={70}>
              {content.perspectiveCopy}
            </Reveal>
          </div>
          <Reveal as="blockquote" className="founder-quote">
            <span aria-hidden="true">“</span>
            {content.quote}
            <footer>Jessy Santos</footer>
          </Reveal>

          <Reveal className="founder-cta-wrap" delay={70}>
            <p>{content.ctaCopy}</p>
            <div className="founder-cta-actions">
              <Link className="button button-primary" to="/contact">
                {content.ctaPrimary}
              </Link>
              <Link className="text-link" to="/services">
                {content.ctaSecondary}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}

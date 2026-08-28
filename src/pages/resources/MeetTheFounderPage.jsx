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
        "Learn about Jessy Santos and the business operations, client-service, and digital experience behind Alchemize Business Services.",
    },
    es: {
      title: "Conozca a la fundadora | Experiencia en operaciones y digital",
      description:
        "Conozca a Jessy Santos y la experiencia en operaciones empresariales, atención al cliente y digital detrás de Alchemize Business Services.",
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
        "Jessy brings more than 15 years of professional experience across business operations, administration, client service, organization, financial responsibilities, and practical decision-making. Her work has required balancing priorities, coordinating responsibilities, managing recurring processes, and creating order around details that affect the larger business.",
        "Her MBA strengthened and broadened that established experience with a deeper understanding of how businesses function, how priorities connect, and where thoughtful structure can make work more manageable. It complements the practical judgment developed through years of day-to-day responsibility.",
      ],
      approachEyebrow: "How That Experience Shapes Alchemize",
      approachTitle: "Business problems rarely exist in isolation.",
      approachCopy:
        "A client-service problem may also be a workflow problem. An administrative challenge may point to a systems gap. A website issue may actually begin with unclear communication or service delivery. Alchemize starts by understanding the broader need, then identifies a practical solution that fits how the client or business actually works.",
      capabilitiesEyebrow: "Experience Across the Business",
      capabilitiesTitle: "The work behind clear, capable support.",
      capabilitiesIntro:
        "Alchemize draws on connected experience across the operational and digital responsibilities that shape how a business serves its clients and moves work forward.",
      capabilities: [
        {
          label: "Business Operations",
          title: "Operations & Structure",
          copy: "Workflows, priorities, responsibilities, recurring processes, and practical execution.",
        },
        {
          label: "Administration & Organization",
          title: "Administration & Organization",
          copy: "Information, documents, scheduling, coordination, systems, and recurring responsibilities.",
        },
        {
          label: "Client Service",
          title: "Client Service & Coordination",
          copy: "Client communication, service coordination, problem resolution, follow-through, and relationship management.",
        },
        {
          label: "Financial & Operational Responsibility",
          title: "Financial & Operational Responsibility",
          copy: "Accuracy, accountability, financial details, operational oversight, and practical decision-making.",
        },
        {
          label: "Digital Business & E-Commerce",
          title: "Digital Business & E-Commerce",
          copy: "Websites, e-commerce operations, online presence, SEO considerations, and digital customer experience.",
        },
        {
          label: "UX & Web Development",
          title: "UX & Web Development",
          copy: "User experience, information architecture, responsive design, interface thinking, and technical implementation.",
        },
      ],
      digitalEyebrow: "Business + Digital",
      digitalTitle:
        "Business experience and digital work have developed side by side.",
      digitalCopy: [
        "Jessy’s experience with websites and digital business began well before formal UX or web-development study. Over the years, she created websites, managed e-commerce businesses, worked with online presence, and advised on SEO and digital visibility alongside her broader business responsibilities.",
        "UX study through Full Sail University gave that existing background a more structured understanding of user experience, usability, information architecture, and the ways people interact with digital systems. Continued web-development work then expanded the technical side of that experience.",
        "Together, those disciplines inform Alchemize’s approach to digital work: a website should not be separated from the business behind it. It should communicate clearly, support how services are delivered, and make the experience more useful for both the business and the people it serves.",
      ],
      perspectiveEyebrow: "Perspective",
      perspectiveTitle: "The Perspective Behind Alchemize",
      perspectiveCopy:
        "The Alchemize model comes from understanding how business and personal responsibilities often overlap across systems, deadlines, providers, and practical needs. Jessy’s experience has shaped a connected way of thinking—one that considers administrative, financial, operational, and digital needs in relation to one another rather than as isolated tasks.",
      quote:
        "Business support works best when it brings clarity, order, and useful momentum to the work that matters most.",
      ctaCopy:
        "If you need practical support for a business, project, or digital presence, begin with a conversation about what needs to move forward.",
      ctaPrimary: "Schedule a Consultation",
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
        "Jessy aporta más de 15 años de experiencia profesional en operaciones empresariales, administración, servicio al cliente, organización, responsabilidades financieras y toma de decisiones prácticas. Su trabajo ha requerido equilibrar prioridades, coordinar responsabilidades, administrar procesos recurrentes y crear orden alrededor de detalles que afectan al negocio en general.",
        "Su MBA fortaleció y amplió esa experiencia ya establecida con una comprensión más profunda de cómo funcionan las empresas, cómo se conectan las prioridades y dónde una estructura bien pensada puede hacer el trabajo más manejable. Complementa el criterio práctico desarrollado durante años de responsabilidad diaria.",
      ],
      approachEyebrow: "Cómo Esa Experiencia Da Forma a Alchemize",
      approachTitle:
        "Los problemas empresariales rara vez existen de forma aislada.",
      approachCopy:
        "Un problema de servicio al cliente también puede ser un problema de flujo de trabajo. Un desafío administrativo puede señalar una brecha en los sistemas. Un problema con un sitio web puede comenzar realmente con una comunicación o una prestación de servicios poco clara. Alchemize comienza por entender la necesidad más amplia y luego identifica una solución práctica que se adapte a cómo realmente trabaja el cliente o la empresa.",
      capabilitiesEyebrow: "Experiencia en Todo el Negocio",
      capabilitiesTitle: "El trabajo detrás de un apoyo claro y capaz.",
      capabilitiesIntro:
        "Alchemize se apoya en experiencia conectada a través de las responsabilidades operativas y digitales que determinan cómo una empresa atiende a sus clientes y hace avanzar el trabajo.",
      capabilities: [
        {
          label: "Operaciones Empresariales",
          title: "Operaciones y Estructura",
          copy: "Flujos de trabajo, prioridades, responsabilidades, procesos recurrentes y ejecución práctica.",
        },
        {
          label: "Administración y Organización",
          title: "Administración y Organización",
          copy: "Información, documentos, programación, coordinación, sistemas y responsabilidades recurrentes.",
        },
        {
          label: "Servicio al Cliente",
          title: "Servicio al Cliente y Coordinación",
          copy: "Comunicación con clientes, coordinación de servicios, resolución de problemas, seguimiento y gestión de relaciones.",
        },
        {
          label: "Responsabilidad Financiera y Operativa",
          title: "Responsabilidad Financiera y Operativa",
          copy: "Precisión, responsabilidad, detalles financieros, supervisión operativa y toma de decisiones prácticas.",
        },
        {
          label: "Negocios Digitales y Comercio Electrónico",
          title: "Negocios Digitales y Comercio Electrónico",
          copy: "Sitios web, operaciones de comercio electrónico, presencia en línea, consideraciones de SEO y experiencia digital del cliente.",
        },
        {
          label: "UX y Desarrollo Web",
          title: "UX y Desarrollo Web",
          copy: "Experiencia de usuario, arquitectura de la información, diseño responsivo, pensamiento de interfaz e implementación técnica.",
        },
      ],
      digitalEyebrow: "Negocios + Digital",
      digitalTitle:
        "La experiencia empresarial y el trabajo digital se han desarrollado lado a lado.",
      digitalCopy: [
        "La experiencia de Jessy con sitios web y negocios digitales comenzó mucho antes de sus estudios formales de UX o desarrollo web. A lo largo de los años, creó sitios web, administró negocios de comercio electrónico, trabajó con presencia en línea y asesoró sobre SEO y visibilidad digital junto con sus responsabilidades empresariales más amplias.",
        "Los estudios de UX a través de Full Sail University aportaron a esa experiencia una comprensión más estructurada de la experiencia de usuario, la usabilidad, la arquitectura de la información y la forma en que las personas interactúan con los sistemas digitales. El trabajo continuo en desarrollo web amplió luego el aspecto técnico de esa experiencia.",
        "En conjunto, esas disciplinas orientan el enfoque de Alchemize hacia el trabajo digital: un sitio web no debe estar separado del negocio que lo sostiene. Debe comunicar con claridad, apoyar la prestación de servicios y hacer la experiencia más útil tanto para la empresa como para las personas a las que sirve.",
      ],
      perspectiveEyebrow: "Perspectiva",
      perspectiveTitle: "La Perspectiva Detrás de Alchemize",
      perspectiveCopy:
        "El modelo de Alchemize surge de comprender cómo las responsabilidades empresariales y personales suelen superponerse entre sistemas, plazos, proveedores y necesidades prácticas. La experiencia de Jessy ha formado una manera conectada de pensar que considera las necesidades administrativas, financieras, operativas y digitales en relación unas con otras, en lugar de tratarlas como tareas aisladas.",
      quote:
        "El apoyo empresarial funciona mejor cuando aporta claridad, orden e impulso útil al trabajo que más importa.",
      ctaCopy:
        "Si necesita apoyo práctico para un negocio, proyecto o presencia digital, comience con una conversación sobre lo que necesita avanzar.",
      ctaPrimary: "Programar una Consulta",
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

          <div className="founder-capabilities">
            {content.capabilities.map((item, index) => (
              <Reveal
                as="article"
                className="founder-capability"
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
        <div className="content-shell founder-perspective-grid">
          <Reveal>
            <span className="section-kicker">{content.perspectiveEyebrow}</span>
            <h2>{content.perspectiveTitle}</h2>
          </Reveal>
          <Reveal as="p" delay={70}>
            {content.perspectiveCopy}
          </Reveal>
        </div>
      </section>

      <section className="founder-closing founder-section">
        <div className="content-shell">
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

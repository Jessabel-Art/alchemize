// WEB & DIGITAL: commercial detail (English and Spanish)
//
// The capability stack behind the Web & Digital page: what each service is, what
// a business receives, and where it stops, organised by the lifecycle
// Build -> Maintain -> Optimize -> Automate. The three groups match
// webDigitalSummary.capabilities so the Services page listing and this page
// cannot drift apart.
//
// PRICING POLICY: no Web & Digital price of any kind is published (packages,
// maintenance plans, SEO, Google Business Profile, automation, software, or
// any internal rate). Projects are scoped by conversation; the CTAs
// route into the existing contact form with `service=business-digital`.

export const webDigitalDetail = {
  en: {
    metaDescription:
      "Website design, maintenance, SEO, Google Business Profile, automation, and custom web applications for small businesses, scoped around how the business operates.",
    heroCopy:
      "Alchemize builds and maintains professional websites and the systems around them: local search and Google Business Profile, forms and scheduling, automation, and custom applications when a website alone is not enough. Every project is scoped around how your business actually works.",
    lifecycle: {
      eyebrow: "How the services relate",
      title: "Build. Maintain. Optimize. Automate.",
      intro:
        "These stages describe how the services fit together, not steps everyone must take. Start where the business is.",
      stages: [
        [
          "Build",
          "A website or custom system designed around how the business works.",
        ],
        ["Maintain", "Keep it current, secure, and working after launch."],
        [
          "Optimize",
          "Improve how it is found and how well it turns visits into inquiries.",
        ],
        [
          "Automate",
          "Connect it to the tools and workflows behind the scenes.",
        ],
      ],
    },
    panelLabels: { projects: "Common projects", includes: "What you receive" },
    // one array of panels per solution group, in group order
    panels: [
      [
        {
          stage: "Build",
          name: "Website design & development",
          lead: "Responsive, custom business websites designed to explain what you do, earn trust, and turn visits into inquiries.",
          projects: [
            "Landing-page websites",
            "Small-business websites",
            "Professional & portfolio websites",
            "Redesigns & refreshes",
          ],
          points: [
            "Discovery, site architecture, and clear navigation",
            "Service-page structure that explains each offer",
            "Lead and contact forms with conversion-oriented calls to action",
            "SEO foundation, with schema and internal linking where appropriate",
            "Analytics that show what is working",
            "Accessibility considerations, plus performance, mobile, and browser testing",
            "Domain, SSL, and launch support",
            "Business email & domain configuration",
            "Scheduling and selected payment integrations when the project needs them",
          ],
          note: "More complex sites, such as multiple locations, larger catalogs, memberships, or migrations, are scoped as custom projects.",
        },
        {
          stage: "Build",
          name: "Custom web applications & software",
          lead: "When a website alone is not enough, Alchemize can scope more advanced digital solutions.",
          points: [
            "Client and customer portals",
            "Dashboards and reporting views",
            "Authentication and user accounts",
            "Databases",
            "Payments",
            "APIs and integrations",
            "Custom workflows and software",
          ],
          note: "These projects begin with discovery, so the deliverables, integrations, and timeline are defined before a proposal.",
        },
      ],
      [
        {
          stage: "Optimize",
          name: "SEO & local visibility",
          lead: "Search work comes in stages, so you can start with the question you actually have.",
          points: [
            "SEO audit: technical fundamentals, metadata, indexing, schema, and a prioritized report",
            "SEO implementation: agreed corrections to your core pages",
            "Local SEO foundation: local research, page optimization, local schema, business name, address, and phone consistency, Search Console, and citation and competitor review",
            "Ongoing SEO: monitoring, technical checks, and steady page improvements, with reporting",
            "Growth-oriented SEO: broader keywords, content opportunities, and competitor and content-gap analysis",
          ],
          note: "Alchemize does not guarantee rankings, traffic, leads, or revenue.",
        },
        {
          stage: "Optimize",
          name: "Google Business Profile",
          lead: "Set up or refine the profile customers see in local search and maps.",
          points: [
            "Google Business Profile setup",
            "Profile optimization",
            "Categories and services",
            "Business description",
            "Hours and service areas",
            "Photo and content guidance",
            "Maintenance guidance",
          ],
          note: "Initial setup is separate from ongoing profile management and local SEO.",
        },
      ],
      [
        {
          stage: "Maintain",
          name: "Website maintenance & management",
          lead: "Building a website and keeping one healthy are different jobs. Maintenance covers the second.",
          points: [
            "Routine updates, and backups where supported",
            "Security, uptime, form, link, and performance checks",
            "Troubleshooting",
            "Content, layout, form, and call-to-action changes, depending on scope",
            "Analytics and performance review",
            "Conversion improvements",
            "Light SEO on existing content, where appropriate",
          ],
          note: "Sites Alchemize did not build start with a review of the platform, hosting, plugins, security, backups, and access.",
        },
        {
          stage: "Automate",
          name: "Digital automation & integrations",
          lead: "Connect repetitive work so information moves between tools without retyping.",
          points: [
            "Connecting repetitive business processes",
            "Notifications and routing",
            "Data mapping between apps",
            "CRM workflows",
            "Forms that feed your systems",
            "API and webhook connections, where appropriate",
            "Customer-facing automation",
            "Advanced integrations and custom workflows, scoped after discovery",
          ],
          note: "Third-party platform, connector, and API-usage costs are separate. Workflows that touch sensitive information are reviewed for security and privacy before implementation.",
        },
      ],
    ],
    after: {
      intro:
        "A website is not necessarily finished when it launches. Maintenance, search visibility, and automation are separate services you can add as the business evolves.",
      items: [
        "Routine updates and content changes",
        "Backups, security, form, and link checks",
        "Search visibility and Google Business Profile work",
        "Analytics review and conversion improvements",
        "Automation of repeat workflows",
        "Domain, DNS, and business email support",
      ],
    },
    finalCopy:
      "You do not need to know whether you need a new website, a redesign, SEO work, automation, or a broader digital setup before contacting us. Tell us what you need and what you are trying to accomplish, and we will recommend a starting point and a proposal.",
    faq: {
      eyebrow: "Questions",
      title: "Web & digital questions",
      items: [
        {
          q: "How much does a website or digital project cost?",
          a: "Web and digital work is scoped from your goals, pages, features, and integrations, so Alchemize quotes each project after a conversation. Tell us what you need and we will recommend a starting point and a proposal.",
        },
        {
          q: "What is the difference between building a website and maintaining one?",
          a: "Building creates the site. Maintenance keeps it healthy afterward: updates, backups where supported, security, form, link, and performance checks, and changes to content, layout, and calls to action.",
        },
        {
          q: "Can you maintain a website you did not build?",
          a: "Yes. Sites Alchemize did not build start with a review of the platform, hosting, plugins, security, backups, and access, so maintenance begins from a known state. Anything the review finds that needs fixing is scoped separately.",
        },
        {
          q: "Do you guarantee search rankings?",
          a: "No. Alchemize does not guarantee rankings, traffic, leads, or revenue. SEO work improves the fundamentals search engines rely on, and results depend on many factors outside anyone's control.",
        },
        {
          q: "What is the difference between SEO and a Google Business Profile?",
          a: "A Google Business Profile is the listing customers see in local search and maps. SEO covers how your website is found. Profile setup is a one-time optimization; ongoing profile management and local SEO are separate.",
        },
        {
          q: "What can be automated?",
          a: "Repetitive work that moves information between tools: routing form submissions into your CRM, sending notifications, mapping data between apps, and connecting API or webhook workflows. More advanced integrations are scoped after discovery.",
        },
        {
          q: "Do you build custom software?",
          a: "Alchemize can scope portals, dashboards, authentication, databases, payments, APIs, and custom workflows. These projects begin with discovery so the deliverables are defined before a proposal.",
        },
        {
          q: "What happens after I submit a request?",
          a: "Alchemize reviews what you describe, asks the questions needed to understand the project, and recommends a starting point and next step before any work begins.",
        },
      ],
    },
  },

  es: {
    metaDescription:
      "Diseño de sitios web, mantenimiento, SEO, Google Business Profile, automatización y aplicaciones web a la medida para pequeñas empresas, según cómo opera el negocio.",
    heroCopy:
      "Alchemize construye y mantiene sitios web profesionales y los sistemas que los rodean: búsqueda local y Google Business Profile, formularios y programación de citas, automatización y aplicaciones a la medida cuando un sitio web no basta. Cada proyecto se define según cómo funciona realmente su negocio.",
    lifecycle: {
      eyebrow: "Cómo se relacionan los servicios",
      title: "Construir. Mantener. Optimizar. Automatizar.",
      intro:
        "Estas etapas describen cómo encajan los servicios, no pasos que todos deban dar. Empiece donde está el negocio.",
      stages: [
        [
          "Construir",
          "Un sitio web o un sistema a la medida diseñado según cómo funciona el negocio.",
        ],
        [
          "Mantener",
          "Mantenerlo al día, seguro y funcionando después del lanzamiento.",
        ],
        [
          "Optimizar",
          "Mejorar cómo se encuentra y qué tan bien convierte las visitas en consultas.",
        ],
        [
          "Automatizar",
          "Conectarlo con las herramientas y los flujos de trabajo detrás de escena.",
        ],
      ],
    },
    panelLabels: {
      projects: "Proyectos frecuentes",
      includes: "Lo que recibe",
    },
    panels: [
      [
        {
          stage: "Construir",
          name: "Diseño y desarrollo de sitios web",
          lead: "Sitios web empresariales a la medida y adaptables a cualquier pantalla, diseñados para explicar lo que usted hace, generar confianza y convertir visitas en consultas.",
          projects: [
            "Sitios de página de destino",
            "Sitios para pequeñas empresas",
            "Sitios profesionales y de portafolio",
            "Rediseños y renovaciones",
          ],
          points: [
            "Descubrimiento, arquitectura del sitio y navegación clara",
            "Estructura de páginas de servicio que explica cada oferta",
            "Formularios de contacto y de captación con llamadas a la acción orientadas a la conversión",
            "Base de SEO, con datos estructurados y enlaces internos donde corresponda",
            "Analíticas que muestran qué funciona",
            "Consideraciones de accesibilidad, además de pruebas de rendimiento, móviles y de navegadores",
            "Dominio, SSL y apoyo en el lanzamiento",
            "Configuración de correo empresarial y dominio",
            "Programación de citas e integraciones de pago selectas cuando el proyecto lo necesite",
          ],
          note: "Los sitios más complejos, como los de varias sedes, catálogos grandes, membresías o migraciones, se definen como proyectos a la medida.",
        },
        {
          stage: "Construir",
          name: "Aplicaciones web y software a la medida",
          lead: "Cuando un sitio web no basta, Alchemize puede definir soluciones digitales más avanzadas.",
          points: [
            "Portales para clientes y usuarios",
            "Paneles de control y vistas de reportes",
            "Autenticación y cuentas de usuario",
            "Bases de datos",
            "Pagos",
            "APIs e integraciones",
            "Flujos de trabajo y software a la medida",
          ],
          note: "Estos proyectos comienzan con una etapa de descubrimiento, para definir los entregables, las integraciones y el calendario antes de una propuesta.",
        },
      ],
      [
        {
          stage: "Optimizar",
          name: "SEO y visibilidad local",
          lead: "El trabajo de búsqueda se ofrece por etapas, para que pueda empezar con la pregunta que realmente tiene.",
          points: [
            "Auditoría de SEO: aspectos técnicos, metadatos, indexación, datos estructurados y un informe priorizado",
            "Implementación de SEO: correcciones acordadas en sus páginas principales",
            "Base de SEO local: investigación local, optimización de páginas, datos estructurados locales, consistencia del nombre, la dirección y el teléfono del negocio, Search Console y revisión de citas y de la competencia",
            "SEO continuo: monitoreo, revisiones técnicas y mejoras constantes de páginas, con reportes",
            "SEO orientado al crecimiento: palabras clave más amplias, oportunidades de contenido y análisis de la competencia y de brechas de contenido",
          ],
          note: "Alchemize no garantiza posiciones, tráfico, clientes potenciales ni ingresos.",
        },
        {
          stage: "Optimizar",
          name: "Google Business Profile",
          lead: "Configure o mejore el perfil que sus clientes ven en la búsqueda local y en los mapas.",
          points: [
            "Configuración de Google Business Profile",
            "Optimización del perfil",
            "Categorías y servicios",
            "Descripción del negocio",
            "Horarios y áreas de servicio",
            "Orientación sobre fotos y contenido",
            "Orientación para el mantenimiento",
          ],
          note: "La configuración inicial es aparte de la gestión continua del perfil y del SEO local.",
        },
      ],
      [
        {
          stage: "Mantener",
          name: "Mantenimiento y gestión del sitio web",
          lead: "Construir un sitio web y mantenerlo sano son trabajos distintos. El mantenimiento cubre el segundo.",
          points: [
            "Actualizaciones de rutina y copias de seguridad donde sea posible",
            "Revisiones de seguridad, disponibilidad, formularios, enlaces y rendimiento",
            "Solución de problemas",
            "Cambios de contenido, diseño, formularios y llamadas a la acción, según el alcance",
            "Revisión de analíticas y rendimiento",
            "Mejoras de conversión",
            "SEO ligero sobre el contenido existente, cuando corresponda",
          ],
          note: "Los sitios que Alchemize no construyó comienzan con una revisión de la plataforma, el alojamiento, los complementos, la seguridad, las copias de seguridad y los accesos.",
        },
        {
          stage: "Automatizar",
          name: "Automatización digital e integraciones",
          lead: "Conecte el trabajo repetitivo para que la información pase de una herramienta a otra sin volver a escribirla.",
          points: [
            "Conexión de procesos empresariales repetitivos",
            "Notificaciones y enrutamiento",
            "Mapeo de datos entre aplicaciones",
            "Flujos de trabajo de CRM",
            "Formularios que alimentan sus sistemas",
            "Conexiones por API y webhook, cuando corresponda",
            "Automatización orientada al cliente",
            "Integraciones avanzadas y flujos a la medida, definidos tras el descubrimiento",
          ],
          note: "Los costos de plataformas de terceros, conectores y uso de API se cobran aparte. Los flujos que manejan información sensible se revisan en cuanto a seguridad y privacidad antes de implementarse.",
        },
      ],
    ],
    after: {
      intro:
        "Un sitio web no necesariamente está terminado cuando se lanza. El mantenimiento, la visibilidad en búsquedas y la automatización son servicios aparte que puede añadir a medida que el negocio evoluciona.",
      items: [
        "Actualizaciones de rutina y cambios de contenido",
        "Copias de seguridad y revisiones de seguridad, formularios y enlaces",
        "Trabajo de visibilidad en búsquedas y de Google Business Profile",
        "Revisión de analíticas y mejoras de conversión",
        "Automatización de flujos de trabajo repetitivos",
        "Apoyo con dominio, DNS y correo empresarial",
      ],
    },
    finalCopy:
      "No necesita saber si requiere un sitio web nuevo, un rediseño, trabajo de SEO, automatización o una configuración digital más amplia antes de contactarnos. Cuéntenos qué necesita y qué desea lograr, y le recomendaremos un punto de partida y una propuesta.",
    faq: {
      eyebrow: "Preguntas",
      title: "Preguntas sobre web y soluciones digitales",
      items: [
        {
          q: "¿Cuánto cuesta un sitio web o un proyecto digital?",
          a: "El trabajo web y digital se define según sus metas, páginas, funciones e integraciones, por lo que Alchemize cotiza cada proyecto después de conversar. Cuéntenos qué necesita y le recomendaremos un punto de partida y una propuesta.",
        },
        {
          q: "¿Cuál es la diferencia entre construir un sitio web y mantenerlo?",
          a: "Construir crea el sitio. El mantenimiento lo mantiene sano después: actualizaciones, copias de seguridad donde sea posible, revisiones de seguridad, formularios, enlaces y rendimiento, y cambios de contenido, diseño y llamadas a la acción.",
        },
        {
          q: "¿Pueden mantener un sitio web que ustedes no construyeron?",
          a: "Sí. Los sitios que Alchemize no construyó comienzan con una revisión de la plataforma, el alojamiento, los complementos, la seguridad, las copias de seguridad y los accesos, para que el mantenimiento parta de un estado conocido. Lo que la revisión encuentre y deba corregirse se define por separado.",
        },
        {
          q: "¿Garantizan posiciones en los buscadores?",
          a: "No. Alchemize no garantiza posiciones, tráfico, clientes potenciales ni ingresos. El trabajo de SEO mejora los fundamentos en los que se apoyan los buscadores, y los resultados dependen de muchos factores que nadie controla.",
        },
        {
          q: "¿Cuál es la diferencia entre SEO y un Google Business Profile?",
          a: "Un Google Business Profile es el perfil que ven los clientes en la búsqueda local y en los mapas. El SEO se ocupa de cómo se encuentra su sitio web. La configuración del perfil es una optimización única; la gestión continua del perfil y el SEO local son aparte.",
        },
        {
          q: "¿Qué se puede automatizar?",
          a: "El trabajo repetitivo que mueve información entre herramientas: enviar los formularios a su CRM, mandar notificaciones, mapear datos entre aplicaciones y conectar flujos por API o webhook. Las integraciones más avanzadas se definen tras el descubrimiento.",
        },
        {
          q: "¿Construyen software a la medida?",
          a: "Alchemize puede definir portales, paneles de control, autenticación, bases de datos, pagos, APIs y flujos de trabajo a la medida. Estos proyectos comienzan con una etapa de descubrimiento para definir los entregables antes de una propuesta.",
        },
        {
          q: "¿Qué pasa después de enviar una solicitud?",
          a: "Alchemize revisa lo que usted describe, hace las preguntas necesarias para entender el proyecto y recomienda un punto de partida y un siguiente paso antes de comenzar cualquier trabajo.",
        },
      ],
    },
  },
};

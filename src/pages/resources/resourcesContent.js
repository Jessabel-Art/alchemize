export const resourcesUi = {
  en: {
    metadata: {
      title: "Resources | Alchemize Business Services",
      description:
        "Practical guides and checklists for tax preparation, Medicare education, business formation, operations, records, and administration.",
    },
    directory: {
      eyebrow: "Understand · Prepare · Organize · Act",
      title: "Resources by responsibility.",
      text: "Browse practical guidance by the responsibility in front of you.",
      filters: "Filter resources by category",
      resource: "resource",
      resources: "resources",
      read: "Read",
      updated: "Updated",
      action: "Read resource",
    },
    article: {
      back: "Back to Resources",
      updated: "Updated",
      reviewed: "Reviewed for",
      utilities: "Article utilities",
      print: "Print",
      download: "Download PDF (English)",
      intro:
        "This guide is designed to help you understand the responsibility, organize useful information, and identify questions that require current official guidance or professional review.",
      important: "Important",
      next: "What to do next",
      nextTitle: "Turn the guide into a useful next step.",
      serviceLink: "Need help organizing what comes next? Explore Services",
      notice: "Educational notice",
      continue: "Continue learning",
      related: "Related resources",
      rail: "Guide navigation and official resources",
      inGuide: "In this guide",
      official: "Official resources",
      external: "External government resource",
      relatedGuides: "Related guides",
    },
  },
  es: {
    metadata: {
      title: "Recursos | Alchemize Business Services",
      description:
        "Guías y listas prácticas sobre impuestos, educación de Medicare, formación empresarial, operaciones, registros y administración.",
    },
    directory: {
      eyebrow: "Comprender · Preparar · Organizar · Actuar",
      title: "Recursos por responsabilidad.",
      text: "Explore orientación práctica según la responsabilidad que tiene por delante.",
      filters: "Filtrar recursos por categoría",
      resource: "recurso",
      resources: "recursos",
      read: "Leer",
      updated: "Actualizado",
      action: "Leer el recurso",
    },
    article: {
      back: "Volver a Recursos",
      updated: "Actualizado",
      reviewed: "Revisado para",
      utilities: "Opciones del artículo",
      print: "Imprimir",
      download: "Descargar PDF (en inglés)",
      intro:
        "Esta guía está diseñada para ayudarle a comprender la responsabilidad, organizar información útil e identificar preguntas que requieren orientación oficial vigente o revisión profesional.",
      important: "Importante",
      next: "Qué hacer después",
      nextTitle: "Convierta la guía en un próximo paso útil.",
      serviceLink:
        "¿Necesita ayuda para organizar lo que sigue? Explore los servicios",
      notice: "Aviso educativo",
      continue: "Continúe aprendiendo",
      related: "Recursos relacionados",
      rail: "Navegación de la guía y recursos oficiales",
      inGuide: "En esta guía",
      official: "Recursos oficiales",
      external: "Recurso gubernamental externo",
      relatedGuides: "Guías relacionadas",
    },
  },
};

export const featuredContent = {
  en: {
    label: "Featured resources",
    controls: "Featured resource controls",
    previous: "Previous",
    next: "Next",
    read: "Read the guide",
    slides: [
      {
        slug: "preparing-for-tax-season",
        label: "Featured guide · Taxes",
        summary:
          "A practical framework for organizing tax records before filing begins, identifying missing information, and reducing the last-minute search for documents.",
        panelLabel: "A calmer preparation sequence",
        panelItems: [
          [
            "Gather",
            "Collect income, expense, identity, and supporting records.",
          ],
          [
            "Reconcile",
            "Check for missing documents and unanswered questions.",
          ],
          [
            "Prepare",
            "Organize what your tax preparer will need before filing.",
          ],
        ],
        utility: {
          label: "Print checklist",
          href: "/resources/preparing-for-tax-season?print=1",
        },
      },
      {
        slug: "medicare-basics-coverage-choices",
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
          label: "View official source",
          href: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options",
          external: true,
        },
      },
      {
        slug: "your-first-year-in-business",
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
    ],
  },
  es: {
    label: "Recursos destacados",
    controls: "Controles de recursos destacados",
    previous: "Anterior",
    next: "Siguiente",
    read: "Leer la guía",
    slides: [
      {
        slug: "preparing-for-tax-season",
        label: "Guía destacada · Impuestos",
        summary:
          "Un marco práctico para organizar registros tributarios, identificar información faltante y reducir la búsqueda de documentos a última hora.",
        panelLabel: "Una preparación más tranquila",
        panelItems: [
          [
            "Reunir",
            "Reúna ingresos, gastos, identidad y documentos de respaldo.",
          ],
          ["Conciliar", "Revise documentos faltantes y preguntas pendientes."],
          [
            "Preparar",
            "Organice lo que necesitará la persona que prepara su declaración.",
          ],
        ],
        utility: {
          label: "Imprimir la lista",
          href: "/resources/preparing-for-tax-season?print=1",
        },
      },
      {
        slug: "medicare-basics-coverage-choices",
        label: "Guía destacada · Medicare y seguros",
        summary:
          "Un punto de partida claro para comprender las Partes A, B, C y D, las diferencias entre Medicare Original y Medicare Advantage y las preguntas importantes al comparar cobertura.",
        panelLabel: "Comience con la visión de cobertura",
        panelItems: [
          [
            "Comprender las partes",
            "Vea cómo se relacionan las partes básicas.",
          ],
          ["Comparar cobertura", "Revise los dos caminos principales."],
          [
            "Revisar la inscripción",
            "Confirme las fechas en fuentes oficiales vigentes.",
          ],
        ],
        utility: {
          label: "Ver la fuente oficial",
          href: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options",
          external: true,
        },
      },
      {
        slug: "your-first-year-in-business",
        label: "Guía destacada · Cómo iniciar un negocio",
        summary:
          "El primer año crea los registros, fechas y hábitos administrativos que el negocio utilizará después. Construya un sistema antes de que la información se disperse.",
        panelLabel: "Bases que conviene construir temprano",
        panelItems: [
          ["Registros", "Dé a la información importante un lugar confiable."],
          ["Fechas", "Controle obligaciones antes de que sean urgentes."],
          ["Procesos", "Documente el trabajo que se repetirá."],
        ],
      },
      {
        slug: "business-needs-a-process",
        label: "Marco destacado · Operaciones empresariales",
        summary:
          "Cuando el mismo problema vuelve, el negocio puede necesitar un proceso repetible, un responsable claro y un lugar confiable para la información.",
        panelLabel: "Construya un camino repetible",
        panelItems: [
          ["Inicio", "Defina qué activa el trabajo."],
          ["Responsable", "Asigne quién lo hará avanzar."],
          ["Pasos", "Defina acciones e información requeridas."],
          ["Revisión", "Mejore lo que produce fricción repetidamente."],
        ],
      },
    ],
  },
};

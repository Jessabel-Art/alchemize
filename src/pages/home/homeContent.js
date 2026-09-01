import {
  DOWNLOADABLE_RESOURCE_IDS,
  getDownloadableResource,
} from "../resources/downloadableResources.js";

export const homeContent = {
  en: {
    metadata: {
      title: "Alchemize Business Services | Modern Business & Digital Support",
      description:
        "A modern business-services partner for individuals, entrepreneurs, and small businesses, connecting operations, administration, financial organization, documents, and digital capability.",
    },
    hero: {
      eyebrow: "Alchemize Business Services",
      titleStart: "Transform Complexity Into",
      titleEmphasis: "Opportunity.",
      descriptor: "Your Tech-Savvy Business Partner",
      copy: "Alchemize is a modern business-services partner for individuals, entrepreneurs, and small businesses. We handle the operational, administrative, financial, document, and digital work behind the next move.",
      difference:
        "Practical business support and technology-minded problem solving stay connected, so clients do not have to coordinate a different provider for every related responsibility.",
      primary: "Schedule a Consultation",
      secondary: "Explore Services",
      alt: "Professional reviewing organized business materials at a desk",
      caption: "Assess. Optimize. Implement.",
    },
    paths: {
      eyebrow: "Start with what you need",
      title: "Support for you. Structure for your business.",
      individualLabel: "For me",
      individualTitle: "Individual Services",
      individualCopy:
        "Personal and business responsibilities often overlap. Tax preparation, documents, and practical organization can become part of a business decision—or the first step toward one.",
      individualLink: "Explore individual services",
      businessLabel: "Entrepreneurs · Freelancers · Businesses",
      businessTitle: "Business Services",
      businessCopy:
        "For owners who need the operation, records, administration, and digital presence to work together.",
      businessLink: "Explore business services",
    },
    capabilities: [
      ["Business Consulting", "/services/businesses/advisory-optimization"],
      ["Business Operations", "/services/businesses/operations-implementation"],
      ["Web & Digital Solutions", "/web-digital"],
      ["Business Readiness", "/services/businesses/readiness-growth"],
      ["Bookkeeping", "/services/businesses/bookkeeping-financial-reporting"],
      ["Payroll", "/services/businesses/payroll-processing"],
      ["Business Tax", "/services/businesses/business-tax-support"],
    ],
    connect: {
      eyebrow: "Your responsibilities connect",
      title: "Many important business and personal decisions overlap.",
      copy: "A business question can affect tax preparation. A new opportunity can expose an operational gap. A better recommendation may still need someone to help put the solution in place.",
      aria: "Alchemize process",
      stages: [
        ["Assess", "Assess what is happening."],
        ["Identify", "Identify what needs to improve."],
        ["Implement", "Implement practical next steps."],
      ],
    },
    business: {
      eyebrow: "Business capabilities",
      title:
        "More than recommendations. Support for putting the work into place.",
      copy: "Alchemize can identify the issue, organize the information, recommend the next move, and complete practical implementation when it falls within our scope. When it does not, we make the boundary clear and point to the kind of qualified professional the work requires.",
      ariaPrefix: "Explore",
    },
    trust: {
      alt: "Jessy Santos working with business documents at a desk",
      eyebrow: "Clear guidance. Practical support.",
      title: "Professional does not have to mean impersonal.",
      copy: "Alchemize combines organized processes and professional standards with clear, direct communication.",
      link: "Why Alchemize",
    },
    resources: {
      eyebrow: "Prepare with confidence",
      title: "Clear information for the decisions in front of you.",
      button: "Explore All Resources",
      pdfLabel: "In development",
      items: [
        [
          "Taxes",
          getDownloadableResource(DOWNLOADABLE_RESOURCE_IDS.individualTax),
        ],
        [
          "Business",
          getDownloadableResource(DOWNLOADABLE_RESOURCE_IDS.startup),
        ],
        [
          "Getting started",
          getDownloadableResource(DOWNLOADABLE_RESOURCE_IDS.consultation),
        ],
      ],
    },
    final: {
      eyebrow: "Start with the need",
      title:
        "You do not need to identify the exact service before reaching out.",
      copy: "Tell us what you are trying to accomplish, improve, or resolve. We will help identify the appropriate next step.",
      button: "Schedule a Consultation",
      spanish: "We speak Spanish. / Se habla español.",
    },
  },
  es: {
    metadata: {
      title:
        "Alchemize Business Services | Asesoría empresarial y apoyo operativo en español",
      description:
        "Un socio moderno de servicios empresariales para personas, emprendedores y pequeñas empresas que conecta operaciones, administración, organización financiera, documentos y capacidad digital.",
    },
    hero: {
      eyebrow: "Alchemize Business Services",
      titleStart: "Transformamos la complejidad en",
      titleEmphasis: "oportunidad.",
      descriptor: "Su socio empresarial con dominio digital",
      copy: "Alchemize es un socio moderno de servicios empresariales para personas, emprendedores y pequeñas empresas. Atendemos el trabajo operativo, administrativo, financiero, documental y digital detrás del próximo paso.",
      difference:
        "El apoyo empresarial práctico y la resolución de problemas con mentalidad tecnológica permanecen conectados, para que el cliente no tenga que coordinar un proveedor distinto para cada responsabilidad relacionada.",
      primary: "Programar una consulta",
      secondary: "Explorar servicios",
      alt: "Profesional revisando materiales empresariales organizados en un escritorio",
      caption: "Evaluar. Optimizar. Implementar.",
    },
    paths: {
      eyebrow: "Comience con lo que necesita",
      title: "Apoyo para usted. Estructura para su empresa.",
      individualLabel: "Para mí",
      individualTitle: "Servicios para personas",
      individualCopy:
        "Las responsabilidades personales y empresariales suelen superponerse. Los impuestos, los documentos y la organización práctica pueden formar parte de una decisión empresarial o ser su primer paso.",
      individualLink: "Explorar servicios para personas",
      businessLabel: "Emprendedores · Profesionales independientes · Empresas",
      businessTitle: "Servicios para empresas",
      businessCopy:
        "Para propietarios que necesitan que la operación, los registros, la administración y la presencia digital funcionen de manera coordinada.",
      businessLink: "Explorar servicios para empresas",
    },
    capabilities: [
      ["Asesoría y optimización", "/services/businesses/advisory-optimization"],
      [
        "Operaciones e implementación",
        "/services/businesses/operations-implementation",
      ],
      ["Web y soluciones digitales", "/web-digital"],
      [
        "Preparación y crecimiento empresarial",
        "/services/businesses/readiness-growth",
      ],
      [
        "Contabilidad y reportes financieros",
        "/services/businesses/bookkeeping-financial-reporting",
      ],
      ["Procesamiento de nómina", "/services/businesses/payroll-processing"],
      [
        "Apoyo tributario para empresas",
        "/services/businesses/business-tax-support",
      ],
    ],
    connect: {
      eyebrow: "Sus responsabilidades están conectadas",
      title:
        "Muchas decisiones empresariales y personales importantes se relacionan entre sí.",
      copy: "Una pregunta empresarial puede afectar la preparación de impuestos. Una nueva oportunidad puede revelar una deficiencia operativa. Incluso una buena recomendación puede requerir a alguien que ayude a poner la solución en práctica.",
      aria: "Proceso de Alchemize",
      stages: [
        ["Evaluar", "Comprender lo que está ocurriendo."],
        ["Identificar", "Determinar qué necesita mejorar."],
        ["Implementar", "Poner en práctica los próximos pasos."],
      ],
    },
    business: {
      eyebrow: "Capacidades empresariales",
      title:
        "Más que recomendaciones. Apoyo para poner el trabajo en práctica.",
      copy: "Alchemize puede identificar el problema, organizar la información, recomendar el próximo paso y realizar la implementación práctica cuando esté dentro de nuestro alcance. Cuando no lo esté, aclaramos el límite e indicamos qué tipo de profesional calificado requiere el trabajo.",
      ariaPrefix: "Explorar",
    },
    trust: {
      alt: "Jessy Santos trabajando con documentos empresariales en un escritorio",
      eyebrow: "Orientación clara. Apoyo práctico.",
      title: "Ser profesional no significa ser impersonal.",
      copy: "Alchemize combina procesos organizados y estándares profesionales con una comunicación clara y directa.",
      link: "Por qué Alchemize",
    },
    resources: {
      eyebrow: "Prepárese con confianza",
      title: "Información clara para las decisiones que tiene por delante.",
      button: "Explorar todos los recursos",
      pdfLabel: "En desarrollo",
      items: [
        [
          "Impuestos",
          getDownloadableResource(DOWNLOADABLE_RESOURCE_IDS.individualTax),
        ],
        [
          "Empresas",
          getDownloadableResource(DOWNLOADABLE_RESOURCE_IDS.startup),
        ],
        [
          "Primeros pasos",
          getDownloadableResource(DOWNLOADABLE_RESOURCE_IDS.consultation),
        ],
      ],
    },
    final: {
      eyebrow: "Comience con la necesidad",
      title: "No necesita identificar el servicio exacto antes de comunicarse.",
      copy: "Cuéntenos qué desea lograr, mejorar o resolver. Le ayudaremos a identificar el próximo paso apropiado.",
      button: "Programar una consulta",
      spanish: "Atención disponible en español.",
    },
  },
};

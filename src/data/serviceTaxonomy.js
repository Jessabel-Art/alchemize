// CANONICAL PUBLIC SERVICE TAXONOMY
//
// One source of truth for how Alchemize's public services are organised.
// Every public surface (Services page, homepage, footer, Why Alchemize,
// service-detail breadcrumbs, related services, contact options) reads
// category names, order and membership from here rather than restating them.
//
// This file only says HOW existing services are grouped. It does not create
// services. A category either OWNS services (`serviceKeys`) or is a discovery
// path to a service that another category owns (`sharedWith`).
//
// `sharedWith`: Individuals -> Digital Support is a second way into the existing
// Web & Digital Solutions service. It has no page or backend identity of its
// own: it routes to the same destination (/web-digital) and submits the same
// lead key (`business-digital`); only the label and audience context differ.
//
// `serviceKeys` are the `serviceKey` values used by the service catalog
// (src/pages/services/serviceCatalog.js) and the backend lead validator, plus
// `business-digital`, whose dedicated page is /web-digital.

export const SERVICE_AUDIENCES = Object.freeze(["individuals", "businesses"]);

// `summary` (optional): the Services-page description of the category, written
// for the prospect's need. It is separate from the service page's own statement
// (which is unchanged); when absent, the service's statement is shown. For a
// category that groups several services it is the short parent descriptor.
//
// Array order is the canonical display order. Businesses read as a progression:
// establish the business -> assess needs and priorities -> implement stronger
// operations -> tax and financial records -> recurring financial operations ->
// the business's digital presence.
//
// `es.status`:
//   "established" - the Spanish name reuses wording already published on the
//                   site (nav, footer, FAQ, Why Alchemize, homepage).
//   "needs-review" - composite Spanish wording that is not yet established
//                   anywhere on the site and should be confirmed.
export const serviceCategories = Object.freeze([
  {
    key: "tax-preparation",
    audience: "individuals",
    order: 1,
    name: { en: "Tax Preparation", es: "Preparación de impuestos" },
    esStatus: "established",
    serviceKeys: ["individual-tax"],
  },
  {
    key: "notary-document-services",
    audience: "individuals",
    order: 2,
    name: {
      en: "Notary & Document Services",
      es: "Servicios notariales y de documentos",
    },
    esStatus: "established",
    serviceKeys: ["individual-notary"],
  },
  {
    key: "translation-apostille-support",
    audience: "individuals",
    order: 3,
    name: {
      en: "Translation & Apostille Support",
      es: "Traducción y apoyo para apostillas",
    },
    esStatus: "needs-review",
    serviceKeys: ["individual-translation", "individual-apostille"],
  },
  {
    key: "digital-support",
    audience: "individuals",
    order: 4,
    name: { en: "Digital Support", es: "Apoyo digital" },
    esStatus: "established",
    serviceKeys: [],
    sharedWith: "business-digital",
  },
  {
    key: "business-foundation",
    audience: "businesses",
    order: 1,
    name: { en: "Business Foundation", es: "Bases del negocio" },
    esStatus: "established",
    summary: {
      en: "For businesses getting established, formalized, reorganized, or prepared for their next stage.",
      es: "Para negocios que se están estableciendo, formalizando, reorganizando o preparando para su siguiente etapa.",
    },
    serviceKeys: ["business-readiness"],
  },
  {
    key: "business-advisory",
    audience: "businesses",
    order: 2,
    name: { en: "Business Advisory", es: "Asesoría empresarial" },
    esStatus: "needs-review",
    summary: {
      en: "For owners who need to assess a business challenge, identify priorities, and determine what should happen next.",
      es: "Para propietarios que necesitan evaluar un desafío del negocio, identificar prioridades y determinar qué debe suceder a continuación.",
    },
    serviceKeys: ["business-advisory"],
  },
  {
    key: "operations-administration",
    audience: "businesses",
    order: 3,
    name: {
      en: "Operations & Administration",
      es: "Operaciones y administración",
    },
    esStatus: "established",
    summary: {
      en: "For businesses that need stronger workflows, documentation, administrative systems, and hands-on implementation.",
      es: "Para negocios que necesitan flujos de trabajo, documentación, sistemas administrativos e implementación práctica más sólidos.",
    },
    serviceKeys: ["business-operations"],
  },
  {
    key: "tax-financial-organization",
    audience: "businesses",
    order: 4,
    name: {
      en: "Tax & Financial Organization",
      es: "Impuestos y organización financiera",
    },
    esStatus: "needs-review",
    serviceKeys: ["business-financial"],
  },
  {
    key: "bookkeeping-payroll-support",
    audience: "businesses",
    order: 5,
    name: {
      en: "Bookkeeping & Payroll Support",
      es: "Apoyo en teneduría de libros y nómina",
    },
    esStatus: "needs-review",
    summary: {
      en: "Recurring financial operations organized around the day-to-day needs of the business.",
      es: "Operaciones financieras recurrentes organizadas en torno a las necesidades diarias del negocio.",
    },
    serviceKeys: ["business-bookkeeping", "business-payroll"],
  },
  {
    key: "web-digital-solutions",
    audience: "businesses",
    order: 6,
    name: { en: "Web & Digital Solutions", es: "Web y soluciones digitales" },
    esStatus: "established",
    summary: {
      en: "Professional websites, digital presence, and connected systems built around how the business actually operates.",
      es: "Sitios web profesionales, presencia digital y sistemas conectados construidos en torno a cómo opera realmente el negocio.",
    },
    serviceKeys: ["business-digital"],
  },
]);

export const categoryByKey = new Map(
  serviceCategories.map((category) => [category.key, category]),
);

export const categoryByServiceKey = new Map(
  serviceCategories.flatMap((category) =>
    category.serviceKeys.map((serviceKey) => [serviceKey, category]),
  ),
);

// Every service key in canonical display order (audience, category, position).
export const canonicalServiceOrder = Object.freeze(
  serviceCategories.flatMap((category) => category.serviceKeys),
);

export const hasPublicService = (category) =>
  category.serviceKeys.length > 0 || Boolean(category.sharedWith);

export const categoriesForAudience = (audience) =>
  serviceCategories
    .filter((category) => category.audience === audience)
    .sort((a, b) => a.order - b.order);

export const categoryName = (category, language = "en") =>
  category.name[language === "es" ? "es" : "en"];

export const sortByCanonicalOrder = (services) => {
  const indexMap = new Map(
    canonicalServiceOrder.map((serviceKey, index) => [serviceKey, index]),
  );
  return [...services].sort(
    (a, b) =>
      (indexMap.get(a.serviceKey) ?? Number.MAX_SAFE_INTEGER) -
      (indexMap.get(b.serviceKey) ?? Number.MAX_SAFE_INTEGER),
  );
};

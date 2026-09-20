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
    summary: {
      en: "Need a return prepared without the last-minute document search? Organize records, confirm scope, and prepare the return.",
      es: "¿Necesita su declaración preparada sin buscar documentos a último momento? Organizamos los registros, confirmamos el alcance y preparamos la declaración.",
    },
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
    summary: {
      en: "Need a document notarized or a packet put in order? Request an appointment and get the document ready first.",
      es: "¿Necesita notarizar un documento u ordenar un paquete de documentos? Solicite una cita y prepare primero el documento.",
    },
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
    summary: {
      en: "Need your expertise presented online? Websites, profiles, and business email for independent professionals.",
      es: "¿Necesita presentar su experiencia en línea? Sitios web, perfiles y correo empresarial para profesionales independientes.",
    },
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
      en: "Starting, formalizing, or reorganizing a business? Assess the foundation, plan the next stage, and get the records in order.",
      es: "¿Está iniciando, formalizando o reorganizando un negocio? Evalúe las bases, planifique la siguiente etapa y ponga los registros en orden.",
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
      en: "Need clarity before making a business decision? Assess the situation, identify gaps, and establish practical priorities.",
      es: "¿Necesita claridad antes de tomar una decisión empresarial? Evalúe la situación, identifique brechas y establezca prioridades prácticas.",
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
      en: "When the work is harder than it should be. Improve workflows, systems, documentation, and the way work moves through the business.",
      es: "Cuando el trabajo es más difícil de lo que debería. Mejore flujos de trabajo, sistemas, documentación y la forma en que el trabajo circula en el negocio.",
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
    summary: {
      en: "Need business tax records ready before filing season? Organize records, deadlines, and documents ahead of time.",
      es: "¿Necesita los registros tributarios del negocio listos antes de la temporada de declaraciones? Organice registros, fechas límite y documentos con anticipación.",
    },
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
      en: "Need reliable books instead of financial catch-up? Recurring bookkeeping and payroll administration organized around the day-to-day needs of the business.",
      es: "¿Necesita libros confiables en lugar de ponerse al día con las finanzas? Teneduría de libros recurrente y administración de nómina organizadas en torno a las necesidades diarias del negocio.",
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
      en: "Need technology to work as part of the business? Build and improve websites, visibility, automation, and connected digital systems.",
      es: "¿Necesita que la tecnología funcione como parte del negocio? Construya y mejore sitios web, visibilidad, automatización y sistemas digitales conectados.",
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

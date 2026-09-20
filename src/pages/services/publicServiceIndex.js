// Read-only presentation layer over the canonical taxonomy
// (src/data/serviceTaxonomy.js) and the service catalogs. Every public surface
// that names a service category asks this module, so category names, order and
// membership are defined in exactly one place.
import {
  categoriesForAudience,
  categoryByServiceKey,
  categoryName,
} from "../../data/serviceTaxonomy.js";
import { serviceCatalog } from "./serviceCatalog.js";
import { serviceGroupsEs } from "./serviceCatalog.es.js";
import { webDigitalSummary } from "../web-digital/webDigitalSummary.js";

export const WEB_DIGITAL_ROUTE = "/web-digital";

const lang = (language) => (language === "es" ? "es" : "en");

const detailRoute = (service) =>
  `/services/${service.audience}/${service.slug}`;

// serviceKey -> the public service as presented in one language.
const buildServiceMap = (language) => {
  const services =
    lang(language) === "es"
      ? Object.values(serviceGroupsEs).flat()
      : serviceCatalog;
  const map = new Map(
    services.map((service) => [
      service.serviceKey,
      {
        serviceKey: service.serviceKey,
        audience: service.audience,
        title: service.title,
        route: detailRoute(service),
        statement: service.statement,
        capabilities: service.capabilities,
        hasDetailPage: true,
      },
    ]),
  );
  const web = webDigitalSummary[lang(language)];
  map.set("business-digital", {
    serviceKey: "business-digital",
    audience: "businesses",
    title: web.title,
    route: WEB_DIGITAL_ROUTE,
    statement: web.statement,
    capabilities: web.capabilities,
    // Wording for audiences that reach this service through their own path.
    byAudience: { individuals: web.individual },
    hasDetailPage: false,
  });
  return map;
};

const serviceMaps = { en: buildServiceMap("en"), es: buildServiceMap("es") };

// The service a category presents. A category that owns its services lists them;
// a category that is a path to another category's service (Digital Support ->
// Web & Digital Solutions) presents that same service under its own name, using
// the audience-specific wording the destination page already publishes.
function servicesFor(category, services) {
  if (category.serviceKeys.length) {
    return category.serviceKeys
      .map((serviceKey) => services.get(serviceKey))
      .filter(Boolean);
  }
  if (category.sharedWith) {
    const base = services.get(category.sharedWith);
    if (!base) return [];
    const variant = base.byAudience?.[category.audience];
    return [
      {
        ...base,
        statement: variant?.statement ?? base.statement,
        capabilities: variant?.capabilities ?? base.capabilities,
      },
    ];
  }
  return [];
}

// Categories of an audience in canonical order, each with the existing services
// it presents. Single-service categories link straight to the service; a
// category that groups several services links to its row on the Services page.
export function getServiceCategories(audience, language) {
  const services = serviceMaps[lang(language)];
  return categoriesForAudience(audience).map((category) => {
    const items = servicesFor(category, services);
    const name = categoryName(category, language);
    return {
      key: category.key,
      audience: category.audience,
      name,
      shared: Boolean(category.sharedWith),
      // Router state for links into a shared destination: it tells the
      // destination which audience's pathway the visitor took (Individuals ->
      // Digital Support), so its inquiry and measurement keep that audience.
      linkState: category.sharedWith
        ? {
            entryAudience:
              category.audience === "individuals" ? "individual" : "business",
          }
        : undefined,
      summary: category.summary?.[lang(language)] ?? null,
      services:
        category.sharedWith && items.length
          ? items.map((item) => ({ ...item, title: name }))
          : items,
      route:
        items.length === 1
          ? items[0].route
          : items.length > 1
            ? `/services/#${category.key}`
            : null,
    };
  });
}

// Title and route of one public service, for links that point at it from
// elsewhere (for example the end of a resource).
export function getServiceLink(serviceKey, language) {
  const service = serviceMaps[lang(language)].get(serviceKey);
  return service ? { title: service.title, route: service.route } : null;
}

export function getCategoryForService(serviceKey, language) {
  const category = categoryByServiceKey.get(serviceKey);
  if (!category) return null;
  return {
    key: category.key,
    audience: category.audience,
    name: categoryName(category, language),
    multiService: category.serviceKeys.length > 1,
  };
}

// The name shown wherever a single service is picked or referenced (related
// links): the category name when the category is served by one page, otherwise
// the service's own name (e.g. "Bookkeeping" within "Bookkeeping & Payroll
// Support").
export function getServiceDisplayName(serviceKey, language) {
  return serviceMaps[lang(language)].get(serviceKey)?.title ?? null;
}

// Options for the contact form's service selector. Every public service that
// accepts inquiries is listed with its canonical backend key. Translation and
// Apostille, and Bookkeeping and Payroll, are separate selectable services even
// though each pair shares a category. Individuals -> Digital Support reuses the
// canonical `business-digital` key (alias: true): the label and audience differ,
// the service identity does not.
export function getContactServiceGroups(language) {
  const services = serviceMaps[lang(language)];
  const groups = [
    {
      audience: "individual",
      label: "Individual Services",
      source: "individuals",
    },
    { audience: "business", label: "Business Services", source: "businesses" },
  ];
  return groups.map(({ audience, label, source }) => ({
    audience,
    label,
    items: categoriesForAudience(source).flatMap((category) => {
      const name = categoryName(category, language);
      if (category.sharedWith) {
        return [{ value: category.sharedWith, label: name, alias: true }];
      }
      return category.serviceKeys.map((serviceKey) => ({
        value: serviceKey,
        label:
          category.serviceKeys.length === 1
            ? name
            : (services.get(serviceKey)?.title ?? name),
        alias: false,
      }));
    }),
  }));
}

// A short, catalog-derived summary line for a category (existing capability
// labels only): the first capability of each service, then more, up to `limit`.
export function summarizeCategory(category, limit = 3) {
  const lists = category.services.map((service) => [...service.capabilities]);
  const picked = [];
  while (picked.length < limit && lists.some((list) => list.length)) {
    for (const list of lists) {
      if (picked.length < limit && list.length) picked.push(list.shift());
    }
  }
  return picked;
}

const RESOURCE_SLUGS = [
  "preparing-for-tax-season",
  "tax-records-what-to-keep",
  "estimated-taxes-questions",
  "professional-website-design-process",
  "digital-presence-audit",
  "seo-and-website-metadata",
  "starting-a-business-organization-checklist",
  "your-first-year-in-business",
  "business-formation-information-to-gather",
  "business-needs-a-process",
  "simple-administrative-system",
  "business-records-what-needs-a-home",
  "building-a-business-deadline-calendar",
];

const SERVICE_DETAIL_PATHS = [
  "/services/individuals/tax-preparation",
  "/services/individuals/notary-document-services",
  "/services/businesses/advisory-optimization",
  "/services/businesses/operations-implementation",
  "/services/businesses/digital-business-technology",
  "/services/businesses/readiness-growth",
  "/services/businesses/business-tax-support",
];

export const APP_ROUTE_PATHS = [
  "/",
  "/about",
  "/services",
  "/web-digital",
  "/services/individuals",
  "/services/businesses",
  ...SERVICE_DETAIL_PATHS,
  "/contact",
  "/resources",
  "/resources/meet-the-founder",
  ...RESOURCE_SLUGS.map((slug) => `/resources/${slug}`),
  "/faq",
  "/why-alchemize",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/admin",
  "/admin/dashboard",
  "/admin/leads",
  "/admin/clients",
  "/admin/services",
  "/admin/tasks",
  "/admin/documents",
  "/admin/appointments",
  "/admin/messages",
  "/admin/billing",
  "/admin/content",
  "/admin/settings",
  "/client-portal",
  "/client-portal/dashboard",
  "/client-portal/services",
  "/client-portal/tasks",
  "/client-portal/documents",
  "/client-portal/appointments",
  "/client-portal/messages",
  "/client-portal/billing",
  "/client-portal/profile",
  "/es",
  "/es/about",
  "/es/services",
  "/es/web-digital",
  "/es/services/individuals",
  "/es/services/businesses",
  ...SERVICE_DETAIL_PATHS.map((path) => `/es${path}`),
  "/es/contact",
  "/es/resources",
  "/es/resources/meet-the-founder",
  ...RESOURCE_SLUGS.map((slug) => `/es/resources/${slug}`),
  "/es/faq",
  "/es/why-alchemize",
];

const REDIRECT_ROUTE_PATHS = new Set([
  "/about",
  "/services/individuals",
  "/services/businesses",
  "/es/about",
  "/es/services/individuals",
  "/es/services/businesses",
]);

export const PUBLIC_SITEMAP_ROUTES = APP_ROUTE_PATHS.filter(
  (path) =>
    !REDIRECT_ROUTE_PATHS.has(path) &&
    !path.startsWith("/admin") &&
    !path.startsWith("/client-portal") &&
    !path.startsWith("/login") &&
    !path.startsWith("/register"),
);

export function getSitemapRoutes() {
  return PUBLIC_SITEMAP_ROUTES.map((path) => {
    const isSpanish = path === "/es" || path.startsWith("/es/");
    const base = isSpanish ? (path === "/es" ? "/" : path.slice(3)) : path;
    const hasTranslation = !["/privacy", "/terms"].includes(base);
    return {
      path,
      alternates: hasTranslation
        ? {
            en: base,
            es: base === "/" ? "/es" : `/es${base}`,
            "x-default": base,
          }
        : null,
    };
  });
}

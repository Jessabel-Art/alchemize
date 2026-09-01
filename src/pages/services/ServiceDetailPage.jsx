import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import EditorialServicePage from "../../components/services/EditorialServicePage.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import {
  buildBreadcrumbListSchema,
  buildServiceSchema,
  ensureJsonLd,
  ensureMeta,
  injectSiteEntitySchema,
  SITE_URL,
} from "../../seo/siteSchema.js";
import { findService, legacyServiceRoutes } from "./serviceCatalog.js";
import { findServiceEs } from "./serviceCatalog.es.js";
import { serviceDetailUi } from "./servicesContent.js";
import "./services.css";

function useServiceMetadata(service, language) {
  useEffect(() => {
    if (!service) return undefined;
    const prefix = language === "es" ? "/es" : "";
    const canonical = `${SITE_URL}${prefix}/services/${service.audience}/${service.slug}`;
    const seoTitle = service.seoTitle || `${service.title} | Alchemize`;
    const seoDescription =
      service.seoDescription ||
      service.overview.replace(/\s+/g, " ").trim().slice(0, 158);
    document.title = seoTitle;
    let meta = document.head.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = seoDescription;
    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.append(canonicalLink);
    }
    canonicalLink.href = canonical;
    ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: seoTitle,
    });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seoDescription,
    });
    ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonical,
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "article",
    });
    ensureMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: "Alchemize Business Services",
    });
    ensureMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: language === "es" ? "es_ES" : "en_US",
    });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    ensureMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seoTitle,
    });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seoDescription,
    });
    injectSiteEntitySchema();
    ensureJsonLd(`service-schema-${language}-${service.slug}`, {
      "@context": "https://schema.org",
      "@graph": [
        buildServiceSchema(service, language, canonical),
        buildBreadcrumbListSchema([
          [
            language === "es" ? "Servicios" : "Services",
            `${SITE_URL}${prefix}/services`,
          ],
          [
            service.audienceLabel,
            `${SITE_URL}${prefix}/services#${service.audience}`,
          ],
          [service.title, canonical],
        ]),
      ],
    });
    return () =>
      document.head
        .querySelector(
          `script[data-schema-id="service-schema-${language}-${service.slug}"]`,
        )
        ?.remove();
  }, [service, language]);
}

export default function ServiceDetailPage() {
  const { audience, slug } = useParams();
  const { language, path } = useLanguage();
  const ui = serviceDetailUi[language];
  const legacy = audience === "businesses" ? legacyServiceRoutes[slug] : null;
  const service =
    language === "es"
      ? findServiceEs(audience, slug)
      : findService(audience, slug);
  useServiceMetadata(service, language);
  if (slug === "digital-business-technology") {
    return <Navigate to={path("/web-digital")} replace />;
  }
  if (legacy) return <Navigate to={path(legacy)} replace />;
  if (!service) return <Navigate to={path("/services")} replace />;
  return <EditorialServicePage service={service} ui={ui} language={language} />;
}

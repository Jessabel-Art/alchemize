import { useEffect } from "react";
import {
  ensureMeta,
  injectSiteEntitySchema,
  buildBreadcrumbListSchema,
  SITE_URL,
} from "../../seo/siteSchema.js";

export default function useResourceMetadata(resource, language = "en") {
  useEffect(() => {
    const prefix = language === "es" ? "/es" : "";
    const title = resource
      ? `${resource.title} | Alchemize Resource Library`
      : language === "es"
        ? "Recursos | Guías prácticas para impuestos, negocios y operaciones"
        : "Resources | Practical Guides for Taxes, Business & Operations";
    const description = resource
      ? resource.excerpt
      : language === "es"
        ? "Guías prácticas, listas de verificación y recursos oficiales para impuestos, operaciones empresariales, documentos y administración diaria."
        : "Practical guides, checklists, and official resources for taxes, business operations, document support, and day-to-day business administration.";
    const path = resource ? `/resources/${resource.slug}` : "/resources";
    const canonical = `${SITE_URL}${prefix}${path}`;
    document.title = title;

    ensureMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonical,
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: resource ? "article" : "website",
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
      content: title,
    });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    injectSiteEntitySchema();

    const oldScript = document.getElementById("resource-structured-data");
    oldScript?.remove();
    if (resource) {
      const articleScript = document.createElement("script");
      articleScript.id = "resource-structured-data";
      articleScript.type = "application/ld+json";
      articleScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            headline: resource.title,
            description: resource.excerpt,
            dateModified: resource.modifiedDate || "2026-08-18",
            inLanguage: language === "es" ? "es" : "en",
            author: {
              "@type": "Organization",
              name: "Alchemize Business Services",
            },
            publisher: {
              "@type": "Organization",
              name: "Alchemize Business Services",
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/assets/logos/alchemize-logo-dark.png`,
              },
            },
            mainEntityOfPage: canonical,
          },
          buildBreadcrumbListSchema([
            [
              language === "es" ? "Recursos" : "Resources",
              `${SITE_URL}${prefix}/resources`,
            ],
            [resource.title, canonical],
          ]),
        ],
      });
      document.head.appendChild(articleScript);
    }

    return () => document.getElementById("resource-structured-data")?.remove();
  }, [resource, language]);
}

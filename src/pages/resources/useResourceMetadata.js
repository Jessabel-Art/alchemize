import { useEffect } from "react";

const SITE_URL = "https://getalchemize.com";

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) =>
    element.setAttribute(name, value),
  );
  return element;
}

export default function useResourceMetadata(resource) {
  useEffect(() => {
    const title = resource
      ? `${resource.title} | Alchemize Resource Library`
      : "Resources | Alchemize Business Services";
    const description = resource
      ? resource.excerpt
      : "Practical guides, checklists, official resources, and straightforward explanations for personal and business responsibilities.";
    const path = resource ? `/resources/${resource.slug}` : "/resources";
    const canonical = `${SITE_URL}${path}`;
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

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const oldScript = document.getElementById("resource-structured-data");
    oldScript?.remove();
    if (resource) {
      const script = document.createElement("script");
      script.id = "resource-structured-data";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            headline: resource.title,
            description: resource.excerpt,
            dateModified: "2026-08-18",
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
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Resources",
                item: `${SITE_URL}/resources`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: resource.title,
                item: canonical,
              },
            ],
          },
        ],
      });
      document.head.appendChild(script);
    }
    return () => document.getElementById("resource-structured-data")?.remove();
  }, [resource]);
}

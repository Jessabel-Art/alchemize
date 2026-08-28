export const SITE_URL = "https://getalchemize.com";

const organizationBase = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Alchemize Business Services",
  url: SITE_URL,
  description:
    "Alchemize Business Services provides practical support for taxes, document services, business operations, digital systems, and administrative readiness for individuals, entrepreneurs, and small businesses.",
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/assets/logos/alchemize-logo-dark.png`,
  },
  founder: {
    "@type": "Person",
    name: "Jessy Santos",
    url: `${SITE_URL}/resources/meet-the-founder`,
  },
};

export function ensureJsonLd(id, payload) {
  if (typeof document === "undefined") return;

  const existing = document.head.querySelector(
    `script[data-schema-id="${id}"]`,
  );
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.schemaId = id;
  script.textContent = JSON.stringify(payload);
  document.head.appendChild(script);
}

export function ensureMeta(selector, attributes) {
  if (typeof document === "undefined") return null;

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    element.setAttribute(key, value);
  });

  return element;
}

export function injectSiteEntitySchema() {
  ensureJsonLd("alchemize-organization-schema", organizationBase);
  ensureJsonLd("alchemize-website-schema", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Alchemize Business Services",
    url: SITE_URL,
    description:
      "Practical business, tax, operations, document, and digital support for individuals, entrepreneurs, and small businesses.",
    inLanguage: ["en", "es"],
    publisher: {
      "@type": "Organization",
      name: "Alchemize Business Services",
      url: SITE_URL,
      logo: `${SITE_URL}/assets/logos/alchemize-logo-dark.png`,
    },
  });
}

export function buildServiceSchema(service, language, canonical) {
  if (!service) return null;

  const description =
    service.seoDescription ||
    service.overview?.replace(/\s+/g, " ").trim().slice(0, 180) ||
    service.statement ||
    "";

  const areaServed = (() => {
    const serviceSlug = service.slug;
    if (
      ["notary-document-services", "apostille-services"].includes(serviceSlug)
    ) {
      return "North Carolina";
    }
    if (
      [
        "translation-services",
        "bookkeeping-financial-reporting",
        "payroll-processing",
        "digital-business-technology",
      ].includes(serviceSlug)
    ) {
      return "United States";
    }
    return undefined;
  })();

  const item = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: language === "es" ? service.titleEs || service.title : service.title,
    serviceType:
      language === "es" ? service.titleEs || service.title : service.title,
    description,
    url: canonical,
    provider: {
      "@type": "Organization",
      name: "Alchemize Business Services",
      url: SITE_URL,
      logo: `${SITE_URL}/assets/logos/alchemize-logo-dark.png`,
    },
  };

  if (areaServed) {
    item.areaServed = areaServed;
  }

  return item;
}

export function buildFaqSchema(faqItems) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export function buildPersonSchema({
  name,
  jobTitle,
  description,
  url,
  worksFor,
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle,
    description,
    url,
    worksFor: worksFor || {
      "@type": "Organization",
      name: "Alchemize Business Services",
      url: SITE_URL,
    },
  };
}

export function buildBreadcrumbListSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item,
    })),
  };
}

export const SITE_URL = "https://getalchemize.com";

export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/assets/images/home/alchemize-hero.webp`,
  width: 1672,
  height: 941,
};

// Inline reference to the organization entity (search engines do not reliably
// resolve @id across separate JSON-LD blocks, so name and url travel with it).
const organizationRef = {
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: "Alchemize Business Services",
  url: SITE_URL,
};

// Same facts as the visible footer: Fayetteville, NC; virtual business support
// nationwide. No street address is published, so none is described here.
const organizationBase = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: "Alchemize Business Services",
  url: SITE_URL,
  description:
    "Alchemize Business Services provides practical support for taxes, document services, business operations, digital systems, and administrative readiness for individuals, entrepreneurs, and small businesses.",
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/assets/logos/alchemize-logo-dark.png`,
  },
  image: SOCIAL_IMAGE.url,
  telephone: "+1-910-644-0207",
  email: "hello@getalchemize.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Fayetteville",
    addressRegion: "NC",
    addressCountry: "US",
  },
  areaServed: [
    { "@type": "State", name: "North Carolina" },
    { "@type": "Country", name: "United States" },
  ],
  knowsLanguage: ["en", "es"],
  sameAs: [
    "https://www.instagram.com/getalchemize/",
    "https://www.threads.com/@getalchemize",
    "https://www.linkedin.com/company/alchemize-business-services/",
  ],
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

// Default share image. Pages that do not have their own use the brand image.
export function ensureSocialImage() {
  ensureMeta('meta[property="og:image"]', {
    property: "og:image",
    content: SOCIAL_IMAGE.url,
  });
  ensureMeta('meta[property="og:image:width"]', {
    property: "og:image:width",
    content: String(SOCIAL_IMAGE.width),
  });
  ensureMeta('meta[property="og:image:height"]', {
    property: "og:image:height",
    content: String(SOCIAL_IMAGE.height),
  });
  ensureMeta('meta[name="twitter:image"]', {
    name: "twitter:image",
    content: SOCIAL_IMAGE.url,
  });
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
    publisher: organizationRef,
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
        "web-digital",
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
    provider: organizationRef,
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

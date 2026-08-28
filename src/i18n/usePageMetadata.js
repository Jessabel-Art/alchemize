import { useEffect } from "react";
import { useLanguage } from "./LanguageContext.jsx";
import {
  ensureMeta,
  injectSiteEntitySchema,
  SITE_URL,
} from "../seo/siteSchema.js";

function ensureMetaByName(name, content) {
  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.append(meta);
  }
  meta.content = content;
}

export default function usePageMetadata(metadata) {
  const { language, path } = useLanguage();
  const localized = metadata[language] ?? metadata.en;

  useEffect(() => {
    const canonicalPath =
      typeof window !== "undefined" ? window.location.pathname : path("/");
    const canonical = `${SITE_URL}${canonicalPath}`;

    document.title = localized.title;
    ensureMetaByName("description", localized.description);
    ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: localized.title,
    });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: localized.description,
    });
    ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonical,
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "website",
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
      content: localized.title,
    });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: localized.description,
    });

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.append(canonicalLink);
    }
    canonicalLink.href = canonical;

    injectSiteEntitySchema();
  }, [language, localized.description, localized.title, path]);
}

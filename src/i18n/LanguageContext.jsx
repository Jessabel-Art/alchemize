import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SITE_URL } from "../seo/siteSchema.js";

const LanguageContext = createContext(null);
const STORAGE_KEY = "alchemize-language";

// Pages that exist in English only: they get no Spanish alternate.
const ENGLISH_ONLY_PATHS = [
  "/privacy",
  "/terms",
  "/resources/hostinger-for-small-business-websites",
  "/resources/api-integrations-for-small-business",
];

// One URL per page: "/services/" and "/services" are the same document.
export function normalizePathname(pathname) {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

// True for pages that have no Spanish edition (in either language's URL).
export function isEnglishOnlyPath(pathname) {
  return ENGLISH_ONLY_PATHS.includes(
    stripLanguagePrefix(normalizePathname(pathname)),
  );
}

export function stripLanguagePrefix(pathname) {
  if (pathname === "/es") return "/";
  return pathname.startsWith("/es/") ? pathname.slice(3) || "/" : pathname;
}

export function localizePath(to, language) {
  if (typeof to !== "string") return to;
  if (
    !to.startsWith("/") ||
    to.startsWith("//") ||
    to.startsWith("/assets/") ||
    to.startsWith("/api/") ||
    to.startsWith("/admin") ||
    to.startsWith("/client-portal") ||
    to.startsWith("/login") ||
    to.startsWith("/register") ||
    to.startsWith("/alchemize-api.php")
  ) {
    return to;
  }

  const [pathAndQuery, hash = ""] = to.split("#");
  const [pathname, query = ""] = pathAndQuery.split("?");
  const basePath = stripLanguagePrefix(pathname || "/");
  if (["/privacy", "/terms"].includes(basePath)) {
    return `${basePath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  }
  const localized =
    language === "es"
      ? basePath === "/"
        ? "/es"
        : `/es${basePath}`
      : basePath;
  return `${localized}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

function ensureAlternate(hreflang, href) {
  let link = document.head.querySelector(
    `link[rel="alternate"][hreflang="${hreflang}"]`,
  );
  if (!link) {
    link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = hreflang;
    document.head.append(link);
  }
  link.href = href;
}

function removeAlternate(hreflang) {
  document.head
    .querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`)
    ?.remove();
}

export function LanguageProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const language =
    location.pathname === "/es" || location.pathname.startsWith("/es/")
      ? "es"
      : "en";

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(STORAGE_KEY, language);

    const pathname = normalizePathname(location.pathname);
    const englishPath = localizePath(pathname, "en");
    const spanishPath = localizePath(pathname, "es");
    const origin = SITE_URL;
    const englishOnly = isEnglishOnlyPath(pathname);

    // An unknown URL (see NotFoundPage) is not a page: no canonical, no alternates.
    if (document.documentElement.dataset.notFound) {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      ["en", "es", "x-default"].forEach(removeAlternate);
      return;
    }

    ensureAlternate("en", `${origin}${englishPath}`);
    if (englishOnly) removeAlternate("es");
    else ensureAlternate("es", `${origin}${spanishPath}`);
    ensureAlternate("x-default", `${origin}${englishPath}`);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    // An English-only page's canonical is always its English URL.
    canonical.href = `${origin}${englishOnly ? englishPath : pathname}`;
  }, [language, location.pathname]);

  const value = useMemo(
    () => ({
      language,
      isSpanish: language === "es",
      path: (to) => localizePath(to, language),
      switchLanguage(nextLanguage) {
        window.localStorage.setItem(STORAGE_KEY, nextLanguage);
        navigate(
          `${localizePath(location.pathname, nextLanguage)}${location.search}${location.hash}`,
        );
      },
    }),
    [language, location.hash, location.pathname, location.search, navigate],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LanguageContext = createContext(null);
const STORAGE_KEY = "alchemize-language";

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

    const englishPath = localizePath(location.pathname, "en");
    const spanishPath = localizePath(location.pathname, "es");
    const origin = "https://getalchemize.com";
    const legalEnglishOnly = ["/privacy", "/terms"].includes(englishPath);
    ensureAlternate("en", `${origin}${englishPath}`);
    if (legalEnglishOnly) removeAlternate("es");
    else ensureAlternate("es", `${origin}${spanishPath}`);
    ensureAlternate("x-default", `${origin}${englishPath}`);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = `${origin}${location.pathname}`;
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

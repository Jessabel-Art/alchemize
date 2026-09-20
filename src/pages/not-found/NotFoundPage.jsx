import { useEffect } from "react";
import PageShell from "../../components/ui/PageShell.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { ensureMeta } from "../../seo/siteSchema.js";

const copy = {
  en: {
    title: "Page not found | Alchemize Business Services",
    eyebrow: "404",
    heading: "This page could not be found.",
    summary:
      "The address may have changed or been typed incorrectly. These pages will get you back on track.",
    home: "Go to the homepage",
    services: "Browse services",
    contact: "Tell Us What You Need",
  },
  es: {
    title: "Página no encontrada | Alchemize Business Services",
    eyebrow: "404",
    heading: "No pudimos encontrar esta página.",
    summary:
      "Es posible que la dirección haya cambiado o se haya escrito de forma incorrecta. Estas páginas le ayudarán a continuar.",
    home: "Ir al inicio",
    services: "Ver servicios",
    contact: "Cuéntenos qué necesita",
  },
};

// An unknown URL is not a page: it is kept out of the index and carries no
// canonical or hreflang (LanguageProvider reads the data-not-found flag).
export default function NotFoundPage() {
  const { language } = useLanguage();
  const text = copy[language];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.notFound = "true";
    document.title = text.title;
    const robots = ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: "noindex, follow",
    });
    return () => {
      delete root.dataset.notFound;
      robots?.remove();
    };
  }, [text.title]);

  return (
    <PageShell
      eyebrow={text.eyebrow}
      title={text.heading}
      summary={text.summary}
      actions={
        <>
          <Link className="button button-primary" to="/">
            {text.home}
          </Link>
          <Link className="button button-secondary" to="/services">
            {text.services}
          </Link>
          <Link className="text-link" to="/contact">
            {text.contact}
          </Link>
        </>
      }
    />
  );
}

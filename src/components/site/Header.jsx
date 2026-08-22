import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Logo from "../brand/Logo.jsx";
import {
  LocalizedLink as Link,
  LocalizedNavLink as NavLink,
} from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import "./header.css";

const navigation = {
  en: {
    items: [
      ["/", "Home"],
      ["/services", "Services"],
      ["/why-alchemize", "Why Alchemize"],
      ["/resources", "Resources"],
      ["/faq", "FAQ"],
    ],
    consultation: "Schedule a Consultation",
    homeLabel: "Alchemize Business Services home",
    navigationLabel: "Primary navigation",
    open: "Open navigation menu",
    close: "Close navigation menu",
    languageLabel: "Select website language",
  },
  es: {
    items: [
      ["/", "Inicio"],
      ["/services", "Servicios"],
      ["/why-alchemize", "Por qué Alchemize"],
      ["/resources", "Recursos"],
      ["/faq", "Preguntas frecuentes"],
    ],
    consultation: "Programar una consulta",
    homeLabel: "Inicio de Alchemize Business Services",
    navigationLabel: "Navegación principal",
    open: "Abrir el menú de navegación",
    close: "Cerrar el menú de navegación",
    languageLabel: "Seleccionar el idioma del sitio",
  },
};

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { language, switchLanguage } = useLanguage();
  const content = navigation[language];
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const close = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  return (
    <header className="site-header">
      <div className="header-shell">
        <Link to="/" className="site-logo" aria-label={content.homeLabel}>
          <Logo surface="dark" responsive />
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? content.close : content.open}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          id="primary-navigation"
          className={`main-nav${open ? " is-open" : ""}`}
          aria-label={content.navigationLabel}
        >
          <div className="main-nav-links">
            {content.items.map(([to, label], index) => (
              <NavLink
                key={to}
                end={index === 0}
                to={to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
          <div className="language-selector" aria-label={content.languageLabel}>
            <button
              type="button"
              className={language === "en" ? "is-current" : ""}
              aria-pressed={language === "en"}
              onClick={() => switchLanguage("en")}
            >
              EN
            </button>
            <span aria-hidden="true">|</span>
            <button
              type="button"
              className={language === "es" ? "is-current" : ""}
              aria-pressed={language === "es"}
              onClick={() => switchLanguage("es")}
            >
              ES
            </button>
          </div>
          <Link to="/contact" className="button button-primary header-cta">
            {content.consultation}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;

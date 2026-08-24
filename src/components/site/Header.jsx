import { useEffect, useRef, useState } from "react";
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
      ["/web-digital", "Web & Digital Solutions"],
      ["/why-alchemize", "Why Alchemize"],
    ],
    whyItems: [
      ["/resources/meet-the-founder", "Meet the Founder"],
      ["/faq", "FAQ"],
      ["/resources/client-resources", "Client Resources"],
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
      ["/web-digital", "Web y soluciones digitales"],
      ["/why-alchemize", "Por qué Alchemize"],
    ],
    whyItems: [
      ["/resources/meet-the-founder", "Conozca a la fundadora"],
      ["/faq", "Preguntas frecuentes"],
      ["/resources/client-resources", "Recursos para clientes"],
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
  const [resourceOpen, setResourceOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);
  const closeTimerRef = useRef(null);
  const { language, switchLanguage } = useLanguage();
  const content = navigation[language];
  const isWhySection = (() => {
    const normalized = location.pathname.replace(/^\/es/, "");
    return (
      normalized === "/why-alchemize" ||
      normalized === "/faq" ||
      normalized === "/resources/client-resources" ||
      normalized === "/resources/meet-the-founder" ||
      normalized.startsWith("/resources/")
    );
  })();
  const openResources = () => {
    window.clearTimeout(closeTimerRef.current);
    setResourceOpen(true);
  };
  const openResourcesFromHover = () => {
    if (window.matchMedia("(min-width: 1231px)").matches) openResources();
  };
  const closeResourcesSoon = () => {
    if (!window.matchMedia("(min-width: 1231px)").matches) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setResourceOpen(false), 180);
  };

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => setResourceOpen(false), [location.pathname]);
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setResourceOpen(false);
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    const handlePointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setResourceOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
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
          <div className="main-nav-links" ref={menuRef}>
            {content.items.map(([to, label], index) => {
              if (label === "Why Alchemize" || label === "Por qué Alchemize") {
                return (
                  <div
                    key={to}
                    className={`nav-dropdown${resourceOpen ? " is-open" : ""}`}
                    onMouseEnter={openResourcesFromHover}
                    onMouseLeave={closeResourcesSoon}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setResourceOpen(false);
                      }
                    }}
                  >
                    <div className="nav-dropdown-trigger-wrap">
                      <NavLink
                        to={to}
                        end={index === 0}
                        className={({ isActive }) =>
                          `nav-link nav-link-parent${isActive || isWhySection ? " active" : ""}`
                        }
                        onClick={() => setResourceOpen(false)}
                      >
                        {label}
                      </NavLink>
                      <button
                        type="button"
                        className={`nav-dropdown-control${resourceOpen ? " is-open" : ""}`}
                        aria-expanded={resourceOpen}
                        aria-controls="why-menu"
                        aria-label={`${resourceOpen ? "Close" : "Open"} ${label} submenu`}
                        onClick={() => {
                          if (window.matchMedia("(max-width: 1230px)").matches) {
                            setResourceOpen((value) => !value);
                          } else {
                            openResources();
                          }
                        }}
                      >
                        <span className="nav-caret" aria-hidden="true">
                          ▾
                        </span>
                      </button>
                    </div>
                    <div
                      id="why-menu"
                      className={`nav-dropdown-panel${resourceOpen ? " is-open" : ""}`}
                      aria-label="Why Alchemize menu"
                      onMouseEnter={openResourcesFromHover}
                      onMouseLeave={closeResourcesSoon}
                    >
                      {content.whyItems.map(([whyTo, whyLabel]) => (
                        <NavLink
                          key={whyTo}
                          to={whyTo}
                          className={({ isActive }) =>
                            `nav-dropdown-link${isActive ? " active" : ""}`
                          }
                          onClick={() => setResourceOpen(false)}
                        >
                          {whyLabel}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
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
              );
            })}
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

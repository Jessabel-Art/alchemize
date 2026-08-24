import Logo from "../brand/Logo.jsx";
import { LocalizedLink as Link } from "../../i18n/LocalizedLink.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import "./footer.css";

const groups = {
  en: [
    [
      "Individuals",
      [
        ["Tax Preparation", "/services/individuals/tax-preparation"],
        [
          "Notary & Documents",
          "/services/individuals/notary-document-services",
        ],
      ],
    ],
    [
      "Businesses",
      [
        [
          "Advisory & Optimization",
          "/services/businesses/advisory-optimization",
        ],
        [
          "Operations & Implementation",
          "/services/businesses/operations-implementation",
        ],
        [
          "Digital Business & Technology",
          "/services/businesses/digital-business-technology",
        ],
        [
          "Business Readiness & Growth",
          "/services/businesses/readiness-growth",
        ],
        [
          "Financial & Tax Support",
          "/services/businesses/financial-tax-support",
        ],
      ],
    ],
    [
      "Company",
      [
        ["Why Alchemize", "/why-alchemize"],
        ["Web & Digital Solutions", "/web-digital"],
        ["Resources", "/resources"],
        ["FAQ", "/faq"],
        ["Contact", "/contact"],
      ],
    ],
    [
      "Access",
      [
        ["Client Portal", "/client-portal"],
        ["Admin Access", "/admin"],
        ["Privacy Policy", "/privacy"],
        ["Terms of Service", "/terms"],
      ],
    ],
  ],
  es: [
    [
      "Personas",
      [
        ["Preparación de impuestos", "/services/individuals/tax-preparation"],
        [
          "Notaría y documentos",
          "/services/individuals/notary-document-services",
        ],
      ],
    ],
    [
      "Empresas",
      [
        [
          "Asesoría y optimización",
          "/services/businesses/advisory-optimization",
        ],
        [
          "Operaciones e implementación",
          "/services/businesses/operations-implementation",
        ],
        [
          "Tecnología para empresas",
          "/services/businesses/digital-business-technology",
        ],
        ["Preparación y crecimiento", "/services/businesses/readiness-growth"],
        [
          "Apoyo financiero y fiscal",
          "/services/businesses/financial-tax-support",
        ],
      ],
    ],
    [
      "Empresa",
      [
        ["Por qué Alchemize", "/why-alchemize"],
        ["Web y soluciones digitales", "/web-digital"],
        ["Recursos", "/resources"],
        ["Preguntas frecuentes", "/faq"],
        ["Contacto", "/contact"],
      ],
    ],
    [
      "Acceso",
      [
        ["Portal del cliente", "/client-portal"],
        ["Acceso administrativo", "/admin"],
        ["Política de privacidad (en inglés)", "/privacy"],
        ["Términos de servicio (en inglés)", "/terms"],
      ],
    ],
  ],
};

function Footer() {
  const { language, isSpanish } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-brand">
          <Link
            to="/"
            aria-label={isSpanish ? "Inicio de Alchemize" : "Alchemize home"}
          >
            <Logo surface="dark" className="brand-logo--footer" />
          </Link>
          <p>
            {isSpanish
              ? "Transformamos la complejidad en oportunidad."
              : "Transforming complexity into opportunity."}
          </p>
        </div>
        {groups[language].map(([title, links]) => (
          <div className="footer-group" key={title}>
            <h2>{title}</h2>
            {links.map(([label, to]) => (
              <Link key={label} to={to}>
                {label}
              </Link>
            ))}
          </div>
        ))}
        <div className="footer-bottom">
          <span>© 2026 Alchemize Business Services LLC</span>
          <span>getalchemize.com</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

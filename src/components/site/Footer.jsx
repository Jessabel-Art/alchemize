import { Link } from "react-router-dom";
import Logo from "../brand/Logo.jsx";
import "./footer.css";

const groups = [
  [
    "Individuals",
    [
      ["Tax Preparation", "/services/individuals/tax-preparation"],
      ["Insurance Solutions", "/services/individuals/insurance"],
      ["Notary & Documents", "/services/individuals/notary-document-services"],
    ],
  ],
  [
    "Businesses",
    [
      ["Advisory & Optimization", "/services/businesses/advisory-optimization"],
      [
        "Operations & Implementation",
        "/services/businesses/operations-implementation",
      ],
      [
        "Digital Business & Technology",
        "/services/businesses/digital-business-technology",
      ],
      ["Business Readiness & Growth", "/services/businesses/readiness-growth"],
      ["Financial & Tax Support", "/services/businesses/financial-tax-support"],
    ],
  ],
  [
    "Company",
    [
      ["Why Alchemize", "/why-alchemize"],
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
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-brand">
          <Link to="/" aria-label="Alchemize home">
            <Logo surface="dark" className="brand-logo--footer" />
          </Link>
          <p>Transforming complexity into opportunity.</p>
        </div>
        {groups.map(([title, links]) => (
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

import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "../brand/Logo.jsx";
import "./header.css";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Services" },
  { to: "/why-alchemize", label: "Why Alchemize" },
  { to: "/resources", label: "Resources" },
  { to: "/faq", label: "FAQ" },
];

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const close = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  return (
    <header className="site-header">
      <div className="header-shell">
        <Link
          to="/"
          className="site-logo"
          aria-label="Alchemize Business Services home"
        >
          <Logo surface="dark" responsive />
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={`${open ? "Close" : "Open"} navigation menu`}
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
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/contact" className="button button-primary header-cta">
            Schedule a Consultation
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;

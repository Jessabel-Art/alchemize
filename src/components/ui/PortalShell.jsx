import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "../brand/Logo.jsx";
import "./portal-shell.css";

function PortalShell({ title, navItems, children }) {
  const isAdminShell = title === "Alchemize Admin";
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1023) setNavOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`${navOpen ? "portal-shell portal-nav-open" : "portal-shell"}${isAdminShell ? " admin-portal-shell" : ""}`}
    >
      {
        <>
          <button
            type="button"
            className="portal-sidebar-toggle"
            aria-label={`Toggle ${isAdminShell ? "admin" : "client portal"} navigation`}
            aria-expanded={navOpen}
            aria-controls="portal-sidebar-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            Menu
          </button>
          <div
            className={
              navOpen
                ? "portal-sidebar-backdrop active"
                : "portal-sidebar-backdrop"
            }
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        </>
      }

      <aside className="portal-sidebar" id="portal-sidebar-nav">
        <div className="portal-brand">
          <Logo surface="dark" />
          <span>{title}</span>
        </div>

        <nav className="portal-nav" aria-label="Portal navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin/dashboard" || item.to === "/client-portal/dashboard"}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) =>
                isActive ? "portal-nav-item active" : "portal-nav-item"
              }
            >
              <span>{item.label}</span>
              {item.count > 0 ? (
                <span
                  className="portal-nav-badge"
                  aria-label={`${item.count} ${item.label.toLowerCase()} items need attention`}
                >
                  {item.count}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        {isAdminShell ? (
          <a className="portal-mobile-return" href="/">
            Return to website
          </a>
        ) : null}
      </aside>

      <main className="portal-main">
        <div className="portal-topbar">
          <span>Workspace</span>
          <a className="portal-topbar-return" href="/">
            Return to website
          </a>
        </div>
        {children}
      </main>
    </div>
  );
}

export default PortalShell;

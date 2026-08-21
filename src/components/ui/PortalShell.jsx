import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "../brand/Logo.jsx";
import "./portal-shell.css";

function PortalShell({ title, navItems, children }) {
  const isAdminShell = title === "Alchemize Admin";
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!isAdminShell) return undefined;
    const handleResize = () => {
      if (window.innerWidth > 1023) setNavOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAdminShell]);

  return (
    <div className={isAdminShell && navOpen ? "portal-shell admin-nav-open" : "portal-shell"}>
      {isAdminShell ? (
        <>
          <button
            type="button"
            className="portal-sidebar-toggle"
            aria-label="Toggle admin navigation"
            aria-expanded={navOpen}
            aria-controls="admin-sidebar-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            Menu
          </button>
          <div
            className={navOpen ? "portal-sidebar-backdrop active" : "portal-sidebar-backdrop"}
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        </>
      ) : null}

      <aside className="portal-sidebar" id={isAdminShell ? "admin-sidebar-nav" : undefined}>
        <div className="portal-brand">
          <Logo surface="dark" />
          <span>{title}</span>
        </div>

        <nav className="portal-nav" aria-label="Portal navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) =>
                isActive ? "portal-nav-item active" : "portal-nav-item"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="portal-main">
        <div className="portal-topbar">
          <span>Workspace</span>
          <a href="/">Return to website</a>
        </div>
        {children}
      </main>
    </div>
  );
}

export default PortalShell;

import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import PortalShell from "../components/ui/PortalShell.jsx";
import { auth } from "../services/admin-api.js";
import { portalApi } from "../services/portal-api.js";
import "../pages/portal/portal.css";
import "../pages/portal/client-workspace.css";

const baseNavItems = [
  { label: "Dashboard", to: "/client-portal/dashboard" },
  { label: "Services", to: "/client-portal/services" },
  { label: "Onboarding / Intake", to: "/client-portal/intake" },
  { label: "Tasks", to: "/client-portal/tasks" },
  { label: "Documents", to: "/client-portal/documents" },
  { label: "Appointments", to: "/client-portal/appointments" },
  { label: "Messages", to: "/client-portal/messages" },
  { label: "Billing", to: "/client-portal/billing" },
  { label: "Profile", to: "/client-portal/profile" },
];

function ClientPortalLayout() {
  const [access, setAccess] = useState("loading");
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let active = true;
    const refreshCounts = () =>
      portalApi
        .dashboard()
        .then(
          (dashboard) => active && setCounts(dashboard.navigation_counts || {}),
        )
        .catch(() => {});
    auth
      .session()
      .then((session) => {
        if (!active) return;
        const role = session?.user?.role_slug;
        const authorized =
          session?.authenticated &&
          ["client", "business-authorized-user"].includes(role);
        if (!authorized && import.meta.env.DEV) {
          console.error("Client Portal route authorization rejected", {
            authenticated: Boolean(session?.authenticated),
            role: role || null,
            reason: session?.authenticated
              ? "role_not_permitted"
              : "not_authenticated",
          });
        }
        setAccess(authorized ? "authorized" : "denied");
        if (authorized) {
          refreshCounts();
          window.addEventListener("alchemize:portal-refresh", refreshCounts);
        }
      })
      .catch((error) => {
        if (!active) return;
        if (import.meta.env.DEV) {
          console.error("Client Portal session resolution failed", {
            status: error?.status || null,
            code: error?.code || "SESSION_REQUEST_FAILED",
            message: error?.message || "Session request failed.",
          });
        }
        setAccess("denied");
      });
    return () => {
      active = false;
      window.removeEventListener("alchemize:portal-refresh", refreshCounts);
    };
  }, []);

  if (access === "loading") {
    return (
      <main className="portal-access-state">Loading client portal...</main>
    );
  }

  if (access === "denied") {
    return <Navigate to="/login" replace />;
  }

  return (
    <PortalShell
      title="Client Portal"
      navItems={baseNavItems.map((item) => ({
        ...item,
        count: counts[item.to.split("/").at(-1)] || 0,
      }))}
    >
      <Outlet />
    </PortalShell>
  );
}

export default ClientPortalLayout;

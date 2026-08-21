import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import PortalShell from "../components/ui/PortalShell.jsx";
import { adminStore } from "../../js/data/admin-store.js";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Leads", to: "/admin/leads" },
  { label: "Clients", to: "/admin/clients" },
  { label: "Services", to: "/admin/services" },
  { label: "Tasks", to: "/admin/tasks" },
  { label: "Documents", to: "/admin/documents" },
  { label: "Appointments", to: "/admin/appointments" },
  { label: "Billing", to: "/admin/billing" },
  { label: "Content", to: "/admin/content" },
  { label: "Reports", to: "/admin/reports" },
  { label: "Settings", to: "/admin/settings" },
];

function AdminLayout() {
  useEffect(() => {
    window.adminStore = adminStore;
    return () => { delete window.adminStore; };
  }, []);
  return (
    <PortalShell title="Alchemize Admin" navItems={navItems}>
      <Outlet />
    </PortalShell>
  );
}

export default AdminLayout;

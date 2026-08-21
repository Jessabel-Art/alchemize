import { Outlet } from "react-router-dom";
import PortalShell from "../components/ui/PortalShell.jsx";

const navItems = [
  { label: "Dashboard", to: "/client-portal/dashboard" },
  { label: "Services", to: "/client-portal/services" },
  { label: "Tasks", to: "/client-portal/tasks" },
  { label: "Documents", to: "/client-portal/documents" },
  { label: "Appointments", to: "/client-portal/appointments" },
  { label: "Messages", to: "/client-portal/messages" },
  { label: "Billing", to: "/client-portal/billing" },
  { label: "Profile", to: "/client-portal/profile" },
];

function ClientPortalLayout() {
  return (
    <PortalShell title="Client Portal" navItems={navItems}>
      <Outlet />
    </PortalShell>
  );
}

export default ClientPortalLayout;

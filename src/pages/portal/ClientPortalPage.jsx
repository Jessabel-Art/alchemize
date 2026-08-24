import { Navigate, useLocation } from "react-router-dom";
import PortalRecordsPage from "./PortalRecordsPage.jsx";

const resources = new Set([
  "services",
  "tasks",
  "documents",
  "appointments",
  "messages",
  "billing",
  "profile",
]);

function ClientPortalPage() {
  const location = useLocation();
  const resource = location.pathname.split("/").filter(Boolean).at(-1);

  if (!resources.has(resource)) {
    return <Navigate to="/client-portal/dashboard" replace />;
  }

  return <PortalRecordsPage resource={resource} />;
}

export default ClientPortalPage;

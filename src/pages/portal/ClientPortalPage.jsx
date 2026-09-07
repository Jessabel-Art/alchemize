import { Navigate, useLocation } from "react-router-dom";
import PortalRecordsPage from "./PortalRecordsPage.jsx";

const resources = new Set([
  "services",
  "tasks",
  "documents",
  "tasks-and-documents",
  "appointments",
  "messages",
  "billing",
  "profile",
]);

function ClientPortalPage() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const resource =
    segments[1] === "services" && segments[2] ? "services" : segments.at(-1);
  const engagementId =
    segments[1] === "services" && segments[2] ? segments[2] : null;

  if (resource === "tasks" || resource === "documents") {
    return (
      <Navigate
        to={"/client-portal/tasks-and-documents" + location.search}
        replace
      />
    );
  }

  if (!resources.has(resource)) {
    return <Navigate to="/client-portal/dashboard" replace />;
  }

  return <PortalRecordsPage resource={resource} engagementId={engagementId} />;
}

export default ClientPortalPage;

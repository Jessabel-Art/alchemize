import { Navigate, useParams } from "react-router-dom";
import ResourceDetailPage from "./ResourceDetailPage.jsx";
import { resourceBySlug } from "./resourcesData.js";

export default function ResourceRoutePage() {
  const { slug } = useParams();
  const resource = resourceBySlug.get(slug);
  return resource ? (
    <ResourceDetailPage resource={resource} />
  ) : (
    <Navigate to="/resources" replace />
  );
}

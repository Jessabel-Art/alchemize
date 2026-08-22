import { Navigate, useParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import ResourceDetailPage from "./ResourceDetailPage.jsx";
import { resourceBySlug } from "./resourcesData.js";
import { resourceBySlugEs } from "./resourcesData.es.js";

export default function ResourceRoutePage() {
  const { slug } = useParams();
  const { language, path } = useLanguage();
  const resource = (language === "es" ? resourceBySlugEs : resourceBySlug).get(
    slug,
  );
  return resource ? (
    <ResourceDetailPage resource={resource} />
  ) : (
    <Navigate to={path("/resources")} replace />
  );
}

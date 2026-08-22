import { Navigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

function ServiceCategoryPage({ audience }) {
  const { path } = useLanguage();
  return <Navigate to={path(`/services/#${audience}`)} replace />;
}

export default ServiceCategoryPage;

import { Navigate } from "react-router-dom";

function ServiceCategoryPage({ audience }) {
  return <Navigate to={`/services/#${audience}`} replace />;
}

export default ServiceCategoryPage;

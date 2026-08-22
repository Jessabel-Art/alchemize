import { Link, NavLink } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";

export function LocalizedLink({ to, ...props }) {
  const { path } = useLanguage();
  return <Link to={path(to)} {...props} />;
}

export function LocalizedNavLink({ to, ...props }) {
  const { path } = useLanguage();
  return <NavLink to={path(to)} {...props} />;
}

export default LocalizedLink;

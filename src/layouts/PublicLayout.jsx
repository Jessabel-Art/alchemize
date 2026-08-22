import { Outlet } from "react-router-dom";
import Header from "../components/site/Header.jsx";
import Footer from "../components/site/Footer.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function PublicLayout() {
  const { isSpanish } = useLanguage();
  return (
    <>
      <a className="skip-link" href="#main-content">
        {isSpanish ? "Saltar al contenido" : "Skip to content"}
      </a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default PublicLayout;

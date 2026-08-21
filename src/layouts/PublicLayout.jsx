import { Outlet } from "react-router-dom";
import Header from "../components/site/Header.jsx";
import Footer from "../components/site/Footer.jsx";

function PublicLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default PublicLayout;

import { useEffect, useState } from "react";
import {
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigationType,
  useNavigate,
} from "react-router-dom";
import { auth } from "../services/admin-api.js";
import PublicLayout from "../layouts/PublicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import ClientPortalLayout from "../layouts/ClientPortalLayout.jsx";
import HomePage from "../pages/home/HomePage.jsx";
import ServicesPage from "../pages/services/ServicesPage.jsx";
import WebDigitalPage from "../pages/web-digital/WebDigitalPage.jsx";
import ContactPage from "../pages/contact/ContactPage.jsx";
import FaqPage from "../pages/faq/FaqPage.jsx";
import WhyAlchemizePage from "../pages/why-alchemize/WhyAlchemizePage.jsx";
import ResourcesPage from "../pages/resources/ResourcesPage.jsx";
import MeetTheFounderPage from "../pages/resources/MeetTheFounderPage.jsx";
import ResourceRoutePage from "../pages/resources/ResourceRoutePage.jsx";
import LegalPage from "../pages/legal/LegalPage.jsx";
import AuthPage, { SetPasswordPage } from "../pages/auth/AuthPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AdminCommunicationsPage from "../pages/admin/AdminCommunicationsPage.jsx";
import AdminIntakePage from "../pages/admin/AdminIntakePage.jsx";
import ClientIntakePage from "../pages/portal/ClientIntakePage.jsx";
import {
  LeadManagementPage,
  ClientManagementPage,
  ServiceManagementPage,
  ClientRequestsPage,
  TaskManagementPage,
  DocumentManagementPage,
  AppointmentManagementPage,
  BillingManagementPage,
  InvoiceDetailPage,
  ContentManagementPage,
  ReportsPage,
  SettingsPage,
} from "../pages/admin/AdminOperationalPages.jsx";
import ClientPortalPage from "../pages/portal/ClientPortalPage.jsx";
import ClientPortalDashboardPage from "../pages/portal/ClientPortalDashboardPage.jsx";
import ServiceCategoryPage from "../pages/services/ServiceCategoryPage.jsx";
import ServiceDetailPage from "../pages/services/ServiceDetailPage.jsx";
import PublicSchedulingPage from "../pages/appointments/PublicSchedulingPage.jsx";

function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") {
      return;
    }

    if (location.hash) {
      const targetId = location.hash.slice(1);
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }

      const fallback = document.querySelector(location.hash);
      if (fallback) {
        fallback.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.hash, location.pathname, navigationType]);

  return null;
}

function ProtectedAdminRoute({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    auth
      .session()
      .then((payload) => {
        if (!active) return;
        const authenticated = Boolean(payload?.authenticated);
        const internalRole = [
          "owner-admin",
          "administrator",
          "staff",
          "read-only",
        ].includes(payload?.user?.role_slug);
        setStatus(authenticated && internalRole ? "authorized" : "redirect");
        if (!authenticated || !internalRole) {
          navigate("/login", { replace: true });
        }
      })
      .catch(() => {
        if (active) {
          setStatus("redirect");
          navigate("/login", { replace: true });
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "redirect") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <>
      <ScrollRestoration />
      <Routes>
        <Route path="/es" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path="about"
            element={<Navigate to="/es/why-alchemize" replace />}
          />
          <Route path="services" element={<ServicesPage />} />
          <Route path="web-digital" element={<WebDigitalPage />} />
          <Route
            path="services/individuals"
            element={<ServiceCategoryPage audience="individuals" />}
          />
          <Route
            path="services/businesses"
            element={<ServiceCategoryPage audience="businesses" />}
          />
          <Route
            path="services/businesses/digital-business-technology"
            element={<Navigate to="/es/web-digital" replace />}
          />
          <Route
            path="services/businesses/digital-business-technology/"
            element={<Navigate to="/es/web-digital" replace />}
          />
          <Route
            path="services/:audience/:slug"
            element={<ServiceDetailPage />}
          />
          <Route path="contact" element={<ContactPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route
            path="resources/client-resources"
            element={<ResourcesPage />}
          />
          <Route
            path="resources/meet-the-founder"
            element={<MeetTheFounderPage />}
          />
          <Route
            path="resources/documents-to-bring-to-a-consultation"
            element={
              <Navigate
                to="/es/resources/your-first-year-in-business"
                replace
              />
            }
          />
          <Route path="resources/:slug" element={<ResourceRoutePage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="why-alchemize" element={<WhyAlchemizePage />} />
        </Route>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/about"
            element={<Navigate to="/why-alchemize" replace />}
          />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/web-digital" element={<WebDigitalPage />} />
          <Route
            path="/services/individuals"
            element={<ServiceCategoryPage audience="individuals" />}
          />
          <Route
            path="/services/businesses"
            element={<ServiceCategoryPage audience="businesses" />}
          />
          <Route
            path="/services/businesses/digital-business-technology"
            element={<Navigate to="/web-digital" replace />}
          />
          <Route
            path="/services/businesses/digital-business-technology/"
            element={<Navigate to="/web-digital" replace />}
          />
          <Route
            path="/services/:audience/:slug"
            element={<ServiceDetailPage />}
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/appointment/schedule/:token"
            element={<PublicSchedulingPage />}
          />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route
            path="/resources/client-resources"
            element={<ResourcesPage />}
          />
          <Route
            path="/resources/meet-the-founder"
            element={<MeetTheFounderPage />}
          />
          <Route path="/resources/:slug" element={<ResourceRoutePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/why-alchemize" element={<WhyAlchemizePage />} />
          <Route
            path="/privacy"
            element={
              <LegalPage
                title="Privacy Policy"
                summary="How Alchemize Business Services collects, uses, shares, and protects information."
              />
            }
          />
          <Route
            path="/terms"
            element={
              <LegalPage
                title="Terms of Service"
                summary="Terms governing use of the Alchemize Business Services website and public materials."
              />
            }
          />
        </Route>

        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={<AuthPage title="Login" buttonLabel="Log in" />}
          />
          <Route
            path="/register"
            element={<AuthPage title="Register" buttonLabel="Create account" />}
          />
          <Route path="/set-password" element={<SetPasswordPage />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="leads" element={<LeadManagementPage />} />
          <Route path="clients" element={<ClientManagementPage />} />
          <Route path="clients/:clientId" element={<ClientManagementPage />} />
          <Route path="services" element={<ServiceManagementPage />} />
          <Route path="client-requests" element={<ClientRequestsPage />} />
          <Route
            path="intakes"
            element={
              <Navigate to="/admin/client-requests?type=intake" replace />
            }
          />
          <Route
            path="intake"
            element={
              <Navigate to="/admin/client-requests?type=intake" replace />
            }
          />
          <Route
            path="tasks"
            element={<Navigate to="/admin/client-requests?type=task" replace />}
          />
          <Route
            path="documents"
            element={
              <Navigate to="/admin/client-requests?type=document" replace />
            }
          />
          <Route path="communications" element={<AdminCommunicationsPage />} />
          <Route path="appointments" element={<AppointmentManagementPage />} />
          <Route path="billing" element={<BillingManagementPage />} />
          <Route
            path="billing/invoices/:invoiceId"
            element={<InvoiceDetailPage />}
          />
          <Route path="content" element={<ContentManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/client-portal/*" element={<ClientPortalLayout />}>
          <Route
            index
            element={<Navigate to="/client-portal/dashboard" replace />}
          />
          <Route path="dashboard" element={<ClientPortalDashboardPage />} />
          <Route path="services" element={<ClientPortalPage />} />
          <Route path="intake" element={<ClientIntakePage />} />
          <Route path="tasks" element={<ClientPortalPage />} />
          <Route path="documents" element={<ClientPortalPage />} />
          <Route path="appointments" element={<ClientPortalPage />} />
          <Route path="messages" element={<ClientPortalPage />} />
          <Route path="billing" element={<ClientPortalPage />} />
          <Route path="profile" element={<ClientPortalPage />} />
          <Route
            path="*"
            element={<Navigate to="/client-portal/dashboard" replace />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;

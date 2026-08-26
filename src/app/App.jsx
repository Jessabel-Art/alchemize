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
import ResourceDetailPage from "../pages/resources/ResourceDetailPage.jsx";
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
            path="/services/:audience/:slug"
            element={<ServiceDetailPage />}
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route
            path="/resources/client-resources"
            element={<ResourcesPage />}
          />
          <Route
            path="/resources/meet-the-founder"
            element={<MeetTheFounderPage />}
          />
          <Route
            path="/resources/documents-to-bring-to-a-consultation"
            element={
              <Navigate to="/resources/your-first-year-in-business" replace />
            }
          />
          <Route path="/resources/:slug" element={<ResourceRoutePage />} />
          <Route
            path="/legacy-resource-reference/preparing-for-tax-season"
            element={
              <ResourceDetailPage
                eyebrow="Taxes"
                title="Preparing for Tax Season"
                summary="A calmer filing process starts with an organized record system and enough time to address what is missing."
                sections={[
                  {
                    type: "paragraph",
                    content:
                      "Tax preparation becomes easier when gathering records is a routine rather than a last-minute search.",
                  },
                  {
                    type: "heading",
                    content: "Start before every form arrives",
                  },
                  {
                    type: "paragraph",
                    content:
                      "Create one physical folder or secured digital location for the filing year. Add records as they arrive and maintain a short list of expected items that have not arrived yet.",
                  },
                  { type: "heading", content: "Build the record set" },
                  {
                    type: "list",
                    items: [
                      "Income statements and other income records",
                      "Applicable expense and deduction support",
                      "Prior-year return and carryforward information",
                      "Records connected to major life or business changes",
                      "Applicable estimated-payment information",
                    ],
                  },
                  { type: "heading", content: "Use a simple timeline" },
                  {
                    type: "ordered-list",
                    items: [
                      "During the year: file records consistently and keep business and personal items separate.",
                      "Before tax documents arrive: review last year’s categories and list expected issuers.",
                      "As documents arrive: compare each item with the list and note corrections needed.",
                      "Before preparation: review the folder once, write down questions, and follow secure transfer instructions.",
                    ],
                  },
                  {
                    type: "note",
                    content:
                      "This guide provides general organizational information. It is not individualized tax advice and does not determine whether a particular deduction or credit applies.",
                  },
                  { type: "heading", content: "If something is missing" },
                  {
                    type: "paragraph",
                    content:
                      "Do not guess. Identify the issuer or record source, request a replacement or correction where appropriate, and ask whether preparation should wait. Keeping a missing-items list makes follow-up more reliable.",
                  },
                ]}
                related={[
                  {
                    title: "Tax Documents Checklist",
                    href: "/resources/tax-documents-checklist/",
                  },
                  {
                    title: "Tax Preparation",
                    href: "/services/individuals/tax-preparation",
                  },
                ]}
              />
            }
          />
          <Route
            path="/legacy-resource-reference/starting-a-business-organization-checklist"
            element={
              <ResourceDetailPage
                eyebrow="Business"
                title="Starting a Business: Organization Checklist"
                summary="Turn a business idea into an orderly administrative setup with clear records, responsibilities, and next steps."
                sections={[
                  {
                    type: "paragraph",
                    content:
                      "Good organization begins before forms are filed. Clarify the business, the people involved, and the information that will support each administrative step.",
                  },
                  { type: "heading", content: "Define the starting picture" },
                  {
                    type: "list",
                    items: [
                      "Describe what the business will do and who it will serve",
                      "List owners, roles, decision responsibilities, and reliable contact information",
                      "Identify the proposed business name and research requirements through appropriate official sources",
                      "Write down questions that require legal, tax, insurance, or licensing guidance",
                    ],
                  },
                  { type: "heading", content: "Prepare for formation" },
                  {
                    type: "paragraph",
                    content:
                      "Organize the information needed to discuss entity structure, formation filings, an EIN-related workflow, and initial registrations. Choosing an entity can have legal and tax consequences, so administrative support should not replace qualified advice.",
                  },
                  { type: "heading", content: "Separate business activity" },
                  {
                    type: "list",
                    items: [
                      "Create dedicated business contact and record systems.",
                      "Keep business and personal income and expenses distinct.",
                      "Retain formation records, tax correspondence, agreements, licenses, and insurance information by category.",
                      "Choose who will maintain each record and how often it will be reviewed.",
                    ],
                  },
                  { type: "heading", content: "Create a recurring calendar" },
                  {
                    type: "paragraph",
                    content:
                      "Track filing dates, renewals, tax-preparation milestones, insurance reviews, contract dates, and internal operating tasks. Record the source of every deadline rather than relying on memory.",
                  },
                  {
                    type: "note",
                    content:
                      "This checklist provides administrative organization guidance, not legal advice or a recommendation of a particular entity type.",
                  },
                ]}
                related={[
                  {
                    title: "Business Records Organization",
                    href: "/resources/business-records-organization/",
                  },
                  {
                    title: "Business Formation & Startup",
                    href: "/services/businesses/readiness-growth",
                  },
                ]}
              />
            }
          />
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
          <Route path="intakes" element={<AdminIntakePage />} />
          <Route path="services" element={<ServiceManagementPage />} />
          <Route path="tasks" element={<TaskManagementPage />} />
          <Route path="documents" element={<DocumentManagementPage />} />
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

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
import ContactPage from "../pages/contact/ContactPage.jsx";
import FaqPage from "../pages/faq/FaqPage.jsx";
import WhyAlchemizePage from "../pages/why-alchemize/WhyAlchemizePage.jsx";
import ResourcesPage from "../pages/resources/ResourcesPage.jsx";
import ResourceDetailPage from "../pages/resources/ResourceDetailPage.jsx";
import ResourceRoutePage from "../pages/resources/ResourceRoutePage.jsx";
import LegalPage from "../pages/legal/LegalPage.jsx";
import AuthPage from "../pages/auth/AuthPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
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
        setStatus(authenticated ? "authorized" : "redirect");
        if (!authenticated) {
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
        <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/about"
          element={<Navigate to="/why-alchemize" replace />}
        />
        <Route path="/services" element={<ServicesPage />} />
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
                { type: "heading", content: "Start before every form arrives" },
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
          path="/legacy-resource-reference/understanding-insurance-coverage"
          element={
            <ResourceDetailPage
              eyebrow="Insurance"
              title="Understanding Insurance Coverage"
              summary="Learn the terms that shape cost, access, and protection before comparing available options."
              sections={[
                {
                  type: "paragraph",
                  content:
                    "Coverage is easier to evaluate when you separate what is protected, what you pay, and what the policy does not cover.",
                },
                { type: "heading", content: "Terms to understand" },
                { type: "subheading", content: "Premium" },
                {
                  type: "paragraph",
                  content:
                    "The amount paid to maintain coverage. A lower premium does not automatically mean a better fit if other costs or limits create a gap.",
                },
                { type: "subheading", content: "Deductible" },
                {
                  type: "paragraph",
                  content:
                    "An amount the covered person may be responsible for before certain benefits apply. How and when it applies depends on the coverage.",
                },
                { type: "subheading", content: "Limit and exclusion" },
                {
                  type: "paragraph",
                  content:
                    "A limit caps what the policy may pay or provide. An exclusion identifies circumstances the policy does not cover. Both deserve careful review.",
                },
                { type: "subheading", content: "Beneficiary" },
                {
                  type: "paragraph",
                  content:
                    "For coverage where beneficiaries apply, this is the person or entity designated to receive benefits. Names and designations should be reviewed after meaningful life changes.",
                },
                { type: "heading", content: "Prepare the protection picture" },
                {
                  type: "list",
                  items: [
                    "Identify the people, income, property, or obligations you are trying to protect",
                    "List current coverage and what you understand about it",
                    "Note budget constraints and predictable out-of-pocket responsibilities",
                    "Write down changes expected in the near future",
                  ],
                },
                {
                  type: "note",
                  content:
                    "This guide is general education. Coverage availability, terms, and suitability depend on the specific situation and applicable requirements.",
                },
              ]}
              related={[
                {
                  title: "Questions Before Choosing Insurance",
                  href: "/resources/questions-to-ask-before-choosing-insurance/",
                },
                {
                  title: "Insurance Solutions",
                  href: "/services/individuals/insurance",
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
        <Route path="tasks" element={<TaskManagementPage />} />
        <Route path="documents" element={<DocumentManagementPage />} />
        <Route path="appointments" element={<AppointmentManagementPage />} />
        <Route path="billing" element={<BillingManagementPage />} />
        <Route path="billing/invoices/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="content" element={<ContentManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/client-portal/*" element={<ClientPortalLayout />}>
        <Route index element={<ClientPortalPage />} />
        <Route path="dashboard" element={<ClientPortalDashboardPage />} />
        <Route
          path="services"
          element={
            <ClientPortalPage
              eyebrow="My services"
              title="My services"
              summary="Review the services active in your account and the status of each current engagement."
              cards={[
                {
                  title: "Tax preparation",
                  text: "Current planning, document collection, and filing support.",
                },
                {
                  title: "Insurance guidance",
                  text: "Risk review and coverage conversations for your current needs.",
                },
                {
                  title: "Business operations",
                  text: "Administrative structure and process support for the business.",
                },
                {
                  title: "Consultation",
                  text: "Upcoming guidance and follow-up planning for service work.",
                },
              ]}
            />
          }
        />
        <Route
          path="tasks"
          element={
            <ClientPortalPage
              eyebrow="Tasks"
              title="Tasks"
              summary="See the action items, documents, and next steps connected to your active service work."
              cards={[
                {
                  title: "Waiting on you",
                  text: "Action items that need your review, response, or information.",
                },
                {
                  title: "In progress",
                  text: "Work already moving forward with an assigned next step.",
                },
                {
                  title: "Soon",
                  text: "Upcoming deadlines and follow-up items coming up soon.",
                },
                {
                  title: "Completed",
                  text: "The latest items already finished and recorded.",
                },
              ]}
            />
          }
        />
        <Route
          path="documents"
          element={
            <ClientPortalPage
              eyebrow="Documents"
              title="Documents"
              summary="Access the shared files, requests, and records that support your service workflow."
              cards={[
                {
                  title: "Requested",
                  text: "Documents that still need to be supplied or reviewed.",
                },
                {
                  title: "Shared",
                  text: "Files provided to your team for the active engagement.",
                },
                {
                  title: "Awaiting review",
                  text: "Items in process and waiting on evaluation.",
                },
                {
                  title: "Archive",
                  text: "Completed record sets kept for future reference.",
                },
              ]}
            />
          }
        />
        <Route
          path="appointments"
          element={
            <ClientPortalPage
              eyebrow="Appointments"
              title="Appointments"
              summary="Keep your upcoming consultations and check-ins organized in one place."
              cards={[
                {
                  title: "Upcoming",
                  text: "Scheduled meetings and touchpoints on the calendar.",
                },
                {
                  title: "Confirmed",
                  text: "Appointments already agreed and scheduled in the plan.",
                },
                {
                  title: "Reschedule",
                  text: "Meetings that may need a timing adjustment.",
                },
                {
                  title: "Follow-up",
                  text: "Next-step meetings after review or delivery.",
                },
              ]}
            />
          }
        />
        <Route
          path="messages"
          element={
            <ClientPortalPage
              eyebrow="Messages"
              title="Messages"
              summary="Review notes, updates, and service communication from the team."
              cards={[
                {
                  title: "Unread",
                  text: "New communication that needs review.",
                },
                {
                  title: "Action needed",
                  text: "Messages with a response or next-step requirement.",
                },
                {
                  title: "Archived",
                  text: "Older communication retained for reference.",
                },
                {
                  title: "Templates",
                  text: "Shared guidance and standard follow-up language.",
                },
              ]}
            />
          }
        />
        <Route
          path="billing"
          element={
            <ClientPortalPage
              eyebrow="Billing"
              title="Billing"
              summary="Review invoices, account balance, and payment cadence for your services."
              cards={[
                {
                  title: "Open invoices",
                  text: "Amounts still awaiting payment or review.",
                },
                {
                  title: "Paid",
                  text: "Completed payment activity for current work.",
                },
                {
                  title: "Past due",
                  text: "Outstanding balances requiring attention.",
                },
                {
                  title: "Schedule",
                  text: "Recurring or planned service charges for your account.",
                },
              ]}
            />
          }
        />
        <Route
          path="profile"
          element={
            <ClientPortalPage
              eyebrow="Profile"
              title="Profile"
              summary="Keep the simplest and most accurate details available for future service and communication."
              cards={[
                {
                  title: "Business details",
                  text: "Primary service details and account context.",
                },
                {
                  title: "Contact info",
                  text: "Current communication preferences and reachability.",
                },
                {
                  title: "Documents",
                  text: "Reference records and business information currently on file.",
                },
                {
                  title: "Preferences",
                  text: "General settings tied to portal communication and service flow.",
                },
              ]}
            />
          }
        />
      </Route>
      </Routes>
    </>
  );
}

export default App;

import PortalSectionPage from "../../components/ui/PortalSectionPage.jsx";
import "./portal.css";

const defaultCards = [
  { title: "Dashboard", text: "Overview of active items, upcoming milestones, and current status." },
  { title: "Documents", text: "Shared records, uploads, and important business documents." },
  { title: "Appointments", text: "Consultations, check-ins, and scheduling context for your work." },
  { title: "Messages", text: "Service updates and direct communication from your Alchemize team." },
  { title: "Billing", text: "Invoices, payment status, and outstanding balance information." },
  { title: "Profile", text: "Keep your account, business, and contact details up to date." },
];

function ClientPortalPage({
  eyebrow = "Client portal",
  title = "Your business workspace",
  summary = "A focused place to review your service delivery, upcoming priorities, and essential account details.",
  cards = defaultCards,
}) {
  return <PortalSectionPage eyebrow={eyebrow} title={title} summary={summary} cards={cards} />;
}

export default ClientPortalPage;

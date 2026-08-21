import PortalSectionPage from "../../components/ui/PortalSectionPage.jsx";
import "./portal.css";

const cards = [
  { title: "Dashboard", text: "Review active milestones, upcoming tasks, and service status." },
  { title: "Appointments", text: "Manage consultation times and keep important scheduling context nearby." },
  { title: "Documents", text: "Access shared files, records, and decisions tied to the active service work." },
  { title: "Messages", text: "Track communication from your service team and keep follow-up organized." },
  { title: "Billing", text: "Review invoices, payments, and outstanding balance details." },
  { title: "Profile", text: "Keep business and personal details current for a smooth process." },
];

function ClientPortalDashboardPage() {
  return (
    <PortalSectionPage
      eyebrow="Client portal"
      title="Your service workspace"
      summary="A clear place to review upcoming tasks, documents, appointments, and service-related communication."
      cards={cards}
    />
  );
}

export default ClientPortalDashboardPage;

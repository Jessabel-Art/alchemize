import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import PortalShell from "../components/ui/PortalShell.jsx";
import { adminStore } from "../../js/data/admin-store.js";
import {
  appointments,
  clients,
  documents,
  engagements,
  invoices,
  payments,
  services,
  tasks,
} from "../services/admin-api.js";

const titleCase = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const mapClient = (row) => ({
  id: String(row.id),
  displayName: row.display_name,
  clientType: titleCase(row.client_type),
  businessName: row.legal_name || "",
  email: row.primary_email || "",
  phone: row.primary_phone || "",
  preferredContactMethod: titleCase(row.preferred_contact_method || "email"),
  status: titleCase(row.status),
  portalStatus: titleCase(row.portal_status),
  portalUserStatus: row.portal_user_status,
  portalPasswordSet: Boolean(Number(row.portal_password_set)),
  driveSyncStatus: titleCase(row.drive_sync_status || "not_configured"),
  stripeSyncStatus: titleCase(row.stripe_sync_status || "not_configured"),
  lastActivity: row.updated_at || row.created_at,
  createdAt: row.created_at,
});
const mapService = (row) => ({
  id: String(row.id),
  serviceName: row.service_name,
  serviceCode: row.service_code,
  status: titleCase(row.status),
});
const mapAppointment = (row) => {
  const start = String(row.scheduled_at || "").replace(" ", "T");
  const date = start.slice(0, 10);
  const time = start
    ? new Date(start).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
  return {
    id: String(row.id),
    clientId: row.client_id == null ? "" : String(row.client_id),
    type: titleCase(row.appointment_type),
    title: titleCase(row.appointment_type),
    serviceName: row.service_name || "",
    date,
    time,
    status: titleCase(row.status),
    deliveryMethod: titleCase(row.location_type || "virtual"),
    duration: 60,
    needsPreparation: Boolean(Number(row.preparation_required)),
    followUpRequired: Boolean(Number(row.follow_up_required)),
    calendarSyncStatus: titleCase(row.calendar_sync_status || "not_configured"),
  };
};
const mapEngagement = (row) => ({
  id: String(row.id),
  publicId: row.public_id,
  clientId: String(row.client_id),
  serviceName: row.title,
  title: row.title,
  description: row.description || "",
  status: titleCase(row.status),
  startedAt: row.start_date,
  targetDate: row.target_date,
  assignedTo: "Owner / Administrator",
});
const mapTask = (row) => ({
  id: String(row.id),
  publicId: row.public_id,
  clientId: row.client_id == null ? "" : String(row.client_id),
  engagementId: row.engagement_id == null ? "" : String(row.engagement_id),
  title: row.title,
  description: row.description || "",
  priority: titleCase(row.priority),
  dueDate: row.due_date,
  status: titleCase(row.status),
  visibility: row.visibility,
  assignedTo: "Owner / Administrator",
});
const mapDocument = (row) => ({
  id: String(row.id),
  publicId: row.public_id,
  clientId: String(row.client_id),
  engagementId: row.engagement_id == null ? "" : String(row.engagement_id),
  name: row.document_name,
  category: row.document_type || "Document",
  status: titleCase(row.status),
  visibility:
    row.visibility === "internal" ? "Internal Only" : "Client Visible",
  requestedAt: row.requested_date,
  receivedAt: row.received_date,
  instructions: row.client_instructions || "",
  driveSyncStatus: titleCase(row.drive_sync_status || "not_configured"),
});
const mapInvoice = (row) => ({
  id: String(row.id),
  publicId: row.public_id,
  invoiceNumber: row.invoice_number,
  clientId: String(row.client_id),
  engagementId: row.engagement_id == null ? "" : String(row.engagement_id),
  invoiceDate: row.invoice_date,
  dueAt: row.due_date,
  status: titleCase(row.status),
  currency: row.currency,
  lineItems: (row.line_items?.length
    ? row.line_items
    : [
        {
          id: `subtotal-${row.id}`,
          description: "Invoice services",
          quantity: 1,
          unit_price: Number(row.subtotal || 0),
          amount: Number(row.subtotal || 0),
        },
      ]
  ).map((item) => ({
    id: item.id,
    serviceCode: item.service_code || "",
    description: item.description,
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unit_price || 0),
    amount: Number(item.amount || 0),
    billingType: item.billing_type || "Custom",
  })),
  adjustments: Number(row.adjustment_total || 0),
  creditsApplied: Number(row.credit_deposit_total || 0),
  paidAmount: Number(row.paid_total || 0),
  notes: row.client_facing_notes || "",
  internalMemo: row.internal_notes || "",
  stripeSyncStatus: titleCase(row.stripe_sync_status || "not_configured"),
});
const mapPayment = (row) => ({
  id: String(row.id),
  invoiceId: String(row.invoice_id),
  clientId: String(row.client_id),
  date: row.payment_date,
  amount: Number(row.amount || 0),
  methodLabel: titleCase(row.payment_method || "manual"),
  reference: row.external_reference || "",
  receiptUrl: row.receipt_url || "",
});

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Leads", to: "/admin/leads" },
  { label: "Clients", to: "/admin/clients" },
  { label: "Intake", to: "/admin/intakes" },
  { label: "Services", to: "/admin/services" },
  { label: "Tasks", to: "/admin/tasks" },
  { label: "Documents", to: "/admin/documents" },
  { label: "Communications", to: "/admin/communications" },
  { label: "Appointments", to: "/admin/appointments" },
  { label: "Billing", to: "/admin/billing" },
  { label: "Content", to: "/admin/content" },
  { label: "Reports", to: "/admin/reports" },
  { label: "Settings", to: "/admin/settings" },
];

function AdminLayout() {
  const [loadState, setLoadState] = useState({ loading: true, error: "" });
  useEffect(() => {
    window.adminStore = adminStore;
    return () => {
      delete window.adminStore;
    };
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([
      clients.list(),
      services.list(),
      appointments.list(),
      engagements.list(),
      tasks.list(),
      documents.list(),
      invoices.list(),
      payments.list(),
    ])
      .then(
        ([
          clientRows,
          serviceRows,
          appointmentRows,
          engagementRows,
          taskRows,
          documentRows,
          invoiceRows,
          paymentRows,
        ]) => {
          if (!active) return;
          adminStore.replaceCollections({
            clients: (clientRows || []).map(mapClient),
            services: (serviceRows || []).map(mapService),
            appointments: (appointmentRows || []).map(mapAppointment),
            engagements: (engagementRows || []).map(mapEngagement),
            tasks: (taskRows || []).map(mapTask),
            documents: (documentRows || []).map(mapDocument),
            invoices: (invoiceRows || []).map(mapInvoice),
            payments: (paymentRows || []).map(mapPayment),
          });
          setLoadState({ loading: false, error: "" });
        },
      )
      .catch(
        (error) =>
          active &&
          setLoadState({
            loading: false,
            error: error.message || "Admin data could not be loaded.",
          }),
      );
    return () => {
      active = false;
    };
  }, []);
  return (
    <PortalShell title="Alchemize Admin" navItems={navItems}>
      {loadState.loading ? (
        <div className="admin-feedback">Loading admin records…</div>
      ) : null}
      {loadState.error ? (
        <div className="admin-feedback error" role="alert">
          {loadState.error} Refresh to try again.
        </div>
      ) : null}
      {!loadState.loading && !loadState.error ? <Outlet /> : null}
    </PortalShell>
  );
}

export default AdminLayout;

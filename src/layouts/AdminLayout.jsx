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
  leads,
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
  publicName: row.public_name || row.service_name,
  category: row.category || "General",
  audience: titleCase(row.audience),
  status: titleCase(row.catalog_status || row.status),
  catalogStatus: row.catalog_status || "ACTIVE",
  pricingType: row.pricing_type || "FIXED",
  billingType: titleCase(row.billing_type || "custom"),
  defaultPrice: row.default_price == null ? null : Number(row.default_price),
  active: Boolean(Number(row.active_flag)),
  selectable:
    Boolean(Number(row.active_flag)) &&
    ["ACTIVE", "CUSTOM_SOW_ONLY", "MANUAL_REVIEW"].includes(row.catalog_status),
  shortDescription: row.description || "",
  internalPricingNotes: row.internal_pricing_notes || "",
  catalogVersion: row.catalog_version,
  priceLocked: Boolean(Number(row.price_locked)),
  tiers: (row.tiers || []).map((tier) => ({
    id: String(tier.id),
    tierKey: tier.tier_key,
    tierName: tier.tier_name,
    description: tier.description || "",
    basePrice: tier.base_price == null ? null : Number(tier.base_price),
    minimumPrice:
      tier.minimum_price == null ? null : Number(tier.minimum_price),
    billingFrequency: tier.billing_frequency,
    pricingType: tier.pricing_type,
    status: tier.status,
    active: Boolean(Number(tier.active_flag)),
    limits: tier.limits_metadata,
    invoiceDescription: tier.invoice_description || "",
  })),
  addOns: (row.add_ons || []).map((addOn) => ({
    id: String(addOn.id),
    addOnCode: addOn.add_on_code,
    addOnName: addOn.name,
    description: addOn.description || "",
    defaultPrice:
      addOn.default_price == null ? null : Number(addOn.default_price),
    pricingMethod: addOn.pricing_method,
    unit: addOn.unit,
    active: Boolean(Number(addOn.active_flag)),
  })),
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
    serviceId: row.service_id == null ? "" : String(row.service_id),
    type: titleCase(row.appointment_type),
    title: titleCase(row.appointment_type),
    serviceName: row.service_name || "",
    date,
    time,
    status: titleCase(row.status),
    deliveryMethod: titleCase(row.location_type || "virtual"),
    duration: Number(row.duration_minutes || 60),
    notes: row.internal_notes || "",
    meetingMethod: titleCase(row.meeting_method || "phone"),
    needsPreparation: Boolean(Number(row.preparation_required)),
    followUpRequired: Boolean(Number(row.follow_up_required)),
    calendarSyncStatus: titleCase(row.calendar_sync_status || "not_configured"),
  };
};
const mapEngagement = (row) => ({
  id: String(row.id),
  publicId: row.public_id,
  clientId: String(row.client_id),
  serviceId: row.service_id == null ? "" : String(row.service_id),
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
  subtotal: Number(row.subtotal || 0),
  amount: Number(row.subtotal || 0),
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
  { label: "Services", to: "/admin/services" },
  { label: "Client Requests", to: "/admin/client-requests" },
  { label: "Communications", to: "/admin/communications" },
  { label: "Appointments", to: "/admin/appointments" },
  { label: "Billing", to: "/admin/billing" },
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
      leads.list(),
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
          leadRows,
        ]) => {
          if (!active) return;
          adminStore.replaceCollections({
            clients: (clientRows || []).map(mapClient),
            services: (serviceRows || [])
              .filter(
                (row) =>
                  row.catalog_status !== "NOT_OFFERED" &&
                  row.service_code !== "business-financing",
              )
              .map(mapService),
            appointments: (appointmentRows || []).map(mapAppointment),
            engagements: (engagementRows || []).map(mapEngagement),
            tasks: (taskRows || []).map(mapTask),
            documents: (documentRows || []).map(mapDocument),
            invoices: (invoiceRows || []).map(mapInvoice),
            payments: (paymentRows || []).map(mapPayment),
            leads: (leadRows || []).map((row) => ({
              id: String(row.id),
              name: row.full_name,
              email: row.email || "",
              phone: row.phone || "",
              audience: titleCase(row.audience),
              serviceInterest: row.service_key
                ? titleCase(row.service_key)
                : "General consultation",
              source: titleCase(row.source || "website_contact"),
              status: titleCase(row.status),
              receivedAt: row.created_at,
              lastContact: row.updated_at,
              assignedTo: row.assigned_owner || "Owner / Administrator",
              nextAction: row.next_action || "Review inquiry",
            })),
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
      {!loadState.loading ? <Outlet /> : null}
    </PortalShell>
  );
}

export default AdminLayout;

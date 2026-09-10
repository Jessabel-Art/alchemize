import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { portalApi } from "../../services/portal-api.js";
import { businessContact, contactRouting } from "../../data/contactInfo.js";
import InvoiceDocument from "../../components/invoices/InvoiceDocument.jsx";
import "./client-invoice-detail.css";

const statusLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function daysBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
    return null;
  return Math.round((endDate - startDate) / 86400000);
}

// Projects the client-scoped API response (already ownership-checked and
// already excluding admin-only columns such as internal_notes) into the
// same prop shape the shared InvoiceDocument renders for Admin.
function toDocumentInvoice(invoice) {
  const termsDays = daysBetween(invoice.invoice_date, invoice.due_date);
  const paymentTermsLabel =
    termsDays === null
      ? ""
      : termsDays <= 0
        ? "Due on receipt"
        : `Net ${termsDays}`;
  return {
    invoiceNumber: invoice.invoice_number || invoice.id,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    status: statusLabel(invoice.status),
    paymentTermsLabel,
    clientName: invoice.client_display_name || "Client",
    billingMeta: [invoice.client_email, invoice.client_phone].filter(Boolean),
    businessName: "Alchemize Business Services",
    businessEmail: contactRouting.billing.email,
    businessWebsite: "getalchemize.com",
    businessPhone: businessContact.phone.display,
    lineItems: (invoice.line_items || []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      amount: item.amount,
    })),
    subtotal: invoice.subtotal,
    adjustments: invoice.adjustment_total,
    creditsApplied: invoice.credit_deposit_total,
    // Same formula as the admin totals calculation (subtotal + adjustments
    // - credits, floored at 0), applied to the same authoritative stored
    // columns both portals read — not recalculated differently per portal.
    total: Math.max(
      Number(invoice.subtotal || 0) +
        Number(invoice.adjustment_total || 0) -
        Number(invoice.credit_deposit_total || 0),
      0,
    ),
    paidAmount: invoice.paid_total,
    balance: invoice.outstanding_balance,
    clientFacingNote: invoice.client_facing_notes || "",
  };
}

export default function ClientInvoiceDetail() {
  const { invoiceId } = useParams();
  const [state, setState] = useState({
    status: "loading",
    invoice: null,
    error: "",
  });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", invoice: null, error: "" });
    portalApi
      .invoiceDetail(invoiceId)
      .then((data) => {
        if (active)
          setState({ status: "ready", invoice: data.invoice, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({ status: "error", invoice: null, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [invoiceId]);

  return (
    <div className="portal-page client-invoice-detail-page">
      <header className="portal-page-header">
        <div>
          <span className="section-kicker">Billing</span>
          <h1>Invoice</h1>
        </div>
        <div className="portal-action-group">
          <Link className="portal-action-button" to="/client-portal/billing">
            ← Back to Billing
          </Link>
          {state.status === "ready" ? (
            <button
              type="button"
              className="portal-action-button"
              onClick={() => window.print()}
            >
              <Printer size={16} aria-hidden="true" />
              Print invoice
            </button>
          ) : null}
        </div>
      </header>
      {state.status === "loading" ? (
        <p role="status" className="portal-empty-state">
          Loading invoice…
        </p>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="portal-empty-state">
          {state.error}
        </p>
      ) : null}
      {state.status === "ready" ? (
        <InvoiceDocument invoice={toDocumentInvoice(state.invoice)} />
      ) : null}
    </div>
  );
}

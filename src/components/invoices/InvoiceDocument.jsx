import "./invoice-document.css";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value || 0),
  );

// Mirrors the invoice-relevant subset of the shared admin statusTone map
// (src/pages/admin/AdminOperationalPages.jsx). "Partially Paid"/"Past Due"
// intentionally have no tone override — the base .invoice-print-status
// style (a soft gold) is the existing "needs attention" look; only
// success/info/neutral have distinct tone classes today.
const statusTone = {
  Draft: "neutral",
  Open: "info",
  Paid: "success",
  Cancelled: "neutral",
};

/**
 * The single canonical invoice document, shared by Admin Portal → Billing /
 * Invoice and Client Portal → Billing → View invoice. Purely presentational:
 * it renders exactly the fields it is given and performs no data fetching,
 * authorization, or admin-only lookups, so each caller is responsible for
 * supplying an already role-appropriate, client-safe (or admin) data shape.
 */
export default function InvoiceDocument({ invoice }) {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    status,
    paymentTermsLabel,
    clientName,
    billingMeta = [],
    businessName,
    businessEmail,
    businessWebsite,
    businessPhone,
    lineItems = [],
    subtotal,
    adjustments,
    creditsApplied,
    total,
    paidAmount,
    balance,
    clientFacingNote,
  } = invoice;
  const tone = statusTone[status] || "neutral";

  return (
    <div className="invoice-print-sheet" aria-label="Invoice">
      <div className="invoice-print-page">
        <header className="invoice-print-header">
          <div className="invoice-print-brand">
            <img
              src="/assets/logos/alchemize-logo-dark.png"
              alt="Alchemize Business Services"
              className="invoice-print-logo"
            />
            <p className="invoice-print-tagline">
              Transforming complexity into opportunity.
            </p>
          </div>
          <div className="invoice-print-title-block">
            <h2 className="invoice-print-title">Invoice</h2>
            <dl className="invoice-print-meta">
              <div>
                <dt>Invoice #</dt>
                <dd>{invoiceNumber}</dd>
              </div>
              <div>
                <dt>Issue date</dt>
                <dd>{formatDate(invoiceDate)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(dueDate)}</dd>
              </div>
              {paymentTermsLabel ? (
                <div>
                  <dt>Terms</dt>
                  <dd>{paymentTermsLabel}</dd>
                </div>
              ) : null}
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`invoice-print-status tone-${tone}`}>
                    {status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="invoice-print-parties">
          <div>
            <h3>Bill To</h3>
            <p className="invoice-print-party-name">{clientName}</p>
            {billingMeta.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div>
            <h3>From</h3>
            <p className="invoice-print-party-name">{businessName}</p>
            <p>{businessEmail}</p>
            <p>{businessWebsite}</p>
            <p>{businessPhone}</p>
          </div>
        </section>

        <table className="invoice-print-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((lineItem) => (
              <tr key={lineItem.id}>
                <td>{lineItem.description || "Custom invoice line"}</td>
                <td>{lineItem.quantity || 1}</td>
                <td>{formatCurrency(lineItem.unitPrice || 0)}</td>
                <td>{formatCurrency(lineItem.amount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-print-summary">
          <div className="invoice-print-totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div>
              <span>Adjustments</span>
              <strong>{formatCurrency(adjustments)}</strong>
            </div>
            <div>
              <span>Credits / Deposits</span>
              <strong>
                {creditsApplied > 0 ? "-" : ""}
                {formatCurrency(creditsApplied)}
              </strong>
            </div>
            {total !== subtotal ? (
              <div>
                <span>Invoice Total</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            ) : null}
            <div>
              <span>Payments</span>
              <strong>
                {paidAmount > 0 ? "-" : ""}
                {formatCurrency(paidAmount)}
              </strong>
            </div>
            <div className="invoice-print-balance">
              <span>Balance Due</span>
              <strong>{formatCurrency(balance)}</strong>
            </div>
          </div>
        </div>

        <section className="invoice-print-lower">
          <div>
            <h3>Payment Information</h3>
            <p>
              Please contact {businessName} at {businessEmail} for available
              payment options for this invoice.
            </p>
          </div>
          {clientFacingNote ? (
            <div>
              <h3>Notes</h3>
              <p>{clientFacingNote}</p>
            </div>
          ) : null}
        </section>

        <footer className="invoice-print-footer">
          <div className="invoice-print-footer-contact">
            <strong>{businessName}</strong>
            <span>{businessEmail}</span>
            <span>{businessWebsite}</span>
          </div>
          <p className="invoice-print-footer-statement">
            Transforming complexity into opportunity.
          </p>
        </footer>
      </div>
    </div>
  );
}

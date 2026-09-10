import { Link } from "react-router-dom";
import {
  FileText,
  Receipt,
  HelpCircle,
  CreditCard,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { portalApi } from "../../services/portal-api.js";
import "./client-billing.css";

const invoiceDetailPath = (invoiceId) =>
  `/client-portal/billing/invoices/${encodeURIComponent(invoiceId)}`;

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
const formatDate = (value) => {
  if (!value) return "Not specified";
  // Invoice/due dates are date-only ("YYYY-MM-DD"); parse the calendar
  // date directly so the viewer's timezone can't shift it by a day.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
const formatCurrency = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(value || 0),
  );
const isOpenInvoice = (item) =>
  ["open", "partially_paid", "past_due"].includes(item.status) &&
  Number(item.outstanding_balance) > 0;
const contactBillingHref = (invoiceNumber) =>
  `mailto:billing@getalchemize.com?subject=${encodeURIComponent(
    invoiceNumber ? `Invoice ${invoiceNumber}` : "Billing question",
  )}`;

export default function ClientBilling({ data, busy, run }) {
  const invoices = data.invoices || [];
  const payments = data.payments || [];
  const openInvoices = invoices.filter(isOpenInvoice);
  const paymentsTotal = payments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const balanceNote =
    openInvoices.length === 0
      ? "No outstanding balance"
      : openInvoices.length === 1
        ? `1 invoice ${label(openInvoices[0].status).toLowerCase()}`
        : `${openInvoices.length} invoices need attention`;

  return (
    <div className="bill-page">
      <div className="portal-workspace-grid bill-workspace-grid">
        <div className="portal-workspace-primary">
          <div className="bill-workspace">
            <section className="bill-summary" aria-label="Billing summary">
              <div className="bill-summary-metric bill-summary-primary">
                <span className="bill-metric-label">Current balance</span>
                <strong>{formatCurrency(data.summary?.open_balance)}</strong>
                <p>{balanceNote}</p>
              </div>
              <div className="bill-summary-metric">
                <span className="bill-metric-label">Total invoices</span>
                <strong>{invoices.length}</strong>
                <p>View your invoice history</p>
              </div>
              <div className="bill-summary-metric">
                <span className="bill-metric-label">Payments made</span>
                <strong>{payments.length}</strong>
                <p>Total payments: {formatCurrency(paymentsTotal)}</p>
              </div>
            </section>

            <section aria-labelledby="open-invoices-title">
              <h2 id="open-invoices-title">Open invoices</h2>
              {openInvoices.length ? (
                <div className="bill-invoice-rows">
                  {openInvoices.map((item) => (
                    <InvoiceCard
                      key={item.id}
                      item={item}
                      busy={busy}
                      run={run}
                    />
                  ))}
                </div>
              ) : (
                <div className="bill-empty">
                  <FileText aria-hidden="true" />
                  <div>
                    <strong>You're all caught up.</strong>
                    <p>There is currently no outstanding balance.</p>
                  </div>
                </div>
              )}
            </section>

            <section aria-labelledby="payment-history-title">
              <h2 id="payment-history-title">Payment history</h2>
              {payments.length ? (
                <PaymentHistory payments={payments} total={paymentsTotal} />
              ) : (
                <div className="bill-empty">
                  <Receipt aria-hidden="true" />
                  <div>
                    <strong>No payments recorded yet.</strong>
                    <p>Recorded payments will appear here.</p>
                  </div>
                </div>
              )}
            </section>

            <section className="bill-support-callout">
              <MessageCircle aria-hidden="true" />
              <div>
                <strong>Need help with your invoice?</strong>
                <p>
                  If you have any questions about a charge, payment method, or
                  need a copy of an invoice, we're here to help.
                </p>
              </div>
              <a className="portal-action-button" href={contactBillingHref()}>
                Contact billing
                <ArrowRight aria-hidden="true" size={14} />
              </a>
            </section>
          </div>
        </div>
        <aside className="portal-workspace-utility">
          <BillingRail />
        </aside>
      </div>
    </div>
  );
}

function BillingRail() {
  return (
    <>
      <section className="bill-rail-card">
        <h2>
          <FileText aria-hidden="true" />
          Billing at a glance
        </h2>
        <ul className="bill-glance-list">
          <li>
            <span className="bill-glance-icon" aria-hidden="true">
              <FileText size={15} />
            </span>
            <div>
              <strong>Invoices</strong>
              <p>View and download your invoices anytime.</p>
            </div>
          </li>
          <li>
            <span className="bill-glance-icon" aria-hidden="true">
              <Receipt size={15} />
            </span>
            <div>
              <strong>Payments</strong>
              <p>See your payment history and remaining balance.</p>
            </div>
          </li>
          <li>
            <span className="bill-glance-icon" aria-hidden="true">
              <HelpCircle size={15} />
            </span>
            <div>
              <strong>Need help?</strong>
              <p>Contact us if you have any billing questions.</p>
              <a className="bill-rail-link" href={contactBillingHref()}>
                Contact billing
                <ArrowRight aria-hidden="true" size={13} />
              </a>
            </div>
          </li>
        </ul>
      </section>
      <section className="bill-rail-card bill-payment-methods">
        <h2>
          <CreditCard aria-hidden="true" />
          Payment methods
        </h2>
        <p>
          Payments are processed securely through our payment provider. You'll
          be redirected to a secure checkout page to complete your payment.
        </p>
        <div className="bill-rail-divider" />
        <strong>Have a question about a charge?</strong>
        <a className="bill-rail-link" href={contactBillingHref()}>
          Contact billing
          <ArrowRight aria-hidden="true" size={13} />
        </a>
      </section>
    </>
  );
}

function InvoiceCard({ item, busy, run }) {
  return (
    <article className="bill-invoice-card">
      <div className="bill-invoice-main">
        <div className="bill-invoice-heading">
          <strong>{item.invoice_number}</strong>
          <span className={`bill-status is-${item.status.replace(/_/g, "-")}`}>
            {label(item.status)}
          </span>
        </div>
        <p>{item.engagement_title || "General account"}</p>
        <small>
          Issued {formatDate(item.invoice_date)} · Due{" "}
          {formatDate(item.due_date)}
        </small>
        <div className="portal-action-group">
          <ActionButton
            className="portal-action-button bill-pay-button"
            busy={busy === `${item.id}-pay`}
            onClick={() =>
              run(
                `${item.id}-pay`,
                async () => {
                  const checkout = await portalApi.checkoutInvoice(item.id);
                  if (!checkout.checkout_url)
                    throw new Error(
                      "Online payment is temporarily unavailable.",
                    );
                  window.location.assign(checkout.checkout_url);
                },
                "Opening secure payment…",
              )
            }
          >
            Pay securely
          </ActionButton>
          <Link
            className="portal-action-button"
            to={invoiceDetailPath(item.id)}
          >
            View invoice
          </Link>
          <a
            className="portal-action-button"
            href={contactBillingHref(item.invoice_number)}
          >
            Contact billing
          </a>
        </div>
      </div>
      <div className="bill-invoice-amounts">
        <strong>
          {formatCurrency(item.outstanding_balance, item.currency)}
        </strong>
        <small>{formatCurrency(item.paid_total, item.currency)} paid</small>
        <small>
          {formatCurrency(item.outstanding_balance, item.currency)} remaining
        </small>
      </div>
    </article>
  );
}

function ActionButton({ children, busy, className, ...props }) {
  return (
    <button type="button" className={className} disabled={busy} {...props}>
      {busy ? "Working…" : children}
    </button>
  );
}

function PaymentHistory({ payments, total }) {
  return (
    <div className="bill-payment-history">
      <table className="bill-payment-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Invoice</th>
            <th scope="col">Amount</th>
            <th scope="col">Method</th>
            <th scope="col">Reference</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((item) => (
            <tr key={item.id}>
              <td data-label="Date">{formatDate(item.payment_date)}</td>
              <td data-label="Invoice">
                <Link
                  className="bill-invoice-link"
                  to={invoiceDetailPath(item.invoice_id)}
                >
                  {item.invoice_number}
                </Link>
              </td>
              <td data-label="Amount">{formatCurrency(item.amount)}</td>
              <td data-label="Method">{label(item.payment_method)}</td>
              <td data-label="Reference">
                {/^https:\/\//i.test(item.receipt_url || "") ? (
                  <a href={item.receipt_url} target="_blank" rel="noreferrer">
                    Receipt
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="bill-total-label">
              Total payments
            </td>
            <td className="bill-total-value">{formatCurrency(total)}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

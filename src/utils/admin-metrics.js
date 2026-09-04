export const getInvoiceRemainingBalance = (invoice = {}) => {
  const total = Number(invoice.amount ?? invoice.total ?? 0);
  const paidAmount = Number(invoice.paidAmount ?? invoice.paid_amount ?? 0);
  const balance = Math.max(total - paidAmount, 0);

  if (invoice.status === "Cancelled" || invoice.status === "Void") {
    return 0;
  }

  return balance;
};

export const getOpenInvoiceBalance = (invoices = []) =>
  invoices
    .filter(
      (invoice) =>
        invoice &&
        !["Paid", "Cancelled", "Void", "Closed"].includes(invoice.status),
    )
    .reduce((sum, invoice) => sum + getInvoiceRemainingBalance(invoice), 0);

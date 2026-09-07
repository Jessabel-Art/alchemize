ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_paypal_order
    ON invoices (paypal_order_id);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS paypal_capture_id VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_paypal_capture
    ON payments (paypal_capture_id);
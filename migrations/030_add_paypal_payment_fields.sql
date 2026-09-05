ALTER TABLE invoices
    ADD COLUMN paypal_order_id VARCHAR(255) NULL,
    ADD UNIQUE KEY uq_invoices_paypal_order (paypal_order_id);

ALTER TABLE payments
    ADD COLUMN paypal_capture_id VARCHAR(255) NULL,
    ADD UNIQUE KEY uq_payments_paypal_capture (paypal_capture_id);
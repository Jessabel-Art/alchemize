ALTER TABLE leads
    ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER source,
    ADD UNIQUE KEY uq_leads_client_id (client_id),
    ADD CONSTRAINT fk_leads_client FOREIGN KEY (client_id) REFERENCES clients (id) ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE payments
    ADD COLUMN request_key CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL AFTER public_id,
    ADD UNIQUE KEY uq_payments_request_key (request_key);

UPDATE invoices SET credit_deposit_total = ABS(credit_deposit_total) WHERE credit_deposit_total < 0;

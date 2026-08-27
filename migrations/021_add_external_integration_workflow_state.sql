ALTER TABLE clients
    ADD COLUMN google_drive_folder_id VARCHAR(255) NULL AFTER origin_lead_id,
    ADD COLUMN drive_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending' AFTER google_drive_folder_id,
    ADD COLUMN drive_sync_attempted_at TIMESTAMP(6) NULL AFTER drive_sync_status,
    ADD COLUMN drive_synced_at TIMESTAMP(6) NULL AFTER drive_sync_attempted_at,
    ADD COLUMN drive_sync_error VARCHAR(80) NULL AFTER drive_synced_at,
    ADD COLUMN stripe_customer_id VARCHAR(255) NULL AFTER drive_sync_error,
    ADD COLUMN stripe_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending' AFTER stripe_customer_id,
    ADD COLUMN stripe_sync_attempted_at TIMESTAMP(6) NULL AFTER stripe_sync_status,
    ADD COLUMN stripe_synced_at TIMESTAMP(6) NULL AFTER stripe_sync_attempted_at,
    ADD COLUMN stripe_sync_error VARCHAR(80) NULL AFTER stripe_synced_at,
    ADD UNIQUE KEY uq_clients_google_drive_folder_id (google_drive_folder_id),
    ADD UNIQUE KEY uq_clients_stripe_customer_id (stripe_customer_id);

ALTER TABLE document_submissions
    ADD COLUMN google_drive_file_id VARCHAR(255) NULL AFTER storage_key,
    ADD COLUMN drive_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending' AFTER google_drive_file_id,
    ADD COLUMN drive_sync_attempted_at TIMESTAMP(6) NULL AFTER drive_sync_status,
    ADD COLUMN drive_synced_at TIMESTAMP(6) NULL AFTER drive_sync_attempted_at,
    ADD COLUMN drive_sync_error VARCHAR(80) NULL AFTER drive_synced_at,
    ADD UNIQUE KEY uq_document_submissions_google_file (google_drive_file_id);

ALTER TABLE appointments
    ADD COLUMN google_calendar_event_id VARCHAR(255) NULL AFTER owner_user_id,
    ADD COLUMN calendar_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending' AFTER google_calendar_event_id,
    ADD COLUMN calendar_sync_attempted_at TIMESTAMP(6) NULL AFTER calendar_sync_status,
    ADD COLUMN calendar_synced_at TIMESTAMP(6) NULL AFTER calendar_sync_attempted_at,
    ADD COLUMN calendar_sync_error VARCHAR(80) NULL AFTER calendar_synced_at,
    ADD UNIQUE KEY uq_appointments_google_event (google_calendar_event_id);

ALTER TABLE invoices
    ADD COLUMN stripe_invoice_id VARCHAR(255) NULL AFTER internal_notes,
    ADD COLUMN stripe_checkout_session_id VARCHAR(255) NULL AFTER stripe_invoice_id,
    ADD COLUMN stripe_payment_intent_id VARCHAR(255) NULL AFTER stripe_checkout_session_id,
    ADD COLUMN stripe_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending' AFTER stripe_payment_intent_id,
    ADD COLUMN stripe_sync_attempted_at TIMESTAMP(6) NULL AFTER stripe_sync_status,
    ADD COLUMN stripe_synced_at TIMESTAMP(6) NULL AFTER stripe_sync_attempted_at,
    ADD COLUMN stripe_sync_error VARCHAR(80) NULL AFTER stripe_synced_at,
    ADD UNIQUE KEY uq_invoices_stripe_invoice (stripe_invoice_id),
    ADD UNIQUE KEY uq_invoices_stripe_checkout (stripe_checkout_session_id),
    ADD UNIQUE KEY uq_invoices_stripe_payment_intent (stripe_payment_intent_id);

ALTER TABLE payments
    ADD COLUMN stripe_payment_intent_id VARCHAR(255) NULL AFTER external_reference,
    ADD COLUMN stripe_charge_id VARCHAR(255) NULL AFTER stripe_payment_intent_id,
    ADD COLUMN receipt_url VARCHAR(500) NULL AFTER stripe_charge_id,
    ADD UNIQUE KEY uq_payments_stripe_payment_intent (stripe_payment_intent_id),
    ADD UNIQUE KEY uq_payments_stripe_charge (stripe_charge_id);

ALTER TABLE notifications
    ADD COLUMN delivery_status ENUM('pending','sent','failed','unavailable') NOT NULL DEFAULT 'pending' AFTER dedupe_key,
    ADD COLUMN delivery_attempted_at TIMESTAMP(6) NULL AFTER delivery_status,
    ADD COLUMN delivered_at TIMESTAMP(6) NULL AFTER delivery_attempted_at,
    ADD COLUMN delivery_error VARCHAR(80) NULL AFTER delivered_at;

CREATE TABLE public_submission_guards (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    request_fingerprint CHAR(64) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    payload_fingerprint CHAR(64) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    lead_id BIGINT UNSIGNED NULL,
    first_attempt_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_attempt_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    attempt_count INT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_public_submission_guards_public_id (public_id),
    UNIQUE KEY uq_public_submission_guards_payload (payload_fingerprint),
    KEY idx_public_submission_guards_request_time (request_fingerprint, last_attempt_at),
    CONSTRAINT fk_public_submission_guards_lead FOREIGN KEY (lead_id) REFERENCES leads (id) ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

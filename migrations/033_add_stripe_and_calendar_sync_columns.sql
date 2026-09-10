-- Reproduced against the same un-migrated legacy schema that exposed the
-- missing payments.receipt_url column (migration 032): production is
-- missing several other columns that migration 021 was supposed to add,
-- because scripts/run-migrations.php's baseline step can mark 1-26 as
-- already-applied without verifying their statements actually ran.
--
-- Proven dependencies (direct SQL reproduction, not speculative):
--   - server/repositories/external-integration-repository.php
--     invoiceForClient() selects c.stripe_customer_id -> the exact cause
--     of Client Portal Billing "Pay securely" returning INTERNAL_ERROR
--     (PDOException: Unknown column 'c.stripe_customer_id').
--   - setStripeCustomer()/setStripeClientFailure() write the other
--     clients.stripe_sync_* columns in the same checkout request.
--   - setInvoiceCheckout()/setInvoiceStripeFailure() write the
--     invoices.stripe_* columns in the same checkout request.
--   - setCalendarState(), called from
--     server/services/external-integration-service.php
--     synchronizeAppointment() (used by client appointment confirmation),
--     writes appointments.calendar_sync_* / google_calendar_event_id /
--     meeting_url — both on the success path and inside its own
--     failure-handling catch block, so a missing column here crashes
--     appointment confirmation even when the Google Calendar call itself
--     succeeds or is handled. meeting_url is otherwise part of migration
--     026 (also in the unverified 1-26 baseline range), but only this one
--     column of that migration is proven to be a hard dependency of the
--     two reported failures — the rest of 026 is deliberately left alone.
--
-- This is a brand-new migration number (never previously applied), so
-- idempotency is not strictly required for a first run — but this repo's
-- own migrations 028 and 030 already established "ADD COLUMN IF NOT
-- EXISTS" as the working convention against production's actual database
-- engine (plain ADD COLUMN was used for 032 only because that specific
-- fix was verified against a local MySQL install that rejects this
-- syntax; 028/030 succeeding in production already confirms the
-- production engine supports it). Using the same idiom here is the safer
-- choice given some uncertainty about production's exact current column
-- set, and matches established convention.
ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS stripe_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS stripe_sync_attempted_at TIMESTAMP(6) NULL,
    ADD COLUMN IF NOT EXISTS stripe_synced_at TIMESTAMP(6) NULL,
    ADD COLUMN IF NOT EXISTS stripe_sync_error VARCHAR(80) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_stripe_customer_id
    ON clients (stripe_customer_id);

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS stripe_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS stripe_sync_attempted_at TIMESTAMP(6) NULL,
    ADD COLUMN IF NOT EXISTS stripe_synced_at TIMESTAMP(6) NULL,
    ADD COLUMN IF NOT EXISTS stripe_sync_error VARCHAR(80) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_stripe_checkout
    ON invoices (stripe_checkout_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_stripe_payment_intent
    ON invoices (stripe_payment_intent_id);

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS calendar_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS calendar_sync_attempted_at TIMESTAMP(6) NULL,
    ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMP(6) NULL,
    ADD COLUMN IF NOT EXISTS calendar_sync_error VARCHAR(80) NULL,
    ADD COLUMN IF NOT EXISTS meeting_url VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_google_event
    ON appointments (google_calendar_event_id);

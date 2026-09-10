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
-- The original version of this migration used "ADD COLUMN IF NOT
-- EXISTS" / "CREATE UNIQUE INDEX IF NOT EXISTS" on the (mistaken) belief
-- that migrations 028/030 had already proven this syntax works against
-- production's real database engine. That belief does not hold: real
-- MySQL (confirmed against MySQL Community Server 8.4.11, both via PDO
-- and the mysql CLI directly) rejects this syntax outright with a 1064
-- syntax error, on both ADD COLUMN and CREATE INDEX — it is a
-- MariaDB-only extension. Corrected using the same portable
-- conditional-DDL pattern already established and verified in migration
-- 030: information_schema.columns/statistics checks, plain
-- (unconditional) ALTER TABLE / CREATE UNIQUE INDEX, inside a temporary
-- helper procedure that is called once and dropped. Safe to run from a
-- clean schema, a partially-applied schema, or a fully-applied schema; it
-- never drops or recreates an existing column, index, or row. The
-- intended schema additions themselves are unchanged from the original
-- migration.
DROP PROCEDURE IF EXISTS alchemize_migration_033_apply;

CREATE PROCEDURE alchemize_migration_033_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN stripe_customer_id VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'stripe_sync_status'
    ) THEN
        ALTER TABLE clients ADD COLUMN stripe_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'stripe_sync_attempted_at'
    ) THEN
        ALTER TABLE clients ADD COLUMN stripe_sync_attempted_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'stripe_synced_at'
    ) THEN
        ALTER TABLE clients ADD COLUMN stripe_synced_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'stripe_sync_error'
    ) THEN
        ALTER TABLE clients ADD COLUMN stripe_sync_error VARCHAR(80) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND index_name = 'uq_clients_stripe_customer_id'
    ) THEN
        CREATE UNIQUE INDEX uq_clients_stripe_customer_id ON clients (stripe_customer_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'stripe_checkout_session_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN stripe_checkout_session_id VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'stripe_payment_intent_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN stripe_payment_intent_id VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'stripe_sync_status'
    ) THEN
        ALTER TABLE invoices ADD COLUMN stripe_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'stripe_sync_attempted_at'
    ) THEN
        ALTER TABLE invoices ADD COLUMN stripe_sync_attempted_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'stripe_synced_at'
    ) THEN
        ALTER TABLE invoices ADD COLUMN stripe_synced_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'stripe_sync_error'
    ) THEN
        ALTER TABLE invoices ADD COLUMN stripe_sync_error VARCHAR(80) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND index_name = 'uq_invoices_stripe_checkout'
    ) THEN
        CREATE UNIQUE INDEX uq_invoices_stripe_checkout ON invoices (stripe_checkout_session_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND index_name = 'uq_invoices_stripe_payment_intent'
    ) THEN
        CREATE UNIQUE INDEX uq_invoices_stripe_payment_intent ON invoices (stripe_payment_intent_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'google_calendar_event_id'
    ) THEN
        ALTER TABLE appointments ADD COLUMN google_calendar_event_id VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'calendar_sync_status'
    ) THEN
        ALTER TABLE appointments ADD COLUMN calendar_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'calendar_sync_attempted_at'
    ) THEN
        ALTER TABLE appointments ADD COLUMN calendar_sync_attempted_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'calendar_synced_at'
    ) THEN
        ALTER TABLE appointments ADD COLUMN calendar_synced_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'calendar_sync_error'
    ) THEN
        ALTER TABLE appointments ADD COLUMN calendar_sync_error VARCHAR(80) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'meeting_url'
    ) THEN
        ALTER TABLE appointments ADD COLUMN meeting_url VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'appointments' AND index_name = 'uq_appointments_google_event'
    ) THEN
        CREATE UNIQUE INDEX uq_appointments_google_event ON appointments (google_calendar_event_id);
    END IF;
END;

CALL alchemize_migration_033_apply();

DROP PROCEDURE alchemize_migration_033_apply;

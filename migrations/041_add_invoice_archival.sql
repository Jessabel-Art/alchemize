-- Data Maintenance invoice lifecycle needs a way to archive an uncollected
-- invoice while preserving 100% of its data (line items, payment history,
-- Stripe/PayPal references, dates, status) -- the existing `status` ENUM
-- ('draft','open','partially_paid','paid','past_due','cancelled','voided')
-- already carries real business meaning and must not be repurposed to also
-- mean "archived". A separate nullable archived_at timestamp, matching the
-- same pattern already used on clients/engagements/documents_metadata, lets
-- active billing views filter it out without touching or losing any data.
--
-- Uses the same portable conditional-DDL pattern as migrations 033/034/036
-- because plain MySQL 8.4 rejects "ADD COLUMN IF NOT EXISTS" outright.
DROP PROCEDURE IF EXISTS alchemize_migration_041_apply;

CREATE PROCEDURE alchemize_migration_041_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE invoices ADD COLUMN archived_at TIMESTAMP(6) NULL DEFAULT NULL AFTER voided_at;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND index_name = 'idx_invoices_archived_at'
    ) THEN
        CREATE INDEX idx_invoices_archived_at ON invoices (archived_at);
    END IF;
END;

CALL alchemize_migration_041_apply();

DROP PROCEDURE alchemize_migration_041_apply;

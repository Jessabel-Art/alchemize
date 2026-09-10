-- The original version of this migration used "ADD COLUMN IF NOT EXISTS" /
-- "CREATE UNIQUE INDEX IF NOT EXISTS", which is a MariaDB-only extension —
-- real MySQL (confirmed against MySQL Community Server 8.4.11, both via
-- PDO and the mysql CLI directly) rejects it outright with a 1064 syntax
-- error, on both ADD COLUMN and CREATE INDEX. scripts/run-migrations.php
-- executes this whole file as a single statement string, but does support
-- a multi-statement string in one call (verified directly), so a
-- create/call/drop stored-procedure block — using only information_schema
-- checks and plain ALTER TABLE/CREATE INDEX, both standard, portable
-- MySQL/MariaDB SQL — is used here instead of engine-specific conditional
-- DDL clauses. Safe to run from a clean schema, a partially-applied
-- schema (either column or index already present), or a fully-applied
-- schema; it never drops or recreates an existing column, index, or row.
DROP PROCEDURE IF EXISTS alchemize_migration_030_apply;

CREATE PROCEDURE alchemize_migration_030_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'paypal_order_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN paypal_order_id VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'invoices' AND index_name = 'uq_invoices_paypal_order'
    ) THEN
        CREATE UNIQUE INDEX uq_invoices_paypal_order ON invoices (paypal_order_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'paypal_capture_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN paypal_capture_id VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND index_name = 'uq_payments_paypal_capture'
    ) THEN
        CREATE UNIQUE INDEX uq_payments_paypal_capture ON payments (paypal_capture_id);
    END IF;
END;

CALL alchemize_migration_030_apply();

DROP PROCEDURE alchemize_migration_030_apply;

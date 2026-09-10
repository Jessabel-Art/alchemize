-- The original version of this migration used "ADD COLUMN IF NOT EXISTS",
-- which is a MariaDB-only extension — real MySQL (confirmed against MySQL
-- Community Server 8.4.11, both via PDO and the mysql CLI directly)
-- rejects it outright with a 1064 syntax error. Corrected using the same
-- portable conditional-DDL pattern established in migration 030:
-- information_schema.columns checks, plain (unconditional) ALTER TABLE,
-- inside a temporary helper procedure that is called once and dropped.
-- Safe to run from a clean schema, a partially-applied schema (some
-- columns already present), or a fully-applied schema; it never drops or
-- recreates an existing column, index, or row, and every intended column
-- keeps its original definition and AFTER position.
DROP PROCEDURE IF EXISTS alchemize_migration_028_apply;

CREATE PROCEDURE alchemize_migration_028_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoice_line_items' AND column_name = 'tier_id'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN tier_id BIGINT UNSIGNED NULL AFTER service_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoice_line_items' AND column_name = 'service_name_snapshot'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN service_name_snapshot VARCHAR(180) NULL AFTER service_code_snapshot;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoice_line_items' AND column_name = 'tier_name_snapshot'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN tier_name_snapshot VARCHAR(180) NULL AFTER service_name_snapshot;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoice_line_items' AND column_name = 'billing_type_snapshot'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN billing_type_snapshot VARCHAR(50) NULL AFTER description_snapshot;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoice_line_items' AND column_name = 'pricing_type_snapshot'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN pricing_type_snapshot VARCHAR(40) NULL AFTER billing_type_snapshot;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoice_line_items' AND column_name = 'base_catalog_price_snapshot'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN base_catalog_price_snapshot DECIMAL(12,2) NULL AFTER pricing_type_snapshot;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoice_line_items' AND column_name = 'pricing_snapshot'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN pricing_snapshot JSON NULL AFTER base_catalog_price_snapshot;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'invoice_line_items' AND column_name = 'catalog_version_snapshot'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN catalog_version_snapshot VARCHAR(40) NULL AFTER pricing_snapshot;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'payments' AND column_name = 'request_key'
    ) THEN
        ALTER TABLE payments ADD COLUMN request_key CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL AFTER public_id;
    END IF;
END;

CALL alchemize_migration_028_apply();

DROP PROCEDURE alchemize_migration_028_apply;

-- The Prospect -> Client conversion workflow needs to preserve the business
-- name entered when a prospect is created or edited (Admin -> Clients ->
-- Add record / View Prospect), so it can be carried into the resulting
-- client's legal_name at conversion time. The leads table has no column for
-- this today.
--
-- Uses the same portable conditional-DDL pattern as migrations 033/034
-- (information_schema check + a temporary helper procedure), since plain
-- MySQL 8.4 rejects "ADD COLUMN IF NOT EXISTS" outright (MariaDB-only
-- syntax). Safe to run against a clean or already-migrated schema.
DROP PROCEDURE IF EXISTS alchemize_migration_035_apply;

CREATE PROCEDURE alchemize_migration_035_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'leads' AND column_name = 'business_name'
    ) THEN
        ALTER TABLE leads ADD COLUMN business_name VARCHAR(255) NULL AFTER full_name;
    END IF;
END;

CALL alchemize_migration_035_apply();

DROP PROCEDURE alchemize_migration_035_apply;

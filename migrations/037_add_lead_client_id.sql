-- Prospect -> Client conversion (server/services/lead-admin-service.php
-- convertLead()) writes leads.client_id to link a converted prospect back
-- to the client record it became, and reads it to detect an
-- already-converted lead before creating a second client. That column was
-- never actually added to the schema — proven by direct reproduction
-- against production: converting a lead throws PDOException SQLSTATE[42S22]
-- "Unknown column 'client_id' in 'SELECT'"/"in 'UPDATE'" from inside the
-- conversion transaction, which rolls back the client insert and surfaces
-- as "The leads API is temporarily unavailable." on the Admin Prospect ->
-- Client conversion flow.
--
-- Uses the same portable conditional-DDL pattern as migrations 033-036
-- (information_schema checks + a temporary helper procedure) because plain
-- MySQL 8.4 rejects "ADD COLUMN IF NOT EXISTS" outright (MariaDB-only
-- syntax). The column and its foreign key mirror clients.origin_lead_id's
-- existing definition (migration 004) for consistency. Safe to run against
-- a clean or already-migrated schema.
DROP PROCEDURE IF EXISTS alchemize_migration_037_apply;

CREATE PROCEDURE alchemize_migration_037_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'leads' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER status;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'leads' AND index_name = 'idx_leads_client_id'
    ) THEN
        CREATE INDEX idx_leads_client_id ON leads (client_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = DATABASE() AND table_name = 'leads' AND constraint_name = 'fk_leads_client'
    ) THEN
        ALTER TABLE leads
            ADD CONSTRAINT fk_leads_client
            FOREIGN KEY (client_id) REFERENCES clients (id)
            ON UPDATE RESTRICT ON DELETE SET NULL;
    END IF;
END;

CALL alchemize_migration_037_apply();

DROP PROCEDURE alchemize_migration_037_apply;

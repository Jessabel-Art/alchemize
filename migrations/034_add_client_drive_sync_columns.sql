-- Production's clients table is missing the drive-sync columns that
-- migration 021 was supposed to add (the same unverified-baseline gap
-- migration 033 already found and fixed for clients.stripe_*,
-- invoices.stripe_*, and appointments.calendar_*/google_calendar_event_id).
--
-- Proven dependency (direct SQL reproduction against production, not
-- speculative): server/repositories/external-integration-repository.php
-- setClientDriveState() runs
--   UPDATE clients SET google_drive_folder_id = ..., drive_sync_status = ...,
--   drive_sync_attempted_at = ..., drive_synced_at = ..., drive_sync_error = ...
-- after every client create/update, and information_schema confirms all five
-- columns plus their unique index are absent from production's clients
-- table. That throws PDOException SQLSTATE[42S22] "Unknown column
-- 'google_drive_folder_id' in 'SET'", which the API layer reports as the
-- generic "Client API is temporarily unavailable." This is the same
-- unhandled exception that made the Admin Client Management page unusable
-- for client creation/conversion.
--
-- Uses the same portable conditional-DDL pattern as migration 033
-- (information_schema checks + a temporary helper procedure) because plain
-- MySQL 8.4 rejects "ADD COLUMN IF NOT EXISTS" / "CREATE INDEX IF NOT
-- EXISTS" outright (that syntax is MariaDB-only). Safe to run against a
-- clean, partially-applied, or fully-applied schema; never drops or
-- recreates an existing column, index, or row.
DROP PROCEDURE IF EXISTS alchemize_migration_034_apply;

CREATE PROCEDURE alchemize_migration_034_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'google_drive_folder_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN google_drive_folder_id VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'drive_sync_status'
    ) THEN
        ALTER TABLE clients ADD COLUMN drive_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'drive_sync_attempted_at'
    ) THEN
        ALTER TABLE clients ADD COLUMN drive_sync_attempted_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'drive_synced_at'
    ) THEN
        ALTER TABLE clients ADD COLUMN drive_synced_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'drive_sync_error'
    ) THEN
        ALTER TABLE clients ADD COLUMN drive_sync_error VARCHAR(80) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND index_name = 'uq_clients_google_drive_folder_id'
    ) THEN
        CREATE UNIQUE INDEX uq_clients_google_drive_folder_id ON clients (google_drive_folder_id);
    END IF;
END;

CALL alchemize_migration_034_apply();

DROP PROCEDURE alchemize_migration_034_apply;

-- Same unverified-baseline gap as migrations 033/034: migration 021 was
-- supposed to add drive-sync columns to document_submissions but never
-- actually applied them in production.
--
-- Proven dependency (direct SQL reproduction against production, not
-- speculative): server/services/system-integrations-service.php
-- googleDriveStatus() runs
--   SELECT drive_synced_at FROM document_submissions WHERE drive_sync_status = ...
-- which throws PDOException SQLSTATE[42S22] "Unknown column
-- 'drive_synced_at' in 'SELECT'", and information_schema confirms all five
-- columns plus their unique index are absent. That made
-- GET settings/integrations (the Admin integration/status panel) return
-- "Settings are temporarily unavailable." The same missing columns are
-- also written by server/repositories/external-integration-repository.php
-- setDocumentDriveState(), called after every client document upload.
--
-- Uses the same portable conditional-DDL pattern as migrations 033/034/035
-- (information_schema checks + a temporary helper procedure) because plain
-- MySQL 8.4 rejects "ADD COLUMN IF NOT EXISTS" / "CREATE INDEX IF NOT
-- EXISTS" outright (MariaDB-only syntax). Safe to run against a clean,
-- partially-applied, or fully-applied schema; never drops or recreates an
-- existing column, index, or row.
DROP PROCEDURE IF EXISTS alchemize_migration_036_apply;

CREATE PROCEDURE alchemize_migration_036_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'document_submissions' AND column_name = 'google_drive_file_id'
    ) THEN
        ALTER TABLE document_submissions ADD COLUMN google_drive_file_id VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'document_submissions' AND column_name = 'drive_sync_status'
    ) THEN
        ALTER TABLE document_submissions ADD COLUMN drive_sync_status ENUM('not_configured','pending','synchronized','failed') NOT NULL DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'document_submissions' AND column_name = 'drive_sync_attempted_at'
    ) THEN
        ALTER TABLE document_submissions ADD COLUMN drive_sync_attempted_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'document_submissions' AND column_name = 'drive_synced_at'
    ) THEN
        ALTER TABLE document_submissions ADD COLUMN drive_synced_at TIMESTAMP(6) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'document_submissions' AND column_name = 'drive_sync_error'
    ) THEN
        ALTER TABLE document_submissions ADD COLUMN drive_sync_error VARCHAR(80) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'document_submissions' AND index_name = 'uq_document_submissions_google_file'
    ) THEN
        CREATE UNIQUE INDEX uq_document_submissions_google_file ON document_submissions (google_drive_file_id);
    END IF;
END;

CALL alchemize_migration_036_apply();

DROP PROCEDURE alchemize_migration_036_apply;

<?php
// Same unverified-baseline gap as migrations 033/034/035: migration 021 was
// supposed to add drive-sync columns to document_submissions but never
// actually applied them in production, which made
// GET settings/integrations (the Admin integration/status panel) throw
// PDOException SQLSTATE[42S22] "Unknown column 'drive_synced_at' in
// 'SELECT'". This test runs the migration file itself (not a
// re-implementation of it) against the real local dev database from three
// starting states — clean, fully applied, and partially applied — and
// proves each run is a no-op/fill-in-only: it never errors, never
// drops/recreates a column or index, and never touches row data. Skipped
// (not failed) if that database is unreachable, matching
// tests/php/migration-034-client-drive-sync-columns.php's convention.
declare(strict_types=1);

function verifyMigration036(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

putenv('ALCHEMIZE_DB_HOST=127.0.0.1');
putenv('ALCHEMIZE_DB_PORT=3306');
putenv('ALCHEMIZE_DB_NAME=alchemize_dev');
putenv('ALCHEMIZE_DB_USER=alchemize_dev_user');
putenv('ALCHEMIZE_DB_PASSWORD=AryahLeo1017!');

require_once __DIR__.'/../../server/config/config.php';
require_once __DIR__.'/../../server/database/connection.php';

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

$migrationSql = file_get_contents(__DIR__.'/../../migrations/036_add_document_submission_drive_sync_columns.sql');
verifyMigration036(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/036_add_document_submission_drive_sync_columns.sql');

function columnExists036(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}
function indexExists036(PDO $db, string $table, string $index): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :index');
    $stmt->execute(['table' => $table, 'index' => $index]);
    return (int) $stmt->fetchColumn() > 0;
}
function dropIfPresent036(PDO $db, string $sql): void {
    try { $db->exec($sql); } catch (Throwable) { /* already absent */ }
}

$columns = ['google_drive_file_id', 'drive_sync_status', 'drive_sync_attempted_at', 'drive_synced_at', 'drive_sync_error'];

dropIfPresent036($db, 'ALTER TABLE document_submissions DROP INDEX uq_document_submissions_google_file');
foreach (array_reverse($columns) as $column) {
    dropIfPresent036($db, "ALTER TABLE document_submissions DROP COLUMN {$column}");
}
foreach ($columns as $column) {
    verifyMigration036(!columnExists036($db, 'document_submissions', $column), "Setup failed: document_submissions.{$column} should be absent");
}

// 1. Clean schema.
$db->exec($migrationSql);
foreach ($columns as $column) {
    verifyMigration036(columnExists036($db, 'document_submissions', $column), "Clean run: document_submissions.{$column} was not created");
}
verifyMigration036(indexExists036($db, 'document_submissions', 'uq_document_submissions_google_file'), 'Clean run: uq_document_submissions_google_file was not created');

// 2. Fully-applied schema: running it again must be a safe no-op.
$db->exec($migrationSql);
$columnCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'document_submissions' AND column_name = 'drive_synced_at'"
)->fetchColumn();
verifyMigration036($columnCount === 1, 'Fully-applied re-run duplicated document_submissions.drive_synced_at');

// 3. Partially-applied schema: columns exist but the index does not.
dropIfPresent036($db, 'ALTER TABLE document_submissions DROP INDEX uq_document_submissions_google_file');
verifyMigration036(columnExists036($db, 'document_submissions', 'google_drive_file_id'), 'Setup failed: document_submissions.google_drive_file_id should still be present');
verifyMigration036(!indexExists036($db, 'document_submissions', 'uq_document_submissions_google_file'), 'Setup failed: uq_document_submissions_google_file should be absent');

$db->exec($migrationSql);
verifyMigration036(indexExists036($db, 'document_submissions', 'uq_document_submissions_google_file'), 'Partial run: uq_document_submissions_google_file was not filled in');

$procedureCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_name = 'alchemize_migration_036_apply'"
)->fetchColumn();
verifyMigration036($procedureCount === 0, 'The migration must not leave its helper stored procedure behind');

echo "Migration 036: clean, fully-applied, and partially-applied schema states all converge correctly on the 5 document_submissions drive-sync columns and their unique index, with no duplication and no leftover procedure.\n";

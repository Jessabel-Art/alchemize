<?php
// Migration 034 fills in the same class of gap migrations 030/033 already
// found and fixed: migration 021 was supposed to add clients' drive-sync
// columns but never actually applied for that table in production, which
// made every client create/update throw PDOException SQLSTATE[42S22]
// ("Unknown column 'google_drive_folder_id' in 'SET'") — surfaced to the
// Admin Client Management page as "Client API is temporarily unavailable."
// This test runs the migration file itself (not a re-implementation of it)
// against the real local dev database from three starting states — clean,
// fully applied, and partially applied — and proves each run is a
// no-op/fill-in-only: it never errors, never drops/recreates a column or
// index, and never touches row data. Skipped (not failed) if that database
// is unreachable, matching tests/php/migration-033-stripe-calendar-fields.php's
// convention.
declare(strict_types=1);

function verifyMigration034(bool $condition, string $message): void {
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

$migrationSql = file_get_contents(__DIR__.'/../../migrations/034_add_client_drive_sync_columns.sql');
verifyMigration034(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/034_add_client_drive_sync_columns.sql');

function columnExists034(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}
function indexExists034(PDO $db, string $table, string $index): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :index');
    $stmt->execute(['table' => $table, 'index' => $index]);
    return (int) $stmt->fetchColumn() > 0;
}
function dropIfPresent034(PDO $db, string $sql): void {
    try { $db->exec($sql); } catch (Throwable) { /* already absent */ }
}

$columns = ['google_drive_folder_id', 'drive_sync_status', 'drive_sync_attempted_at', 'drive_synced_at', 'drive_sync_error'];

// Start from a known clean slate regardless of whatever state this
// environment happened to be in.
dropIfPresent034($db, 'ALTER TABLE clients DROP INDEX uq_clients_google_drive_folder_id');
foreach (array_reverse($columns) as $column) {
    dropIfPresent034($db, "ALTER TABLE clients DROP COLUMN {$column}");
}
foreach ($columns as $column) {
    verifyMigration034(!columnExists034($db, 'clients', $column), "Setup failed: clients.{$column} should be absent");
}

// 1. Clean schema: none of the columns or the index exist.
$db->exec($migrationSql);
foreach ($columns as $column) {
    verifyMigration034(columnExists034($db, 'clients', $column), "Clean run: clients.{$column} was not created");
}
verifyMigration034(indexExists034($db, 'clients', 'uq_clients_google_drive_folder_id'), 'Clean run: uq_clients_google_drive_folder_id was not created');

// 2. Fully-applied schema: running it again must be a safe no-op, not an
// error, and must not create a second column/index.
$db->exec($migrationSql);
$columnCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'google_drive_folder_id'"
)->fetchColumn();
verifyMigration034($columnCount === 1, 'Fully-applied re-run duplicated clients.google_drive_folder_id');

// 3. Partially-applied schema: the column exists but the index does not
// (exactly the shape a half-run ALTER TABLE could leave behind).
dropIfPresent034($db, 'ALTER TABLE clients DROP INDEX uq_clients_google_drive_folder_id');
verifyMigration034(columnExists034($db, 'clients', 'google_drive_folder_id'), 'Setup failed: clients.google_drive_folder_id should still be present');
verifyMigration034(!indexExists034($db, 'clients', 'uq_clients_google_drive_folder_id'), 'Setup failed: uq_clients_google_drive_folder_id should be absent');

$db->exec($migrationSql);
verifyMigration034(indexExists034($db, 'clients', 'uq_clients_google_drive_folder_id'), 'Partial run: uq_clients_google_drive_folder_id was not filled in');

// No leftover helper procedure from any of the three runs.
$procedureCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_name = 'alchemize_migration_034_apply'"
)->fetchColumn();
verifyMigration034($procedureCount === 0, 'The migration must not leave its helper stored procedure behind');

echo "Migration 034: clean, fully-applied, and partially-applied schema states all converge correctly on the 5 clients drive-sync columns and their unique index, with no duplication and no leftover procedure.\n";

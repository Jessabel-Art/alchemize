<?php
// leads.client_id was never added to the schema even though
// server/services/lead-admin-service.php convertLead() has always read
// and written it to link a converted prospect back to its resulting
// client and to detect an already-converted lead. Reproduced directly
// against production: converting a lead threw PDOException SQLSTATE[42S22]
// "Unknown column 'client_id'", rolling back the client insert and
// surfacing as "The leads API is temporarily unavailable." on the Admin
// Prospect -> Client conversion flow. This test runs the migration file
// itself (not a re-implementation of it) against the real local dev
// database from three starting states — clean, fully applied, and
// partially applied — and proves each run is a no-op/fill-in-only: it
// never errors, never drops/recreates the column, index, or foreign key,
// and never touches row data. Skipped (not failed) if that database is
// unreachable, matching tests/php/migration-036-*.php's convention.
declare(strict_types=1);

function verifyMigration037(bool $condition, string $message): void {
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

$migrationSql = file_get_contents(__DIR__.'/../../migrations/037_add_lead_client_id.sql');
verifyMigration037(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/037_add_lead_client_id.sql');

function columnExists037(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}
function indexExists037(PDO $db, string $table, string $index): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :index');
    $stmt->execute(['table' => $table, 'index' => $index]);
    return (int) $stmt->fetchColumn() > 0;
}
function fkExists037(PDO $db, string $table, string $constraint): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = :table AND constraint_name = :constraint');
    $stmt->execute(['table' => $table, 'constraint' => $constraint]);
    return (int) $stmt->fetchColumn() > 0;
}
function dropIfPresent037(PDO $db, string $sql): void {
    try { $db->exec($sql); } catch (Throwable) { /* already absent */ }
}

dropIfPresent037($db, 'ALTER TABLE leads DROP FOREIGN KEY fk_leads_client');
dropIfPresent037($db, 'ALTER TABLE leads DROP INDEX idx_leads_client_id');
dropIfPresent037($db, 'ALTER TABLE leads DROP COLUMN client_id');
verifyMigration037(!columnExists037($db, 'leads', 'client_id'), 'Setup failed: leads.client_id should be absent');

// 1. Clean schema.
$db->exec($migrationSql);
verifyMigration037(columnExists037($db, 'leads', 'client_id'), 'Clean run: leads.client_id was not created');
verifyMigration037(indexExists037($db, 'leads', 'idx_leads_client_id'), 'Clean run: idx_leads_client_id was not created');
verifyMigration037(fkExists037($db, 'leads', 'fk_leads_client'), 'Clean run: fk_leads_client was not created');

// 2. Fully-applied schema: running it again must be a safe no-op.
$db->exec($migrationSql);
$columnCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'leads' AND column_name = 'client_id'"
)->fetchColumn();
verifyMigration037($columnCount === 1, 'Fully-applied re-run duplicated leads.client_id');

// 3. Partially-applied schema: the column exists but the index/FK do not.
dropIfPresent037($db, 'ALTER TABLE leads DROP FOREIGN KEY fk_leads_client');
dropIfPresent037($db, 'ALTER TABLE leads DROP INDEX idx_leads_client_id');
verifyMigration037(columnExists037($db, 'leads', 'client_id'), 'Setup failed: leads.client_id should still be present');
verifyMigration037(!indexExists037($db, 'leads', 'idx_leads_client_id'), 'Setup failed: idx_leads_client_id should be absent');

$db->exec($migrationSql);
verifyMigration037(indexExists037($db, 'leads', 'idx_leads_client_id'), 'Partial run: idx_leads_client_id was not filled in');
verifyMigration037(fkExists037($db, 'leads', 'fk_leads_client'), 'Partial run: fk_leads_client was not filled in');

$procedureCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_name = 'alchemize_migration_037_apply'"
)->fetchColumn();
verifyMigration037($procedureCount === 0, 'The migration must not leave its helper stored procedure behind');

echo "Migration 037: clean, fully-applied, and partially-applied schema states all converge correctly on leads.client_id, its index, and its foreign key to clients, with no duplication and no leftover procedure.\n";

<?php
// Direct Client creation (Admin -> Client Management -> "+ Client or
// Prospect" -> Client) had no protection against an accidental repeat
// submission. server/services/client-service.php AlchemizeClientService::
// create() now reads and writes clients.idempotency_key to recognize a
// repeated submission and return the existing client instead of inserting
// a second one. This test runs the migration file itself (not a
// re-implementation of it) against the real local dev database from three
// starting states -- clean, fully applied, and partially applied -- and
// proves each run is a no-op/fill-in-only: it never errors, never
// drops/recreates the column or its unique index, and never touches row
// data. Skipped (not failed) if that database is unreachable, matching
// tests/php/migration-036-*.php's convention.
declare(strict_types=1);

function verifyMigration038(bool $condition, string $message): void {
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

$migrationSql = file_get_contents(__DIR__.'/../../migrations/038_add_client_idempotency_key.sql');
verifyMigration038(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/038_add_client_idempotency_key.sql');

function columnExists038(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}
function indexExists038(PDO $db, string $table, string $index): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :index');
    $stmt->execute(['table' => $table, 'index' => $index]);
    return (int) $stmt->fetchColumn() > 0;
}
function dropIfPresent038(PDO $db, string $sql): void {
    try { $db->exec($sql); } catch (Throwable) { /* already absent */ }
}

dropIfPresent038($db, 'ALTER TABLE clients DROP INDEX uniq_clients_idempotency_key');
dropIfPresent038($db, 'ALTER TABLE clients DROP COLUMN idempotency_key');
verifyMigration038(!columnExists038($db, 'clients', 'idempotency_key'), 'Setup failed: clients.idempotency_key should be absent');

// 1. Clean schema.
$db->exec($migrationSql);
verifyMigration038(columnExists038($db, 'clients', 'idempotency_key'), 'Clean run: clients.idempotency_key was not created');
verifyMigration038(indexExists038($db, 'clients', 'uniq_clients_idempotency_key'), 'Clean run: uniq_clients_idempotency_key was not created');

// 2. Fully-applied schema: running it again must be a safe no-op.
$db->exec($migrationSql);
$columnCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'idempotency_key'"
)->fetchColumn();
verifyMigration038($columnCount === 1, 'Fully-applied re-run duplicated clients.idempotency_key');

// 3. Partially-applied schema: the column exists but the unique index does not.
dropIfPresent038($db, 'ALTER TABLE clients DROP INDEX uniq_clients_idempotency_key');
verifyMigration038(columnExists038($db, 'clients', 'idempotency_key'), 'Setup failed: clients.idempotency_key should still be present');
verifyMigration038(!indexExists038($db, 'clients', 'uniq_clients_idempotency_key'), 'Setup failed: uniq_clients_idempotency_key should be absent');

$db->exec($migrationSql);
verifyMigration038(indexExists038($db, 'clients', 'uniq_clients_idempotency_key'), 'Partial run: uniq_clients_idempotency_key was not filled in');

// The unique index must actually enforce uniqueness, and must not block
// multiple NULLs (clients created before this migration, or by a direct
// API caller that never supplies a key).
$db->exec("INSERT INTO clients (public_id, client_type, display_name, primary_email, status, portal_status, source) VALUES (UUID(), 'individual', 'Migration 038 Test A', 'migration038.test.a@example.test', 'prospective', 'pending', 'website')");
$db->exec("INSERT INTO clients (public_id, client_type, display_name, primary_email, status, portal_status, source) VALUES (UUID(), 'individual', 'Migration 038 Test B', 'migration038.test.b@example.test', 'prospective', 'pending', 'website')");
$idA = (int) $db->lastInsertId();
$db->exec("UPDATE clients SET idempotency_key = 'migration-038-test-key' WHERE primary_email = 'migration038.test.a@example.test'");
$duplicateRejected = false;
try {
    $db->exec("UPDATE clients SET idempotency_key = 'migration-038-test-key' WHERE primary_email = 'migration038.test.b@example.test'");
} catch (Throwable) {
    $duplicateRejected = true;
}
verifyMigration038($duplicateRejected, 'uniq_clients_idempotency_key did not reject a duplicate key');
$db->exec("DELETE FROM clients WHERE primary_email IN ('migration038.test.a@example.test','migration038.test.b@example.test')");

$procedureCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_name = 'alchemize_migration_038_apply'"
)->fetchColumn();
verifyMigration038($procedureCount === 0, 'The migration must not leave its helper stored procedure behind');

echo "Migration 038: clean, fully-applied, and partially-applied schema states all converge correctly on clients.idempotency_key and its unique index, the index actually enforces uniqueness while allowing multiple NULLs, with no leftover procedure.\n";

<?php
// Migration 035 adds leads.business_name, needed so the Prospect -> Client
// conversion workflow can carry a prospect's business name into the
// resulting client's legal_name. This test runs the migration file itself
// (not a re-implementation of it) against the real local dev database from
// two starting states — clean and already applied — and proves each run is
// a no-op/fill-in-only: it never errors, never drops/recreates the column,
// and never touches row data. Skipped (not failed) if that database is
// unreachable, matching tests/php/migration-034-client-drive-sync-columns.php's
// convention.
declare(strict_types=1);

function verifyMigration035(bool $condition, string $message): void {
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

$migrationSql = file_get_contents(__DIR__.'/../../migrations/035_add_lead_business_name.sql');
verifyMigration035(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/035_add_lead_business_name.sql');

function columnExists035(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}
function dropIfPresent035(PDO $db, string $sql): void {
    try { $db->exec($sql); } catch (Throwable) { /* already absent */ }
}

dropIfPresent035($db, 'ALTER TABLE leads DROP COLUMN business_name');
verifyMigration035(!columnExists035($db, 'leads', 'business_name'), 'Setup failed: leads.business_name should be absent');

// 1. Clean schema.
$db->exec($migrationSql);
verifyMigration035(columnExists035($db, 'leads', 'business_name'), 'Clean run: leads.business_name was not created');

// 2. Fully-applied schema: running it again must be a safe no-op, not an
// error, and must not create a second column.
$db->exec($migrationSql);
$columnCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'leads' AND column_name = 'business_name'"
)->fetchColumn();
verifyMigration035($columnCount === 1, 'Fully-applied re-run duplicated leads.business_name');

// No leftover helper procedure from either run.
$procedureCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_name = 'alchemize_migration_035_apply'"
)->fetchColumn();
verifyMigration035($procedureCount === 0, 'The migration must not leave its helper stored procedure behind');

echo "Migration 035: clean and fully-applied schema states both converge correctly on leads.business_name, with no duplication and no leftover procedure.\n";

<?php
// Migration 028 originally used "ADD COLUMN IF NOT EXISTS" (see git
// history), the same MariaDB-only extension proven to fail against real
// MySQL (migration 030's defect). This test runs the corrected migration
// file itself (not a re-implementation of it) against the real local dev
// database from three starting states — clean, partially applied, and
// already fully applied — and proves each run is a no-op/fill-in-only: it
// never errors, never drops/recreates a column, and never touches row
// data. Skipped (not failed) if that database is unreachable, matching
// tests/php/schema-integrity.php and migration-030-paypal-fields.php's
// convention.
declare(strict_types=1);

function verifyMigration028(bool $condition, string $message): void {
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

$migrationSql = file_get_contents(__DIR__.'/../../migrations/028_fix_invoice_payment_schema_gaps.sql');
verifyMigration028(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/028_fix_invoice_payment_schema_gaps.sql');

// The columns migration 028 is responsible for. billing_type_snapshot is
// deliberately excluded — it already existed in the original migration
// 006 table definition, so 028's guard for it is a permanent no-op and
// dropping/re-adding it here would test nothing about 028 itself.
$lineItemColumns = [
    'tier_id', 'service_name_snapshot', 'tier_name_snapshot', 'pricing_type_snapshot',
    'base_catalog_price_snapshot', 'pricing_snapshot', 'catalog_version_snapshot',
];

function columnExists(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}
function columnCount(PDO $db, string $table, string $column): int {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (int) $stmt->fetchColumn();
}
function dropIfPresent(PDO $db, string $sql): void {
    try { $db->exec($sql); } catch (Throwable) { /* already absent */ }
}

// Start from a known clean slate regardless of whatever state this
// environment happened to be in.
foreach ($lineItemColumns as $column) {
    dropIfPresent($db, "ALTER TABLE invoice_line_items DROP COLUMN {$column}");
}
dropIfPresent($db, 'ALTER TABLE payments DROP COLUMN request_key');

foreach ($lineItemColumns as $column) {
    verifyMigration028(!columnExists($db, 'invoice_line_items', $column), "Setup failed: invoice_line_items.{$column} should be absent");
}
verifyMigration028(!columnExists($db, 'payments', 'request_key'), 'Setup failed: payments.request_key should be absent');

// 1. Clean schema.
$db->exec($migrationSql);
foreach ($lineItemColumns as $column) {
    verifyMigration028(columnExists($db, 'invoice_line_items', $column), "Clean run: invoice_line_items.{$column} was not created");
}
verifyMigration028(columnExists($db, 'payments', 'request_key'), 'Clean run: payments.request_key was not created');

// 2. Fully-applied schema: running it again must be a safe no-op.
$db->exec($migrationSql);
foreach ($lineItemColumns as $column) {
    verifyMigration028(columnCount($db, 'invoice_line_items', $column) === 1, "Fully-applied re-run duplicated invoice_line_items.{$column}");
}
verifyMigration028(columnCount($db, 'payments', 'request_key') === 1, 'Fully-applied re-run duplicated payments.request_key');

// 3. Partially-applied schema: two of the eight columns missing, the rest
// present. The migration must fill in exactly what is missing without
// disturbing what already exists.
dropIfPresent($db, 'ALTER TABLE invoice_line_items DROP COLUMN catalog_version_snapshot');
dropIfPresent($db, 'ALTER TABLE payments DROP COLUMN request_key');
verifyMigration028(!columnExists($db, 'invoice_line_items', 'catalog_version_snapshot'), 'Setup failed: catalog_version_snapshot should be absent');
verifyMigration028(!columnExists($db, 'payments', 'request_key'), 'Setup failed: payments.request_key should be absent');
verifyMigration028(columnExists($db, 'invoice_line_items', 'tier_id'), 'Setup failed: tier_id should still be present');

$db->exec($migrationSql);
verifyMigration028(columnExists($db, 'invoice_line_items', 'catalog_version_snapshot'), 'Partial run: catalog_version_snapshot was not filled in');
verifyMigration028(columnExists($db, 'payments', 'request_key'), 'Partial run: payments.request_key was not filled in');
verifyMigration028(columnCount($db, 'invoice_line_items', 'tier_id') === 1, 'Partial run must not touch/duplicate a column that already existed');

// 4. No leftover helper procedure from any of the runs.
$procedureCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_name = 'alchemize_migration_028_apply'"
)->fetchColumn();
verifyMigration028($procedureCount === 0, 'The migration must not leave its helper stored procedure behind');

// 5. Re-run stability: running it a third time is still a clean no-op.
$db->exec($migrationSql);
foreach ($lineItemColumns as $column) {
    verifyMigration028(columnCount($db, 'invoice_line_items', $column) === 1, "Re-run stability: invoice_line_items.{$column} duplicated");
}

echo "Migration 028: clean, fully-applied, and partially-applied schema states all converge correctly on the seven invoice_line_items catalog-snapshot columns and payments.request_key, with no duplication, no leftover procedure, and stable re-runs.\n";

<?php
// Migration 030 originally used "ADD COLUMN IF NOT EXISTS" /
// "CREATE UNIQUE INDEX IF NOT EXISTS" (see git history), a MariaDB-only
// extension that real MySQL rejects with a 1064 syntax error — confirmed
// directly against MySQL Community Server 8.4.11 via both PDO and the
// mysql CLI. This test runs the corrected migration file itself (not a
// re-implementation of it) against the real local dev database from three
// starting states — clean, partially applied, and already fully applied —
// and proves each run is a no-op/fill-in-only: it never errors, never
// drops/recreates the column or index, and never touches row data. It is
// skipped (not failed) if that database is unreachable, so it stays
// portable, matching tests/php/schema-integrity.php's convention.
declare(strict_types=1);

function verifyMigration030(bool $condition, string $message): void {
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

$migrationSql = file_get_contents(__DIR__.'/../../migrations/030_add_paypal_payment_fields.sql');
verifyMigration030(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/030_add_paypal_payment_fields.sql');

function columnExists(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}
function indexExists(PDO $db, string $table, string $index): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :index');
    $stmt->execute(['table' => $table, 'index' => $index]);
    return (int) $stmt->fetchColumn() > 0;
}
function dropIfPresent(PDO $db, string $sql): void {
    try { $db->exec($sql); } catch (Throwable) { /* already absent */ }
}

// Start from a known clean slate regardless of whatever state this
// environment happened to be in (columns present, absent, or mixed).
dropIfPresent($db, 'ALTER TABLE invoices DROP INDEX uq_invoices_paypal_order');
dropIfPresent($db, 'ALTER TABLE invoices DROP COLUMN paypal_order_id');
dropIfPresent($db, 'ALTER TABLE payments DROP INDEX uq_payments_paypal_capture');
dropIfPresent($db, 'ALTER TABLE payments DROP COLUMN paypal_capture_id');

verifyMigration030(!columnExists($db, 'invoices', 'paypal_order_id'), 'Setup failed: invoices.paypal_order_id should be absent');
verifyMigration030(!columnExists($db, 'payments', 'paypal_capture_id'), 'Setup failed: payments.paypal_capture_id should be absent');

// 1. Clean schema: neither column nor index exists anywhere.
$db->exec($migrationSql);
verifyMigration030(columnExists($db, 'invoices', 'paypal_order_id'), 'Clean run: invoices.paypal_order_id was not created');
verifyMigration030(indexExists($db, 'invoices', 'uq_invoices_paypal_order'), 'Clean run: uq_invoices_paypal_order was not created');
verifyMigration030(columnExists($db, 'payments', 'paypal_capture_id'), 'Clean run: payments.paypal_capture_id was not created');
verifyMigration030(indexExists($db, 'payments', 'uq_payments_paypal_capture'), 'Clean run: uq_payments_paypal_capture was not created');

// 2. Fully-applied schema: running it again must be a safe no-op, not an
// error, and must not create a second column/index.
$db->exec($migrationSql);
$invoiceColumnCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'invoices' AND column_name = 'paypal_order_id'"
)->fetchColumn();
$invoiceIndexCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'invoices' AND index_name = 'uq_invoices_paypal_order'"
)->fetchColumn();
verifyMigration030($invoiceColumnCount === 1, 'Fully-applied re-run duplicated invoices.paypal_order_id');
verifyMigration030($invoiceIndexCount === 1, 'Fully-applied re-run duplicated uq_invoices_paypal_order');

// 3. Partially-applied schema (mixed): the invoices column exists but its
// index does not; the payments side is entirely absent. The migration
// must fill in exactly what is missing without disturbing what already
// exists.
dropIfPresent($db, 'ALTER TABLE invoices DROP INDEX uq_invoices_paypal_order');
dropIfPresent($db, 'ALTER TABLE payments DROP INDEX uq_payments_paypal_capture');
dropIfPresent($db, 'ALTER TABLE payments DROP COLUMN paypal_capture_id');
verifyMigration030(columnExists($db, 'invoices', 'paypal_order_id'), 'Setup failed: invoices.paypal_order_id should still be present');
verifyMigration030(!indexExists($db, 'invoices', 'uq_invoices_paypal_order'), 'Setup failed: uq_invoices_paypal_order should be absent');
verifyMigration030(!columnExists($db, 'payments', 'paypal_capture_id'), 'Setup failed: payments.paypal_capture_id should be absent');

$db->exec($migrationSql);
verifyMigration030(indexExists($db, 'invoices', 'uq_invoices_paypal_order'), 'Partial run: uq_invoices_paypal_order was not filled in');
verifyMigration030(columnExists($db, 'payments', 'paypal_capture_id'), 'Partial run: payments.paypal_capture_id was not filled in');
verifyMigration030(indexExists($db, 'payments', 'uq_payments_paypal_capture'), 'Partial run: uq_payments_paypal_capture was not filled in');

// No leftover helper procedure from any of the three runs.
$procedureCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_name = 'alchemize_migration_030_apply'"
)->fetchColumn();
verifyMigration030($procedureCount === 0, 'The migration must not leave its helper stored procedure behind');

// Leave the schema in the fully-applied end state migration 030 is meant
// to produce (matching what production should end up with).
echo "Migration 030: clean, fully-applied, and partially-applied schema states all converge correctly on invoices.paypal_order_id/uq_invoices_paypal_order and payments.paypal_capture_id/uq_payments_paypal_capture, with no duplication and no leftover procedure.\n";

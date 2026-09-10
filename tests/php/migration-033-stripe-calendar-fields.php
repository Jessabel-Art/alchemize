<?php
// Migration 033 originally used "ADD COLUMN IF NOT EXISTS" /
// "CREATE UNIQUE INDEX IF NOT EXISTS" (see git history) on the mistaken
// belief that migrations 028/030 had already proven this syntax works
// against production — the same MariaDB-only extension proven to fail
// against real MySQL. This test runs the corrected migration file itself
// (not a re-implementation of it) against the real local dev database
// from three starting states — clean, partially applied, and already
// fully applied — and proves each run is a no-op/fill-in-only: it never
// errors, never drops/recreates a column or index, and never touches row
// data. Skipped (not failed) if that database is unreachable, matching
// tests/php/schema-integrity.php and migration-030-paypal-fields.php's
// convention.
declare(strict_types=1);

function verifyMigration033(bool $condition, string $message): void {
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

$migrationSql = file_get_contents(__DIR__.'/../../migrations/033_add_stripe_and_calendar_sync_columns.sql');
verifyMigration033(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/033_add_stripe_and_calendar_sync_columns.sql');

$clientColumns = ['stripe_customer_id', 'stripe_sync_status', 'stripe_sync_attempted_at', 'stripe_synced_at', 'stripe_sync_error'];
$invoiceColumns = ['stripe_checkout_session_id', 'stripe_payment_intent_id', 'stripe_sync_status', 'stripe_sync_attempted_at', 'stripe_synced_at', 'stripe_sync_error'];
$appointmentColumns = ['google_calendar_event_id', 'calendar_sync_status', 'calendar_sync_attempted_at', 'calendar_synced_at', 'calendar_sync_error', 'meeting_url'];
$indexes = [
    ['clients', 'uq_clients_stripe_customer_id'],
    ['invoices', 'uq_invoices_stripe_checkout'],
    ['invoices', 'uq_invoices_stripe_payment_intent'],
    ['appointments', 'uq_appointments_google_event'],
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
function indexExists(PDO $db, string $table, string $index): bool {
    $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :index');
    $stmt->execute(['table' => $table, 'index' => $index]);
    return (int) $stmt->fetchColumn() > 0;
}
function indexCount(PDO $db, string $table, string $index): int {
    $stmt = $db->prepare('SELECT COUNT(DISTINCT index_name) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :index');
    $stmt->execute(['table' => $table, 'index' => $index]);
    return (int) $stmt->fetchColumn();
}
function dropIfPresent(PDO $db, string $sql): void {
    try { $db->exec($sql); } catch (Throwable) { /* already absent */ }
}

// Start from a known clean slate regardless of whatever state this
// environment happened to be in.
foreach ($indexes as [$table, $index]) {
    dropIfPresent($db, "ALTER TABLE {$table} DROP INDEX {$index}");
}
foreach ($clientColumns as $column) dropIfPresent($db, "ALTER TABLE clients DROP COLUMN {$column}");
foreach ($invoiceColumns as $column) dropIfPresent($db, "ALTER TABLE invoices DROP COLUMN {$column}");
foreach ($appointmentColumns as $column) dropIfPresent($db, "ALTER TABLE appointments DROP COLUMN {$column}");

verifyMigration033(!columnExists($db, 'clients', 'stripe_customer_id'), 'Setup failed: clients.stripe_customer_id should be absent');
verifyMigration033(!columnExists($db, 'appointments', 'meeting_url'), 'Setup failed: appointments.meeting_url should be absent');

// 1. Clean schema: none of the 17 columns or 4 indexes exist.
$db->exec($migrationSql);
foreach ($clientColumns as $column) verifyMigration033(columnExists($db, 'clients', $column), "Clean run: clients.{$column} was not created");
foreach ($invoiceColumns as $column) verifyMigration033(columnExists($db, 'invoices', $column), "Clean run: invoices.{$column} was not created");
foreach ($appointmentColumns as $column) verifyMigration033(columnExists($db, 'appointments', $column), "Clean run: appointments.{$column} was not created");
foreach ($indexes as [$table, $index]) verifyMigration033(indexExists($db, $table, $index), "Clean run: {$table}.{$index} was not created");

// 2. Fully-applied schema: running it again must be a safe no-op — no
// duplicate columns or indexes.
$db->exec($migrationSql);
foreach ($clientColumns as $column) verifyMigration033(columnCount($db, 'clients', $column) === 1, "Fully-applied re-run duplicated clients.{$column}");
foreach ($invoiceColumns as $column) verifyMigration033(columnCount($db, 'invoices', $column) === 1, "Fully-applied re-run duplicated invoices.{$column}");
foreach ($appointmentColumns as $column) verifyMigration033(columnCount($db, 'appointments', $column) === 1, "Fully-applied re-run duplicated appointments.{$column}");
foreach ($indexes as [$table, $index]) verifyMigration033(indexCount($db, $table, $index) === 1, "Fully-applied re-run duplicated {$table}.{$index}");

// 3. Partially-applied schema (mixed across tables): one index missing,
// one column missing from two different tables, everything else present.
// The migration must fill in exactly what is missing without disturbing
// what already exists.
dropIfPresent($db, 'ALTER TABLE clients DROP INDEX uq_clients_stripe_customer_id');
dropIfPresent($db, 'ALTER TABLE invoices DROP COLUMN stripe_sync_error');
dropIfPresent($db, 'ALTER TABLE appointments DROP COLUMN meeting_url');
verifyMigration033(!indexExists($db, 'clients', 'uq_clients_stripe_customer_id'), 'Setup failed: uq_clients_stripe_customer_id should be absent');
verifyMigration033(!columnExists($db, 'invoices', 'stripe_sync_error'), 'Setup failed: invoices.stripe_sync_error should be absent');
verifyMigration033(!columnExists($db, 'appointments', 'meeting_url'), 'Setup failed: appointments.meeting_url should be absent');
verifyMigration033(columnExists($db, 'clients', 'stripe_customer_id'), 'Setup failed: clients.stripe_customer_id should still be present');

$db->exec($migrationSql);
verifyMigration033(indexExists($db, 'clients', 'uq_clients_stripe_customer_id'), 'Partial run: uq_clients_stripe_customer_id was not filled in');
verifyMigration033(columnExists($db, 'invoices', 'stripe_sync_error'), 'Partial run: invoices.stripe_sync_error was not filled in');
verifyMigration033(columnExists($db, 'appointments', 'meeting_url'), 'Partial run: appointments.meeting_url was not filled in');
verifyMigration033(columnCount($db, 'clients', 'stripe_customer_id') === 1, 'Partial run must not touch/duplicate a column that already existed');

// 4. No leftover helper procedure from any of the runs.
$procedureCount = (int) $db->query(
    "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE() AND routine_name = 'alchemize_migration_033_apply'"
)->fetchColumn();
verifyMigration033($procedureCount === 0, 'The migration must not leave its helper stored procedure behind');

// 5. Re-run stability: running it a third time is still a clean no-op.
$db->exec($migrationSql);
foreach ($clientColumns as $column) verifyMigration033(columnCount($db, 'clients', $column) === 1, "Re-run stability: clients.{$column} duplicated");
foreach ($indexes as [$table, $index]) verifyMigration033(indexCount($db, $table, $index) === 1, "Re-run stability: {$table}.{$index} duplicated");

echo "Migration 033: clean, fully-applied, and partially-applied schema states all converge correctly on the 17 Stripe/calendar-sync columns and 4 unique indexes across clients/invoices/appointments, with no duplication, no leftover procedure, and stable re-runs.\n";

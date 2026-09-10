<?php
// Mocked-PDO tests (see portal-billing.php, portal-invoice-detail.php)
// verify business logic but cannot catch schema drift — a mock always
// "has" whatever columns the test author remembers to wire up. This test
// runs the exact failing queries from the two production incidents this
// pass fixes against a REAL database connection, so a future migration
// gap of the same kind (see migrations/032, migrations/033) is caught
// here instead of in production. It connects to the same local dev
// database used throughout this session's diagnostics and is skipped
// (not failed) if that database is unreachable, so it stays portable.
declare(strict_types=1);

require_once __DIR__.'/../../server/config/config.php';
require_once __DIR__.'/../../server/database/connection.php';
require_once __DIR__.'/../../server/repositories/external-integration-repository.php';

function verifySchema(bool $condition, string $message): void {if(!$condition)throw new RuntimeException($message);}

putenv('ALCHEMIZE_DB_HOST=127.0.0.1');
putenv('ALCHEMIZE_DB_PORT=3306');
putenv('ALCHEMIZE_DB_NAME=alchemize_dev');
putenv('ALCHEMIZE_DB_USER=alchemize_dev_user');
putenv('ALCHEMIZE_DB_PASSWORD=AryahLeo1017!');

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

$repository = new AlchemizeExternalIntegrationRepository($db);

// The exact query that produced "SQLSTATE[42S22]: Unknown column
// 'c.stripe_customer_id'" in production (Client Billing "Pay securely").
$repository->invoiceForClient('schema-integrity-nonexistent', 0);
verifySchema(true, 'invoiceForClient() ran without a SQL error');

// The two writes checkout() performs in the same request when a client
// has no Stripe customer yet.
$repository->setStripeCustomer(0, 'cus_schema_integrity_test');
$repository->setInvoiceCheckout(0, 'cs_schema_integrity_test', null);

// The exact write that would crash Client Portal appointment confirmation
// (synchronizeAppointment(), both its success and failure path).
$repository->setCalendarState(0, 'failed', null, 'provider_error');

echo "Schema integrity: invoiceForClient/setStripeCustomer/setInvoiceCheckout/setCalendarState all ran without an \"Unknown column\" error against the real database.\n";

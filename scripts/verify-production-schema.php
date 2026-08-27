<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$bootstrapCandidates = [dirname(__DIR__) . '/server/bootstrap.php', dirname(__DIR__) . '/bootstrap.php'];
$bootstrap = null;
foreach ($bootstrapCandidates as $candidate) if (is_file($candidate)) { $bootstrap = $candidate; break; }
if ($bootstrap === null) { echo "SCHEMA_CONNECTION=MISSING\n"; exit(2); }

$expected = [
    'leads' => ['id' => ['bigint', false], 'public_id' => ['char', false], 'client_id' => ['bigint', true]],
    'clients' => ['id' => ['bigint', false], 'public_id' => ['char', false], 'portal_status' => ['enum', false], 'google_drive_folder_id' => ['varchar', true], 'stripe_customer_id' => ['varchar', true]],
    'users' => ['id' => ['bigint', false], 'password_hash' => ['varchar', true], 'status' => ['enum', false], 'role_id' => ['bigint', false]],
    'client_access_grants' => ['user_id' => ['bigint', false], 'client_id' => ['bigint', false], 'status' => ['enum', false]],
    'portal_account_tokens' => ['token_hash' => ['char', false], 'expires_at' => ['timestamp', false], 'used_at' => ['timestamp', true], 'invalidated_at' => ['timestamp', true]],
    'engagements' => ['client_id' => ['bigint', false], 'status' => ['enum', false]],
    'intake_assignments' => ['client_id' => ['bigint', false], 'engagement_id' => ['bigint', false], 'status' => ['enum', false]],
    'tasks' => ['client_id' => ['bigint', true], 'engagement_id' => ['bigint', true], 'visibility' => ['enum', false]],
    'documents_metadata' => ['client_id' => ['bigint', false], 'status' => ['enum', false], 'storage_key' => ['varchar', true]],
    'document_submissions' => ['document_id' => ['bigint', false], 'client_id' => ['bigint', false], 'version_number' => ['int', false], 'google_drive_file_id' => ['varchar', true]],
    'appointments' => ['client_id' => ['bigint', true], 'status' => ['enum', false], 'google_calendar_event_id' => ['varchar', true]],
    'message_threads' => ['client_id' => ['bigint', false], 'status' => ['enum', false]],
    'messages' => ['thread_id' => ['bigint', false], 'client_id' => ['bigint', false], 'read_by_client_at' => ['timestamp', true], 'read_by_admin_at' => ['timestamp', true]],
    'invoices' => ['client_id' => ['bigint', false], 'status' => ['enum', false], 'issued_at' => ['timestamp', true], 'stripe_checkout_session_id' => ['varchar', true], 'stripe_payment_intent_id' => ['varchar', true]],
    'payments' => ['invoice_id' => ['bigint', false], 'client_id' => ['bigint', false], 'request_key' => ['char', true], 'stripe_payment_intent_id' => ['varchar', true]],
    'notifications' => ['recipient_user_id' => ['bigint', false], 'dedupe_key' => ['varchar', true], 'delivery_status' => ['enum', false]],
    'stripe_webhook_events' => ['stripe_event_id' => ['varchar', false], 'event_status' => ['enum', false]],
    'public_submission_guards' => ['request_fingerprint' => ['char', false], 'payload_fingerprint' => ['char', false], 'lead_id' => ['bigint', true]],
];

try {
    $config = require $bootstrap;
    $database = alchemize_database($config['database']);
    $statement = $database->prepare(
        'SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema'
    );
    $statement->execute(['schema' => (string) $config['database']['name']]);
    $actual = [];
    foreach ($statement->fetchAll() as $column) $actual[$column['TABLE_NAME']][$column['COLUMN_NAME']] = $column;
    $problems = 0;
    foreach ($expected as $table => $columns) {
        if (!isset($actual[$table])) { echo "SCHEMA.{$table}=MISSING\n"; $problems++; continue; }
        echo "SCHEMA.{$table}=PRESENT\n";
        foreach ($columns as $column => [$type, $nullable]) {
            $record = $actual[$table][$column] ?? null;
            if ($record === null) { echo "SCHEMA.{$table}.{$column}=MISSING\n"; $problems++; continue; }
            $matches = strtolower((string) $record['DATA_TYPE']) === $type
                && (($record['IS_NULLABLE'] === 'YES') === $nullable);
            echo "SCHEMA.{$table}.{$column}=" . ($matches ? 'PRESENT' : 'MISMATCH') . PHP_EOL;
            if (!$matches) $problems++;
        }
    }
    echo 'SCHEMA_VALIDATION=' . ($problems === 0 ? 'PRESENT' : 'MISMATCH') . PHP_EOL;
    exit($problems === 0 ? 0 : 1);
} catch (Throwable $error) {
    error_log(sprintf('Production schema verification failed [%s].', get_class($error)));
    echo "SCHEMA_CONNECTION=MISSING\n";
    exit(2);
}

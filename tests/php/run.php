<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/server/http/request.php';
require_once dirname(__DIR__, 2) . '/server/config/config.php';
require_once dirname(__DIR__, 2) . '/server/validation/lead-validator.php';
require_once dirname(__DIR__, 2) . '/server/services/stripe-webhook-service.php';
require_once dirname(__DIR__, 2) . '/server/services/google-client-factory.php';
$composerAutoload = dirname(__DIR__, 2) . '/vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
}
require_once dirname(__DIR__, 2) . '/server/repositories/notification-repository.php';
require_once dirname(__DIR__, 2) . '/server/services/notification-service.php';
require_once dirname(__DIR__, 2) . '/server/services/ses-email-provider.php';

$tests = [];
function test(string $name, Closure $test): void
{
    global $tests;
    $tests[] = [$name, $test];
}

function expect(bool $condition, string $message = 'Expectation failed'): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function valid_payload(): array
{
    return [
        'full_name' => 'Jordan Rivera',
        'email' => 'jordan@example.com',
        'phone' => '(555) 555-0100',
        'audience' => 'individual',
        'service_key' => 'individual-tax',
        'message' => 'I would like help preparing and organizing for tax season.',
        'preferred_contact' => 'email',
        'language_preference' => 'en',
        'website' => '',
    ];
}

test('accepts a valid lead payload', function (): void {
    $result = alchemize_validate_lead(valid_payload());
    expect($result['valid'] === true);
    expect($result['data']['service_key'] === 'individual-tax');
});

test('requires a name', function (): void {
    $payload = valid_payload();
    $payload['full_name'] = '';
    expect(isset(alchemize_validate_lead($payload)['errors']['full_name']));
});

test('rejects invalid email', function (): void {
    $payload = valid_payload();
    $payload['email'] = 'invalid';
    expect(isset(alchemize_validate_lead($payload)['errors']['email']));
});

test('rejects invalid audience', function (): void {
    $payload = valid_payload();
    $payload['audience'] = 'other';
    expect(isset(alchemize_validate_lead($payload)['errors']['audience']));
});

test('rejects invalid service', function (): void {
    $payload = valid_payload();
    $payload['service_key'] = 'unknown-service';
    expect(isset(alchemize_validate_lead($payload)['errors']['service_key']));
});

test('normalizes a documented legacy service alias', function (): void {
    $payload = valid_payload();
    $payload['service_key'] = 'business-administration-operations';
    $payload['audience'] = 'business';
    expect(alchemize_validate_lead($payload)['data']['service_key'] === 'business-operations');
});

test('rejects oversized message', function (): void {
    $payload = valid_payload();
    $payload['message'] = str_repeat('x', 5001);
    expect(isset(alchemize_validate_lead($payload)['errors']['message']));
});

test('detects the honeypot', function (): void {
    $payload = valid_payload();
    $payload['website'] = 'https://spam.example';
    expect(alchemize_validate_lead($payload)['spam'] === true);
});

test('accepts a supported language preference', function (): void {
    $payload = valid_payload();
    $payload['language_preference'] = 'es';
    expect(alchemize_validate_lead($payload)['data']['language_preference'] === 'es');
});

test('rejects an unsupported language preference', function (): void {
    $payload = valid_payload();
    $payload['language_preference'] = 'fr';
    expect(isset(alchemize_validate_lead($payload)['errors']['language_preference']));
});

test('does not project public admin fields into lead creation data', function (): void {
    $payload = valid_payload();
    $payload['status'] = 'converted';
    $payload['source'] = 'forged';
    $payload['assigned_owner'] = 'attacker';
    $data = alchemize_validate_lead($payload)['data'];
    expect(!array_key_exists('status', $data));
    expect(!array_key_exists('source', $data));
    expect(!array_key_exists('assigned_owner', $data));
});

test('rejects invalid JSON', function (): void {
    try {
        alchemize_decode_json_request('POST', 'application/json', null, '{broken');
        expect(false, 'Invalid JSON was accepted.');
    } catch (AlchemizeRequestException $error) {
        expect($error->errorCode === 'INVALID_JSON');
    }
});

test('rejects wrong method', function (): void {
    try {
        alchemize_decode_json_request('GET', 'application/json', null, '{}');
        expect(false, 'GET was accepted.');
    } catch (AlchemizeRequestException $error) {
        expect($error->httpStatus === 405);
    }
});

test('verifies a valid Stripe signature using the webhook secret', function (): void {
    $payload = '{"id":"evt_test_123","type":"invoice.payment_succeeded"}';
    $secret = 'whsec_test_secret';
    $timestamp = (string) time();
    $signature = 't=' . $timestamp . ',v1=' . hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    expect(alchemize_stripe_verify_signed_payload($payload, $signature, $secret) === true);
});

test('rejects a tampered Stripe payload', function (): void {
    $payload = '{"id":"evt_test_123","type":"invoice.payment_succeeded"}';
    $secret = 'whsec_test_secret';
    $timestamp = (string) time();
    $tampered = '{"id":"evt_test_123","type":"invoice.payment_failed"}';
    $signature = 't=' . $timestamp . ',v1=' . hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    expect(alchemize_stripe_verify_signed_payload($tampered, $signature, $secret) === false);
});

test('supports a safe no-op path for unsupported Stripe events', function (): void {
    $payload = ['id' => 'evt_test_456', 'type' => 'customer.subscription.deleted', 'data' => ['object' => []]];
    $result = alchemize_stripe_process_event_payload($payload, $payload['type']);
    expect($result['status'] === 'ignored');
    expect($result['handled'] === true);
});

test('loads dotenv values without replacing server-provided environment variables', function (): void {
    $path = tempnam(sys_get_temp_dir(), 'alchemize-env-');
    expect(is_string($path));
    $suffix = bin2hex(random_bytes(6));
    $loadedKey = 'ALCHEMIZE_TEST_LOADED_' . strtoupper($suffix);
    $preservedKey = 'ALCHEMIZE_TEST_PRESERVED_' . strtoupper($suffix);
    putenv($preservedKey . '=server-value');
    file_put_contents($path, $loadedKey . '=file-value' . PHP_EOL . $preservedKey . '=file-value' . PHP_EOL);

    try {
        alchemize_load_environment_file($path);
        expect(getenv($loadedKey) === 'file-value');
        expect(getenv($preservedKey) === 'server-value');
    } finally {
        @unlink($path);
        putenv($loadedKey);
        putenv($preservedKey);
    }
});

test('resolves relative integration paths from the project root', function (): void {
    $resolved = str_replace('\\', '/', alchemize_resolve_project_path('private/example.json'));
    $root = rtrim(str_replace('\\', '/', alchemize_project_root()), '/');
    expect(alchemize_resolve_project_path('private/google-service-account.json') !== 'private/google-service-account.json');
    expect($resolved === $root . '/private/example.json');
    try {
        alchemize_resolve_project_path('../outside.json');
        expect(false, 'Parent path traversal was accepted.');
    } catch (RuntimeException) {
        expect(true);
    }
});

test('validates Google service-account JSON without requiring live credentials', function (): void {
    $path = tempnam(sys_get_temp_dir(), 'alchemize-google-');
    expect(is_string($path));
    file_put_contents($path, json_encode([
        'type' => 'service_account',
        'project_id' => 'local-test-project',
        'private_key' => 'not-a-real-private-key',
        'client_email' => 'local-test@example.invalid',
    ], JSON_THROW_ON_ERROR));

    try {
        $factory = new AlchemizeGoogleClientFactory(['credentials_path' => $path]);
        $credentials = $factory->loadCredentialDocument();
        expect($credentials['type'] === 'service_account');
        expect($factory->configurationStatus()['credentials_path'] === true);
    } finally {
        @unlink($path);
    }
});

test('initializes the SES SMTP provider without connecting or sending', function (): void {
    $provider = new AlchemizeSesSmtpEmailProvider([
        'region' => 'us-east-1',
        'host' => 'email-smtp.us-east-1.amazonaws.com',
        'port' => 587,
        'username' => 'local-test-user',
        'password' => 'local-test-password',
        'from_email' => 'verified-sender@example.com',
        'from_name' => 'Alchemize Business Services',
        'reply_to_email' => 'reply@example.com',
    ]);
    expect(!in_array(false, $provider->configurationStatus(), true));
    $mailer = $provider->initialize();
    expect($mailer instanceof PHPMailer\PHPMailer\PHPMailer);
    expect($mailer->Mailer === 'smtp');
    expect($mailer->Port === 587);
    expect($mailer->SMTPSecure === PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS);
    expect($mailer->SMTPAuth === true);
});

$failed = 0;
foreach ($tests as [$name, $test]) {
    try {
        $test();
        echo "PASS {$name}\n";
    } catch (Throwable $error) {
        $failed++;
        fwrite(STDERR, "FAIL {$name}: {$error->getMessage()}\n");
    }
}

echo sprintf("%d passed, %d failed\n", count($tests) - $failed, $failed);
exit($failed === 0 ? 0 : 1);

<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/server/http/request.php';
require_once dirname(__DIR__, 2) . '/server/validation/lead-validator.php';

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

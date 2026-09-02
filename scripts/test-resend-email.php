<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function alchemize_resolve_existing_path(array $candidates): ?string
{
    foreach ($candidates as $candidate) {
        if (is_string($candidate) && $candidate !== '' && is_file($candidate)) {
            return $candidate;
        }
    }

    return null;
}

$scriptDir = __DIR__;
$projectRoot = dirname($scriptDir);

$bootstrapPath = alchemize_resolve_existing_path([
    $scriptDir . '/bootstrap.php',
    $projectRoot . '/server/bootstrap.php',
]);

if ($bootstrapPath === null) {
    throw new RuntimeException(sprintf(
        'Unable to resolve bootstrap.php. Checked: %s',
        implode(', ', [$scriptDir . '/bootstrap.php', $projectRoot . '/server/bootstrap.php'])
    ));
}

$config = require $bootstrapPath;
$provider = alchemize_email_provider($config);
$recipient = trim((string) ($argv[1] ?? 'admin@getalchemize.com'));

if ($recipient === '' || filter_var($recipient, FILTER_VALIDATE_EMAIL) === false) {
    fwrite(STDERR, "Usage: php scripts/test-resend-email.php <recipient@example.com>\n");
    exit(2);
}

$status = $provider instanceof AlchemizeResendEmailProvider ? $provider->configurationStatus() : ['RESEND_API_KEY' => false];
$apiKey = (string) ($config['resend']['api_key'] ?? '');
$fromName = (string) ($config['resend']['from_name'] ?? 'Alchemize Business Services');
$fromEmail = (string) ($config['resend']['from_email'] ?? 'notifications@getalchemize.com');
$replyTo = (string) ($config['resend']['reply_to_email'] ?? 'admin@getalchemize.com');

printf("PROVIDER=resend\n");
printf("CONFIGURED=%s\n", ($status['RESEND_API_KEY'] ?? false) && ($status['RESEND_FROM_EMAIL'] ?? false) && ($status['RESEND_FROM_NAME'] ?? false) ? 'true' : 'false');
printf("API_KEY_PRESENT=%s\n", $apiKey !== '' ? 'true' : 'false');
printf("FROM_EMAIL=%s\n", $fromEmail);
printf("REPLY_TO=%s\n", $replyTo);
printf("RECIPIENT=%s\n", $recipient);

$payload = [
    'from' => sprintf('%s <%s>', $fromName, $fromEmail),
    'to' => [$recipient],
    'reply_to' => $replyTo,
    'subject' => 'Alchemize | Resend diagnostic test',
    'html' => '<p>Testing the Resend transactional email path.</p>',
    'text' => 'Testing the Resend transactional email path.',
];

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        'content' => json_encode($payload, JSON_THROW_ON_ERROR),
        'ignore_errors' => true,
        'timeout' => 20,
    ],
]);

$response = @file_get_contents('https://api.resend.com/emails', false, $context);
if ($response === false || !is_string($response)) {
    fwrite(STDERR, "HTTP_STATUS=0\n");
    fwrite(STDERR, "RESEND_ERROR=network_error\n");
    exit(1);
}

$decoded = json_decode($response, true);
$body = is_array($decoded) ? $decoded : ['raw_response' => $response];
$httpStatus = 0;

global $http_response_header;

if (isset($http_response_header) && is_array($http_response_header)) {
    foreach ($http_response_header as $header) {
        if (preg_match('#^HTTP/\S+\s+(\d{3})#i', (string) $header, $matches)) {
            $httpStatus = (int) $matches[1];
        }
    }
}

printf("HTTP_STATUS=%d\n", $httpStatus);
if (isset($body['id'])) {
    printf("RESEND_ID=%s\n", (string) $body['id']);
    printf("RESEND_ERROR=none\n");
    exit(0);
}

printf("RESEND_ERROR=%s\n", json_encode($body, JSON_THROW_ON_ERROR));
exit(1);

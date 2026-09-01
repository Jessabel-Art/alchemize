<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$config = require dirname(__DIR__) . '/server/bootstrap.php';
$google = new AlchemizeGoogleClientFactory($config['google'] ?? []);
$resend = new AlchemizeResendEmailProvider([
    'email_provider' => $config['email_provider'] ?? 'resend',
    ...($config['resend'] ?? []),
]);
$checks = [
    'APP_ENV' => trim((string) ($config['app_env'] ?? '')) !== '',
    'APP_URL' => trim((string) ($config['app_url'] ?? '')) !== '',
    'EMAIL_PROVIDER' => strtolower((string) ($config['email_provider'] ?? 'resend')) === 'resend',
    'STRIPE_PUBLISHABLE_KEY' => trim((string) ($config['stripe']['publishable_key'] ?? '')) !== '',
    'STRIPE_SECRET_KEY' => trim((string) ($config['stripe']['secret_key'] ?? '')) !== '',
    'STRIPE_WEBHOOK_SECRET' => trim((string) ($config['stripe']['webhook_secret'] ?? '')) !== '',
    'RESEND_API_KEY' => trim((string) ($config['resend']['api_key'] ?? '')) !== '',
    'RESEND_FROM_EMAIL' => filter_var((string) ($config['resend']['from_email'] ?? 'notifications@getalchemize.com'), FILTER_VALIDATE_EMAIL) !== false,
    'RESEND_FROM_NAME' => trim((string) ($config['resend']['from_name'] ?? 'Alchemize Business Services')) !== '',
    'RESEND_REPLY_TO_EMAIL' => filter_var((string) ($config['resend']['reply_to_email'] ?? 'admin@getalchemize.com'), FILTER_VALIDATE_EMAIL) !== false,
];

foreach (($google->configurationStatus()) as $name => $configured) {
    $checks[str_starts_with($name, 'google_') ? strtoupper($name) : 'GOOGLE_' . strtoupper($name)] = $configured;
}

foreach ($resend->configurationStatus() as $name => $configured) {
    $checks[$name] = $configured;
}

foreach ($checks as $name => $configured) {
    echo $name . '=' . ($configured ? 'configured' : 'missing') . PHP_EOL;
}

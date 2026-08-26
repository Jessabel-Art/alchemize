<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$config = require dirname(__DIR__) . '/server/bootstrap.php';
$google = new AlchemizeGoogleClientFactory($config['google'] ?? []);
$ses = new AlchemizeSesSmtpEmailProvider($config['ses'] ?? []);
$checks = [
    'APP_ENV' => trim((string) ($config['app_env'] ?? '')) !== '',
    'APP_URL' => trim((string) ($config['app_url'] ?? '')) !== '',
    'STRIPE_PUBLISHABLE_KEY' => trim((string) ($config['stripe']['publishable_key'] ?? '')) !== '',
    'STRIPE_SECRET_KEY' => trim((string) ($config['stripe']['secret_key'] ?? '')) !== '',
    'STRIPE_WEBHOOK_SECRET' => trim((string) ($config['stripe']['webhook_secret'] ?? '')) !== '',
];

foreach (($google->configurationStatus()) as $name => $configured) {
    $checks[str_starts_with($name, 'google_') ? strtoupper($name) : 'GOOGLE_' . strtoupper($name)] = $configured;
}

foreach ($ses->configurationStatus() as $name => $configured) {
    $checks[$name] = $configured;
}

try {
    $ses->initialize();
    $checks['SES_PROVIDER'] = true;
} catch (Throwable) {
    $checks['SES_PROVIDER'] = false;
}

foreach ($checks as $name => $configured) {
    echo $name . '=' . ($configured ? 'configured' : 'missing') . PHP_EOL;
}

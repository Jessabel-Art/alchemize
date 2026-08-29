<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$root = rtrim((string) ($argv[1] ?? getcwd()), DIRECTORY_SEPARATOR);
$privateRoot = $root . '/alchemize-server';
$publicRoot = $root . '/public_html';

$checks = [
    'private bootstrap' => $privateRoot . '/bootstrap.php',
    'private external integration service' => $privateRoot . '/services/external-integration-service.php',
    'private external integration repository' => $privateRoot . '/repositories/external-integration-repository.php',
    'private Google Drive service' => $privateRoot . '/services/google-drive-service.php',
    'private Google Calendar service' => $privateRoot . '/services/google-calendar-service.php',
    'public site entry' => $publicRoot . '/index.html',
    'public API entrypoint' => $publicRoot . '/alchemize-api.php',
    'public API auth route' => $publicRoot . '/api/v1/auth/index.php',
];

$missing = [];
foreach ($checks as $label => $path) {
    if (!is_file($path)) {
        $missing[] = $label;
    }
}

if ($missing !== []) {
    echo 'DEPLOYMENT_MISSING=' . implode(',', $missing) . PHP_EOL;
    exit(1);
}

require_once $privateRoot . '/bootstrap.php';

foreach (['alchemize_external_integrations', 'AlchemizeExternalIntegrationService', 'AlchemizeExternalIntegrationRepository', 'AlchemizeGoogleDriveService', 'AlchemizeGoogleCalendarService'] as $symbol) {
    if (!function_exists($symbol) && !class_exists($symbol)) {
        echo 'DEPLOYMENT_SYMBOL_MISSING=' . $symbol . PHP_EOL;
        exit(1);
    }
}

echo 'DEPLOYMENT_RUNTIME_OK' . PHP_EOL;
exit(0);

<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$rootHint = rtrim((string) ($argv[1] ?? ''), DIRECTORY_SEPARATOR);
$scriptDir = __DIR__;
$projectRoot = dirname($scriptDir);

$bootstrapCandidates = [
    $scriptDir . '/bootstrap.php',
    $projectRoot . '/server/bootstrap.php',
];

$bootstrapPath = null;
foreach ($bootstrapCandidates as $candidate) {
    if (is_file($candidate)) {
        $bootstrapPath = $candidate;
        break;
    }
}

if ($bootstrapPath === null && $rootHint !== '') {
    $bootstrapCandidates[] = $rootHint . '/alchemize-server/bootstrap.php';
    foreach ($bootstrapCandidates as $candidate) {
        if (is_file($candidate)) {
            $bootstrapPath = $candidate;
            break;
        }
    }
}

if ($bootstrapPath === null) {
    throw new RuntimeException(sprintf(
        'Unable to resolve bootstrap.php. Checked: %s',
        implode(', ', $bootstrapCandidates),
    ));
}

$privateRoot = dirname($bootstrapPath);
$publicRootCandidates = [
    $rootHint !== '' ? $rootHint . '/public_html' : null,
    dirname($privateRoot) . '/public_html',
    dirname($privateRoot) . '/public',
    $projectRoot . '/public_html',
    $projectRoot . '/public',
];

$publicRoot = null;
foreach ($publicRootCandidates as $candidate) {
    if (is_dir($candidate)) {
        $publicRoot = $candidate;
        break;
    }
}

if ($publicRoot === null) {
    throw new RuntimeException(sprintf(
        'Unable to resolve the public web root. Checked: %s',
        implode(', ', array_filter($publicRootCandidates, static fn ($value): bool => $value !== null)),
    ));
}

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

require_once $bootstrapPath;

foreach (['alchemize_external_integrations', 'AlchemizeExternalIntegrationService', 'AlchemizeExternalIntegrationRepository', 'AlchemizeGoogleDriveService', 'AlchemizeGoogleCalendarService'] as $symbol) {
    if (!function_exists($symbol) && !class_exists($symbol)) {
        echo 'DEPLOYMENT_SYMBOL_MISSING=' . $symbol . PHP_EOL;
        exit(1);
    }
}

echo 'DEPLOYMENT_RUNTIME_OK' . PHP_EOL;
exit(0);

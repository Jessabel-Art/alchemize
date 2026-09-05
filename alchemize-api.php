<?php

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

$configuredBootstrap = getenv('ALCHEMIZE_SERVER_BOOTSTRAP');
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
$bootstrapCandidates = array_filter([
    is_string($configuredBootstrap) ? $configuredBootstrap : null,
    $documentRoot !== '' ? dirname($documentRoot) . '/alchemize-server/bootstrap.php' : null,
    __DIR__ . '/../alchemize-server/bootstrap.php',
    __DIR__ . '/../server/bootstrap.php',
], static fn (?string $candidate): bool => is_string($candidate) && $candidate !== '');

$bootstrap = null;
foreach ($bootstrapCandidates as $candidate) {
    if (is_file($candidate)) {
        $bootstrap = $candidate;
        break;
    }
}

if ($bootstrap === null) {
    error_log('API bootstrap unavailable: no configured bootstrap file was found.');
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode([
        'error' => ['code' => 'INTERNAL_ERROR', 'message' => 'The API is temporarily unavailable.'],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$_SERVER['ALCHEMIZE_SERVER_BOOTSTRAP'] = $bootstrap;
$_ENV['ALCHEMIZE_SERVER_BOOTSTRAP'] = $bootstrap;
putenv('ALCHEMIZE_SERVER_BOOTSTRAP=' . $bootstrap);

require_once $bootstrap;

$allowedRoutes = [
    'auth',
    'leads',
    'clients',
    'services',
    'settings',
    'engagements',
    'tasks',
    'appointments',
    'documents',
    'invoices',
    'payments',
    'notes',
    'portal',
    'portal-admin',
    'webhooks',
];

$route = trim((string) ($_GET['route'] ?? ''));
$route = preg_replace('#/+#', '/', $route) ?? '';
$route = trim($route, '/');

if ($route === '') {
    alchemize_error_response(404, 'NOT_FOUND', 'The requested route was not found.');
}

$segments = array_values(array_filter(explode('/', $route), static fn (string $segment): bool => $segment !== ''));
if ($segments === [] || !in_array($segments[0], $allowedRoutes, true)) {
    alchemize_error_response(404, 'NOT_FOUND', 'The requested route was not found.');
}

$resource = $segments[0];
$remaining = array_slice($segments, 1);
$allowedAuthRoutes = ['session', 'login', 'logout', 'set-password', 'forgot-password', 'change-password'];
if ($resource === 'auth' && !in_array($remaining[0] ?? '', $allowedAuthRoutes, true)) {
    alchemize_error_response(404, 'NOT_FOUND', 'The requested authentication route was not found.');
}

$deployedEndpointPath = __DIR__ . '/api/v1/' . $resource . '/index.php';
$sourceEndpointPath = dirname(__DIR__) . '/api/v1/' . $resource . '/index.php';

if (is_file($deployedEndpointPath)) {
    $endpointPath = $deployedEndpointPath;
} elseif (basename(__DIR__) === 'public' && is_file($sourceEndpointPath)) {
    // In the source tree the front controller lives in public/, while api/ is
    // its sibling. Production packages place both beneath public_html/.
    $endpointPath = $sourceEndpointPath;
} else {
    alchemize_error_response(404, 'NOT_FOUND', 'The requested route was not found.');
}

$originalPathInfo = $_SERVER['PATH_INFO'] ?? null;
$originalRequestUri = $_SERVER['REQUEST_URI'] ?? null;
$_SERVER['PATH_INFO'] = $remaining === [] ? '' : '/' . implode('/', $remaining);
$_SERVER['REQUEST_URI'] = '/alchemize-api.php?route=' . rawurlencode($route);

try {
    require_once $endpointPath;
} catch (Throwable $error) {
    error_log(sprintf('Front controller dispatch failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'The API is temporarily unavailable.');
} finally {
    if ($originalPathInfo === null) {
        unset($_SERVER['PATH_INFO']);
    } else {
        $_SERVER['PATH_INFO'] = $originalPathInfo;
    }

    if ($originalRequestUri === null) {
        unset($_SERVER['REQUEST_URI']);
    } else {
        $_SERVER['REQUEST_URI'] = $originalRequestUri;
    }
}

<?php

declare(strict_types=1);

function alchemize_json_response(array $body, int $status): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function alchemize_error_response(
    int $status,
    string $code,
    string $message,
    array $fields = [],
): never {
    $error = ['code' => $code, 'message' => $message];
    if ($fields !== []) {
        $error['fields'] = $fields;
    }
    alchemize_json_response(['error' => $error], $status);
}

function alchemize_runtime_error_log(string $route, Throwable $error, array $context = []): void
{
    $logDirectory = dirname(__DIR__) . '/private/logs';
    if (!is_dir($logDirectory) && !mkdir($logDirectory, 0750, true) && !is_dir($logDirectory)) {
        return;
    }

    $sqlState = null;
    $providerHttpStatus = null;
    $providerCode = null;
    $providerMessage = null;

    if ($error instanceof PDOException && is_array($error->errorInfo ?? null)) {
        $sqlState = (string) ($error->errorInfo[0] ?? '');
    } elseif (is_string($error->getCode()) && preg_match('/^\d{5}$/', $error->getCode()) === 1) {
        $sqlState = $error->getCode();
    }

    $route = trim((string) $route);
    $route = $route !== '' ? $route : (string) ($context['route'] ?? 'unknown');

    if (method_exists($error, 'getErrors')) {
        $providerErrors = $error->getErrors();
        if (is_array($providerErrors) && $providerErrors !== []) {
            $providerHttpStatus = $error->getCode();
            $first = $providerErrors[0] ?? null;
            if (is_array($first)) {
                $providerCode = (string) ($first['reason'] ?? $first['code'] ?? '');
                $providerMessage = (string) ($first['message'] ?? '');
            } elseif (is_object($first)) {
                $providerCode = (string) ($first->reason ?? $first->code ?? '');
                $providerMessage = (string) ($first->message ?? '');
            }
        }
    }

    if ($providerHttpStatus === null && method_exists($error, 'getCode') && is_numeric($error->getCode())) {
        $providerHttpStatus = (int) $error->getCode();
    }

    $payload = [
        'timestamp' => gmdate('c'),
        'route' => $route,
        'class' => get_class($error),
        'message' => preg_replace('/\s+/', ' ', $error->getMessage()) ?: 'Unknown error',
        'file' => $error->getFile(),
        'line' => $error->getLine(),
        'sqlstate' => $sqlState,
        'provider_http_status' => $providerHttpStatus,
        'provider_code' => $providerCode,
        'provider_message' => $providerMessage,
        'context' => $context,
    ];

    $line = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . PHP_EOL;
    file_put_contents($logDirectory . '/portal-errors.log', $line, FILE_APPEND | LOCK_EX);
}

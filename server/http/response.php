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

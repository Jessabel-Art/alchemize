<?php

declare(strict_types=1);

final class AlchemizeRequestException extends RuntimeException
{
    public function __construct(
        public readonly int $httpStatus,
        public readonly string $errorCode,
        string $message,
    ) {
        parent::__construct($message);
    }
}

function alchemize_decode_json_request(
    string $method,
    string $contentType,
    ?string $contentLength,
    string $rawBody,
): array {
    if (strtoupper($method) !== 'POST') {
        throw new AlchemizeRequestException(405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.');
    }

    if (strtolower(trim(explode(';', $contentType)[0])) !== 'application/json') {
        throw new AlchemizeRequestException(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
    }

    $maximumBytes = 65536;
    if (($contentLength !== null && (int) $contentLength > $maximumBytes) || strlen($rawBody) > $maximumBytes) {
        throw new AlchemizeRequestException(413, 'PAYLOAD_TOO_LARGE', 'The request is too large.');
    }

    try {
        $payload = json_decode($rawBody, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        throw new AlchemizeRequestException(400, 'INVALID_JSON', 'The request body contains invalid JSON.');
    }

    if (!is_array($payload) || array_is_list($payload)) {
        throw new AlchemizeRequestException(400, 'INVALID_REQUEST', 'The request body must be a JSON object.');
    }

    return $payload;
}

function alchemize_read_json_request(): array
{
    $rawBody = file_get_contents('php://input');
    if ($rawBody === false) {
        throw new AlchemizeRequestException(400, 'INVALID_REQUEST', 'The request body could not be read.');
    }

    return alchemize_decode_json_request(
        $_SERVER['REQUEST_METHOD'] ?? 'GET',
        $_SERVER['CONTENT_TYPE'] ?? '',
        $_SERVER['CONTENT_LENGTH'] ?? null,
        $rawBody,
    );
}

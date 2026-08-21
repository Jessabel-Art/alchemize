<?php

declare(strict_types=1);

function alchemize_csrf_token(): string
{
    if (headers_sent()) {
        return '';
    }

    if (session_status() === PHP_SESSION_NONE) {
        session_name('alchemize_sid');
        session_start();
    }

    if (empty($_SESSION['alchemize_csrf'])) {
        $_SESSION['alchemize_csrf'] = bin2hex(random_bytes(32));
    }

    return (string) $_SESSION['alchemize_csrf'];
}

function alchemize_require_csrf(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name('alchemize_sid');
        session_start();
    }

    $expected = $_SESSION['alchemize_csrf'] ?? null;
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? null;

    if (!is_string($expected) || $expected === '' || !is_string($provided) || !hash_equals($expected, $provided)) {
        throw new AlchemizeRequestException(419, 'CSRF_TOKEN_INVALID', 'The security token is invalid or expired.');
    }
}

<?php

declare(strict_types=1);

function alchemize_session_start(): void
{
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    $isSecure = (($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['SERVER_PORT'] ?? '') === '443');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 8,
        'path' => '/',
        'domain' => '',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('alchemize_sid');
    if (!session_start()) {
        error_log('Alchemize session initialization failed.');
        throw new RuntimeException('Session storage is unavailable.');
    }
}

function alchemize_session_user(): ?array
{
    alchemize_session_start();
    $user = $_SESSION['alchemize_user'] ?? null;
    return is_array($user) ? $user : null;
}

function alchemize_set_session_user(array $user): void
{
    alchemize_session_start();
    if (!session_regenerate_id(true)) {
        error_log('Alchemize session identifier regeneration failed.');
        throw new RuntimeException('Session storage is unavailable.');
    }
    $_SESSION['alchemize_user'] = $user;
}

function alchemize_clear_session_user(): void
{
    alchemize_session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
}

function alchemize_require_authenticated_user(): array
{
    $user = alchemize_session_user();
    if (!is_array($user) || empty($user['user_id'])) {
        throw new AlchemizeRequestException(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    return $user;
}

function alchemize_require_roles(array $allowedRoles): array
{
    $user = alchemize_require_authenticated_user();
    $roleSlug = (string) ($user['role_slug'] ?? '');
    if ($allowedRoles === [] || in_array($roleSlug, $allowedRoles, true)) {
        return $user;
    }

    throw new AlchemizeRequestException(403, 'FORBIDDEN', 'You do not have permission to perform that action.');
}

<?php

declare(strict_types=1);

function alchemize_project_root(): string
{
    return dirname(__DIR__, 2);
}

function alchemize_load_environment_file(?string $path = null): void
{
    static $loadedPaths = [];
    $environmentPath = $path ?? alchemize_project_root() . '/.env';
    if (isset($loadedPaths[$environmentPath]) || !is_file($environmentPath)) {
        return;
    }

    $lines = file($environmentPath, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        throw new RuntimeException('The local environment file could not be read.');
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        if (str_starts_with($trimmed, 'export ')) {
            $trimmed = trim(substr($trimmed, 7));
        }

        $separator = strpos($trimmed, '=');
        if ($separator === false) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $separator));
        if (preg_match('/^[A-Z_][A-Z0-9_]*$/i', $key) !== 1 || getenv($key) !== false) {
            continue;
        }

        $value = trim(substr($trimmed, $separator + 1));
        if (strlen($value) >= 2) {
            $quote = $value[0];
            if (($quote === '"' || $quote === "'") && str_ends_with($value, $quote)) {
                $value = substr($value, 1, -1);
                if ($quote === '"') {
                    $value = str_replace(['\\n', '\\r', '\\"', '\\\\'], ["\n", "\r", '"', '\\'], $value);
                }
            }
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    $loadedPaths[$environmentPath] = true;
}

function alchemize_resolve_project_path(string $path): string
{
    $trimmed = trim($path);
    if ($trimmed === '') {
        return '';
    }

    if (preg_match('#^(?:[A-Za-z]:[\\\\/]|/)#', $trimmed) === 1) {
        return str_replace('\\', '/', $trimmed);
    }

    $segments = preg_split('#[\\\\/]+#', $trimmed) ?: [];
    if (in_array('..', $segments, true)) {
        throw new RuntimeException('Relative configuration paths may not traverse parent directories.');
    }

    return alchemize_project_root() . '/' . ltrim(str_replace('\\', '/', $trimmed), '/');
}

function alchemize_config(): array
{
    static $config = null;
    if (is_array($config)) {
        return $config;
    }

    alchemize_load_environment_file();

    $localPath = __DIR__ . '/config.local.php';
    $local = is_file($localPath) ? require $localPath : [];
    if (!is_array($local)) {
        throw new RuntimeException('Local configuration must return an array.');
    }

    $env = static function (string|array $keys, mixed $fallback = null): mixed {
        foreach ((array) $keys as $key) {
            $value = getenv($key);
            if ($value !== false && $value !== '') {
                return $value;
            }
        }
        return $fallback;
    };

    $localDatabase = is_array($local['database'] ?? null) ? $local['database'] : [];
    $localStripe = is_array($local['stripe'] ?? null) ? $local['stripe'] : [];
    $config = [
        'app_env' => (string) $env(['ALCHEMIZE_APP_ENV', 'APP_ENV'], $local['app_env'] ?? 'production'),
        'app_url' => (string) $env(['ALCHEMIZE_APP_URL', 'APP_URL'], $local['app_url'] ?? 'http://localhost:5173'),
        'document_storage_root' => (string) $env(
            'ALCHEMIZE_DOCUMENT_STORAGE_ROOT',
            $local['document_storage_root'] ?? dirname(__DIR__) . '/storage/client-documents',
        ),
        'stripe' => [
            'publishable_key' => (string) $env(['ALCHEMIZE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY'], $localStripe['publishable_key'] ?? ''),
            'secret_key' => (string) $env(['ALCHEMIZE_STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY'], $localStripe['secret_key'] ?? ''),
            'webhook_secret' => (string) $env(['ALCHEMIZE_STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET'], $localStripe['webhook_secret'] ?? ''),
        ],
        'google' => [
            'project_id' => (string) $env('GOOGLE_PROJECT_ID', ''),
            'service_account_email' => (string) $env('GOOGLE_SERVICE_ACCOUNT_EMAIL', ''),
            'credentials_path' => alchemize_resolve_project_path((string) $env('GOOGLE_APPLICATION_CREDENTIALS', '')),
            'client_root_folder_id' => (string) $env('GOOGLE_CLIENT_ROOT_FOLDER_ID', ''),
            'calendar_id' => (string) $env('GOOGLE_CALENDAR_ID', ''),
        ],
        'email_provider' => (string) $env('EMAIL_PROVIDER', 'resend'),

        'resend' => [
            'api_key' => (string) $env('RESEND_API_KEY', ''),
            'from_email' => (string) $env('RESEND_FROM_EMAIL', 'notifications@getalchemize.com'),
            'from_name' => (string) $env('RESEND_FROM_NAME', 'Alchemize Business Services'),
            'reply_to_email' => (string) $env('RESEND_REPLY_TO_EMAIL', 'admin@getalchemize.com'),
        ],
        'database' => [
            'host' => (string) $env(['ALCHEMIZE_DB_HOST', 'DB_HOST'], $localDatabase['host'] ?? ''),
            'port' => (int) $env(['ALCHEMIZE_DB_PORT', 'DB_PORT'], $localDatabase['port'] ?? 3306),
            'name' => (string) $env(['ALCHEMIZE_DB_NAME', 'DB_NAME'], $localDatabase['name'] ?? ''),
            'user' => (string) $env(['ALCHEMIZE_DB_USER', 'DB_USER'], $localDatabase['user'] ?? ''),
            'password' => (string) $env(['ALCHEMIZE_DB_PASSWORD', 'DB_PASSWORD'], $localDatabase['password'] ?? ''),
        ],
    ];

    return $config;
}

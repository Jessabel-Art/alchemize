<?php

declare(strict_types=1);

function alchemize_config(): array
{
    static $config = null;
    if (is_array($config)) {
        return $config;
    }

    $localPath = __DIR__ . '/config.local.php';
    $local = is_file($localPath) ? require $localPath : [];
    if (!is_array($local)) {
        throw new RuntimeException('Local configuration must return an array.');
    }

    $env = static fn (string $key, mixed $fallback = null): mixed =>
        (($value = getenv($key)) !== false && $value !== '') ? $value : $fallback;

    $localDatabase = is_array($local['database'] ?? null) ? $local['database'] : [];
    $config = [
        'app_env' => (string) $env('ALCHEMIZE_APP_ENV', $local['app_env'] ?? 'production'),
        'database' => [
            'host' => (string) $env('ALCHEMIZE_DB_HOST', $localDatabase['host'] ?? ''),
            'port' => (int) $env('ALCHEMIZE_DB_PORT', $localDatabase['port'] ?? 3306),
            'name' => (string) $env('ALCHEMIZE_DB_NAME', $localDatabase['name'] ?? ''),
            'user' => (string) $env('ALCHEMIZE_DB_USER', $localDatabase['user'] ?? ''),
            'password' => (string) $env('ALCHEMIZE_DB_PASSWORD', $localDatabase['password'] ?? ''),
        ],
    ];

    return $config;
}

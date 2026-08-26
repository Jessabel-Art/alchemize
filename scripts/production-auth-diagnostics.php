<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$projectRoot = dirname(__DIR__);
$bootstrap = $projectRoot . '/bootstrap.php';
$autoload = $projectRoot . '/vendor/autoload.php';
$checks = [
    'APP_ENV' => false,
    'APP_URL' => false,
    'DATABASE_CONFIG' => false,
    'DATABASE_CONNECTION' => false,
    'PDO_DRIVER' => in_array('mysql', PDO::getAvailableDrivers(), true),
    'COMPOSER_AUTOLOAD' => is_file($autoload),
    'SESSION_WRITE' => false,
    'AUTH_REPOSITORY' => false,
];

try {
    if (!is_file($bootstrap)) {
        throw new RuntimeException('Bootstrap is unavailable.');
    }

    $config = require $bootstrap;
    $checks['APP_ENV'] = trim((string) ($config['app_env'] ?? '')) !== '';
    $checks['APP_URL'] = trim((string) ($config['app_url'] ?? '')) !== '';

    $databaseConfig = $config['database'] ?? [];
    $checks['DATABASE_CONFIG'] = is_array($databaseConfig)
        && array_reduce(
            ['host', 'port', 'name', 'user', 'password'],
            static fn (bool $ready, string $key): bool => $ready
                && array_key_exists($key, $databaseConfig)
                && trim((string) $databaseConfig[$key]) !== '',
            true,
        );

    if ($checks['DATABASE_CONFIG'] && $checks['PDO_DRIVER']) {
        try {
            $database = alchemize_database($databaseConfig);
            $database->query('SELECT 1');
            $checks['DATABASE_CONNECTION'] = true;

            $repository = new AlchemizeUserRepository($database);
            $statement = $database->query('SELECT 1 FROM users LIMIT 1');
            $statement->fetch();
            $checks['AUTH_REPOSITORY'] = $repository instanceof AlchemizeUserRepository;
        } catch (Throwable) {
            // Status-only diagnostic: never expose connection details.
        }
    }

    try {
        $diagnosticSessionId = bin2hex(random_bytes(16));
        session_id($diagnosticSessionId);
        alchemize_session_start();
        $_SESSION['alchemize_diagnostic'] = $diagnosticSessionId;
        session_write_close();

        session_id($diagnosticSessionId);
        alchemize_session_start();
        $checks['SESSION_WRITE'] = hash_equals(
            $diagnosticSessionId,
            (string) ($_SESSION['alchemize_diagnostic'] ?? ''),
        );
        $_SESSION = [];
        session_destroy();
    } catch (Throwable) {
        $checks['SESSION_WRITE'] = false;
    }
} catch (Throwable) {
    // Individual statuses below are sufficient and safe for production support.
}

foreach ($checks as $name => $configured) {
    $successLabels = ['DATABASE_CONNECTION'];
    $ready = in_array($name, $successLabels, true) ? 'success' : 'configured';
    $failed = in_array($name, $successLabels, true) ? 'failure' : 'missing';
    echo $name . '=' . ($configured ? $ready : $failed) . PHP_EOL;
}

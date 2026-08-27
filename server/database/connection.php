<?php

declare(strict_types=1);

function alchemize_database(array $config): PDO
{
    static $connections = [];
    foreach (['host', 'port', 'name', 'user', 'password'] as $key) {
        if (!array_key_exists($key, $config) || ($key !== 'password' && $config[$key] === '')) {
            throw new RuntimeException('Database configuration is incomplete.');
        }
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['host'],
        $config['port'],
        $config['name'],
    );

    $key = hash('sha256', $dsn . "\0" . (string) $config['user'] . "\0" . (string) $config['password']);
    if (isset($connections[$key])) return $connections[$key];
    $connections[$key] = new PDO($dsn, $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $connections[$key];
}

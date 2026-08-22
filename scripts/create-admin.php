#!/usr/bin/env php
<?php

declare(strict_types=1);

$bootstrapCandidates = array_filter([
    getenv('ALCHEMIZE_SERVER_BOOTSTRAP') ?: null,
    dirname(__DIR__) . '/alchemize-server/bootstrap.php',
    dirname(__DIR__) . '/server/bootstrap.php',
], static fn (?string $candidate): bool => is_string($candidate) && $candidate !== '');

$bootstrap = null;
foreach ($bootstrapCandidates as $candidate) {
    if (is_file($candidate)) {
        $bootstrap = $candidate;
        break;
    }
}

if ($bootstrap === null) {
    fwrite(STDERR, "Unable to resolve the Alchemize server bootstrap. Set ALCHEMIZE_SERVER_BOOTSTRAP or place bootstrap.php in /alchemize-server or /server.\n");
    exit(1);
}

require_once $bootstrap;

function readArgOrPrompt(array $args, string $key, string $prompt): string
{
    if (isset($args[$key])) {
        return trim((string) $args[$key]);
    }

    fwrite(STDOUT, $prompt . "\n");
    $value = trim((string) fgets(STDIN));
    return $value;
}

$args = [];
foreach ($argv as $index => $argument) {
    if ($index === 0) {
        continue;
    }
    if (str_starts_with($argument, '--')) {
        $parts = explode('=', $argument, 2);
        $key = substr($parts[0], 2);
        $args[$key] = $parts[1] ?? '';
    }
}

$email = readArgOrPrompt($args, 'email', 'Enter the initial admin email:');
$displayName = readArgOrPrompt($args, 'name', 'Enter the admin display name:');
$password = readArgOrPrompt($args, 'password', 'Enter a secure password:');

if ($email === '' || $displayName === '' || $password === '') {
    fwrite(STDERR, "Email, name, and password are required.\n");
    exit(1);
}

try {
    $config = alchemize_config();
    $database = alchemize_database($config['database']);
    $service = new AlchemizeAuthService(
        new AlchemizeUserRepository($database),
        new AlchemizeRoleRepository($database),
    );

    $result = $service->createInitialOwner($email, $password, $displayName);
    fwrite(STDOUT, "Created owner admin account for {$result['email']} ({$result['display_name']}).\n");
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
}

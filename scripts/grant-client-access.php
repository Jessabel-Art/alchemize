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
    fwrite(STDERR, "Unable to resolve the Alchemize server bootstrap.\n");
    exit(1);
}

require_once $bootstrap;

$arguments = [];
foreach (array_slice($argv, 1) as $argument) {
    if (str_starts_with($argument, '--')) {
        [$key, $value] = array_pad(explode('=', substr($argument, 2), 2), 2, '');
        $arguments[$key] = trim($value);
    }
}

$email = strtolower($arguments['email'] ?? '');
$clientPublicId = $arguments['client'] ?? '';
$accessRole = $arguments['role'] ?? 'authorized_user';
$isDefault = ($arguments['default'] ?? 'no') === 'yes' ? 1 : 0;
$allowedRoles = ['primary_contact', 'authorized_user', 'billing_contact', 'document_contact', 'read_only'];

if ($email === '' || $clientPublicId === '' || !in_array($accessRole, $allowedRoles, true)) {
    fwrite(STDERR, "Usage: grant-client-access.php --email=user@example.com --client=CLIENT-PUBLIC-UUID [--role=authorized_user] [--default=yes]\n");
    exit(1);
}

try {
    $database = alchemize_database(alchemize_config()['database']);
    $database->beginTransaction();

    $userStatement = $database->prepare(
        'SELECT u.id, r.slug AS role_slug
         FROM users u INNER JOIN roles r ON r.id = u.role_id
         WHERE u.email = :email AND u.status = \'active\' LIMIT 1'
    );
    $userStatement->execute(['email' => $email]);
    $user = $userStatement->fetch();
    if (!is_array($user) || !in_array($user['role_slug'], ['client', 'business-authorized-user'], true)) {
        throw new RuntimeException('An active client portal user was not found.');
    }

    $clientStatement = $database->prepare(
        'SELECT id FROM clients WHERE public_id = :public_id AND status <> \'archived\' LIMIT 1'
    );
    $clientStatement->execute(['public_id' => $clientPublicId]);
    $client = $clientStatement->fetch();
    if (!is_array($client)) {
        throw new RuntimeException('The client record was not found.');
    }

    if ($isDefault === 1) {
        $clearDefault = $database->prepare('UPDATE client_access_grants SET is_default = 0 WHERE user_id = :user_id');
        $clearDefault->execute(['user_id' => (int) $user['id']]);
    }

    $grant = $database->prepare(
        'INSERT INTO client_access_grants
            (public_id, user_id, client_id, access_role, status, is_default, effective_at)
         VALUES
            (:public_id, :user_id, :client_id, :access_role, \'active\', :is_default, CURRENT_TIMESTAMP(6))
         ON DUPLICATE KEY UPDATE
            access_role = VALUES(access_role), status = \'active\', is_default = VALUES(is_default),
            effective_at = COALESCE(effective_at, CURRENT_TIMESTAMP(6)), expires_at = NULL'
    );
    $grant->execute([
        'public_id' => alchemize_uuid_v4(),
        'user_id' => (int) $user['id'],
        'client_id' => (int) $client['id'],
        'access_role' => $accessRole,
        'is_default' => $isDefault,
    ]);

    $database->commit();
    fwrite(STDOUT, "Client portal access granted.\n");
} catch (Throwable $error) {
    if (isset($database) && $database instanceof PDO && $database->inTransaction()) {
        $database->rollBack();
    }
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
}

<?php

declare(strict_types=1);

final class AlchemizeAuthService
{
    public function __construct(
        private readonly AlchemizeUserRepository $users,
        private readonly AlchemizeRoleRepository $roles,
    ) {}

    public function login(string $email, string $password): array
    {
        $normalizedEmail = strtolower(trim($email));
        $user = $this->users->findByEmail($normalizedEmail);

        if ($user === null || !password_verify($password, (string) ($user['password_hash'] ?? ''))) {
            throw new AlchemizeRequestException(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
        }

        if ((string) ($user['status'] ?? '') !== 'active') {
            throw new AlchemizeRequestException(403, 'ACCOUNT_DISABLED', 'This account is not active.');
        }

        $this->users->updateLastLogin((int) $user['id']);

        return [
            'user_id' => (int) $user['id'],
            'public_id' => (string) $user['public_id'],
            'email' => (string) $user['email'],
            'display_name' => (string) $user['display_name'],
            'role_slug' => (string) ($user['role_slug'] ?? 'client'),
            'role_name' => (string) ($user['role_name'] ?? 'Client'),
        ];
    }

    public function createInitialOwner(string $email, string $password, string $displayName): array
    {
        $normalizedEmail = strtolower(trim($email));
        if ($normalizedEmail === '' || trim($displayName) === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Email and display name are required.');
        }

        $existing = $this->users->findByEmail($normalizedEmail);
        if ($existing !== null) {
            throw new AlchemizeRequestException(409, 'USER_EXISTS', 'An account with this email already exists.');
        }

        $role = $this->roles->findBySlug('owner-admin');
        if ($role === null) {
            throw new AlchemizeRequestException(500, 'ROLE_MISSING', 'Owner role is not available.');
        }

        $userId = $this->users->create([
            'public_id' => alchemize_uuid_v4(),
            'email' => $normalizedEmail,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'display_name' => trim($displayName),
            'status' => 'active',
            'role_id' => (int) $role['id'],
        ]);

        return ['user_id' => $userId, 'email' => $normalizedEmail, 'display_name' => trim($displayName)];
    }
}

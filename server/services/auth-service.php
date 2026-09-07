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
            'password_changed_at' => null,
        ]);
        $this->users->touchPasswordChangedAt($userId);

        return ['user_id' => $userId, 'email' => $normalizedEmail, 'display_name' => trim($displayName)];
    }

    public function getAccountSummary(int $userId): array
    {
        $user = $this->users->findById($userId);
        if ($user === null) {
            throw new AlchemizeRequestException(404, 'USER_NOT_FOUND', 'This account could not be found.');
        }

        return [
            'user' => [
                'user_id' => (int) $user['id'],
                'public_id' => (string) $user['public_id'],
                'email' => (string) $user['email'],
                'display_name' => (string) $user['display_name'],
                'role_slug' => (string) ($user['role_slug'] ?? ''),
                'role_name' => (string) ($user['role_name'] ?? ''),
                'status' => (string) ($user['status'] ?? 'active'),
                'last_login_at' => $user['last_login_at'] ?? null,
                'password_changed_at' => $user['password_changed_at'] ?? null,
            ],
            'recent_activity' => $this->users->listRecentSecurityActivity($userId, 10),
            'security' => [
                'mfa_available' => false,
                'session_note' => 'Current browser session is managed by secure cookies and can be ended by signing out.',
            ],
        ];
    }

    public function updateProfile(int $userId, string $displayName, string $email): array
    {
        $trimmedName = trim($displayName);
        $normalizedEmail = strtolower(trim($email));
        if ($trimmedName === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Display name is required.');
        }
        if (!filter_var($normalizedEmail, FILTER_VALIDATE_EMAIL)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A valid email address is required.');
        }

        $existing = $this->users->findByEmail($normalizedEmail);
        if ($existing !== null && (int) $existing['id'] !== $userId) {
            throw new AlchemizeRequestException(409, 'EMAIL_IN_USE', 'This email is already associated with another account.');
        }

        $this->users->updateProfile($userId, $trimmedName, $normalizedEmail);
        $summary = $this->getAccountSummary($userId);
        $audit = new AlchemizeAuditEventRepository(alchemize_database(alchemize_config()['database']));
        $audit->create([
            'public_id' => alchemize_uuid_v4(),
            'actor_user_id' => $userId,
            'event_type' => 'user.profile.updated',
            'entity_type' => 'user',
            'entity_id' => (string) $summary['user']['public_id'],
            'action_summary' => 'Updated account profile details for the current user.',
            'request_metadata' => null,
        ]);

        return [
            'updated' => true,
            'user' => $summary['user'],
            'recent_activity' => $summary['recent_activity'],
            'security' => $summary['security'],
        ];
    }
}

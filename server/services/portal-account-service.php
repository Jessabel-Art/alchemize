<?php

declare(strict_types=1);

final class AlchemizePortalAccountService
{
    public function __construct(
        private readonly PDO $database,
        private readonly AlchemizeUserRepository $users,
        private readonly AlchemizeRoleRepository $roles,
        private readonly AlchemizePortalAccountRepository $accounts,
        private readonly array $config,
    ) {}

    public function provision(int $clientId, string $email, string $displayName, ?int $actorId): array
    {
        $normalizedEmail = strtolower(trim($email));
        if (!filter_var($normalizedEmail, FILTER_VALIDATE_EMAIL)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A valid email is required to invite a portal user.');
        }
        $existing = $this->users->findByEmail($normalizedEmail);
        if ($existing !== null) {
            throw new AlchemizeRequestException(409, 'EMAIL_IN_USE', 'That email is already associated with an account.');
        }
        $role = $this->roles->findBySlug('client');
        if ($role === null) throw new RuntimeException('Client role is not configured.');
        $userId = $this->users->create([
            'public_id' => alchemize_uuid_v4(), 'email' => $normalizedEmail,
            'password_hash' => null, 'display_name' => $displayName,
            'status' => 'invited', 'role_id' => (int) $role['id'],
        ]);
        $this->accounts->createAccessGrant($userId, $clientId, $actorId);
        return $this->issue($clientId, $userId, 'invitation', $actorId);
    }

    public function issueForClient(int $clientId, string $purpose, ?int $actorId): array
    {
        $status = $this->accounts->statusForClient($clientId);
        if ($status === null || empty($status['user_id'])) throw new AlchemizeRequestException(409, 'PORTAL_ACCOUNT_MISSING', 'This client does not have a portal account.');
        $active = $status['user_status'] === 'active' && !empty($status['password_hash']);
        if ($purpose === 'invitation' && $active) throw new AlchemizeRequestException(409, 'ACCOUNT_ALREADY_ACTIVE', 'This portal account is already active.');
        if ($purpose === 'password_reset' && !$active) throw new AlchemizeRequestException(409, 'ACCOUNT_NOT_ACTIVE', 'Password reset is available only after portal setup is complete.');
        return $this->issue($clientId, (int) $status['user_id'], $purpose, $actorId);
    }

    private function issue(int $clientId, int $userId, string $purpose, ?int $actorId): array
    {
        if (($this->config['app_env'] ?? 'production') !== 'development') {
            throw new AlchemizeRequestException(503, 'EMAIL_NOT_CONFIGURED', 'Email delivery is not configured. The invitation was not sent.');
        }
        $this->accounts->invalidateTokens($userId, $purpose);
        $raw = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $hours = $purpose === 'invitation' ? 72 : 1;
        $expires = (new DateTimeImmutable("+{$hours} hours"))->format('Y-m-d H:i:s.u');
        $this->accounts->createToken($userId, $clientId, $purpose, hash('sha256', $raw), $expires, $actorId);
        $path = $purpose === 'invitation' ? '/set-password?purpose=invitation&token=' : '/set-password?purpose=password_reset&token=';
        $url = rtrim((string) ($this->config['app_url'] ?? ''), '/') . $path . rawurlencode($raw);
        $this->deliver($purpose, $url);
        $result = ['purpose' => $purpose, 'expires_at' => $expires, 'delivery' => 'queued'];
        if (($this->config['app_env'] ?? 'production') === 'development') $result['development_url'] = $url;
        return $result;
    }

    private function deliver(string $purpose, string $url): void
    {
        if (($this->config['app_env'] ?? 'production') === 'development') {
            error_log(sprintf('Development portal %s URL: %s', $purpose, $url));
            return;
        }
        throw new AlchemizeRequestException(503, 'EMAIL_NOT_CONFIGURED', 'Email delivery is not configured. The invitation was not sent.');
    }

    public function setPassword(string $rawToken, string $purpose, string $password): void
    {
        if (!in_array($purpose, ['invitation', 'password_reset'], true)) throw new AlchemizeRequestException(422, 'INVALID_TOKEN', 'This setup link is invalid or expired.');
        if (strlen($password) < 12) throw new AlchemizeRequestException(422, 'WEAK_PASSWORD', 'Use at least 12 characters for your password.');
        $token = $this->accounts->findUsableToken($rawToken, $purpose);
        if ($token === null) throw new AlchemizeRequestException(410, 'TOKEN_EXPIRED_OR_USED', 'This setup link is invalid, expired, or has already been used.');
        $this->accounts->consume((int) $token['id'], (int) $token['user_id'], (int) $token['client_id'], password_hash($password, PASSWORD_DEFAULT));
    }
}

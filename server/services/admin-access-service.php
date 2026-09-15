<?php

declare(strict_types=1);

// Admin onboarding shares users, roles, password hashing, and account tokens with auth.
final class AlchemizeAdminAccessService
{
    private AlchemizeUserRepository $users;
    private AlchemizePortalAccountRepository $tokens;
    private const ROLES = ['owner-admin', 'administrator', 'staff', 'read-only'];

    public function __construct(private readonly PDO $database, private readonly array $config)
    {
        $this->users = new AlchemizeUserRepository($database);
        $this->tokens = new AlchemizePortalAccountRepository($database);
    }

    private function manager(int $actorId, string $role, ?array $target = null): array
    {
        $actor = $this->users->findById($actorId);
        if (!$actor || $actor['status'] !== 'active' || !in_array($actor['role_slug'], ['owner-admin', 'administrator'], true)) {
            throw new AlchemizeRequestException(403, 'FORBIDDEN', 'You cannot manage team access.');
        }
        if (!in_array($role, self::ROLES, true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid team role.');
        if ($actor['role_slug'] !== 'owner-admin' && ($role === 'owner-admin' || ($target['role_slug'] ?? '') === 'owner-admin')) {
            throw new AlchemizeRequestException(403, 'FORBIDDEN', 'Only an owner can assign or manage ownership access.');
        }
        return $actor;
    }

    // Serialize membership writes, including concurrent owner demotions and token acceptance.
    private function lockTeam(): void
    {
        $this->database->query("SELECT id FROM roles WHERE slug IN ('owner-admin','administrator','staff','read-only') ORDER BY id FOR UPDATE")->fetchAll();
    }

    public function invite(int $actorId, array $payload): array
    {
        $name = trim((string) ($payload['display_name'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $role = (string) ($payload['role_slug'] ?? 'administrator');
        if ($name === '' || strlen($name) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Enter a name and valid email address.');
        }
        $this->database->beginTransaction();
        try {
            $this->lockTeam();
            $actor = $this->manager($actorId, $role);
            if ($this->users->findByEmail($email)) throw new AlchemizeRequestException(409, 'EMAIL_IN_USE', 'That email already has an account. Manage its existing access or invitation.');
            $roleRow = (new AlchemizeRoleRepository($this->database))->findBySlug($role);
            if (!$roleRow || !$roleRow['is_active']) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'This role is unavailable.');
            $id = $this->users->create(['public_id' => alchemize_uuid_v4(), 'email' => $email, 'display_name' => $name,
                'role_id' => (int) $roleRow['id'], 'status' => 'invited', 'password_hash' => null]);
            $issued = $this->issue($id, 'admin_invitation', $actorId);
            $this->database->commit();
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
        return $this->sendInvitation($email, $actor, (string) $roleRow['name'], $issued);
    }

    public function invitations(): array
    {
        return $this->database->query("SELECT u.id AS user_id, u.display_name, u.email, r.slug AS role_slug, r.name AS role_name,
            t.created_at AS invited_at, t.expires_at,
            CASE WHEN t.invalidated_at IS NOT NULL THEN 'revoked' WHEN t.expires_at <= CURRENT_TIMESTAMP(6) THEN 'expired'
                 WHEN t.id IS NULL THEN 'not_sent' ELSE 'pending' END AS invitation_status
            FROM users u JOIN roles r ON r.id = u.role_id
            LEFT JOIN portal_account_tokens t ON t.id = (SELECT MAX(p.id) FROM portal_account_tokens p WHERE p.user_id=u.id AND p.purpose='admin_invitation')
            WHERE u.status='invited' AND r.slug IN ('owner-admin','administrator','staff','read-only') ORDER BY u.display_name")->fetchAll();
    }

    public function invitationAction(int $actorId, int $userId, string $action): array
    {
        if (!in_array($action, ['resend', 'revoke'], true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Invalid invitation action.');
        $this->database->beginTransaction();
        try {
            $this->lockTeam();
            $user = $this->users->findById($userId);
            if (!$user || $user['status'] !== 'invited') throw new AlchemizeRequestException(409, 'INVITATION_NOT_PENDING', 'This account is no longer awaiting setup.');
            $actor = $this->manager($actorId, (string) $user['role_slug'], $user);
            $this->tokens->invalidateTokens($userId, 'admin_invitation');
            $issued = $action === 'resend' ? $this->issue($userId, 'admin_invitation', $actorId) : null;
            $this->database->commit();
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
        return $issued ? $this->sendInvitation($user['email'], $actor, $user['role_name'], $issued) : ['revoked' => true];
    }

    public function updateMember(int $actorId, array $payload): void
    {
        $id = (int) ($payload['user_id'] ?? 0);
        $role = (string) ($payload['role_slug'] ?? '');
        $status = (string) ($payload['status'] ?? '');
        $this->database->beginTransaction();
        try {
            $this->lockTeam();
            $target = $this->users->findById($id);
            $this->manager($actorId, $role, $target);
            if (!$target || !in_array($target['role_slug'], self::ROLES, true) || $target['status'] === 'invited' || !$target['password_hash']) {
                throw new AlchemizeRequestException(409, 'ACCOUNT_NOT_READY', 'Complete invitation setup before managing access.');
            }
            if (!in_array($status, ['active', 'inactive', 'suspended'], true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid access status.');
            if ($target['role_slug'] === 'owner-admin' && $target['status'] === 'active' && ($role !== 'owner-admin' || $status !== 'active')) {
                $owners = $this->database->query("SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.slug='owner-admin' AND u.status='active' AND u.password_hash IS NOT NULL FOR UPDATE")->fetchAll();
                if (count($owners) <= 1) throw new AlchemizeRequestException(409, 'LAST_OWNER', 'The last active owner must retain access.');
            }
            if ($id === $actorId) throw new AlchemizeRequestException(403, 'FORBIDDEN', 'You cannot change your own team access here.');
            $roleRow = (new AlchemizeRoleRepository($this->database))->findBySlug($role);
            if (!$roleRow || !$roleRow['is_active']) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'This role is unavailable.');
            $this->database->prepare('UPDATE users SET role_id=:role_id, status=:status WHERE id=:id')->execute(['role_id' => $roleRow['id'], 'status' => $status, 'id' => $id]);
            $this->database->commit();
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    private function issue(int $userId, string $purpose, ?int $actorId, ?string $email = null): array
    {
        $this->tokens->invalidateTokens($userId, $purpose);
        $raw = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $expires = (new DateTimeImmutable($purpose === 'admin_invitation' ? '+72 hours' : '+1 hour'))->format('Y-m-d H:i:s');
        $this->tokens->createToken($userId, null, $purpose, hash('sha256', $raw), $expires, $actorId, $email);
        $url = rtrim((string) $this->config['app_url'], '/') . '/set-password?purpose=' . $purpose . '&token=' . rawurlencode($raw);
        return ['url' => $url, 'expires_at' => $expires];
    }

    private function deliver(string $email, string $title, string $body, string $label, array $issued): array
    {
        $delivery = 'failed';
        try {
            $delivery = alchemize_email_provider($this->config)->deliver([
                'public_id' => alchemize_uuid_v4(), 'recipient_email' => $email, 'title' => $title,
                'message_body' => $body, 'action_url' => $issued['url'], 'action_label' => $label,
                'secondary_text' => "This link expires in " . ($label === 'Accept Invitation' ? '72 hours.' : '1 hour.') . " If you weren't expecting this message, you can ignore it.",
                'app_url' => $this->config['app_url'],
            ]);
        } catch (Throwable $error) {
            error_log('Admin account email delivery failed [' . get_class($error) . '].');
        }
        // No raw tokens in API responses, logs, or stored invitation records.
        return ['expires_at' => $issued['expires_at'], 'email_delivery' => $delivery];
    }

    private function sendInvitation(string $email, array $actor, string $role, array $issued): array
    {
        return $this->deliver($email, "You've been invited to the Alchemize Admin Portal",
            $actor['display_name'] . " has invited you to access the Alchemize administrative workspace.\n\nRole: " . $role,
            'Accept Invitation', $issued);
    }

    public function requestEmailChange(int $userId, string $email, string $password): array
    {
        $email = strtolower(trim($email));
        $this->database->beginTransaction();
        try {
            $this->database->prepare('SELECT id FROM users WHERE id=:id FOR UPDATE')->execute(['id' => $userId]);
            $user = $this->users->findById($userId);
            if (!$user || $user['status'] !== 'active' || !password_verify($password, (string) $user['password_hash'])) throw new AlchemizeRequestException(401, 'INVALID_CREDENTIALS', 'The current password is incorrect.');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Enter a valid email address.');
            if ($this->users->findByEmail($email)) throw new AlchemizeRequestException(409, 'EMAIL_IN_USE', 'This email is already associated with an account.');
            $issued = $this->issue($userId, 'email_change', $userId, $email);
            $this->database->commit();
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
        return $this->deliver($email, 'Confirm your Alchemize login email', 'Confirm this address to change your login email. Your current login email remains in place until confirmation.', 'Confirm email', $issued);
    }

    public function accept(string $raw, string $purpose, string $password = ''): void
    {
        if (!in_array($purpose, ['admin_invitation', 'email_change'], true) || !preg_match('/^[A-Za-z0-9_-]{43}$/', $raw)) throw new AlchemizeRequestException(410, 'INVALID_TOKEN', 'This link is invalid, expired, revoked, or already used.');
        if ($purpose === 'admin_invitation' && strlen($password) < 12) throw new AlchemizeRequestException(422, 'WEAK_PASSWORD', 'Use at least 12 characters for your password.');
        $this->database->beginTransaction();
        try {
            $this->lockTeam();
            $statement = $this->database->prepare('SELECT * FROM portal_account_tokens WHERE token_hash=:hash AND purpose=:purpose AND client_id IS NULL AND used_at IS NULL AND invalidated_at IS NULL AND expires_at > CURRENT_TIMESTAMP(6) FOR UPDATE');
            $statement->execute(['hash' => hash('sha256', $raw), 'purpose' => $purpose]);
            $token = $statement->fetch();
            if (!$token) throw new AlchemizeRequestException(410, 'INVALID_TOKEN', 'This link is invalid, expired, revoked, or already used.');
            $user = $this->users->findById((int) $token['user_id']);
            if ($purpose === 'admin_invitation') {
                if (!$user || $user['status'] !== 'invited' || !in_array($user['role_slug'], self::ROLES, true)) throw new AlchemizeRequestException(410, 'INVALID_TOKEN', 'This invitation is no longer available.');
                $this->database->prepare("UPDATE users SET password_hash=:hash, status='active', password_changed_at=CURRENT_TIMESTAMP(6) WHERE id=:id AND status='invited'")->execute(['hash' => password_hash($password, PASSWORD_DEFAULT), 'id' => $user['id']]);
            } else {
                if (!$user || $user['status'] !== 'active') throw new AlchemizeRequestException(410, 'INVALID_TOKEN', 'This account is not active.');
                if ($this->users->findByEmail($token['pending_email'])) throw new AlchemizeRequestException(409, 'EMAIL_IN_USE', 'This email is already associated with an account.');
                $this->users->updateProfile((int) $user['id'], $user['display_name'], $token['pending_email']);
            }
            $this->database->prepare('UPDATE portal_account_tokens SET used_at=CURRENT_TIMESTAMP(6) WHERE id=:id')->execute(['id' => $token['id']]);
            $this->database->commit();
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }
}

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
        if ($existing !== null && !in_array((string) ($existing['role_slug'] ?? ''), ['client', 'business-authorized-user'], true)) {
            throw new AlchemizeRequestException(409, 'EMAIL_IN_USE', 'That email is already associated with an account.');
        }
        if ($existing === null) {
            $role = $this->roles->findBySlug('client');
            if ($role === null) throw new RuntimeException('Client role is not configured.');
            $userId = $this->users->create([
                'public_id' => alchemize_uuid_v4(), 'email' => $normalizedEmail,
                'password_hash' => null, 'display_name' => $displayName,
                'status' => 'invited', 'role_id' => (int) $role['id'],
            ]);
        } else {
            $userId = (int) $existing['id'];
        }
        $this->accounts->createAccessGrant($userId, $clientId, $actorId);
        return $this->issue($clientId, $userId, $normalizedEmail, 'invitation', $actorId, true);
    }

    public function provisionAuthorized(int $clientId, string $email, string $displayName, string $accessRole, ?int $actorId): array
    {
        $normalizedEmail=strtolower(trim($email));
        if(!filter_var($normalizedEmail,FILTER_VALIDATE_EMAIL))throw new AlchemizeRequestException(422,'VALIDATION_ERROR','A valid email is required.');
        $existing=$this->users->findByEmail($normalizedEmail);
        if($existing!==null&&!in_array((string)($existing['role_slug']??''),['client','business-authorized-user'],true))throw new AlchemizeRequestException(409,'EMAIL_IN_USE','That email is already associated with an account.');
        if($existing===null){$role=$this->roles->findBySlug('business-authorized-user');if($role===null)throw new RuntimeException('Authorized-user role is not configured.');$userId=$this->users->create(['public_id'=>alchemize_uuid_v4(),'email'=>$normalizedEmail,'password_hash'=>null,'display_name'=>$displayName,'status'=>'invited','role_id'=>(int)$role['id']]);}else{$userId=(int)$existing['id'];}
        $this->accounts->createAuthorizedAccessGrant($userId,$clientId,$accessRole,$actorId);
        $result=$this->issue($clientId,$userId,$normalizedEmail,'invitation',$actorId,true);$result['_user_id']=$userId;return $result;
    }

    public function issueForClient(int $clientId, string $purpose, ?int $actorId): array
    {
        $status = $this->accounts->statusForClient($clientId);
        if ($status === null || empty($status['user_id'])) throw new AlchemizeRequestException(409, 'PORTAL_ACCOUNT_MISSING', 'This client does not have a portal account.');
        $active = $status['user_status'] === 'active' && !empty($status['password_hash']);
        if ($purpose === 'invitation' && $active) throw new AlchemizeRequestException(409, 'ACCOUNT_ALREADY_ACTIVE', 'This portal account is already active.');
        if ($purpose === 'password_reset' && !$active) throw new AlchemizeRequestException(409, 'ACCOUNT_NOT_ACTIVE', 'Password reset is available only after portal setup is complete.');
        return $this->issue($clientId, (int) $status['user_id'], (string) $status['email'], $purpose, $actorId, true);
    }

    public function manualLinkForClient(int $clientId, string $purpose, ?int $actorId): array
    {
        $status = $this->accounts->statusForClient($clientId);
        if ($status === null || empty($status['user_id'])) throw new AlchemizeRequestException(409, 'PORTAL_ACCOUNT_MISSING', 'This client does not have a portal account.');
        $active = $status['user_status'] === 'active' && !empty($status['password_hash']);
        if ($purpose === 'invitation' && $active) throw new AlchemizeRequestException(409, 'ACCOUNT_ALREADY_ACTIVE', 'This portal account is already active.');
        if ($purpose === 'password_reset' && !$active) throw new AlchemizeRequestException(409, 'ACCOUNT_NOT_ACTIVE', 'Password reset is available only after portal setup is complete.');
        return $this->issue($clientId, (int) $status['user_id'], (string) $status['email'], $purpose, $actorId, false);
    }

    private function issue(int $clientId, int $userId, string $email, string $purpose, ?int $actorId, bool $deliver): array
    {
        $this->accounts->invalidateTokens($userId, $purpose);
        $raw = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $hours = $purpose === 'invitation' ? 72 : 1;
        $expires = (new DateTimeImmutable("+{$hours} hours"))->format('Y-m-d H:i:s.u');
        $this->accounts->createToken($userId, $clientId, $purpose, hash('sha256', $raw), $expires, $actorId);
        $path = $purpose === 'invitation' ? '/set-password?purpose=invitation&token=' : '/set-password?purpose=password_reset&token=';
        $url = rtrim((string) ($this->config['app_url'] ?? ''), '/') . $path . rawurlencode($raw);
        $delivery = $deliver ? $this->deliver($email, $purpose, $url) : 'not_attempted';
        $result = ['purpose' => $purpose, 'expires_at' => $expires, 'email_delivery' => $delivery];
        if (!$deliver || $delivery !== 'sent') $result['setup_url'] = $url;
        return $result;
    }

    private function deliver(string $email, string $purpose, string $url): string
    {
        if (($this->config['app_env'] ?? 'production') === 'development') {
            error_log(sprintf('Development portal %s URL: %s', $purpose, $url));
            return 'unavailable';
        }
        try {
            if (!function_exists('alchemize_email_provider')) return 'unavailable';
            return alchemize_email_provider($this->config)->deliver([
                'public_id' => alchemize_uuid_v4(), 'recipient_email' => $email,
                'title' => $purpose === 'invitation' ? 'Set up your Alchemize client portal' : 'Reset your Alchemize portal password',
                'message_body' => ($purpose === 'invitation' ? 'Set up your portal password: ' : 'Reset your portal password: ') . $url,
            ]);
        } catch (Throwable $error) {
            error_log(sprintf('Portal account email delivery failed [%s].', get_class($error)));
            return 'failed';
        }
    }

    public function setAccessState(int $clientId, bool $enabled): array
    {
        $this->accounts->setAccessState($clientId, $enabled);
        return ['portal_status' => $enabled ? 'active' : 'disabled'];
    }

    public function requestPasswordReset(string $email): void
    {
        try {
            $status = $this->accounts->statusForEmail($email);
            if ($status === null || $status['user_status'] !== 'active' || empty($status['password_hash'])
                || $status['access_status'] !== 'active' || $status['portal_status'] !== 'active') return;
            $this->issue((int) $status['client_id'], (int) $status['user_id'], (string) $status['email'], 'password_reset', null, true);
        } catch (Throwable $error) {
            error_log(sprintf('Public password reset request failed [%s].', get_class($error)));
        }
    }

    public function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        if (strlen($newPassword) < 12) throw new AlchemizeRequestException(422, 'WEAK_PASSWORD', 'Use at least 12 characters for your password.');
        $user = $this->users->findById($userId);
        if ($user === null || !password_verify($currentPassword, (string) ($user['password_hash'] ?? ''))) {
            throw new AlchemizeRequestException(401, 'INVALID_CREDENTIALS', 'The current password is incorrect.');
        }
        $this->users->updatePasswordHash($userId, password_hash($newPassword, PASSWORD_DEFAULT));
        $this->accounts->invalidateTokens($userId, 'password_reset');
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

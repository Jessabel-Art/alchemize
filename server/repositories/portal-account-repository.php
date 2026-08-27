<?php

declare(strict_types=1);

final class AlchemizePortalAccountRepository
{
    public function __construct(private readonly PDO $database) {}

    public function statusForClient(int $clientId): ?array
    {
        $statement = $this->database->prepare(
            "SELECT u.id AS user_id, u.email, u.status AS user_status, u.password_hash,
                    cag.status AS access_status, c.portal_status,
                    (SELECT pat.expires_at FROM portal_account_tokens pat
                     WHERE pat.user_id = u.id AND pat.purpose = 'invitation'
                       AND pat.used_at IS NULL AND pat.invalidated_at IS NULL
                     ORDER BY pat.created_at DESC LIMIT 1) AS invitation_expires_at
             FROM clients c
             LEFT JOIN client_access_grants cag ON cag.client_id = c.id AND cag.is_default = 1
             LEFT JOIN users u ON u.id = cag.user_id
             WHERE c.id = :client_id LIMIT 1"
        );
        $statement->execute(['client_id' => $clientId]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function statusForEmail(string $email): ?array
    {
        $statement = $this->database->prepare(
            "SELECT u.id AS user_id, u.email, u.status AS user_status, u.password_hash,
                    cag.client_id, cag.status AS access_status, c.portal_status
             FROM users u INNER JOIN client_access_grants cag ON cag.user_id = u.id AND cag.is_default = 1
             INNER JOIN clients c ON c.id = cag.client_id WHERE u.email = :email LIMIT 1"
        );
        $statement->execute(['email' => strtolower(trim($email))]); $row=$statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function createAccessGrant(int $userId, int $clientId, ?int $actorId): void
    {
        $statement = $this->database->prepare(
            "INSERT INTO client_access_grants
                (public_id, user_id, client_id, access_role, status, is_default, granted_by_user_id)
             VALUES (:public_id, :user_id, :client_id, 'primary_contact', 'pending', 1, :actor_id)
             ON DUPLICATE KEY UPDATE status = IF(status = 'revoked', 'pending', status),
                 is_default = 1, granted_by_user_id = COALESCE(VALUES(granted_by_user_id), granted_by_user_id)"
        );
        $statement->execute(['public_id' => alchemize_uuid_v4(), 'user_id' => $userId, 'client_id' => $clientId, 'actor_id' => $actorId]);
    }

    public function createAuthorizedAccessGrant(int $userId, int $clientId, string $role, ?int $actorId): void
    {
        $statement = $this->database->prepare(
            "INSERT INTO client_access_grants (public_id,user_id,client_id,access_role,status,is_default,granted_by_user_id)
             VALUES(:public_id,:user_id,:client_id,:role,'pending',0,:actor_id)
             ON DUPLICATE KEY UPDATE access_role=VALUES(access_role),status=IF(status='revoked','pending',status),
                 granted_by_user_id=COALESCE(VALUES(granted_by_user_id),granted_by_user_id)"
        );
        $statement->execute(['public_id'=>alchemize_uuid_v4(),'user_id'=>$userId,'client_id'=>$clientId,'role'=>$role,'actor_id'=>$actorId]);
    }

    public function setAccessState(int $clientId, bool $enabled): void
    {
        $status = $this->statusForClient($clientId);
        if ($status === null || empty($status['user_id'])) {
            throw new AlchemizeRequestException(409, 'PORTAL_ACCOUNT_MISSING', 'This client does not have a portal account.');
        }
        $this->database->beginTransaction();
        try {
            $this->database->prepare("UPDATE client_access_grants SET status = :status,
                effective_at = IF(:enabled = 1, COALESCE(effective_at, CURRENT_TIMESTAMP(6)), effective_at)
                WHERE client_id = :client_id AND is_default = 1")->execute([
                    'status' => $enabled ? 'active' : 'revoked', 'enabled' => $enabled ? 1 : 0, 'client_id' => $clientId,
                ]);
            $this->database->prepare('UPDATE clients SET portal_status = :status WHERE id = :client_id')
                ->execute(['status' => $enabled ? 'active' : 'disabled', 'client_id' => $clientId]);
            $this->database->prepare("UPDATE users SET status = :status WHERE id = :user_id")
                ->execute(['status' => $enabled ? 'active' : 'inactive', 'user_id' => $status['user_id']]);
            if (!$enabled) $this->invalidateTokens((int) $status['user_id'], 'password_reset');
            $this->database->commit();
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    public function invalidateTokens(int $userId, string $purpose): void
    {
        $statement = $this->database->prepare(
            'UPDATE portal_account_tokens SET invalidated_at = CURRENT_TIMESTAMP(6)
             WHERE user_id = :user_id AND purpose = :purpose AND used_at IS NULL AND invalidated_at IS NULL'
        );
        $statement->execute(['user_id' => $userId, 'purpose' => $purpose]);
    }

    public function createToken(int $userId, int $clientId, string $purpose, string $hash, string $expiresAt, ?int $actorId): void
    {
        $statement = $this->database->prepare(
            'INSERT INTO portal_account_tokens
                (public_id, user_id, client_id, purpose, token_hash, expires_at, created_by_user_id)
             VALUES (:public_id, :user_id, :client_id, :purpose, :token_hash, :expires_at, :actor_id)'
        );
        $statement->execute(['public_id' => alchemize_uuid_v4(), 'user_id' => $userId, 'client_id' => $clientId, 'purpose' => $purpose, 'token_hash' => $hash, 'expires_at' => $expiresAt, 'actor_id' => $actorId]);
    }

    public function findUsableToken(string $rawToken, string $purpose): ?array
    {
        $statement = $this->database->prepare(
            'SELECT pat.*, u.email, u.status AS user_status, cag.status AS access_status
             FROM portal_account_tokens pat
             INNER JOIN users u ON u.id = pat.user_id
             INNER JOIN client_access_grants cag ON cag.user_id = pat.user_id AND cag.client_id = pat.client_id
             WHERE pat.token_hash = :token_hash AND pat.purpose = :purpose
               AND pat.used_at IS NULL AND pat.invalidated_at IS NULL
               AND pat.expires_at > CURRENT_TIMESTAMP(6) LIMIT 1'
        );
        $statement->execute(['token_hash' => hash('sha256', $rawToken), 'purpose' => $purpose]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function consume(int $tokenId, int $userId, int $clientId, string $passwordHash): void
    {
        $this->database->beginTransaction();
        try {
            $statement = $this->database->prepare('UPDATE users SET password_hash = :hash, status = \'active\' WHERE id = :id');
            $statement->execute(['hash' => $passwordHash, 'id' => $userId]);
            $statement = $this->database->prepare("UPDATE client_access_grants SET status = 'active', effective_at = COALESCE(effective_at, CURRENT_TIMESTAMP(6)) WHERE user_id = :user_id AND client_id = :client_id");
            $statement->execute(['user_id' => $userId, 'client_id' => $clientId]);
            $statement = $this->database->prepare("UPDATE clients SET portal_status = 'active' WHERE id = :client_id");
            $statement->execute(['client_id' => $clientId]);
            $statement = $this->database->prepare('UPDATE portal_account_tokens SET used_at = CURRENT_TIMESTAMP(6) WHERE id = :id AND used_at IS NULL');
            $statement->execute(['id' => $tokenId]);
            if ($statement->rowCount() !== 1) throw new RuntimeException('Token was already consumed.');
            $this->database->commit();
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }
}

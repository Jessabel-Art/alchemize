<?php

declare(strict_types=1);

final class AlchemizeUserRepository
{
    public function __construct(private readonly PDO $database) {}

    public function findByEmail(string $email): ?array
    {
        $statement = $this->database->prepare(
            'SELECT u.*, r.slug AS role_slug, r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
             WHERE u.email = :email
             LIMIT 1',
        );
        $statement->execute(['email' => strtolower(trim($email))]);
        $user = $statement->fetch();
        return is_array($user) ? $user : null;
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare(
            'SELECT u.*, r.slug AS role_slug, r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
             WHERE u.id = :id
             LIMIT 1',
        );
        $statement->execute(['id' => $id]);
        $user = $statement->fetch();
        return is_array($user) ? $user : null;
    }

    public function create(array $user): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO users (public_id, email, password_hash, display_name, status, role_id)
             VALUES (:public_id, :email, :password_hash, :display_name, :status, :role_id)',
        );
        $statement->execute($user);
        return (int) $this->database->lastInsertId();
    }

    public function updateLastLogin(int $userId): void
    {
        $statement = $this->database->prepare(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP(6) WHERE id = :id',
        );
        $statement->execute(['id' => $userId]);
    }

    public function hasActiveClientAccess(int $userId): bool
    {
        $statement = $this->database->prepare(
            "SELECT 1 FROM client_access_grants cag
             INNER JOIN clients c ON c.id = cag.client_id
             WHERE cag.user_id = :user_id AND cag.status = 'active'
               AND (cag.effective_at IS NULL OR cag.effective_at <= CURRENT_TIMESTAMP(6))
               AND (cag.expires_at IS NULL OR cag.expires_at > CURRENT_TIMESTAMP(6))
               AND c.portal_status = 'active' AND c.status <> 'archived' LIMIT 1"
        );
        $statement->execute(['user_id' => $userId]);
        return $statement->fetchColumn() !== false;
    }

    public function updatePasswordHash(int $userId, string $passwordHash): void
    {
        $statement = $this->database->prepare('UPDATE users SET password_hash = :hash WHERE id = :id AND status = \'active\'');
        $statement->execute(['hash' => $passwordHash, 'id' => $userId]);
        if ($statement->rowCount() !== 1) throw new AlchemizeRequestException(409, 'ACCOUNT_NOT_ACTIVE', 'This account is not active.');
    }

    public function listInternalUsers(): array
    {
        $statement = $this->database->query(
            "SELECT u.public_id AS id, u.display_name, u.email, u.status, u.last_login_at,
                    r.name AS role_name, r.slug AS role_slug
             FROM users u INNER JOIN roles r ON r.id = u.role_id
             WHERE r.slug IN ('owner-admin','administrator','staff','read-only')
               AND u.status <> 'archived' ORDER BY u.display_name ASC"
        );
        return $statement->fetchAll();
    }
}

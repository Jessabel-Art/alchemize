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
}

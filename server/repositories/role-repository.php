<?php

declare(strict_types=1);

final class AlchemizeRoleRepository
{
    public function __construct(private readonly PDO $database) {}

    public function findBySlug(string $slug): ?array
    {
        $statement = $this->database->prepare(
            'SELECT * FROM roles WHERE slug = :slug LIMIT 1',
        );
        $statement->execute(['slug' => $slug]);
        $role = $statement->fetch();
        return is_array($role) ? $role : null;
    }

    public function listActive(): array
    {
        $statement = $this->database->query('SELECT * FROM roles WHERE is_active = 1 ORDER BY name ASC');
        return $statement->fetchAll();
    }
}

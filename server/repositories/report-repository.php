<?php

declare(strict_types=1);

final class AlchemizeReportRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listForUser(int $userId): array
    {
        $statement = $this->database->prepare(
            'SELECT id, public_id, name, report_type, config_json, created_by_user_id, created_at, updated_at
             FROM saved_reports
             WHERE created_by_user_id = :user_id OR created_by_user_id IS NULL
             ORDER BY created_at DESC'
        );
        $statement->execute(['user_id' => $userId]);
        $rows = $statement->fetchAll();

        return array_map(function (array $row): array {
            $config = json_decode((string) $row['config_json'], true, 512, JSON_THROW_ON_ERROR);
            return [
                'id' => (int) $row['id'],
                'public_id' => (string) $row['public_id'],
                'name' => (string) $row['name'],
                'report_type' => (string) $row['report_type'],
                'config' => is_array($config) ? $config : [],
                'created_by_user_id' => $row['created_by_user_id'] !== null ? (int) $row['created_by_user_id'] : null,
                'created_at' => (string) $row['created_at'],
                'updated_at' => (string) $row['updated_at'],
            ];
        }, $rows);
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare(
            'SELECT id, public_id, name, report_type, config_json, created_by_user_id, created_at, updated_at
             FROM saved_reports WHERE id = :id LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        if (!is_array($row)) {
            return null;
        }

        $config = json_decode((string) $row['config_json'], true, 512, JSON_THROW_ON_ERROR);
        return [
            'id' => (int) $row['id'],
            'public_id' => (string) $row['public_id'],
            'name' => (string) $row['name'],
            'report_type' => (string) $row['report_type'],
            'config' => is_array($config) ? $config : [],
            'created_by_user_id' => $row['created_by_user_id'] !== null ? (int) $row['created_by_user_id'] : null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    public function create(array $row): array
    {
        $statement = $this->database->prepare(
            'INSERT INTO saved_reports (public_id, name, report_type, config_json, created_by_user_id)
             VALUES (:public_id, :name, :report_type, :config_json, :created_by_user_id)'
        );
        $statement->execute([
            'public_id' => $row['public_id'],
            'name' => $row['name'],
            'report_type' => $row['report_type'],
            'config_json' => json_encode($row['config'], JSON_THROW_ON_ERROR),
            'created_by_user_id' => $row['created_by_user_id'],
        ]);

        $id = (int) $this->database->lastInsertId();
        return $this->findById($id) ?? [
            'id' => $id,
            'public_id' => $row['public_id'],
            'name' => $row['name'],
            'report_type' => $row['report_type'],
            'config' => is_array($row['config']) ? $row['config'] : [],
            'created_by_user_id' => $row['created_by_user_id'],
            'created_at' => null,
            'updated_at' => null,
        ];
    }

    public function update(int $id, array $values): array
    {
        if ($values === []) {
            return $this->findById($id) ?? [];
        }

        $fields = [];
        foreach ($values as $field => $value) {
            if ($field === 'config') {
                $fields[] = 'config_json = :config_json';
                continue;
            }
            $fields[] = sprintf('%s = :%s', $field, $field);
        }

        $sql = 'UPDATE saved_reports SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $bindings = ['id' => $id];
        foreach ($values as $field => $value) {
            if ($field === 'config') {
                $bindings['config_json'] = json_encode($value, JSON_THROW_ON_ERROR);
                continue;
            }
            $bindings[$field] = $value;
        }

        $statement = $this->database->prepare($sql);
        $statement->execute($bindings);
        return $this->findById($id) ?? [];
    }

    public function delete(int $id): bool
    {
        $statement = $this->database->prepare('DELETE FROM saved_reports WHERE id = :id');
        $statement->execute(['id' => $id]);
        return $statement->rowCount() > 0;
    }
}

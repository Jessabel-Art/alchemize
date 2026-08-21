<?php

declare(strict_types=1);

final class AlchemizeServiceRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM services ORDER BY service_name ASC');
        return $statement->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM services WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function findByCode(string $code): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM services WHERE service_code = :service_code LIMIT 1');
        $statement->execute(['service_code' => trim($code)]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO services (
                public_id, service_code, service_name, description, audience, category, status,
                default_duration, billing_type, default_price, currency, active_flag,
                billing_description, internal_pricing_notes
            ) VALUES (
                :public_id, :service_code, :service_name, :description, :audience, :category, :status,
                :default_duration, :billing_type, :default_price, :currency, :active_flag,
                :billing_description, :internal_pricing_notes
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }

    public function update(int $id, array $values): void
    {
        if ($values === []) {
            return;
        }
        $fields = [];
        foreach (array_keys($values) as $field) {
            $fields[] = sprintf('%s = :%s', $field, $field);
        }
        $sql = 'UPDATE services SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}

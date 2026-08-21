<?php

declare(strict_types=1);

final class AlchemizeInvoiceRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM invoices ORDER BY created_at DESC');
        return $statement->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM invoices WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO invoices (
                public_id, invoice_number, client_id, engagement_id, invoice_date, due_date,
                status, currency, subtotal, adjustment_total, credit_deposit_total,
                paid_total, outstanding_balance, client_facing_notes, internal_notes,
                issued_at
            ) VALUES (
                :public_id, :invoice_number, :client_id, :engagement_id, :invoice_date, :due_date,
                :status, :currency, :subtotal, :adjustment_total, :credit_deposit_total,
                :paid_total, :outstanding_balance, :client_facing_notes, :internal_notes,
                :issued_at
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
        $sql = 'UPDATE invoices SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}

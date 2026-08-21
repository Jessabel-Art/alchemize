<?php

declare(strict_types=1);

final class AlchemizePaymentRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM payments ORDER BY payment_date DESC, created_at DESC');
        return $statement->fetchAll();
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO payments (
                public_id, invoice_id, client_id, payment_date, amount, payment_method,
                external_reference, internal_note, recorded_by_user_id
            ) VALUES (
                :public_id, :invoice_id, :client_id, :payment_date, :amount, :payment_method,
                :external_reference, :internal_note, :recorded_by_user_id
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }
}

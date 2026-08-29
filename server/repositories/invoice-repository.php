<?php

declare(strict_types=1);

final class AlchemizeInvoiceRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM invoices ORDER BY created_at DESC');
        return array_map(fn (array $row): array => $this->withLineItems($row), $statement->fetchAll());
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM invoices WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $this->withLineItems($row) : null;
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

    public function createWithLineItems(array $row, array $items): int
    {
        $this->database->beginTransaction();
        try {
            $invoiceId = $this->create($row);
            $statement = $this->database->prepare(
                'INSERT INTO invoice_line_items
                    (public_id, invoice_id, service_id, tier_id, service_code_snapshot, service_name_snapshot,
                     tier_name_snapshot, description_snapshot, quantity, unit_price, amount, billing_type_snapshot,
                     pricing_type_snapshot, base_catalog_price_snapshot, pricing_snapshot, catalog_version_snapshot)
                 VALUES (:public_id, :invoice_id, :service_id, :tier_id, :service_code, :service_name,
                     :tier_name, :description, :quantity, :unit_price, :amount, :billing_type,
                     :pricing_type, :base_catalog_price, :pricing_snapshot, :catalog_version)'
            );
            foreach ($items as $item) {
                $statement->execute([
                    'public_id' => alchemize_uuid_v4(), 'invoice_id' => $invoiceId,
                    'service_id' => $item['service_id'], 'service_code' => $item['service_code'],
                    'tier_id' => $item['tier_id'], 'service_name' => $item['service_name'], 'tier_name' => $item['tier_name'],
                    'description' => $item['description'], 'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'], 'amount' => $item['amount'],
                    'billing_type' => $item['billing_type'],
                    'pricing_type' => $item['pricing_type'], 'base_catalog_price' => $item['base_catalog_price'],
                    'pricing_snapshot' => json_encode($item['pricing_snapshot'], JSON_THROW_ON_ERROR), 'catalog_version' => $item['catalog_version'],
                ]);
            }
            $this->database->commit();
            return $invoiceId;
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
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

    private function withLineItems(array $invoice): array
    {
        $statement = $this->database->prepare(
            'SELECT public_id AS id, service_id, tier_id, service_code_snapshot AS service_code,
                    service_name_snapshot AS service_name, tier_name_snapshot AS tier_name,
                    description_snapshot AS description, quantity, unit_price, amount,
                    billing_type_snapshot AS billing_type, pricing_type_snapshot AS pricing_type,
                    base_catalog_price_snapshot AS base_catalog_price, pricing_snapshot, catalog_version_snapshot AS catalog_version
             FROM invoice_line_items WHERE invoice_id = :invoice_id ORDER BY id ASC'
        );
        $statement->execute(['invoice_id' => $invoice['id']]);
        $invoice['line_items'] = $statement->fetchAll();
        return $invoice;
    }
}

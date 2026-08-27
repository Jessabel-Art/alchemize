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
                public_id, request_key, invoice_id, client_id, payment_date, amount, payment_method,
                external_reference, internal_note, recorded_by_user_id
            ) VALUES (
                :public_id, :request_key, :invoice_id, :client_id, :payment_date, :amount, :payment_method,
                :external_reference, :internal_note, :recorded_by_user_id
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }

    public function recordManualPayment(array $row): array
    {
        $this->database->beginTransaction();
        try {
            if (!empty($row['request_key'])) {
                $statement = $this->database->prepare('SELECT * FROM payments WHERE request_key = :request_key LIMIT 1');
                $statement->execute(['request_key' => $row['request_key']]);
                $existing = $statement->fetch();
                if (is_array($existing)) {
                    $this->database->commit();
                    return $existing + ['duplicate' => true];
                }
            }
            $statement = $this->database->prepare(
                "SELECT * FROM invoices WHERE id = :invoice_id AND client_id = :client_id
                 AND status IN ('open','partially_paid','past_due') AND issued_at IS NOT NULL LIMIT 1 FOR UPDATE"
            );
            $statement->execute(['invoice_id' => $row['invoice_id'], 'client_id' => $row['client_id']]);
            $invoice = $statement->fetch();
            if (!is_array($invoice)) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The payable invoice was not found.');
            if ((float) $row['amount'] > (float) $invoice['outstanding_balance']) {
                throw new AlchemizeRequestException(422, 'PAYMENT_EXCEEDS_BALANCE', 'Payment cannot exceed the outstanding balance.');
            }
            $id = $this->create($row);
            $this->database->prepare(
                "UPDATE invoices SET paid_total = paid_total + :amount,
                 outstanding_balance = GREATEST(0, outstanding_balance - :amount2),
                 status = IF(outstanding_balance - :amount3 <= 0, 'paid', 'partially_paid'),
                 paid_at = IF(outstanding_balance - :amount4 <= 0, CURRENT_TIMESTAMP(6), paid_at)
                 WHERE id = :id"
            )->execute(['amount' => $row['amount'], 'amount2' => $row['amount'], 'amount3' => $row['amount'], 'amount4' => $row['amount'], 'id' => $row['invoice_id']]);
            $this->database->commit();
            return ['id' => $id, 'amount' => $row['amount'], 'duplicate' => false];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }
}

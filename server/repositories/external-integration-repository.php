<?php

declare(strict_types=1);

final class AlchemizeExternalIntegrationRepository
{
    public function __construct(private readonly PDO $database) {}

    public function client(int $clientId): ?array
    {
        return $this->one('SELECT * FROM clients WHERE id = :id LIMIT 1', ['id' => $clientId]);
    }

    public function setClientDriveState(int $clientId, string $status, ?string $folderId = null, ?string $error = null): void
    {
        $this->database->prepare(
            'UPDATE clients SET google_drive_folder_id = COALESCE(:folder_id, google_drive_folder_id),
             drive_sync_status = :status, drive_sync_attempted_at = CURRENT_TIMESTAMP(6),
             drive_synced_at = IF(:status = \'synchronized\', CURRENT_TIMESTAMP(6), drive_synced_at), drive_sync_error = :error
             WHERE id = :id'
        )->execute(['folder_id' => $folderId, 'status' => $status, 'error' => $error, 'id' => $clientId]);
    }

    public function submission(int $submissionId): ?array
    {
        return $this->one(
            'SELECT ds.*, d.document_name, c.public_id AS client_public_id, c.display_name,
                    c.google_drive_folder_id FROM document_submissions ds
             INNER JOIN documents_metadata d ON d.id = ds.document_id
             INNER JOIN clients c ON c.id = ds.client_id WHERE ds.id = :id LIMIT 1',
            ['id' => $submissionId],
        );
    }

    public function setDocumentDriveState(int $submissionId, string $status, ?string $fileId = null, ?string $error = null): void
    {
        $this->database->prepare(
            'UPDATE document_submissions SET google_drive_file_id = COALESCE(:file_id, google_drive_file_id),
             drive_sync_status = :status, drive_sync_attempted_at = CURRENT_TIMESTAMP(6),
             drive_synced_at = IF(:status = \'synchronized\', CURRENT_TIMESTAMP(6), drive_synced_at), drive_sync_error = :error
             WHERE id = :id'
        )->execute(['file_id' => $fileId, 'status' => $status, 'error' => $error, 'id' => $submissionId]);
    }

    public function appointment(int $appointmentId): ?array
    {
        return $this->one(
            'SELECT a.*, c.display_name, c.primary_email FROM appointments a
             LEFT JOIN clients c ON c.id = a.client_id WHERE a.id = :id LIMIT 1',
            ['id' => $appointmentId],
        );
    }

    public function setCalendarState(int $appointmentId, string $status, ?string $eventId = null, ?string $error = null, ?string $meetingUrl = null): void
    {
        $this->database->prepare(
            'UPDATE appointments SET google_calendar_event_id = COALESCE(:event_id, google_calendar_event_id),
             meeting_url = COALESCE(:meeting_url, meeting_url),
             calendar_sync_status = :status, calendar_sync_attempted_at = CURRENT_TIMESTAMP(6),
             calendar_synced_at = IF(:status = \'synchronized\', CURRENT_TIMESTAMP(6), calendar_synced_at), calendar_sync_error = :error
             WHERE id = :id'
        )->execute(['event_id' => $eventId, 'meeting_url' => $meetingUrl, 'status' => $status, 'error' => $error, 'id' => $appointmentId]);
    }

    public function invoiceForClient(string $publicId, int $clientId): ?array
    {
        return $this->one(
            "SELECT i.*, c.display_name, c.primary_email, c.stripe_customer_id
             FROM invoices i INNER JOIN clients c ON c.id = i.client_id
             WHERE i.public_id = :public_id AND i.client_id = :client_id AND i.issued_at IS NOT NULL
               AND i.status IN ('open','partially_paid','past_due') AND i.outstanding_balance > 0 LIMIT 1",
            ['public_id' => $publicId, 'client_id' => $clientId],
        );
    }

    public function setStripeCustomer(int $clientId, string $customerId): void
    {
        $this->database->prepare(
            "UPDATE clients SET stripe_customer_id = :customer_id, stripe_sync_status = 'synchronized',
             stripe_sync_attempted_at = CURRENT_TIMESTAMP(6), stripe_synced_at = CURRENT_TIMESTAMP(6), stripe_sync_error = NULL WHERE id = :id"
        )->execute(['customer_id' => $customerId, 'id' => $clientId]);
    }

    public function setStripeClientFailure(int $clientId, string $status, ?string $error): void
    {
        $this->database->prepare(
            'UPDATE clients SET stripe_sync_status = :status, stripe_sync_attempted_at = CURRENT_TIMESTAMP(6), stripe_sync_error = :error WHERE id = :id'
        )->execute(['status' => $status, 'error' => $error, 'id' => $clientId]);
    }

    public function setInvoiceCheckout(int $invoiceId, string $sessionId, ?string $paymentIntentId): void
    {
        $this->database->prepare(
            "UPDATE invoices SET stripe_checkout_session_id = :session_id,
             stripe_payment_intent_id = COALESCE(:payment_intent_id, stripe_payment_intent_id), stripe_sync_status = 'synchronized',
             stripe_sync_attempted_at = CURRENT_TIMESTAMP(6), stripe_synced_at = CURRENT_TIMESTAMP(6), stripe_sync_error = NULL WHERE id = :id"
        )->execute(['session_id' => $sessionId, 'payment_intent_id' => $paymentIntentId, 'id' => $invoiceId]);
    }

    public function setInvoiceStripeFailure(int $invoiceId, string $status, ?string $error): void
    {
        $this->database->prepare(
            'UPDATE invoices SET stripe_sync_status = :status, stripe_sync_attempted_at = CURRENT_TIMESTAMP(6), stripe_sync_error = :error WHERE id = :id'
        )->execute(['status' => $status, 'error' => $error, 'id' => $invoiceId]);
    }

    public function reconcileStripeInvoice(string $paymentIntentId, int $amountCents, ?string $chargeId, ?string $receiptUrl): bool
    {
        $invoice = $this->one('SELECT * FROM invoices WHERE stripe_payment_intent_id = :id LIMIT 1 FOR UPDATE', ['id' => $paymentIntentId]);
        if ($invoice === null) return false;
        $existingPayment = $this->one('SELECT id FROM payments WHERE stripe_payment_intent_id = :id LIMIT 1', ['id' => $paymentIntentId]);
        if ($existingPayment !== null) return true;
        $amount = number_format($amountCents / 100, 2, '.', '');
        $this->database->prepare(
            "INSERT INTO payments (public_id, invoice_id, client_id, payment_date, amount, payment_method,
                external_reference, stripe_payment_intent_id, stripe_charge_id, receipt_url)
             VALUES (:public_id, :invoice_id, :client_id, CURRENT_DATE, :amount, 'stripe', :reference, :intent, :charge, :receipt)
             ON DUPLICATE KEY UPDATE receipt_url = COALESCE(VALUES(receipt_url), receipt_url)"
        )->execute([
            'public_id' => alchemize_uuid_v4(), 'invoice_id' => $invoice['id'], 'client_id' => $invoice['client_id'],
            'amount' => $amount, 'reference' => $chargeId ?: $paymentIntentId, 'intent' => $paymentIntentId,
            'charge' => $chargeId, 'receipt' => $receiptUrl,
        ]);
        $this->database->prepare(
            "UPDATE invoices SET paid_total = LEAST(subtotal + adjustment_total - credit_deposit_total, paid_total + :amount),
             outstanding_balance = GREATEST(0, outstanding_balance - :amount2),
             status = IF(outstanding_balance - :amount3 <= 0, 'paid', 'partially_paid'),
             paid_at = IF(outstanding_balance - :amount4 <= 0, CURRENT_TIMESTAMP(6), paid_at),
             stripe_sync_status = 'synchronized', stripe_synced_at = CURRENT_TIMESTAMP(6), stripe_sync_error = NULL WHERE id = :id"
        )->execute(['amount' => $amount, 'amount2' => $amount, 'amount3' => $amount, 'amount4' => $amount, 'id' => $invoice['id']]);
        return true;
    }

    public function reconcileCheckoutSession(string $sessionId, string $paymentIntentId, int $amountCents): bool
    {
        $this->database->prepare(
            'UPDATE invoices SET stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, :intent) WHERE stripe_checkout_session_id = :session'
        )->execute(['intent' => $paymentIntentId, 'session' => $sessionId]);
        return $this->reconcileStripeInvoice($paymentIntentId, $amountCents, null, null);
    }

    public function registerPublicSubmission(string $requestFingerprint, string $payloadFingerprint, int $limit, int $windowSeconds): string
    {
        $duplicate = $this->one('SELECT lead_id FROM public_submission_guards WHERE payload_fingerprint = :payload LIMIT 1', ['payload' => $payloadFingerprint]);
        if ($duplicate !== null && !empty($duplicate['lead_id'])) return 'duplicate';
        $statement = $this->database->prepare(
            'SELECT COUNT(*) FROM public_submission_guards WHERE request_fingerprint = :request
             AND last_attempt_at >= :cutoff'
        );
        $statement->execute(['request' => $requestFingerprint, 'cutoff' => date('Y-m-d H:i:s.u', time() - $windowSeconds)]);
        if ((int) $statement->fetchColumn() >= $limit) return 'limited';
        $statement = $this->database->prepare(
            'INSERT IGNORE INTO public_submission_guards (public_id, request_fingerprint, payload_fingerprint)
             VALUES (:public_id, :request, :payload)'
        );
        $statement->execute(['public_id' => alchemize_uuid_v4(), 'request' => $requestFingerprint, 'payload' => $payloadFingerprint]);
        if ($statement->rowCount() !== 1) {
            $existing = $this->one('SELECT lead_id FROM public_submission_guards WHERE payload_fingerprint = :payload LIMIT 1', ['payload' => $payloadFingerprint]);
            return $existing !== null && !empty($existing['lead_id']) ? 'duplicate' : 'accepted';
        }
        return 'accepted';
    }

    public function attachLeadToSubmission(string $payloadFingerprint, int $leadId): void
    {
        $this->database->prepare('UPDATE public_submission_guards SET lead_id = :lead_id WHERE payload_fingerprint = :payload')
            ->execute(['lead_id' => $leadId, 'payload' => $payloadFingerprint]);
    }

    private function one(string $sql, array $parameters): ?array
    {
        $statement = $this->database->prepare($sql); $statement->execute($parameters); $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }
}

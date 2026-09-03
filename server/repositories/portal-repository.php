<?php

declare(strict_types=1);

final class AlchemizePortalRepository
{
    public function __construct(private readonly PDO $database) {}

    public function findActiveAccessForUser(int $userId): ?array
    {
        $statement = $this->database->prepare(
            'SELECT cag.public_id AS access_id, cag.client_id, cag.access_role,
                    c.public_id AS client_public_id, c.client_type, c.display_name,
                    c.preferred_name, c.primary_email, c.primary_phone,
                    c.preferred_contact_method, c.language_preference,
                    c.portal_onboarding_dismissed_at, c.status, c.portal_status
             FROM client_access_grants cag
             INNER JOIN clients c ON c.id = cag.client_id
             WHERE cag.user_id = :user_id
               AND cag.status = \'active\'
               AND (cag.effective_at IS NULL OR cag.effective_at <= CURRENT_TIMESTAMP(6))
               AND (cag.expires_at IS NULL OR cag.expires_at > CURRENT_TIMESTAMP(6))
               AND c.portal_status = \'active\'
               AND c.status <> \'archived\'
             ORDER BY cag.is_default DESC, cag.created_at ASC
             LIMIT 1'
        );
        $statement->execute(['user_id' => $userId]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function listServices(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT e.public_id AS id, e.title, e.description, e.status,
                    e.start_date, e.target_date, e.completion_date,
                    u.display_name AS assigned_contact,
                    GROUP_CONCAT(DISTINCT COALESCE(esi.service_name_snapshot, s.service_name)
                        ORDER BY COALESCE(esi.service_name_snapshot, s.service_name) SEPARATOR \'||\') AS service_names
             FROM engagements e
             LEFT JOIN users u ON u.id = e.owner_user_id
             LEFT JOIN engagement_service_items esi ON esi.engagement_id = e.id
             LEFT JOIN services s ON s.id = esi.service_id
             WHERE e.client_id = :client_id AND e.archived_at IS NULL
             GROUP BY e.id, e.public_id, e.title, e.description, e.status,
                      e.start_date, e.target_date, e.completion_date, u.display_name
             ORDER BY e.start_date DESC, e.created_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listTasks(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT t.public_id AS id, t.title, t.description, t.priority, t.due_date,
                    t.status, t.completed_at, e.public_id AS engagement_id,
                    e.title AS engagement_title, s.service_name
             FROM tasks t
             LEFT JOIN engagements e ON e.id = t.engagement_id AND e.client_id = t.client_id
             LEFT JOIN services s ON s.id = t.service_id
             WHERE t.client_id = :client_id
               AND t.visibility IN (\'client\', \'both\')
               AND t.archived_at IS NULL
             ORDER BY t.status = \'completed\', t.due_date IS NULL, t.due_date ASC, t.created_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listDocuments(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT d.public_id AS id, d.document_name, d.document_type, d.status,
                    d.visibility, d.requested_date, d.due_date, d.client_instructions,
                    d.received_date, d.reviewed_date,
                    d.mime_type, e.public_id AS engagement_id, e.title AS engagement_title,
                    (SELECT ds.original_filename FROM document_submissions ds WHERE ds.document_id = d.id
                     ORDER BY ds.submitted_at DESC LIMIT 1) AS submitted_filename,
                    (SELECT ds.client_visible_review_note FROM document_submissions ds WHERE ds.document_id = d.id
                     ORDER BY ds.submitted_at DESC LIMIT 1) AS client_visible_review_note,
                    (SELECT ds.version_number FROM document_submissions ds WHERE ds.document_id = d.id
                     AND ds.archived_at IS NULL ORDER BY ds.version_number DESC LIMIT 1) AS current_version,
                    s.service_name
             FROM documents_metadata d
             LEFT JOIN engagements e ON e.id = d.engagement_id AND e.client_id = d.client_id
             LEFT JOIN services s ON s.id = d.service_id
             WHERE d.client_id = :client_id
               AND d.visibility IN (\'client\', \'shared\')
               AND d.archived_at IS NULL
             ORDER BY d.requested_date DESC, d.created_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listAppointments(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT a.public_id AS id, a.appointment_type, a.scheduled_at, a.end_at,
                    a.timezone, a.location_type, a.status, a.client_instructions,
                    a.preparation_required, a.follow_up_required,
                    (SELECT acr.request_type FROM appointment_change_requests acr
                     WHERE acr.appointment_id = a.id AND acr.status = \'pending\' LIMIT 1) AS pending_request,
                    e.public_id AS engagement_id, e.title AS engagement_title, s.service_name
             FROM appointments a
             LEFT JOIN engagements e ON e.id = a.engagement_id AND e.client_id = a.client_id
             LEFT JOIN services s ON s.id = a.service_id
             WHERE a.client_id = :client_id
               AND a.visibility IN (\'client\', \'both\')
               AND a.status <> \'cancelled\'
             ORDER BY a.scheduled_at ASC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listInvoices(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT i.public_id AS id, i.invoice_number, i.invoice_date, i.due_date,
                    i.status, i.currency, i.subtotal, i.adjustment_total,
                    i.credit_deposit_total, i.paid_total, i.outstanding_balance,
                    i.client_facing_notes, i.issued_at,
                    e.public_id AS engagement_id, e.title AS engagement_title
             FROM invoices i
             LEFT JOIN engagements e ON e.id = i.engagement_id AND e.client_id = i.client_id
             WHERE i.client_id = :client_id
               AND i.issued_at IS NOT NULL
               AND i.status NOT IN (\'draft\', \'cancelled\', \'voided\')
             ORDER BY i.invoice_date DESC, i.created_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listPayments(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT p.public_id AS id, p.payment_date, p.amount, p.payment_method, p.receipt_url,
                    i.public_id AS invoice_id, i.invoice_number
             FROM payments p
             INNER JOIN invoices i ON i.id = p.invoice_id AND i.client_id = p.client_id
             WHERE p.client_id = :client_id
               AND i.issued_at IS NOT NULL
               AND i.status NOT IN (\'draft\', \'cancelled\', \'voided\')
             ORDER BY p.payment_date DESC, p.created_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function getProfile(int $clientId): ?array
    {
        $statement = $this->database->prepare(
            'SELECT c.public_id AS id, c.client_type, c.display_name, c.legal_name,
                    c.preferred_name, c.primary_email, c.primary_phone,
                    c.preferred_contact_method, c.language_preference, c.status, c.portal_status,
                    bp.legal_name AS business_legal_name, bp.dba_name, bp.entity_type,
                    bp.formation_state, bp.formation_date, bp.business_email,
                    bp.business_phone, bp.website, bp.billing_address_line1,
                    bp.billing_address_line2, bp.billing_city, bp.billing_state,
                    bp.billing_postal_code, bp.billing_country, bp.business_stage
             FROM clients c
             LEFT JOIN business_profiles bp ON bp.client_id = c.id
             WHERE c.id = :client_id LIMIT 1'
        );
        $statement->execute(['client_id' => $clientId]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function listAuthorizedContacts(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT public_id AS id, name, title, email, phone, relationship,
                    authorization_level, is_primary_contact, is_billing_contact,
                    is_document_contact, is_scheduling_contact
             FROM client_contacts
             WHERE client_id = :client_id
               AND authorization_status = \'active\'
               AND archived_at IS NULL
               AND (portal_access_allowed = 1 OR is_primary_contact = 1
                    OR is_billing_contact = 1 OR is_document_contact = 1
                    OR is_scheduling_contact = 1)
             ORDER BY is_primary_contact DESC, name ASC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listPortalUsers(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT u.public_id AS id, u.display_name AS name, u.email, cag.access_role,
                    cag.status, cag.is_default, cag.effective_at, cag.expires_at
             FROM client_access_grants cag INNER JOIN users u ON u.id = cag.user_id
             WHERE cag.client_id = :client_id
             ORDER BY cag.is_default DESC, cag.status = \'active\' DESC, u.display_name ASC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listAuthorizedUserRequests(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT public_id AS id, name, email, requested_access_role, status,
                    resolution_note, created_at, resolved_at
             FROM authorized_user_requests WHERE client_id = :client_id
             ORDER BY status = \'pending\' DESC, created_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listPendingProfileChanges(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT public_id AS id, field_name, proposed_value, status, created_at
             FROM profile_change_requests WHERE client_id = :client_id AND status = \'pending\'
             ORDER BY created_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function listActivity(int $clientId, int $limit = 20): array
    {
        $limit = max(1, min(50, $limit));
        $statement = $this->database->prepare(
            'SELECT public_id AS id, event_type, entity_type, entity_id, summary, created_at
             FROM activity_events
             WHERE client_id = :client_id AND visibility IN (\'client\', \'both\')
             ORDER BY created_at DESC
             LIMIT ' . $limit
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function countUnreadMessages(int $clientId): int
    {
        $statement = $this->database->prepare(
            'SELECT COUNT(*) FROM messages
             WHERE client_id = :client_id AND sender_type = \'staff\' AND read_by_client_at IS NULL'
        );
        $statement->execute(['client_id' => $clientId]);
        return (int) $statement->fetchColumn();
    }

    public function recentCommunication(int $clientId): ?array
    {
        $statement = $this->database->prepare(
            'SELECT mt.public_id AS id, mt.subject, mt.status, mt.last_message_at,
                    (SELECT message_body FROM messages WHERE thread_id = mt.id
                     ORDER BY created_at DESC, id DESC LIMIT 1) AS latest_message
             FROM message_threads mt WHERE mt.client_id = :client_id
             ORDER BY mt.last_message_at DESC LIMIT 1'
        );
        $statement->execute(['client_id' => $clientId]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function countClientActionMessages(int $clientId): int
    {
        $statement = $this->database->prepare(
            'SELECT COUNT(*) FROM message_threads
             WHERE client_id = :client_id AND client_action_required = 1 AND status <> \'archived\''
        );
        $statement->execute(['client_id' => $clientId]);
        return (int) $statement->fetchColumn();
    }
}

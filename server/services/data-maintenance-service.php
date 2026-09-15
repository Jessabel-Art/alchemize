<?php

declare(strict_types=1);

// Data Maintenance: identify records that qualify for lifecycle cleanup,
// let an admin review the actual candidates, and only ever apply the
// specific, safe action for that record type. Historical/financial/audit
// records are archived, never deleted; only genuinely disposable records
// (expired security tokens, expired scheduling links) can be purged, and
// only after the caller re-verifies eligibility server-side -- a selected
// id list is never trusted on its own.
final class AlchemizeDataMaintenanceService
{
    private const ADMIN_ROLES = ['owner-admin', 'administrator', 'staff', 'read-only'];
    private const CLIENT_REQUEST_STALE_DAYS = 30;
    private const DISPOSABLE_INVOICE_STATUSES = ['draft', 'cancelled', 'voided'];

    public function __construct(
        private readonly PDO $database,
        private readonly int $actorUserId,
    ) {}

    private function prospectThresholdDays(): int
    {
        $statement = $this->database->prepare(
            'SELECT setting_value FROM application_settings WHERE setting_key = :key LIMIT 1'
        );
        $statement->execute(['key' => 'prospect_follow_up_days']);
        $value = $statement->fetchColumn();
        if ($value === false || $value === null) return 90;
        $decoded = json_decode((string) $value);
        return is_numeric($decoded) ? max(1, (int) $decoded) : 90;
    }

    public function overview(int $thresholdMonths = 6): array
    {
        $thresholdMonths = max(1, $thresholdMonths);
        $prospectDays = $this->prospectThresholdDays();

        $summary = [
            'inactive_prospects' => $this->countInactiveProspects($prospectDays),
            'completed_engagements' => $this->countCompletedEngagements($thresholdMonths),
            'expired_client_requests' => $this->countExpiredClientRequests(),
            'expired_links' => $this->countExpiredLinks(),
            'expired_invitations' => $this->countExpiredInvitations(),
            'invoice_disposable' => $this->countDisposableInvoices(),
            'invoice_uncollected' => $this->countUncollectedInvoices($thresholdMonths),
            'expired_tokens' => $this->countExpiredTokens(),
            'orphaned_records' => 0,
        ];

        return [
            'threshold_months' => $thresholdMonths,
            'prospect_threshold_days' => $prospectDays,
            'summary' => $summary,
            'categories' => [
                'inactive_prospects' => [
                    'title' => 'Inactive Prospects',
                    'description' => "Prospects with no qualifying activity for {$prospectDays}+ days.",
                    'count' => $summary['inactive_prospects'],
                    'action' => 'archive',
                    'actions' => ['archive', 'delete'],
                ],
                'completed_engagements' => [
                    'title' => 'Completed Engagements',
                    'description' => "Completed client engagements older than {$thresholdMonths} months, eligible for archival review.",
                    'count' => $summary['completed_engagements'],
                    'action' => 'archive',
                ],
                'expired_client_requests' => [
                    'title' => 'Expired Client Requests',
                    'description' => "Document requests still unfulfilled " . self::CLIENT_REQUEST_STALE_DAYS . "+ days past their due date (or since requested, when no due date was set).",
                    'count' => $summary['expired_client_requests'],
                    'action' => 'archive',
                    'actions' => ['archive', 'delete'],
                ],
                'expired_links' => [
                    'title' => 'Expired Scheduling Links',
                    'description' => 'Scheduling links that can no longer be used.',
                    'count' => $summary['expired_links'],
                    'action' => 'delete',
                ],
                'expired_invitations' => [
                    'title' => 'Expired Admin Invitations',
                    'description' => 'Administrator invitations that expired without being accepted.',
                    'count' => $summary['expired_invitations'],
                    'action' => 'remove',
                ],
                'invoice_disposable' => [
                    'title' => 'Disposable Invoices',
                    'description' => 'Draft, cancelled, or voided invoices with zero payment history and no payment attempt on record -- safe to remove.',
                    'count' => $summary['invoice_disposable'],
                    'action' => 'delete',
                ],
                'invoice_uncollected' => [
                    'title' => 'Uncollected Invoices',
                    'description' => "Open or past-due invoices more than {$thresholdMonths} months past their due date, eligible to archive out of active billing views. All financial data is preserved.",
                    'count' => $summary['invoice_uncollected'],
                    'action' => 'archive',
                ],
                'expired_tokens' => [
                    'title' => 'Expired Security Tokens',
                    'description' => 'Expired, unused authentication links (password reset, portal setup, email change).',
                    'count' => $summary['expired_tokens'],
                    'action' => 'purge',
                ],
                'orphaned_records' => [
                    'title' => 'Orphaned Records',
                    'description' => 'Records with missing required parent relationships. Database referential integrity prevents this from occurring today.',
                    'count' => 0,
                    'action' => null,
                ],
            ],
        ];
    }

    public function preview(array $payload): array
    {
        $category = (string) ($payload['category'] ?? '');
        $limit = max(1, min(100, (int) ($payload['limit'] ?? 25)));

        $thresholdMonths = max(1, (int) ($payload['threshold_months'] ?? 6));

        return match ($category) {
            'inactive_prospects' => [
                'category' => $category,
                'action' => 'archive',
                'count' => $this->countInactiveProspects($this->prospectThresholdDays()),
                'records' => $this->inactiveProspectPreview($this->prospectThresholdDays(), $limit),
            ],
            'completed_engagements' => [
                'category' => $category,
                'action' => 'archive',
                'count' => $this->countCompletedEngagements(6),
                'records' => $this->completedEngagementPreview(6, $limit),
            ],
            'expired_client_requests' => [
                'category' => $category,
                'action' => 'archive',
                'count' => $this->countExpiredClientRequests(),
                'records' => $this->expiredClientRequestPreview($limit),
            ],
            'invoice_disposable' => [
                'category' => $category,
                'action' => 'delete',
                'count' => $this->countDisposableInvoices(),
                'records' => $this->disposableInvoicePreview($limit),
            ],
            'invoice_uncollected' => [
                'category' => $category,
                'action' => 'archive',
                'count' => $this->countUncollectedInvoices($thresholdMonths),
                'records' => $this->uncollectedInvoicePreview($thresholdMonths, $limit),
            ],
            'expired_links' => [
                'category' => $category,
                'action' => 'delete',
                'count' => $this->countExpiredLinks(),
                'records' => $this->expiredLinkPreview($limit),
            ],
            'expired_invitations' => [
                'category' => $category,
                'action' => 'remove',
                'count' => $this->countExpiredInvitations(),
                'records' => $this->expiredInvitationPreview($limit),
            ],
            'expired_tokens' => [
                'category' => $category,
                'action' => 'purge',
                'count' => $this->countExpiredTokens(),
                'records' => $this->expiredTokenPreview($limit),
            ],
            'orphaned_records' => [
                'category' => $category,
                'action' => null,
                'count' => 0,
                'records' => [],
            ],
            default => throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Unknown maintenance category.'),
        };
    }

    public function execute(array $payload): array
    {
        $action = (string) ($payload['action'] ?? '');
        $category = (string) ($payload['category'] ?? '');
        $selected = array_values(array_unique(array_filter(array_map('intval', (array) ($payload['selected_ids'] ?? [])))));
        $confirm = (string) ($payload['confirm'] ?? '');

        if ($action === '' || $category === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a maintenance action to run.');
        }

        if ($action === 'archive' && $category === 'inactive_prospects') {
            return $this->archiveInactiveProspects($selected);
        }

        if ($action === 'delete' && $category === 'inactive_prospects') {
            if ($confirm !== 'DELETE INACTIVE PROSPECTS') {
                throw new AlchemizeRequestException(422, 'CONFIRMATION_REQUIRED', 'Type DELETE INACTIVE PROSPECTS to confirm.');
            }
            return $this->deleteInactiveProspects($selected);
        }

        if ($action === 'archive' && $category === 'completed_engagements') {
            return $this->archiveCompletedEngagements($selected);
        }

        if ($action === 'archive' && $category === 'expired_client_requests') {
            return $this->archiveExpiredClientRequests($selected);
        }

        if ($action === 'delete' && $category === 'expired_client_requests') {
            if ($confirm !== 'DELETE CLIENT REQUESTS') {
                throw new AlchemizeRequestException(422, 'CONFIRMATION_REQUIRED', 'Type DELETE CLIENT REQUESTS to confirm.');
            }
            return $this->deleteExpiredClientRequests($selected);
        }

        if ($action === 'delete' && $category === 'invoice_disposable') {
            if ($confirm !== 'DELETE DISPOSABLE INVOICES') {
                throw new AlchemizeRequestException(422, 'CONFIRMATION_REQUIRED', 'Type DELETE DISPOSABLE INVOICES to confirm.');
            }
            return $this->deleteDisposableInvoices($selected);
        }

        if ($action === 'archive' && $category === 'invoice_uncollected') {
            return $this->archiveUncollectedInvoices($selected);
        }

        if ($action === 'delete' && $category === 'expired_links') {
            if ($confirm !== 'DELETE EXPIRED LINKS') {
                throw new AlchemizeRequestException(422, 'CONFIRMATION_REQUIRED', 'Type DELETE EXPIRED LINKS to confirm.');
            }
            return $this->deleteExpiredLinks($selected);
        }

        if ($action === 'remove' && $category === 'expired_invitations') {
            return $this->removeExpiredInvitations($selected);
        }

        if ($action === 'purge' && $category === 'expired_tokens') {
            if ($confirm !== 'PURGE EXPIRED TOKENS') {
                throw new AlchemizeRequestException(422, 'CONFIRMATION_REQUIRED', 'Type PURGE EXPIRED TOKENS to confirm token cleanup.');
            }
            return $this->purgeExpiredTokens($selected);
        }

        throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'This maintenance action is not available.');
    }

    public function history(int $limit = 20): array
    {
        $limit = max(1, min(100, $limit));
        $statement = $this->database->prepare(
            "SELECT ae.event_type, ae.action_summary, ae.created_at, u.display_name AS actor_name
             FROM audit_events ae
             LEFT JOIN users u ON u.id = ae.actor_user_id
             WHERE ae.event_type LIKE 'maintenance.%'
             ORDER BY ae.created_at DESC, ae.id DESC
             LIMIT :limit"
        );
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    // ---- Inactive prospects ----------------------------------------------

    private function countInactiveProspects(int $days): int
    {
        $statement = $this->database->prepare(
            "SELECT COUNT(*) FROM clients WHERE status = 'prospective' AND updated_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL :days DAY)"
        );
        $statement->bindValue(':days', $days, PDO::PARAM_INT);
        $statement->execute();
        return (int) $statement->fetchColumn();
    }

    private function inactiveProspectPreview(int $days, int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT id, public_id, display_name, primary_email, status, created_at, updated_at,
                    DATEDIFF(CURRENT_TIMESTAMP(6), updated_at) AS inactive_days
             FROM clients
             WHERE status = 'prospective' AND updated_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL :days DAY)
             ORDER BY updated_at ASC
             LIMIT :limit"
        );
        $statement->bindValue(':days', $days, PDO::PARAM_INT);
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        $rows = $statement->fetchAll();
        foreach ($rows as &$row) {
            $reasons = $this->prospectBusinessRecordReasons((int) $row['id']);
            $row['delete_eligible'] = $reasons === [];
            $row['delete_blocked_reason'] = $reasons === [] ? null : ('This record ' . implode(' and ', $reasons) . '.');
        }
        return $rows;
    }

    private function inactiveProspectIds(int $days): array
    {
        $statement = $this->database->prepare(
            "SELECT id FROM clients WHERE status = 'prospective' AND updated_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL :days DAY) ORDER BY updated_at ASC"
        );
        $statement->bindValue(':days', $days, PDO::PARAM_INT);
        $statement->execute();
        return array_map('intval', array_column($statement->fetchAll(), 'id'));
    }

    private function archiveInactiveProspects(array $selected): array
    {
        $eligible = array_flip($this->inactiveProspectIds($this->prospectThresholdDays()));
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        if ($ids === []) {
            return ['action' => 'archive', 'category' => 'inactive_prospects', 'archived' => 0, 'blocked' => $blocked, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $statement = $this->database->prepare(
                "UPDATE clients SET status = 'archived', archived_at = CURRENT_TIMESTAMP(6) WHERE id IN ({$placeholders}) AND status = 'prospective'"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.prospect_archive', 'client', $ids, $this->summarizeCount($count, 'archived stale prospective record', 'archived stale prospective records'));
            return ['action' => 'archive', 'category' => 'inactive_prospects', 'archived' => $count, 'blocked' => $blocked, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    // A prospective client is only safe to hard-delete when nothing else in
    // the system depends on it. engagements/invoices/payments/client_service
    // already carry an ON DELETE RESTRICT foreign key (the database itself
    // refuses), but documents_metadata is ON DELETE CASCADE and
    // tasks/appointments are ON DELETE SET NULL -- neither of those would
    // fail the DELETE, they would silently destroy or orphan real records,
    // which is exactly what must never happen here. Checked explicitly
    // rather than relying on the schema's own delete behavior.
    private function prospectBusinessRecordReasons(int $clientId): array
    {
        $reasons = [];
        $checks = [
            'has an engagement on record' => 'SELECT 1 FROM engagements WHERE client_id = :id LIMIT 1',
            'has an invoice on record' => 'SELECT 1 FROM invoices WHERE client_id = :id LIMIT 1',
            'has a document on record' => 'SELECT 1 FROM documents_metadata WHERE client_id = :id LIMIT 1',
            'has an appointment on record' => 'SELECT 1 FROM appointments WHERE client_id = :id LIMIT 1',
            'has a task on record' => 'SELECT 1 FROM tasks WHERE client_id = :id LIMIT 1',
            'has active client portal access' => "SELECT 1 FROM client_access_grants WHERE client_id = :id AND status = 'active' LIMIT 1",
        ];
        foreach ($checks as $reason => $sql) {
            $statement = $this->database->prepare($sql);
            $statement->execute(['id' => $clientId]);
            if ($statement->fetchColumn() !== false) $reasons[] = $reason;
        }
        return $reasons;
    }

    private function deleteInactiveProspects(array $selected): array
    {
        $eligible = array_flip($this->inactiveProspectIds($this->prospectThresholdDays()));
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        $deleted = 0;
        $failed = 0;
        foreach ($ids as $id) {
            if ($this->prospectBusinessRecordReasons($id) !== []) {
                $blocked++;
                continue;
            }
            $this->database->beginTransaction();
            try {
                $statement = $this->database->prepare("DELETE FROM clients WHERE id = :id AND status = 'prospective'");
                $statement->execute(['id' => $id]);
                if ($statement->rowCount() > 0) {
                    $this->database->commit();
                    $deleted++;
                    $this->writeAudit('maintenance.prospect_delete', 'client', [$id], '1 deleted stale prospective record with no dependent business records.');
                } else {
                    $this->database->rollBack();
                }
            } catch (Throwable $error) {
                if ($this->database->inTransaction()) $this->database->rollBack();
                $failed++;
            }
        }
        return ['action' => 'delete', 'category' => 'inactive_prospects', 'deleted' => $deleted, 'blocked' => $blocked, 'failed' => $failed];
    }

    // ---- Completed engagements --------------------------------------------

    private function countCompletedEngagements(int $months): int
    {
        $statement = $this->database->prepare(
            "SELECT COUNT(*) FROM engagements WHERE status = 'completed' AND completion_date IS NOT NULL AND completion_date < DATE_SUB(CURRENT_DATE(), INTERVAL :months MONTH)"
        );
        $statement->bindValue(':months', $months, PDO::PARAM_INT);
        $statement->execute();
        return (int) $statement->fetchColumn();
    }

    private function completedEngagementPreview(int $months, int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT e.id, e.public_id, e.title, c.display_name AS client_name, e.completion_date, e.status,
                    (SELECT MAX(created_at) FROM activity_events WHERE entity_type = 'engagement' AND entity_id = e.public_id) AS last_activity_at
             FROM engagements e
             LEFT JOIN clients c ON c.id = e.client_id
             WHERE e.status = 'completed' AND e.completion_date IS NOT NULL AND e.completion_date < DATE_SUB(CURRENT_DATE(), INTERVAL :months MONTH)
             ORDER BY e.completion_date ASC
             LIMIT :limit"
        );
        $statement->bindValue(':months', $months, PDO::PARAM_INT);
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    private function completedEngagementIds(int $months): array
    {
        $statement = $this->database->prepare(
            "SELECT id FROM engagements WHERE status = 'completed' AND completion_date IS NOT NULL AND completion_date < DATE_SUB(CURRENT_DATE(), INTERVAL :months MONTH) ORDER BY completion_date ASC"
        );
        $statement->bindValue(':months', $months, PDO::PARAM_INT);
        $statement->execute();
        return array_map('intval', array_column($statement->fetchAll(), 'id'));
    }

    private function archiveCompletedEngagements(array $selected): array
    {
        $eligible = array_flip($this->completedEngagementIds(6));
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        if ($ids === []) {
            return ['action' => 'archive', 'category' => 'completed_engagements', 'archived' => 0, 'blocked' => $blocked, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            // Archival only flips status/archived_at on the engagement row --
            // invoices, payments, documents, intake submissions, messages,
            // appointments, and audit records all keep their existing
            // foreign keys to this engagement; nothing here is deleted.
            $statement = $this->database->prepare(
                "UPDATE engagements SET status = 'archived', archived_at = CURRENT_TIMESTAMP(6) WHERE id IN ({$placeholders}) AND status = 'completed'"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.engagement_archive', 'engagement', $ids, $this->summarizeCount($count, 'archived completed engagement', 'archived completed engagements'));
            return ['action' => 'archive', 'category' => 'completed_engagements', 'archived' => $count, 'blocked' => $blocked, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    // ---- Expired client requests --------------------------------------------
    // A "client request" here is a document request (documents_metadata)
    // still awaiting client action. Archiving is always safe (a status/
    // archived_at flip, nothing removed). Deletion is only offered for the
    // narrower set that was never fulfilled at all -- no document_submissions
    // row exists -- so there is no upload/version history to lose; a request
    // with status='replacement_requested' by definition already had a
    // submission at some point and is excluded from deletion for that reason.

    private function clientRequestStaleCondition(): string
    {
        return "(
            (d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE())
            OR (d.due_date IS NULL AND d.requested_date < DATE_SUB(CURRENT_DATE(), INTERVAL :days DAY))
        )";
    }

    private function countExpiredClientRequests(): int
    {
        $condition = $this->clientRequestStaleCondition();
        $statement = $this->database->prepare(
            "SELECT COUNT(*) FROM documents_metadata d
             WHERE d.status IN ('requested', 'awaiting_upload', 'replacement_requested')
               AND d.archived_at IS NULL AND {$condition}"
        );
        $statement->bindValue(':days', self::CLIENT_REQUEST_STALE_DAYS, PDO::PARAM_INT);
        $statement->execute();
        return (int) $statement->fetchColumn();
    }

    private function expiredClientRequestPreview(int $limit): array
    {
        $condition = $this->clientRequestStaleCondition();
        $statement = $this->database->prepare(
            "SELECT d.id, d.public_id, d.document_name, d.status, d.requested_date, d.due_date,
                    c.display_name AS client_name, e.title AS engagement_title,
                    EXISTS(SELECT 1 FROM document_submissions ds WHERE ds.document_id = d.id) AS has_submission
             FROM documents_metadata d
             LEFT JOIN clients c ON c.id = d.client_id
             LEFT JOIN engagements e ON e.id = d.engagement_id
             WHERE d.status IN ('requested', 'awaiting_upload', 'replacement_requested')
               AND d.archived_at IS NULL AND {$condition}
             ORDER BY COALESCE(d.due_date, d.requested_date) ASC
             LIMIT :limit"
        );
        $statement->bindValue(':days', self::CLIENT_REQUEST_STALE_DAYS, PDO::PARAM_INT);
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        $rows = $statement->fetchAll();
        foreach ($rows as &$row) {
            $row['delete_eligible'] = !((bool) $row['has_submission']) && $row['status'] !== 'replacement_requested';
        }
        return $rows;
    }

    private function expiredClientRequestIds(): array
    {
        $condition = $this->clientRequestStaleCondition();
        $statement = $this->database->prepare(
            "SELECT d.id FROM documents_metadata d
             WHERE d.status IN ('requested', 'awaiting_upload', 'replacement_requested')
               AND d.archived_at IS NULL AND {$condition}"
        );
        $statement->bindValue(':days', self::CLIENT_REQUEST_STALE_DAYS, PDO::PARAM_INT);
        $statement->execute();
        return array_map('intval', array_column($statement->fetchAll(), 'id'));
    }

    private function expiredClientRequestDeleteEligibleIds(): array
    {
        $condition = $this->clientRequestStaleCondition();
        $statement = $this->database->prepare(
            "SELECT d.id FROM documents_metadata d
             WHERE d.status IN ('requested', 'awaiting_upload')
               AND d.archived_at IS NULL AND {$condition}
               AND NOT EXISTS (SELECT 1 FROM document_submissions ds WHERE ds.document_id = d.id)"
        );
        $statement->bindValue(':days', self::CLIENT_REQUEST_STALE_DAYS, PDO::PARAM_INT);
        $statement->execute();
        return array_map('intval', array_column($statement->fetchAll(), 'id'));
    }

    private function archiveExpiredClientRequests(array $selected): array
    {
        $eligible = array_flip($this->expiredClientRequestIds());
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        if ($ids === []) {
            return ['action' => 'archive', 'category' => 'expired_client_requests', 'archived' => 0, 'blocked' => $blocked, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $statement = $this->database->prepare(
                "UPDATE documents_metadata SET status = 'archived', archived_at = CURRENT_TIMESTAMP(6)
                 WHERE id IN ({$placeholders}) AND status IN ('requested', 'awaiting_upload', 'replacement_requested') AND archived_at IS NULL"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.client_request_archive', 'document', $ids, $this->summarizeCount($count, 'archived expired client request', 'archived expired client requests'));
            return ['action' => 'archive', 'category' => 'expired_client_requests', 'archived' => $count, 'blocked' => $blocked, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    private function deleteExpiredClientRequests(array $selected): array
    {
        $eligible = array_flip($this->expiredClientRequestDeleteEligibleIds());
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        if ($ids === []) {
            return ['action' => 'delete', 'category' => 'expired_client_requests', 'deleted' => 0, 'blocked' => $blocked, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            // Re-verified against the narrower delete-eligible set: no
            // document_submissions row exists for any of these ids, so
            // nothing of record is lost.
            $statement = $this->database->prepare(
                "DELETE FROM documents_metadata WHERE id IN ({$placeholders})
                 AND status IN ('requested', 'awaiting_upload') AND archived_at IS NULL
                 AND NOT EXISTS (SELECT 1 FROM document_submissions ds WHERE ds.document_id = documents_metadata.id)"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.client_request_delete', 'document', $ids, $this->summarizeCount($count, 'deleted expired client request', 'deleted expired client requests'));
            return ['action' => 'delete', 'category' => 'expired_client_requests', 'deleted' => $count, 'blocked' => $blocked, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    // ---- Expired scheduling links ------------------------------------------

    private function countExpiredLinks(): int
    {
        return (int) $this->database->query(
            "SELECT COUNT(*) FROM appointment_scheduling_links WHERE revoked_at IS NULL AND used_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
        )->fetchColumn();
    }

    private function expiredLinkPreview(int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT l.id, l.public_id, l.appointment_type, l.recipient_name, l.recipient_email,
                    c.display_name AS client_name, s.service_name,
                    l.created_at, l.expires_at, l.use_count, l.max_uses, l.used_at, l.revoked_at
             FROM appointment_scheduling_links l
             LEFT JOIN clients c ON c.id = l.client_id
             LEFT JOIN services s ON s.id = l.service_id
             WHERE l.revoked_at IS NULL AND l.used_at IS NULL AND l.expires_at < CURRENT_TIMESTAMP(6)
             ORDER BY l.expires_at DESC
             LIMIT :limit"
        );
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    private function expiredLinkIds(): array
    {
        $rows = $this->database->query(
            "SELECT id FROM appointment_scheduling_links WHERE revoked_at IS NULL AND used_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
        )->fetchAll();
        return array_map('intval', array_column($rows, 'id'));
    }

    private function deleteExpiredLinks(array $selected): array
    {
        $eligible = array_flip($this->expiredLinkIds());
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        if ($ids === []) {
            return ['action' => 'delete', 'category' => 'expired_links', 'deleted' => 0, 'blocked' => $blocked, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $statement = $this->database->prepare(
                "DELETE FROM appointment_scheduling_links WHERE id IN ({$placeholders}) AND revoked_at IS NULL AND used_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.link_cleanup', 'appointment_scheduling_link', $ids, $this->summarizeCount($count, 'deleted expired scheduling link', 'deleted expired scheduling links'));
            return ['action' => 'delete', 'category' => 'expired_links', 'deleted' => $count, 'blocked' => $blocked, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    // ---- Expired admin invitations -----------------------------------------
    // Admin invitations live as portal_account_tokens rows with
    // purpose='admin_invitation' and client_id NULL, tied to a users row
    // with status='invited'. An accepted invitation has used_at set and its
    // user status flips to 'active' -- it can never appear here.

    private function countExpiredInvitations(): int
    {
        return (int) $this->database->query(
            "SELECT COUNT(*) FROM portal_account_tokens pat
             INNER JOIN users u ON u.id = pat.user_id
             WHERE pat.purpose = 'admin_invitation' AND pat.client_id IS NULL
               AND pat.used_at IS NULL AND pat.invalidated_at IS NULL
               AND pat.expires_at < CURRENT_TIMESTAMP(6) AND u.status = 'invited'"
        )->fetchColumn();
    }

    private function expiredInvitationPreview(int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT u.id AS user_id, u.display_name, u.email, r.slug AS role_slug, r.name AS role_name,
                    pat.created_at AS invited_at, pat.expires_at
             FROM portal_account_tokens pat
             INNER JOIN users u ON u.id = pat.user_id
             INNER JOIN roles r ON r.id = u.role_id
             WHERE pat.purpose = 'admin_invitation' AND pat.client_id IS NULL
               AND pat.used_at IS NULL AND pat.invalidated_at IS NULL
               AND pat.expires_at < CURRENT_TIMESTAMP(6) AND u.status = 'invited'
             ORDER BY pat.expires_at DESC
             LIMIT :limit"
        );
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    private function expiredInvitationUserIds(): array
    {
        $rows = $this->database->query(
            "SELECT u.id FROM portal_account_tokens pat
             INNER JOIN users u ON u.id = pat.user_id
             WHERE pat.purpose = 'admin_invitation' AND pat.client_id IS NULL
               AND pat.used_at IS NULL AND pat.invalidated_at IS NULL
               AND pat.expires_at < CURRENT_TIMESTAMP(6) AND u.status = 'invited'"
        )->fetchAll();
        return array_map('intval', array_column($rows, 'id'));
    }

    private function removeExpiredInvitations(array $selected): array
    {
        $eligible = array_flip($this->expiredInvitationUserIds());
        $userIds = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($userIds) : 0;
        if ($userIds === []) {
            return ['action' => 'remove', 'category' => 'expired_invitations', 'removed' => 0, 'blocked' => $blocked, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            // Invalidate the expired token(s) and archive the never-activated
            // placeholder account -- the invitation was never accepted (an
            // accepted invitation has used_at set and would not be selected
            // here), so no real administrator account is affected.
            $tokenStatement = $this->database->prepare(
                "UPDATE portal_account_tokens SET invalidated_at = CURRENT_TIMESTAMP(6)
                 WHERE user_id IN ({$placeholders}) AND purpose = 'admin_invitation' AND client_id IS NULL
                   AND used_at IS NULL AND invalidated_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
            );
            $tokenStatement->execute($userIds);

            $userStatement = $this->database->prepare(
                "UPDATE users SET status = 'archived' WHERE id IN ({$placeholders}) AND status = 'invited'"
            );
            $userStatement->execute($userIds);
            $count = $userStatement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.invitation_cleanup', 'user', $userIds, $this->summarizeCount($count, 'removed expired administrator invitation', 'removed expired administrator invitations'));
            return ['action' => 'remove', 'category' => 'expired_invitations', 'removed' => $count, 'blocked' => $blocked, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    // ---- Expired security tokens --------------------------------------------
    // Deliberately excludes purpose='admin_invitation' -- those are handled,
    // reviewed, and cleaned up as their own "Expired Admin Invitations"
    // category above, tied to the invited-account lifecycle rather than
    // treated as disposable authentication artifacts.

    private const TOKEN_PURGE_PURPOSES = ['invitation', 'password_reset', 'email_change'];

    private function countExpiredTokens(): int
    {
        $placeholders = implode(',', array_fill(0, count(self::TOKEN_PURGE_PURPOSES), '?'));
        $statement = $this->database->prepare(
            "SELECT COUNT(*) FROM portal_account_tokens
             WHERE purpose IN ({$placeholders}) AND invalidated_at IS NULL AND used_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
        );
        $statement->execute(self::TOKEN_PURGE_PURPOSES);
        return (int) $statement->fetchColumn();
    }

    private function expiredTokenPreview(int $limit): array
    {
        $placeholders = implode(',', array_fill(0, count(self::TOKEN_PURGE_PURPOSES), '?'));
        $statement = $this->database->prepare(
            "SELECT pat.id, pat.public_id, u.email, pat.purpose, pat.expires_at, pat.created_at
             FROM portal_account_tokens pat
             INNER JOIN users u ON u.id = pat.user_id
             WHERE pat.purpose IN ({$placeholders}) AND pat.invalidated_at IS NULL AND pat.used_at IS NULL AND pat.expires_at < CURRENT_TIMESTAMP(6)
             ORDER BY pat.expires_at DESC
             LIMIT " . (int) $limit
        );
        $statement->execute(self::TOKEN_PURGE_PURPOSES);
        return $statement->fetchAll();
    }

    private function expiredTokenIds(): array
    {
        $placeholders = implode(',', array_fill(0, count(self::TOKEN_PURGE_PURPOSES), '?'));
        $statement = $this->database->prepare(
            "SELECT id FROM portal_account_tokens
             WHERE purpose IN ({$placeholders}) AND invalidated_at IS NULL AND used_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
        );
        $statement->execute(self::TOKEN_PURGE_PURPOSES);
        return array_map('intval', array_column($statement->fetchAll(), 'id'));
    }

    private function purgeExpiredTokens(array $selected): array
    {
        // The frontend's selection is never trusted on its own -- re-derive
        // the currently-eligible id set and intersect, so a stale or
        // tampered selected_ids list can only narrow the result, never
        // purge a token that is not (or no longer) actually expired.
        $eligible = array_flip($this->expiredTokenIds());
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        if ($ids === []) {
            return ['action' => 'purge', 'category' => 'expired_tokens', 'deleted' => 0, 'blocked' => $blocked, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $statement = $this->database->prepare(
                "DELETE FROM portal_account_tokens WHERE id IN ({$placeholders}) AND used_at IS NULL AND invalidated_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.token_cleanup', 'portal_account_tokens', $ids, $this->summarizeCount($count, 'purged expired security token', 'purged expired security tokens'));
            return ['action' => 'purge', 'category' => 'expired_tokens', 'deleted' => $count, 'blocked' => $blocked, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    // ---- Invoice maintenance ------------------------------------------------
    // Two disjoint, non-overlapping pools, never the same invoice: disposable
    // (never billed for real -- draft/cancelled/voided, zero payment history,
    // no payment attempt ever started) is safe to hard-delete; uncollected
    // (genuinely billed and still owed, just stale) is only ever archived --
    // every financial field, line item, and payment record stays intact,
    // this only flips a visibility flag. A paid invoice never qualifies for
    // either pool. payments.invoice_id is ON DELETE RESTRICT, so the
    // database itself refuses to let a paid/part-paid invoice with recorded
    // payments be deleted even if this check were ever wrong.

    private function countDisposableInvoices(): int
    {
        $placeholders = implode(',', array_fill(0, count(self::DISPOSABLE_INVOICE_STATUSES), '?'));
        $statement = $this->database->prepare(
            "SELECT COUNT(*) FROM invoices i
             WHERE i.status IN ({$placeholders}) AND i.paid_total = 0 AND i.archived_at IS NULL
               AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.invoice_id = i.id)
               AND (i.stripe_checkout_session_id IS NULL OR i.stripe_checkout_session_id = '')
               AND (i.paypal_order_id IS NULL OR i.paypal_order_id = '')"
        );
        $statement->execute(self::DISPOSABLE_INVOICE_STATUSES);
        return (int) $statement->fetchColumn();
    }

    private function disposableInvoicePreview(int $limit): array
    {
        $placeholders = implode(',', array_fill(0, count(self::DISPOSABLE_INVOICE_STATUSES), '?'));
        $statement = $this->database->prepare(
            "SELECT i.id, i.public_id, i.invoice_number, i.status, i.invoice_date, i.subtotal, i.currency,
                    c.display_name AS client_name, e.title AS engagement_title
             FROM invoices i
             LEFT JOIN clients c ON c.id = i.client_id
             LEFT JOIN engagements e ON e.id = i.engagement_id
             WHERE i.status IN ({$placeholders}) AND i.paid_total = 0 AND i.archived_at IS NULL
               AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.invoice_id = i.id)
               AND (i.stripe_checkout_session_id IS NULL OR i.stripe_checkout_session_id = '')
               AND (i.paypal_order_id IS NULL OR i.paypal_order_id = '')
             ORDER BY i.created_at DESC
             LIMIT " . (int) $limit
        );
        $statement->execute(self::DISPOSABLE_INVOICE_STATUSES);
        return $statement->fetchAll();
    }

    private function disposableInvoiceIds(): array
    {
        $placeholders = implode(',', array_fill(0, count(self::DISPOSABLE_INVOICE_STATUSES), '?'));
        $statement = $this->database->prepare(
            "SELECT i.id FROM invoices i
             WHERE i.status IN ({$placeholders}) AND i.paid_total = 0 AND i.archived_at IS NULL
               AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.invoice_id = i.id)
               AND (i.stripe_checkout_session_id IS NULL OR i.stripe_checkout_session_id = '')
               AND (i.paypal_order_id IS NULL OR i.paypal_order_id = '')"
        );
        $statement->execute(self::DISPOSABLE_INVOICE_STATUSES);
        return array_map('intval', array_column($statement->fetchAll(), 'id'));
    }

    private function deleteDisposableInvoices(array $selected): array
    {
        $eligible = array_flip($this->disposableInvoiceIds());
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        $deleted = 0;
        $failed = 0;
        foreach ($ids as $id) {
            $this->database->beginTransaction();
            try {
                // Re-verified inline against the same safe criteria (never
                // trust the eligible-id snapshot alone): the payments FK is
                // ON DELETE RESTRICT regardless, so a real payment recorded
                // between preview and execute still blocks this atomically.
                $placeholders = implode(',', array_fill(0, count(self::DISPOSABLE_INVOICE_STATUSES), '?'));
                $statement = $this->database->prepare(
                    "DELETE FROM invoices WHERE id = ? AND status IN ({$placeholders}) AND paid_total = 0 AND archived_at IS NULL
                     AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.invoice_id = invoices.id)"
                );
                $statement->execute([$id, ...self::DISPOSABLE_INVOICE_STATUSES]);
                if ($statement->rowCount() > 0) {
                    $this->database->commit();
                    $deleted++;
                    $this->writeAudit('maintenance.invoice_delete', 'invoice', [$id], '1 deleted disposable invoice with no payment history.');
                } else {
                    $this->database->rollBack();
                    $blocked++;
                }
            } catch (Throwable $error) {
                if ($this->database->inTransaction()) $this->database->rollBack();
                $failed++;
            }
        }
        return ['action' => 'delete', 'category' => 'invoice_disposable', 'deleted' => $deleted, 'blocked' => $blocked, 'failed' => $failed];
    }

    private function countUncollectedInvoices(int $months): int
    {
        $statement = $this->database->prepare(
            "SELECT COUNT(*) FROM invoices i
             WHERE i.status IN ('open', 'past_due') AND i.archived_at IS NULL AND i.outstanding_balance > 0
               AND i.due_date IS NOT NULL AND i.due_date < DATE_SUB(CURRENT_DATE(), INTERVAL :months MONTH)"
        );
        $statement->bindValue(':months', $months, PDO::PARAM_INT);
        $statement->execute();
        return (int) $statement->fetchColumn();
    }

    private function uncollectedInvoicePreview(int $months, int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT i.id, i.public_id, i.invoice_number, i.status, i.due_date, i.outstanding_balance, i.currency,
                    c.display_name AS client_name, e.title AS engagement_title
             FROM invoices i
             LEFT JOIN clients c ON c.id = i.client_id
             LEFT JOIN engagements e ON e.id = i.engagement_id
             WHERE i.status IN ('open', 'past_due') AND i.archived_at IS NULL AND i.outstanding_balance > 0
               AND i.due_date IS NOT NULL AND i.due_date < DATE_SUB(CURRENT_DATE(), INTERVAL :months MONTH)
             ORDER BY i.due_date ASC
             LIMIT :limit"
        );
        $statement->bindValue(':months', $months, PDO::PARAM_INT);
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    private function uncollectedInvoiceIds(int $months): array
    {
        $statement = $this->database->prepare(
            "SELECT id FROM invoices
             WHERE status IN ('open', 'past_due') AND archived_at IS NULL AND outstanding_balance > 0
               AND due_date IS NOT NULL AND due_date < DATE_SUB(CURRENT_DATE(), INTERVAL :months MONTH)"
        );
        $statement->bindValue(':months', $months, PDO::PARAM_INT);
        $statement->execute();
        return array_map('intval', array_column($statement->fetchAll(), 'id'));
    }

    private function archiveUncollectedInvoices(array $selected): array
    {
        $eligible = array_flip($this->uncollectedInvoiceIds(6));
        $ids = $selected !== [] ? array_values(array_intersect($selected, array_keys($eligible))) : array_keys($eligible);
        $blocked = $selected !== [] ? count($selected) - count($ids) : 0;
        if ($ids === []) {
            return ['action' => 'archive', 'category' => 'invoice_uncollected', 'archived' => 0, 'blocked' => $blocked, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            // Only archived_at changes. status, outstanding_balance,
            // paid_total, line items, and every payment/Stripe/PayPal
            // reference are left exactly as they are.
            $statement = $this->database->prepare(
                "UPDATE invoices SET archived_at = CURRENT_TIMESTAMP(6)
                 WHERE id IN ({$placeholders}) AND status IN ('open', 'past_due') AND archived_at IS NULL"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.invoice_archive', 'invoice', $ids, $this->summarizeCount($count, 'archived uncollected invoice', 'archived uncollected invoices'));
            return ['action' => 'archive', 'category' => 'invoice_uncollected', 'archived' => $count, 'blocked' => $blocked, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    private function summarizeCount(int $count, string $singular, string $plural): string
    {
        return $count . ' ' . ($count === 1 ? $singular : $plural) . '.';
    }

    private function writeAudit(string $eventType, string $entityType, array $ids, string $summary): void
    {
        $this->database->prepare(
            'INSERT INTO audit_events (public_id, actor_user_id, event_type, entity_type, entity_id, action_summary, request_metadata)
             VALUES (:public_id, :actor_user_id, :event_type, :entity_type, :entity_id, :summary, :metadata)'
        )->execute([
            'public_id' => alchemize_uuid_v4(),
            'actor_user_id' => $this->actorUserId ?: null,
            'event_type' => $eventType,
            'entity_type' => $entityType,
            'entity_id' => $ids[0] ?? null,
            'summary' => $summary,
            'metadata' => json_encode(['entity_type' => $entityType, 'entity_ids' => $ids], JSON_THROW_ON_ERROR),
        ]);
    }
}

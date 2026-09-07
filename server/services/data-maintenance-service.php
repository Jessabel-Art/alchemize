<?php

declare(strict_types=1);

final class AlchemizeDataMaintenanceService
{
    public function __construct(
        private readonly PDO $database,
        private readonly int $actorUserId,
    ) {}

    public function overview(int $thresholdMonths = 6): array
    {
        $now = new DateTimeImmutable('now');
        $cutoff = $now->modify(sprintf('-%d months', max(1, $thresholdMonths)));
        $settings = $this->database->prepare(
            'SELECT setting_value FROM application_settings WHERE setting_key = :key LIMIT 1'
        );
        $settings->execute(['key' => 'prospect_follow_up_days']);
        $followUpDays = $settings->fetchColumn();
        $prospectThreshold = is_numeric($followUpDays) ? (int) $followUpDays : 90;

        $expiredTokens = $this->database->query(
            "SELECT COUNT(*) FROM portal_account_tokens WHERE invalidated_at IS NULL AND used_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
        )->fetchColumn();

        $expiredLinks = $this->database->query(
            "SELECT COUNT(*) FROM appointment_scheduling_links WHERE revoked_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
        )->fetchColumn();

        $completedEngagements = $this->database->query(
            "SELECT COUNT(*) FROM engagements WHERE status = 'completed' AND completion_date IS NOT NULL AND completion_date < '{$cutoff->format('Y-m-d')}'"
        )->fetchColumn();

        $inactiveProspects = $this->database->query(
            "SELECT COUNT(*) FROM clients WHERE status = 'prospective' AND updated_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL {$prospectThreshold} DAY)"
        )->fetchColumn();

        $orphaned = $this->database->query(
            "SELECT COUNT(*)
             FROM client_access_grants cag
             LEFT JOIN clients c ON c.id = cag.client_id
             WHERE c.id IS NULL"
        )->fetchColumn();

        return [
            'threshold_months' => $thresholdMonths,
            'summary' => [
                'expired_tokens' => (int) $expiredTokens,
                'expired_scheduling_links' => (int) $expiredLinks,
                'completed_engagements' => (int) $completedEngagements,
                'inactive_prospects' => (int) $inactiveProspects,
                'orphaned_records' => (int) $orphaned,
            ],
            'categories' => [
                'test_and_demo_data' => ['title' => 'Test & Demo Data', 'count' => 0, 'status' => 'review'],
                'inactive_records' => ['title' => 'Stale & Inactive Records', 'count' => (int) $inactiveProspects, 'status' => 'review'],
                'expired_operational_data' => ['title' => 'Expired Operational Data', 'count' => (int) $expiredTokens + (int) $expiredLinks, 'status' => 'review'],
                'completed_records' => ['title' => 'Completed Records', 'count' => (int) $completedEngagements, 'status' => 'archive'],
                'orphaned_records' => ['title' => 'Orphaned Records', 'count' => (int) $orphaned, 'status' => 'review'],
            ],
        ];
    }

    public function preview(array $payload): array
    {
        $category = (string) ($payload['category'] ?? 'expired_tokens');
        $limit = max(1, min(50, (int) ($payload['limit'] ?? 10)));

        switch ($category) {
            case 'expired_tokens':
                return [
                    'category' => $category,
                    'preview_type' => 'purge',
                    'count' => $this->countExpiredTokens(),
                    'records' => $this->expiredTokenPreview($limit),
                    'blocked' => 0,
                ];
            case 'expired_links':
                return [
                    'category' => $category,
                    'preview_type' => 'purge',
                    'count' => $this->countExpiredLinks(),
                    'records' => $this->expiredLinkPreview($limit),
                    'blocked' => 0,
                ];
            case 'inactive_prospects':
                return [
                    'category' => $category,
                    'preview_type' => 'archive',
                    'count' => $this->countInactiveProspects(),
                    'records' => $this->inactiveProspectPreview($limit),
                    'blocked' => 0,
                ];
            case 'completed_engagements':
                return [
                    'category' => $category,
                    'preview_type' => 'archive',
                    'count' => $this->countCompletedEngagements(),
                    'records' => $this->completedEngagementPreview($limit),
                    'blocked' => 0,
                ];
            default:
                return [
                    'category' => $category,
                    'preview_type' => 'review',
                    'count' => 0,
                    'records' => [],
                    'blocked' => 0,
                ];
        }
    }

    public function execute(array $payload): array
    {
        $action = (string) ($payload['action'] ?? '');
        $category = (string) ($payload['category'] ?? '');
        $selected = array_values(array_filter(array_map('intval', (array) ($payload['selected_ids'] ?? []))));
        $confirm = (string) ($payload['confirm'] ?? '');

        if ($action === '' || $category === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a maintenance action to run.');
        }

        if ($action === 'purge' && $category === 'expired_tokens') {
            if ($confirm !== 'DELETE EXPIRED TOKENS') {
                throw new AlchemizeRequestException(422, 'CONFIRMATION_REQUIRED', 'Type DELETE EXPIRED TOKENS to confirm token cleanup.');
            }
            return $this->purgeExpiredTokens($selected);
        }

        if ($action === 'archive' && $category === 'inactive_prospects') {
            return $this->archiveInactiveProspects($selected);
        }

        if ($action === 'archive' && $category === 'completed_engagements') {
            return $this->archiveCompletedEngagements($selected);
        }

        throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'This maintenance action is not available in the current phase.');
    }

    private function countExpiredTokens(): int
    {
        $statement = $this->database->query(
            "SELECT COUNT(*) FROM portal_account_tokens WHERE invalidated_at IS NULL AND used_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
        );
        return (int) $statement->fetchColumn();
    }

    private function expiredTokenPreview(int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT pat.id, pat.public_id, u.email, pat.purpose, pat.expires_at, pat.created_at
             FROM portal_account_tokens pat
             INNER JOIN users u ON u.id = pat.user_id
             WHERE pat.invalidated_at IS NULL AND pat.used_at IS NULL AND pat.expires_at < CURRENT_TIMESTAMP(6)
             ORDER BY pat.expires_at DESC
             LIMIT :limit"
        );
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    private function countExpiredLinks(): int
    {
        $statement = $this->database->query(
            "SELECT COUNT(*) FROM appointment_scheduling_links WHERE revoked_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)"
        );
        return (int) $statement->fetchColumn();
    }

    private function expiredLinkPreview(int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT id, public_id, recipient_email, appointment_type, expires_at
             FROM appointment_scheduling_links
             WHERE revoked_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6)
             ORDER BY expires_at DESC
             LIMIT :limit"
        );
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    private function countInactiveProspects(): int
    {
        $statement = $this->database->query(
            "SELECT COUNT(*) FROM clients WHERE status = 'prospective' AND updated_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 90 DAY)"
        );
        return (int) $statement->fetchColumn();
    }

    private function inactiveProspectPreview(int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT id, public_id, display_name, primary_email, status, updated_at
             FROM clients
             WHERE status = 'prospective' AND updated_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 90 DAY)
             ORDER BY updated_at ASC
             LIMIT :limit"
        );
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    private function countCompletedEngagements(): int
    {
        $statement = $this->database->query(
            "SELECT COUNT(*) FROM engagements WHERE status = 'completed' AND completion_date IS NOT NULL AND completion_date < DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)"
        );
        return (int) $statement->fetchColumn();
    }

    private function completedEngagementPreview(int $limit): array
    {
        $statement = $this->database->prepare(
            "SELECT e.id, e.public_id, e.title, c.display_name AS client_name, e.completion_date, e.status
             FROM engagements e
             LEFT JOIN clients c ON c.id = e.client_id
             WHERE e.status = 'completed' AND e.completion_date IS NOT NULL AND e.completion_date < DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
             ORDER BY e.completion_date ASC
             LIMIT :limit"
        );
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll();
    }

    private function purgeExpiredTokens(array $selected): array
    {
        $ids = $selected !== [] ? $selected : $this->expiredTokenIds();
        if ($ids === []) {
            return ['action' => 'purge', 'category' => 'expired_tokens', 'deleted' => 0, 'blocked' => 0, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $statement = $this->database->prepare(
                "DELETE FROM portal_account_tokens WHERE id IN ({$placeholders}) AND used_at IS NULL AND invalidated_at IS NULL"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.token_cleanup', 'portal_account_tokens', $ids, 'Expired token cleanup removed temporary authentication artifacts.', $count);
            return ['action' => 'purge', 'category' => 'expired_tokens', 'deleted' => $count, 'blocked' => 0, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    private function archiveInactiveProspects(array $selected): array
    {
        $ids = $selected !== [] ? $selected : $this->inactiveProspectIds();
        if ($ids === []) {
            return ['action' => 'archive', 'category' => 'inactive_prospects', 'archived' => 0, 'blocked' => 0, 'failed' => 0];
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
            $this->writeAudit('maintenance.prospect_archive', 'client', $ids, 'Archived stale prospective records after review.', $count);
            return ['action' => 'archive', 'category' => 'inactive_prospects', 'archived' => $count, 'blocked' => 0, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    private function archiveCompletedEngagements(array $selected): array
    {
        $ids = $selected !== [] ? $selected : $this->completedEngagementIds();
        if ($ids === []) {
            return ['action' => 'archive', 'category' => 'completed_engagements', 'archived' => 0, 'blocked' => 0, 'failed' => 0];
        }

        $this->database->beginTransaction();
        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $statement = $this->database->prepare(
                "UPDATE engagements SET status = 'archived', archived_at = CURRENT_TIMESTAMP(6) WHERE id IN ({$placeholders}) AND status = 'completed'"
            );
            $statement->execute($ids);
            $count = $statement->rowCount();
            $this->database->commit();
            $this->writeAudit('maintenance.engagement_archive', 'engagement', $ids, 'Archived completed engagements older than the configured review threshold.', $count);
            return ['action' => 'archive', 'category' => 'completed_engagements', 'archived' => $count, 'blocked' => 0, 'failed' => 0];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }

    private function expiredTokenIds(): array
    {
        $rows = $this->database->query(
            "SELECT id FROM portal_account_tokens WHERE invalidated_at IS NULL AND used_at IS NULL AND expires_at < CURRENT_TIMESTAMP(6) ORDER BY expires_at DESC"
        )->fetchAll();
        return array_map('intval', array_column($rows, 'id'));
    }

    private function inactiveProspectIds(): array
    {
        $rows = $this->database->query(
            "SELECT id FROM clients WHERE status = 'prospective' AND updated_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 90 DAY) ORDER BY updated_at ASC"
        )->fetchAll();
        return array_map('intval', array_column($rows, 'id'));
    }

    private function completedEngagementIds(): array
    {
        $rows = $this->database->query(
            "SELECT id FROM engagements WHERE status = 'completed' AND completion_date IS NOT NULL AND completion_date < DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH) ORDER BY completion_date ASC"
        )->fetchAll();
        return array_map('intval', array_column($rows, 'id'));
    }

    private function writeAudit(string $eventType, string $entityType, array $ids, string $summary, int $count): void
    {
        $payload = json_encode([
            'entity_type' => $entityType,
            'entity_ids' => $ids,
            'executed_count' => $count,
        ], JSON_THROW_ON_ERROR);

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
            'metadata' => $payload,
        ]);
    }
}

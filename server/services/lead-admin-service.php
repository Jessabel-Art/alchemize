<?php

declare(strict_types=1);

final class AlchemizeLeadAdminService
{
    public function __construct(
        private readonly AlchemizeLeadRepository $leads,
        private readonly AlchemizeActivityRepository $activity,
        private readonly AlchemizeAuditEventRepository $audit,
        private readonly AlchemizeLeadContactAttemptRepository $attempts,
        private readonly AlchemizeLeadInterestRepository $interests,
        private readonly AlchemizeNoteRepository $notes,
        private readonly AlchemizeClientRepository $clients,
    ) {}

    public function listLeads(): array
    {
        return $this->leads->listAll();
    }

    public function getLead(int $leadId): array
    {
        $lead = $this->leads->findById($leadId);
        if ($lead === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Lead was not found.');
        }

        return [
            ...$lead,
            'contact_attempts' => $this->attempts->listByLeadId($leadId),
            'interests' => $this->interests->listByLeadId($leadId),
            'notes' => $this->notes->listByEntity('lead', (string) $lead['public_id']),
        ];
    }

    public function updateLead(int $leadId, array $payload): array
    {
        $lead = $this->leads->findById($leadId);
        if ($lead === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Lead was not found.');
        }

        $values = [];
        foreach (['status', 'assigned_owner', 'next_action', 'next_follow_up_at'] as $field) {
            if (array_key_exists($field, $payload)) {
                $values[$field] = $payload[$field] ?? null;
            }
        }

        if ($values !== []) {
            $this->leads->update($leadId, $values);
        }

        return $this->getLead($leadId);
    }

    public function addContactAttempt(int $leadId, array $payload, ?int $actorUserId): array
    {
        $lead = $this->leads->findById($leadId);
        if ($lead === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Lead was not found.');
        }

        $method = trim((string) ($payload['method'] ?? ''));
        $outcome = trim((string) ($payload['outcome'] ?? ''));
        if ($method === '' || $outcome === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Contact method and outcome are required.');
        }

        $attemptId = $this->attempts->create([
            'public_id' => alchemize_uuid_v4(),
            'lead_id' => $leadId,
            'contacted_at' => trim((string) ($payload['contacted_at'] ?? date('Y-m-d H:i:s'))),
            'method' => $method,
            'direction' => in_array((string) ($payload['direction'] ?? 'outbound'), ['outbound', 'inbound'], true) ? (string) $payload['direction'] : 'outbound',
            'outcome' => $outcome,
            'notes' => trim((string) ($payload['notes'] ?? '')) !== '' ? trim((string) ($payload['notes'] ?? '')) : null,
            'actor_user_id' => $actorUserId,
        ]);

        $this->activity->create([
            'public_id' => alchemize_uuid_v4(),
            'event_type' => 'lead.contact_attempt_logged',
            'actor_type' => 'admin',
            'entity_type' => 'lead',
            'entity_id' => (string) $lead['public_id'],
            'lead_id' => $leadId,
            'summary' => 'Lead contact attempt recorded.',
            'visibility' => 'admin',
        ]);

        return ['id' => $attemptId];
    }

    public function addNote(int $leadId, array $payload, ?int $actorUserId): array
    {
        $lead = $this->leads->findById($leadId);
        if ($lead === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Lead was not found.');
        }

        $noteText = trim((string) ($payload['note_body'] ?? ''));
        if ($noteText === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Note text is required.');
        }

        $noteId = $this->notes->create([
            'public_id' => alchemize_uuid_v4(),
            'entity_type' => 'lead',
            'entity_id' => (string) $lead['public_id'],
            'client_id' => null,
            'note_category' => trim((string) ($payload['note_category'] ?? 'general')) !== '' ? trim((string) ($payload['note_category'] ?? 'general')) : 'general',
            'note_body' => $noteText,
            'author_user_id' => $actorUserId,
        ]);

        return ['id' => $noteId];
    }

    public function addInterest(int $leadId, array $payload): array
    {
        $lead = $this->leads->findById($leadId);
        if ($lead === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Lead was not found.');
        }

        $serviceId = isset($payload['service_id']) && $payload['service_id'] !== '' ? (int) $payload['service_id'] : null;
        if ($serviceId === null && trim((string) ($payload['custom_interest'] ?? '')) === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A service or custom interest is required.');
        }

        $interestId = $this->interests->create([
            'lead_id' => $leadId,
            'service_id' => $serviceId,
            'custom_interest' => trim((string) ($payload['custom_interest'] ?? '')) !== '' ? trim((string) ($payload['custom_interest'] ?? '')) : null,
        ]);

        return ['id' => $interestId];
    }

    public function convertLead(int $leadId, array $payload, ?int $actorUserId): array
    {
        $this->clients->getDatabase()->beginTransaction();

        try {
            $lead = $this->leads->findByIdForUpdate($leadId);
            if ($lead === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Lead was not found.');
            if ((string) ($lead['status'] ?? '') === 'converted' || !empty($lead['client_id'])) {
                throw new AlchemizeRequestException(409, 'LEAD_ALREADY_CONVERTED', 'This lead has already been converted.');
            }
            $displayName = trim((string) ($payload['display_name'] ?? $lead['full_name'] ?? ''));
            if ($displayName === '') throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Client display name is required.');
            $clientId = $this->clients->create([
                'public_id' => alchemize_uuid_v4(),
                'client_type' => in_array((string) ($payload['client_type'] ?? 'business'), ['individual', 'business', 'organization'], true) ? (string) $payload['client_type'] : 'business',
                'display_name' => $displayName,
                'legal_name' => trim((string) ($payload['legal_name'] ?? '')) !== '' ? trim((string) ($payload['legal_name'] ?? '')) : null,
                'preferred_name' => trim((string) ($payload['preferred_name'] ?? '')) !== '' ? trim((string) ($payload['preferred_name'] ?? '')) : null,
                'primary_email' => trim((string) ($payload['primary_email'] ?? $lead['email'] ?? '')) !== '' ? strtolower(trim((string) ($payload['primary_email'] ?? $lead['email']))) : null,
                'primary_phone' => trim((string) ($payload['primary_phone'] ?? $lead['phone'] ?? '')) !== '' ? trim((string) ($payload['primary_phone'] ?? $lead['phone'])) : null,
                'preferred_contact_method' => in_array((string) ($payload['preferred_contact_method'] ?? 'email'), ['email', 'phone', 'either'], true) ? (string) $payload['preferred_contact_method'] : 'email',
                'language_preference' => in_array((string) ($payload['language_preference'] ?? $lead['language_preference'] ?? 'en'), ['en', 'es'], true) ? (string) ($payload['language_preference'] ?? $lead['language_preference']) : 'en',
                'status' => 'active',
                'portal_status' => 'pending',
                'source' => 'lead_conversion',
                'origin_lead_id' => $leadId,
            ]);

            $this->leads->update($leadId, [
                'status' => 'converted',
                'client_id' => $clientId,
            ]);

            $this->activity->create([
                'public_id' => alchemize_uuid_v4(),
                'event_type' => 'lead.converted',
                'actor_type' => 'admin',
                'entity_type' => 'client',
                'entity_id' => (string) $this->clients->findById($clientId)['public_id'],
                'lead_id' => $leadId,
                'client_id' => $clientId,
                'summary' => 'Lead converted into client record.',
                'visibility' => 'admin',
            ]);

            $this->audit->create([
                'public_id' => alchemize_uuid_v4(),
                'actor_user_id' => $actorUserId,
                'event_type' => 'lead.converted',
                'entity_type' => 'lead',
                'entity_id' => (string) $lead['public_id'],
                'action_summary' => 'Lead converted to client record.',
                'request_metadata' => json_encode(['lead_id' => $leadId, 'client_id' => $clientId]),
            ]);

            $this->clients->getDatabase()->commit();
            return ['converted_lead_public_id' => (string) $lead['public_id'], 'new_client_public_id' => (string) $this->clients->findById($clientId)['public_id'], 'status' => 'converted'];
        } catch (Throwable $error) {
            if ($this->clients->getDatabase()->inTransaction()) {
                $this->clients->getDatabase()->rollBack();
            }
            throw $error;
        }
    }
}

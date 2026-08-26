<?php

declare(strict_types=1);

final class AlchemizeClientService
{
    public function __construct(
        private readonly AlchemizeClientRepository $clients,
        private readonly AlchemizeActivityRepository $activities,
    ) {}

    public function create(array $payload): array
    {
        $clientType = trim((string) ($payload['client_type'] ?? ''));
        $displayName = trim((string) ($payload['display_name'] ?? ''));
        $primaryEmail = strtolower(trim((string) ($payload['primary_email'] ?? '')));
        if ($clientType === '' || $displayName === '' || !filter_var($primaryEmail, FILTER_VALIDATE_EMAIL)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Client type, display name, and a valid portal email are required.');
        }

        $clientId = $this->clients->create([
            'public_id' => alchemize_uuid_v4(),
            'client_type' => $clientType,
            'display_name' => $displayName,
            'legal_name' => trim((string) ($payload['legal_name'] ?? '')) !== '' ? trim((string) ($payload['legal_name'] ?? '')) : null,
            'preferred_name' => trim((string) ($payload['preferred_name'] ?? '')) !== '' ? trim((string) ($payload['preferred_name'] ?? '')) : null,
            'primary_email' => $primaryEmail,
            'primary_phone' => trim((string) ($payload['primary_phone'] ?? '')) !== '' ? trim((string) ($payload['primary_phone'] ?? '')) : null,
            'preferred_contact_method' => in_array((string) ($payload['preferred_contact_method'] ?? 'email'), ['email', 'phone', 'either'], true) ? (string) ($payload['preferred_contact_method'] ?? 'email') : 'email',
            'language_preference' => in_array((string) ($payload['language_preference'] ?? 'en'), ['en', 'es'], true) ? (string) ($payload['language_preference'] ?? 'en') : 'en',
            'status' => in_array((string) ($payload['status'] ?? 'prospective'), ['prospective', 'active', 'inactive', 'archived'], true) ? (string) ($payload['status'] ?? 'prospective') : 'prospective',
            'portal_status' => 'pending',
            'source' => trim((string) ($payload['source'] ?? 'website')) !== '' ? trim((string) ($payload['source'] ?? 'website')) : 'website',
            'origin_lead_id' => isset($payload['origin_lead_id']) && $payload['origin_lead_id'] !== '' ? (int) $payload['origin_lead_id'] : null,
        ]);

        $this->activities->create([
            'public_id' => alchemize_uuid_v4(),
            'event_type' => 'client.created',
            'actor_type' => 'admin',
            'entity_type' => 'client',
            'entity_id' => alchemize_uuid_v4(),
            'lead_id' => null,
            'client_id' => $clientId,
            'engagement_id' => null,
            'summary' => 'Client record created.',
            'visibility' => 'admin',
        ]);

        return ['id' => $clientId, 'display_name' => $displayName, 'client_type' => $clientType];
    }
}

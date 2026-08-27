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

    public function update(int $clientId, array $payload): array
    {
        if ($this->clients->findById($clientId) === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Client was not found.');
        }
        $values = [];
        foreach (['display_name', 'legal_name', 'preferred_name', 'primary_phone'] as $field) {
            if (array_key_exists($field, $payload)) $values[$field] = trim((string) $payload[$field]) ?: null;
        }
        if (array_key_exists('primary_email', $payload)) {
            $email = strtolower(trim((string) $payload['primary_email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Enter a valid client email.');
            $values['primary_email'] = $email;
        }
        $enums = [
            'client_type' => ['individual', 'business', 'organization'],
            'preferred_contact_method' => ['email', 'phone', 'either'],
            'language_preference' => ['en', 'es'],
            'status' => ['prospective', 'active', 'inactive', 'archived'],
        ];
        foreach ($enums as $field => $allowed) {
            if (array_key_exists($field, $payload)) {
                if (!in_array($payload[$field], $allowed, true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid client status or preference.');
                $values[$field] = $payload[$field];
            }
        }
        if (($values['display_name'] ?? 'valid') === null) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Display name is required.');
        if (($values['status'] ?? null) === 'archived') $values['archived_at'] = date('Y-m-d H:i:s.u');
        elseif (array_key_exists('status', $values)) $values['archived_at'] = null;
        $this->clients->update($clientId, $values);
        return $this->clients->findById($clientId) ?? [];
    }
}

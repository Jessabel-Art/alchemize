<?php

declare(strict_types=1);

function alchemize_uuid_v4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
}

final class AlchemizeLeadService
{
    public function __construct(
        private readonly PDO $database,
        private readonly AlchemizeLeadRepository $leads,
        private readonly AlchemizeActivityRepository $activities,
    ) {}

    public function create(array $data): array
    {
        $leadPublicId = alchemize_uuid_v4();
        $this->database->beginTransaction();

        try {
            $leadId = $this->leads->create([
                'public_id' => $leadPublicId,
                ...$data,
                'status' => 'new',
                'source' => 'website_contact',
            ]);

            $this->activities->create([
                'public_id' => alchemize_uuid_v4(),
                'event_type' => 'lead.created',
                'actor_type' => 'public',
                'entity_type' => 'lead',
                'entity_id' => $leadPublicId,
                'lead_id' => $leadId,
                'summary' => 'Website contact inquiry received.',
                'visibility' => 'admin',
            ]);

            $this->database->commit();
            return ['leadId' => $leadPublicId, 'status' => 'new'];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $error;
        }
    }
}

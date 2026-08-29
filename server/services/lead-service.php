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
        private readonly ?AlchemizeExternalIntegrationRepository $integrations = null,
        private readonly ?AlchemizeNotificationService $notifications = null,
    ) {}

    public function create(array $data, array $requestContext = []): array
    {
        $payloadFingerprint = hash('sha256', json_encode([
            strtolower((string) ($data['email'] ?? '')), (string) ($data['service_key'] ?? ''),
            trim((string) ($data['message'] ?? '')), (int) floor(time() / 600),
        ], JSON_UNESCAPED_SLASHES));
        $requestFingerprint = hash('sha256', (string) ($requestContext['remote_address'] ?? '') . '|' . (string) ($requestContext['user_agent'] ?? ''));
        if ($this->integrations !== null) {
            try {
                $guard = $this->integrations->registerPublicSubmission($requestFingerprint, $payloadFingerprint, 5, 3600);
            } catch (PDOException $guardError) {
                $driverCode = (int) ($guardError->errorInfo[1] ?? 0);
                if ($guardError->getCode() !== '42S02' && $driverCode !== 1146) throw $guardError;
                $guard = 'unavailable';
                error_log(sprintf('Contact lead guard unavailable during registerPublicSubmission [%s].', get_class($guardError)));
            }
            if ($guard === 'limited') throw new AlchemizeRequestException(429, 'RATE_LIMITED', 'Please wait before sending another request.');
            if ($guard === 'duplicate') return ['leadId' => alchemize_uuid_v4(), 'status' => 'received', 'duplicate' => true];
        }
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
            try {
                $this->integrations?->attachLeadToSubmission($payloadFingerprint, $leadId);
                $this->notifications?->notifyStaff(
                    'lead.created', null, 'lead', $leadPublicId, 'New website inquiry',
                    'A new inquiry was saved and is ready for review in Admin Leads.', 'lead-created:' . $leadPublicId,
                );
            } catch (Throwable $notificationError) {
                error_log(sprintf('Lead notification bookkeeping failed [%s].', get_class($notificationError)));
            }
            return ['leadId' => $leadPublicId, 'status' => 'new'];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            error_log(sprintf('Contact lead persistence failed for %s [%s].', $leadPublicId, get_class($error)));
            throw $error;
        }
    }
}

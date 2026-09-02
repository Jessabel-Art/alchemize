<?php

declare(strict_types=1);

interface AlchemizeEmailProvider
{
    public function queue(array $notification): void;
    public function deliver(array $notification): string;
}

final class AlchemizeNullEmailProvider implements AlchemizeEmailProvider
{
    public function queue(array $notification): void {}
    public function deliver(array $notification): string { return 'unavailable'; }
}

final class AlchemizeNotificationService
{
    public function __construct(
        private readonly AlchemizeNotificationRepository $repository,
        private readonly AlchemizeEmailProvider $emailProvider = new AlchemizeNullEmailProvider(),
    ) {}

    public function notifyStaff(string $eventType, ?int $clientId, string $entityType, string $entityId, string $title, string $body, string $dedupeKey): void
    {
        foreach ($this->repository->staffRecipients() as $recipient) {
            $this->create((int) $recipient['id'], (string) $recipient['email'], $clientId, $eventType, $entityType, $entityId, $title, $body, 'en', $dedupeKey);
        }
    }

    public function notifyClient(int $clientId, string $eventType, string $entityType, string $entityId, string $title, string $body, string $dedupeKey): string
    {
        $statuses = [];
        foreach ($this->repository->clientRecipients($clientId) as $recipient) {
            $statuses[] = $this->create((int) $recipient['id'], (string) $recipient['email'], $clientId, $eventType, $entityType, $entityId, $title, $body, (string) $recipient['language_preference'], $dedupeKey);
        }
        if ($statuses === []) return 'unavailable';
        return in_array('failed', $statuses, true) ? 'failed' : (in_array('unavailable', $statuses, true) ? 'unavailable' : 'sent');
    }

    public function notifyExternal(string $recipientEmail, string $title, string $body, string $actionUrl = '', string $actionLabel = ''): string
    {
        if (trim($recipientEmail) === '') {
            return 'unavailable';
        }
        return $this->notifyExternalDetailed($recipientEmail, $title, $body, $actionUrl, $actionLabel)['status'];
    }

    public function notifyExternalDetailed(string $recipientEmail, string $title, string $body, string $actionUrl = '', string $actionLabel = ''): array
    {
        $notification = [
            'public_id' => alchemize_uuid_v4(),
            'recipient_email' => $recipientEmail,
            'title' => $title,
            'message_body' => $body,
            'action_url' => $actionUrl,
            'action_label' => $actionLabel,
            'secondary_text' => 'If you did not expect this message, you may ignore it.',
        ];

        try {
            if (method_exists($this->emailProvider, 'deliverDetailed')) {
                $result = $this->emailProvider->deliverDetailed($notification);
                return [
                    'status' => $result['status'] ?? 'failed',
                    'provider' => 'resend',
                    'provider_id' => $result['provider_id'] ?? null,
                    'error' => $result['error'] ?? null,
                    'attempted' => !empty($result['attempted']),
                ];
            }

            return [
                'status' => $this->emailProvider->deliver($notification),
                'provider' => 'resend',
                'provider_id' => null,
                'error' => null,
                'attempted' => true,
            ];
        } catch (Throwable $error) {
            error_log(sprintf('External transactional notification delivery failed [%s].', get_class($error)));
            return ['status' => 'failed', 'provider' => 'resend', 'provider_id' => null, 'error' => 'provider_exception', 'attempted' => true];
        }
    }

    private function create(int $userId, string $recipientEmail, ?int $clientId, string $eventType, string $entityType, string $entityId, string $title, string $body, string $language, string $dedupeKey): string
    {
        $notification = [
            'public_id' => alchemize_uuid_v4(), 'recipient_user_id' => $userId, 'client_id' => $clientId,
            'event_type' => $eventType, 'related_entity_type' => $entityType, 'related_entity_id' => $entityId,
            'title' => $title, 'message_body' => $body, 'language_preference' => $language,
            'dedupe_key' => $dedupeKey,
        ];
        if ($this->repository->create($notification)) {
            try {
                $delivery = $this->emailProvider->deliver($notification + ['recipient_email' => $recipientEmail]);
            } catch (Throwable $error) {
                error_log(sprintf('Transactional notification delivery failed [%s].', get_class($error)));
                $delivery = 'failed';
            }
            $this->repository->recordDelivery($notification['public_id'], $delivery);
            return $delivery;
        }
        return 'sent';
    }
}

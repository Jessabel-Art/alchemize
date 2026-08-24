<?php

declare(strict_types=1);

interface AlchemizeEmailProvider
{
    public function queue(array $notification): void;
}

final class AlchemizeNullEmailProvider implements AlchemizeEmailProvider
{
    public function queue(array $notification): void {}
}

final class AlchemizeNotificationService
{
    public function __construct(
        private readonly AlchemizeNotificationRepository $repository,
        private readonly AlchemizeEmailProvider $emailProvider = new AlchemizeNullEmailProvider(),
    ) {}

    public function notifyStaff(string $eventType, ?int $clientId, string $entityType, string $entityId, string $title, string $body, string $dedupeKey): void
    {
        foreach ($this->repository->staffRecipientIds() as $userId) {
            $this->create($userId, $clientId, $eventType, $entityType, $entityId, $title, $body, 'en', $dedupeKey);
        }
    }

    public function notifyClient(int $clientId, string $eventType, string $entityType, string $entityId, string $title, string $body, string $dedupeKey): void
    {
        foreach ($this->repository->clientRecipients($clientId) as $recipient) {
            $this->create((int) $recipient['id'], $clientId, $eventType, $entityType, $entityId, $title, $body, (string) $recipient['language_preference'], $dedupeKey);
        }
    }

    private function create(int $userId, ?int $clientId, string $eventType, string $entityType, string $entityId, string $title, string $body, string $language, string $dedupeKey): void
    {
        $notification = [
            'public_id' => alchemize_uuid_v4(), 'recipient_user_id' => $userId, 'client_id' => $clientId,
            'event_type' => $eventType, 'related_entity_type' => $entityType, 'related_entity_id' => $entityId,
            'title' => $title, 'message_body' => $body, 'language_preference' => $language,
            'dedupe_key' => $dedupeKey,
        ];
        if ($this->repository->create($notification)) $this->emailProvider->queue($notification);
    }
}

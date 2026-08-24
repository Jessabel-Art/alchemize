<?php

declare(strict_types=1);

final class AlchemizePortalService
{
    public function __construct(private readonly AlchemizePortalRepository $repository) {}

    public function resolveAccess(array $sessionUser): array
    {
        $role = (string) ($sessionUser['role_slug'] ?? '');
        if (!in_array($role, ['client', 'business-authorized-user'], true)) {
            throw new AlchemizeRequestException(403, 'PORTAL_ACCESS_DENIED', 'Client portal access is not available for this account.');
        }

        $access = $this->repository->findActiveAccessForUser((int) ($sessionUser['user_id'] ?? 0));
        if ($access === null) {
            throw new AlchemizeRequestException(403, 'PORTAL_ACCESS_DENIED', 'No active client relationship is available for this account.');
        }

        return $access;
    }

    public function dashboard(array $access): array
    {
        $clientId = (int) $access['client_id'];
        $services = $this->repository->listServices($clientId);
        $tasks = $this->repository->listTasks($clientId);
        $documents = $this->repository->listDocuments($clientId);
        $appointments = $this->repository->listAppointments($clientId);
        $invoices = $this->repository->listInvoices($clientId);
        $activity = $this->repository->listActivity($clientId, 8);
        $pendingProfileChanges = $this->repository->listPendingProfileChanges($clientId);

        $activeServices = array_values(array_filter(
            $services,
            static fn (array $row): bool => !in_array($row['status'], ['completed', 'archived'], true),
        ));
        $openTasks = array_values(array_filter(
            $tasks,
            static fn (array $row): bool => !in_array($row['status'], ['completed', 'archived'], true),
        ));
        $neededDocuments = array_values(array_filter(
            $documents,
            static fn (array $row): bool => in_array($row['status'], ['requested', 'awaiting_upload', 'replacement_requested'], true),
        ));
        $upcomingAppointments = array_values(array_filter(
            $appointments,
            static fn (array $row): bool => strtotime((string) $row['scheduled_at']) >= time(),
        ));
        $openInvoices = array_values(array_filter(
            $invoices,
            static fn (array $row): bool => in_array($row['status'], ['open', 'partially_paid', 'past_due'], true),
        ));

        usort($openTasks, static fn (array $a, array $b): int => strcmp((string) ($a['due_date'] ?? '9999-12-31'), (string) ($b['due_date'] ?? '9999-12-31')));
        usort($openInvoices, static fn (array $a, array $b): int => strcmp((string) ($a['due_date'] ?? '9999-12-31'), (string) ($b['due_date'] ?? '9999-12-31')));

        $attention = $this->buildAttention($openTasks, $neededDocuments, $appointments, $openInvoices, $pendingProfileChanges, $clientId);
        $counts = [
            'tasks' => count(array_filter($openTasks, static fn (array $row): bool => in_array($row['status'], ['not_started', 'waiting_on_client'], true))),
            'documents' => count($neededDocuments),
            'messages' => max($this->repository->countUnreadMessages($clientId), $this->repository->countClientActionMessages($clientId)),
            'billing' => count(array_filter($openInvoices, static fn (array $row): bool => $row['status'] === 'past_due')),
        ];

        return [
            'client' => $this->clientSummary($access),
            'summary' => [
                'active_services' => count($activeServices),
                'tasks_requiring_action' => count(array_filter($openTasks, static fn (array $row): bool => in_array($row['status'], ['not_started', 'waiting_on_client'], true))),
                'documents_needed' => count($neededDocuments),
                'unread_messages' => $this->repository->countUnreadMessages($clientId),
                'open_invoices' => count($openInvoices),
                'upcoming_appointments' => count($upcomingAppointments),
                'open_balance' => number_format(array_sum(array_map(
                    static fn (array $row): float => (float) $row['outstanding_balance'],
                    $openInvoices,
                )), 2, '.', ''),
                'has_past_due' => count(array_filter($openInvoices, static fn (array $row): bool => $row['status'] === 'past_due')) > 0,
            ],
            'attention' => $attention,
            'navigation_counts' => $counts,
            'onboarding' => $this->onboarding($access, $activeServices, $tasks, $documents, $appointments),
            'next_task' => $openTasks[0] ?? null,
            'next_appointment' => $upcomingAppointments[0] ?? null,
            'next_invoice' => $openInvoices[0] ?? null,
            'recent_activity' => $activity,
            'recent_communication' => $this->repository->recentCommunication($clientId),
        ];
    }

    public function services(array $access): array
    {
        return ['items' => $this->normalizeServices($this->repository->listServices((int) $access['client_id']))];
    }

    public function tasks(array $access): array
    {
        return ['items' => $this->repository->listTasks((int) $access['client_id'])];
    }

    public function documents(array $access): array
    {
        return [
            'items' => $this->repository->listDocuments((int) $access['client_id']),
            'file_access' => 'metadata_only',
        ];
    }

    public function appointments(array $access): array
    {
        return ['items' => $this->repository->listAppointments((int) $access['client_id'])];
    }

    public function messages(array $access): array
    {
        return ['items' => [], 'available' => true];
    }

    public function billing(array $access): array
    {
        $clientId = (int) $access['client_id'];
        $invoices = $this->repository->listInvoices($clientId);
        return [
            'invoices' => $invoices,
            'payments' => $this->repository->listPayments($clientId),
            'summary' => [
                'open_balance' => number_format(array_sum(array_map(
                    static fn (array $row): float => in_array($row['status'], ['open', 'partially_paid', 'past_due'], true)
                        ? (float) $row['outstanding_balance'] : 0.0,
                    $invoices,
                )), 2, '.', ''),
            ],
        ];
    }

    public function profile(array $access): array
    {
        return [
            'client' => $this->repository->getProfile((int) $access['client_id']),
            'authorized_contacts' => $this->repository->listAuthorizedContacts((int) $access['client_id']),
            'portal_users' => $this->repository->listPortalUsers((int) $access['client_id']),
            'authorized_user_requests' => $this->repository->listAuthorizedUserRequests((int) $access['client_id']),
            'pending_changes' => $this->repository->listPendingProfileChanges((int) $access['client_id']),
            'access_role' => $access['access_role'],
        ];
    }

    public function activity(array $access): array
    {
        return ['items' => $this->repository->listActivity((int) $access['client_id'])];
    }

    private function clientSummary(array $access): array
    {
        return [
            'id' => $access['client_public_id'],
            'type' => $access['client_type'],
            'display_name' => $access['display_name'],
            'preferred_name' => $access['preferred_name'],
        ];
    }

    private function normalizeServices(array $services): array
    {
        return array_map(static function (array $service): array {
            $service['service_names'] = empty($service['service_names'])
                ? []
                : explode('||', (string) $service['service_names']);
            return $service;
        }, $services);
    }

    private function buildAttention(array $tasks, array $documents, array $appointments, array $invoices, array $profileChanges, int $clientId): array
    {
        $items = [];
        $today = strtotime('today');
        foreach ($tasks as $task) {
            if (!in_array($task['status'], ['not_started', 'waiting_on_client'], true)) continue;
            $due = empty($task['due_date']) ? null : strtotime((string) $task['due_date']);
            $priority = $due !== null && $due < $today ? 1 : ($due !== null && $due <= strtotime('+7 days', $today) ? 3 : 2);
            $items[] = ['kind' => 'task', 'priority' => $priority, 'title' => $task['title'], 'detail' => $due !== null ? 'Due ' . $task['due_date'] : 'Action requested', 'to' => '/client-portal/tasks'];
        }
        foreach ($documents as $document) {
            $items[] = ['kind' => 'document', 'priority' => $document['status'] === 'replacement_requested' ? 2 : 3, 'title' => $document['document_name'], 'detail' => $document['status'] === 'replacement_requested' ? 'Replacement requested' : 'Document requested', 'to' => '/client-portal/documents'];
        }
        foreach ($invoices as $invoice) {
            if ($invoice['status'] !== 'past_due') continue;
            $items[] = ['kind' => 'billing', 'priority' => 1, 'title' => 'Invoice ' . $invoice['invoice_number'], 'detail' => 'Past due', 'to' => '/client-portal/billing'];
        }
        $unread = $this->repository->countUnreadMessages($clientId);
        $messageActions = $this->repository->countClientActionMessages($clientId);
        if ($messageActions > 0) $items[] = ['kind' => 'message', 'priority' => 2, 'title' => $messageActions . ' message' . ($messageActions === 1 ? '' : 's') . ' need your response', 'detail' => 'Action requested by Alchemize', 'to' => '/client-portal/messages'];
        elseif ($unread > 0) $items[] = ['kind' => 'message', 'priority' => 4, 'title' => $unread . ' unread message' . ($unread === 1 ? '' : 's'), 'detail' => 'Review your messages', 'to' => '/client-portal/messages'];
        foreach ($profileChanges as $change) $items[] = ['kind' => 'profile', 'priority' => 5, 'title' => 'Profile change pending', 'detail' => ucfirst(str_replace('_', ' ', (string) $change['field_name'])), 'to' => '/client-portal/profile'];
        usort($items, static fn (array $a, array $b): int => $a['priority'] <=> $b['priority']);
        return array_slice($items, 0, 8);
    }

    private function onboarding(array $access, array $services, array $tasks, array $documents, array $appointments): array
    {
        $steps = [
            ['key' => 'profile', 'label' => 'Confirm profile information', 'complete' => !empty($access['primary_email']) && !empty($access['preferred_contact_method']), 'to' => '/client-portal/profile'],
        ];
        if ($services !== []) $steps[] = ['key' => 'service', 'label' => 'Review active service', 'complete' => false, 'to' => '/client-portal/services'];
        if ($tasks !== []) $steps[] = ['key' => 'task', 'label' => 'Complete your first task', 'complete' => count(array_filter($tasks, static fn (array $row): bool => $row['status'] === 'completed')) > 0, 'to' => '/client-portal/tasks'];
        if ($documents !== []) $steps[] = ['key' => 'document', 'label' => 'Provide requested documents', 'complete' => count(array_filter($documents, static fn (array $row): bool => in_array($row['status'], ['accepted', 'received', 'under_review'], true))) > 0, 'to' => '/client-portal/documents'];
        if ($appointments !== []) $steps[] = ['key' => 'appointment', 'label' => 'Review upcoming appointment', 'complete' => count(array_filter($appointments, static fn (array $row): bool => $row['status'] === 'confirmed')) > 0, 'to' => '/client-portal/appointments'];
        return ['dismissed' => !empty($access['portal_onboarding_dismissed_at']), 'steps' => $steps, 'complete' => count(array_filter($steps, static fn (array $step): bool => !$step['complete'])) === 0];
    }
}

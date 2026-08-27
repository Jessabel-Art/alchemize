<?php

declare(strict_types=1);

function alchemize_stripe_verify_signed_payload(string $payload, string $signatureHeader, string $secret): bool
{
    if ($payload === '' || $secret === '') {
        return false;
    }

    $header = trim($signatureHeader);
    if ($header === '') {
        return false;
    }

    $parts = [];
    foreach (explode(',', $header) as $segment) {
        $segment = trim($segment);
        if ($segment === '') {
            continue;
        }

        $pieces = explode('=', $segment, 2);
        if (count($pieces) !== 2) {
            return false;
        }

        [$key, $value] = $pieces;
        $parts[trim($key)] = trim($value);
    }

    if (!isset($parts['t'], $parts['v1'])) {
        return false;
    }

    $expected = hash_hmac('sha256', $parts['t'] . '.' . $payload, $secret);
    return hash_equals($expected, $parts['v1']);
}

function alchemize_stripe_process_event_payload(array $payload, string $eventType): array
{
    $supportedEvents = [
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'invoice.payment_action_required',
        'checkout.session.completed',
        'payment_intent.succeeded',
    ];

    if (!in_array($eventType, $supportedEvents, true)) {
        return [
            'status' => 'ignored',
            'handled' => true,
            'event_type' => $eventType,
        ];
    }

    $object = is_array($payload['data']['object'] ?? null) ? $payload['data']['object'] : [];

    return [
        'status' => 'processed',
        'handled' => true,
        'event_type' => $eventType,
        'invoice_id' => isset($object['id']) ? (string) $object['id'] : null,
        'amount_paid' => isset($object['amount_paid']) ? (int) $object['amount_paid'] : null,
        'checkout_session_id' => $eventType === 'checkout.session.completed' ? (string) ($object['id'] ?? '') : null,
        'payment_intent_id' => $eventType === 'checkout.session.completed'
            ? (string) ($object['payment_intent'] ?? '')
            : ($eventType === 'payment_intent.succeeded' ? (string) ($object['id'] ?? '') : null),
        'amount_received' => isset($object['amount_received']) ? (int) $object['amount_received'] : (isset($object['amount_total']) ? (int) $object['amount_total'] : null),
        'payment_status' => isset($object['payment_status']) ? (string) $object['payment_status'] : null,
    ];
}

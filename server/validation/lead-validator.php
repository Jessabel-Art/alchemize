<?php

declare(strict_types=1);

const ALCHEMIZE_SERVICE_KEYS = [
    'individual-tax',
    'individual-insurance',
    'individual-notary',
    'business-formation',
    'business-operations',
    'business-tax',
    'business-advisory',
    'business-insurance',
    'business-notary',
];

const ALCHEMIZE_SERVICE_ALIASES = [
    'individual-tax-preparation' => 'individual-tax',
    'individual-notary-documents' => 'individual-notary',
    'notary-document-services' => 'individual-notary',
    'business-administration-operations' => 'business-operations',
    'business-notary-administrative-services' => 'business-notary',
    'insurance-review' => 'individual-insurance',
];

function alchemize_string_value(array $payload, string $field): ?string
{
    if (!array_key_exists($field, $payload) || $payload[$field] === null) {
        return null;
    }
    return is_string($payload[$field]) ? trim($payload[$field]) : null;
}

function alchemize_text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function alchemize_validate_lead(array $payload): array
{
    $errors = [];
    $fullName = alchemize_string_value($payload, 'full_name');
    $email = alchemize_string_value($payload, 'email');
    $phone = alchemize_string_value($payload, 'phone');
    $audience = alchemize_string_value($payload, 'audience');
    $serviceKey = alchemize_string_value($payload, 'service_key');
    $message = alchemize_string_value($payload, 'message');
    $preferredContact = alchemize_string_value($payload, 'preferred_contact');
    $website = alchemize_string_value($payload, 'website');

    if ($fullName === null || $fullName === '') {
        $errors['full_name'] = 'Enter your full name.';
    } elseif (alchemize_text_length($fullName) > 150) {
        $errors['full_name'] = 'Name must be 150 characters or fewer.';
    }

    if ($email === null || $email === '') {
        $errors['email'] = 'Enter your email address.';
    } elseif (alchemize_text_length($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        $errors['email'] = 'Enter a valid email address.';
    }

    if ($phone !== null && $phone !== '' && (alchemize_text_length($phone) > 40 || preg_match('/^[0-9+().\-\sA-Za-z]{5,40}$/', $phone) !== 1)) {
        $errors['phone'] = 'Enter a valid phone number using 40 characters or fewer.';
    }

    if (!in_array($audience, ['individual', 'business'], true)) {
        $errors['audience'] = 'Select whether the request is for you or your business.';
    }

    if ($serviceKey !== null && $serviceKey !== '') {
        $serviceKey = ALCHEMIZE_SERVICE_ALIASES[$serviceKey] ?? $serviceKey;
        if (!in_array($serviceKey, ALCHEMIZE_SERVICE_KEYS, true)) {
            $errors['service_key'] = 'Select a valid service area or leave it blank.';
        } elseif (
            ($audience === 'business' && !str_starts_with($serviceKey, 'business-'))
            || ($audience === 'individual' && str_starts_with($serviceKey, 'business-'))
        ) {
            $errors['service_key'] = 'Select a service that matches the chosen audience.';
        }
    } else {
        $serviceKey = null;
    }

    if ($message === null || alchemize_text_length($message) < 10) {
        $errors['message'] = 'Share a general overview of at least 10 characters.';
    } elseif (alchemize_text_length($message) > 5000) {
        $errors['message'] = 'Message must be 5,000 characters or fewer.';
    }

    if ($preferredContact !== null && $preferredContact !== '' && !in_array($preferredContact, ['email', 'phone', 'either'], true)) {
        $errors['preferred_contact'] = 'Select a valid contact preference.';
    } elseif ($preferredContact === 'phone' && ($phone === null || $phone === '')) {
        $errors['phone'] = 'Enter a phone number when phone is the preferred contact method.';
    }

    return [
        'valid' => $errors === [],
        'spam' => $website !== null && $website !== '',
        'errors' => $errors,
        'data' => [
            'full_name' => $fullName,
            'email' => $email !== null ? strtolower($email) : null,
            'phone' => $phone !== '' ? $phone : null,
            'audience' => $audience,
            'service_key' => $serviceKey,
            'message' => $message,
            'preferred_contact' => $preferredContact !== '' ? $preferredContact : null,
        ],
    ];
}

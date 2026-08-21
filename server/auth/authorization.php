<?php

declare(strict_types=1);

function alchemize_require_role(array $allowedRoles): array
{
    $user = alchemize_require_authenticated_user();
    $roleSlug = (string) ($user['role_slug'] ?? '');
    if ($allowedRoles === [] || in_array($roleSlug, $allowedRoles, true)) {
        return $user;
    }

    throw new AlchemizeRequestException(403, 'FORBIDDEN', 'You do not have permission to perform that action.');
}

function alchemize_require_admin(): array
{
    return alchemize_require_role(['owner-admin', 'administrator']);
}

function alchemize_require_staff_or_admin(): array
{
    return alchemize_require_role(['owner-admin', 'administrator', 'staff']);
}

function alchemize_require_read_only_or_higher(): array
{
    return alchemize_require_role(['owner-admin', 'administrator', 'staff', 'read-only']);
}

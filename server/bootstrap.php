<?php

declare(strict_types=1);

$composerAutoloadCandidates = [
    dirname(__DIR__) . '/vendor/autoload.php',
    __DIR__ . '/vendor/autoload.php',
];

foreach ($composerAutoloadCandidates as $composerAutoload) {
    if (is_file($composerAutoload)) {
        require_once $composerAutoload;
        break;
    }
}

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/database/connection.php';
require_once __DIR__ . '/http/request.php';
require_once __DIR__ . '/http/response.php';
require_once __DIR__ . '/http/csrf.php';
require_once __DIR__ . '/auth/session.php';
require_once __DIR__ . '/auth/authorization.php';
require_once __DIR__ . '/validation/lead-validator.php';
require_once __DIR__ . '/repositories/lead-repository.php';
require_once __DIR__ . '/repositories/lead-contact-attempt-repository.php';
require_once __DIR__ . '/repositories/lead-interest-repository.php';
require_once __DIR__ . '/repositories/activity-repository.php';
require_once __DIR__ . '/repositories/role-repository.php';
require_once __DIR__ . '/repositories/user-repository.php';
require_once __DIR__ . '/repositories/client-repository.php';
require_once __DIR__ . '/repositories/service-repository.php';
require_once __DIR__ . '/repositories/engagement-repository.php';
require_once __DIR__ . '/repositories/task-repository.php';
require_once __DIR__ . '/repositories/appointment-repository.php';
require_once __DIR__ . '/repositories/document-repository.php';
require_once __DIR__ . '/repositories/invoice-repository.php';
require_once __DIR__ . '/repositories/payment-repository.php';
require_once __DIR__ . '/repositories/note-repository.php';
require_once __DIR__ . '/repositories/audit-event-repository.php';
require_once __DIR__ . '/repositories/portal-repository.php';
require_once __DIR__ . '/repositories/portal-account-repository.php';
require_once __DIR__ . '/repositories/portal-action-repository.php';
require_once __DIR__ . '/repositories/portal-admin-repository.php';
require_once __DIR__ . '/repositories/notification-repository.php';
require_once __DIR__ . '/repositories/intake-repository.php';
require_once __DIR__ . '/repositories/stripe-webhook-repository.php';
require_once __DIR__ . '/intake/definitions.php';
require_once __DIR__ . '/services/lead-service.php';
require_once __DIR__ . '/services/lead-admin-service.php';
require_once __DIR__ . '/services/auth-service.php';
require_once __DIR__ . '/services/client-service.php';
require_once __DIR__ . '/services/portal-service.php';
require_once __DIR__ . '/services/stripe-webhook-service.php';
require_once __DIR__ . '/services/google-client-factory.php';
require_once __DIR__ . '/services/google-drive-service.php';
require_once __DIR__ . '/services/google-calendar-service.php';
require_once __DIR__ . '/services/portal-account-service.php';
require_once __DIR__ . '/services/document-storage-service.php';
require_once __DIR__ . '/services/portal-action-service.php';
require_once __DIR__ . '/services/portal-admin-service.php';
require_once __DIR__ . '/services/notification-service.php';
require_once __DIR__ . '/services/ses-email-provider.php';
require_once __DIR__ . '/services/intake-service.php';
require_once __DIR__ . '/services/intake-admin-service.php';

$alchemizeConfig = alchemize_config();
$alchemizeIsProduction = ($alchemizeConfig['app_env'] ?? 'production') === 'production';
ini_set('display_errors', $alchemizeIsProduction ? '0' : '1');
ini_set('log_errors', '1');

return $alchemizeConfig;

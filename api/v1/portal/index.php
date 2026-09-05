<?php

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

$configuredBootstrap = getenv('ALCHEMIZE_SERVER_BOOTSTRAP');
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
$bootstrapCandidates = array_filter([
    is_string($configuredBootstrap) ? $configuredBootstrap : null,
    $documentRoot !== '' ? dirname($documentRoot) . '/alchemize-server/bootstrap.php' : null,
    dirname(__DIR__, 3) . '/server/bootstrap.php',
]);

$bootstrap = null;
foreach ($bootstrapCandidates as $candidate) {
    if (is_file($candidate)) {
        $bootstrap = $candidate;
        break;
    }
}

if ($bootstrap === null) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'The client portal is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));
    $resource = $parts[0] ?? 'dashboard';
    $allowedResources = ['dashboard', 'services', 'tasks', 'documents', 'appointments', 'messages', 'intakes', 'billing', 'profile', 'activity', 'acknowledgements', 'onboarding', 'authorized-users'];
    if (!in_array($resource, $allowedResources, true)) {
        throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested client portal route was not found.');
    }

    $sessionUser = alchemize_require_authenticated_user();
    $database = alchemize_database($config['database']);
    $service = new AlchemizePortalService(new AlchemizePortalRepository($database));
    $access = $service->resolveAccess($sessionUser);
    $actions = new AlchemizePortalActionService(
        new AlchemizePortalActionRepository($database),
        new AlchemizeActivityRepository($database),
        new AlchemizeAuditEventRepository($database),
        new AlchemizeDocumentStorageService((string) $config['document_storage_root']),
        new AlchemizeNotificationService(new AlchemizeNotificationRepository($database), alchemize_email_provider($config)),
        alchemize_external_integrations($database, $config),
    );
    $intakes = new AlchemizeIntakeService(new AlchemizeIntakeRepository($database), new AlchemizeActivityRepository($database));

    if ($method === 'GET' && count($parts) === 1) {
        $data = match ($resource) {
        'dashboard' => $service->dashboard($access),
        'services' => $service->services($access),
        'tasks' => $service->tasks($access),
        'documents' => $service->documents($access),
        'appointments' => $service->appointments($access),
        'messages' => $actions->threads($access),
        'intakes' => $intakes->list($access),
        'billing' => $service->billing($access) + [
            'paypal_client_id' => (string) ($config['paypal']['client_id'] ?? ''),
        ],
        'profile' => $service->profile($access),
        'activity' => $service->activity($access),
        default => throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested client portal route was not found.'),
        };
        alchemize_json_response(['data' => $data], 200);
    }

    if ($method === 'GET' && $resource === 'messages' && count($parts) === 2) {
        alchemize_json_response(['data' => $actions->thread($access, $parts[1], true)], 200);
    }
    if ($method === 'GET' && $resource === 'intakes' && count($parts) === 2) {
        alchemize_json_response(['data' => $intakes->get($access, $parts[1])], 200);
    }
    if ($method === 'GET' && $resource === 'documents' && count($parts) === 3 && $parts[2] === 'download') {
        $actions->sendClientDownload($access, $sessionUser, $parts[1]);
    }

    if (!in_array($method, ['POST', 'PUT'], true)) {
        throw new AlchemizeRequestException(405, 'METHOD_NOT_ALLOWED', 'This client portal action is not supported.');
    }

    alchemize_require_csrf();

    if ($method === 'POST' && $resource === 'documents' && count($parts) === 3 && $parts[2] === 'upload') {
        $file = $_FILES['document'] ?? null;
        if (!is_array($file)) throw new AlchemizeRequestException(422, 'UPLOAD_REQUIRED', 'Select a document to upload.');
        $data = $actions->uploadDocument($access, $sessionUser, $parts[1], $file, $_POST['comment'] ?? null);
        alchemize_json_response(['data' => $data], 201);
    }
    if ($method === 'POST' && $resource === 'documents' && count($parts) === 2 && $parts[1] === 'upload') {
        $file = $_FILES['document'] ?? null;
        if (!is_array($file)) throw new AlchemizeRequestException(422, 'UPLOAD_REQUIRED', 'Select a document to upload.');
        alchemize_json_response(['data' => $actions->uploadGeneralDocument($access, $sessionUser, $file, $_POST)], 201);
    }

    $payload = alchemize_read_json_request($method);
    if ($resource === 'intakes' && ($parts[1] ?? '') === 'profile' && in_array(($parts[2] ?? ''), ['addresses','people'], true)) {
        $kind=$parts[2];$recordId=$parts[3]??null;
        if($method==='POST'&&$recordId===null)alchemize_json_response(['data'=>$kind==='addresses'?$intakes->saveAddress($access,null,$payload):$intakes->savePerson($access,null,$payload)],201);
        if($method==='PUT'&&$recordId!==null)alchemize_json_response(['data'=>$kind==='addresses'?$intakes->saveAddress($access,$recordId,$payload):$intakes->savePerson($access,$recordId,$payload)],200);
        if($method==='POST'&&$recordId!==null&&($parts[4]??'')==='remove')alchemize_json_response(['data'=>$kind==='addresses'?$intakes->removeAddress($access,$recordId):$intakes->removePerson($access,$recordId)],200);
    }
    if($method==='POST'&&$resource==='intakes'&&count($parts)===5&&$parts[2]==='requirements'&&$parts[4]==='upload-handoff')alchemize_json_response(['data'=>$intakes->prepareRequirementUpload($access,$sessionUser,$parts[1],$parts[3])],200);
    if($method==='POST'&&$resource==='intakes'&&count($parts)===5&&$parts[2]==='requirements'&&$parts[4]==='use-existing')alchemize_json_response(['data'=>$intakes->useExisting($access,$sessionUser,$parts[1],$parts[3],(string)($payload['document_id']??''))],200);
    if ($method === 'POST' && $resource === 'tasks' && count($parts) === 3) {
        alchemize_json_response(['data' => $actions->task($access, $sessionUser, $parts[1], $parts[2], $payload)], 200);
    }
    if ($method === 'POST' && $resource === 'services' && count($parts) === 2 && $parts[1] === 'request') {
        alchemize_json_response(['data' => $actions->requestService($access, $sessionUser, $payload)], 201);
    }
    if ($method === 'POST' && $resource === 'appointments' && count($parts) === 2 && $parts[1] === 'request') {
        alchemize_json_response(['data' => $actions->requestAppointment($access, $sessionUser, $payload)], 201);
    }
    if ($method === 'POST' && $resource === 'messages' && count($parts) === 1) {
        alchemize_json_response(['data' => $actions->sendMessage($access, $sessionUser, null, $payload)], 201);
    }
    if ($method === 'PUT' && $resource === 'intakes' && count($parts) === 2) {
        alchemize_json_response(['data' => $intakes->save($access, $sessionUser, $parts[1], $payload)], 200);
    }
    if ($method === 'POST' && $resource === 'intakes' && count($parts) === 3 && $parts[2] === 'submit') {
        alchemize_json_response(['data' => $intakes->submit($access, $sessionUser, $parts[1])], 200);
    }
    if ($method === 'POST' && $resource === 'messages' && count($parts) === 3 && $parts[2] === 'reply') {
        alchemize_json_response(['data' => $actions->sendMessage($access, $sessionUser, $parts[1], $payload)], 201);
    }
    if ($method === 'POST' && $resource === 'messages' && count($parts) === 3 && $parts[2] === 'read') {
        alchemize_json_response(['data' => $actions->thread($access, $parts[1], true)], 200);
    }
    if ($method === 'POST' && $resource === 'messages' && count($parts) === 3 && $parts[2] === 'archive') {
        alchemize_json_response(['data' => $actions->archiveThread($access, $sessionUser, $parts[1])], 200);
    }
    if ($method === 'POST' && $resource === 'appointments' && count($parts) === 3) {
        alchemize_json_response(['data' => $actions->appointment($access, $sessionUser, $parts[1], $parts[2], $payload)], 200);
    }
    if ($method === 'POST' && $resource === 'billing' && count($parts) === 3 && $parts[2] === 'checkout') {
        if (!in_array((string) ($access['access_role'] ?? ''), ['primary_contact', 'authorized_user', 'billing_contact'], true)) {
            throw new AlchemizeRequestException(403, 'PORTAL_ACTION_NOT_PERMITTED', 'This portal account cannot initiate invoice payments.');
        }
        $stripeConfig = ($config['stripe'] ?? []) + ['app_url' => (string) ($config['app_url'] ?? '')];
        $payments = new AlchemizeStripePaymentService(
            new AlchemizeExternalIntegrationRepository($database),
            new AlchemizeStripeHttpGateway((string) ($stripeConfig['secret_key'] ?? '')),
            $stripeConfig,
        );
        alchemize_json_response(['data' => $payments->checkout((int) $access['client_id'], $parts[1])], 201);
        }
        if ($method === 'POST' && $resource === 'billing' && count($parts) === 4 && $parts[2] === 'paypal' && $parts[3] === 'order') {
        if (!in_array((string) ($access['access_role'] ?? ''), ['primary_contact', 'authorized_user', 'billing_contact'], true)) {
            throw new AlchemizeRequestException(
                403,
                'PORTAL_ACTION_NOT_PERMITTED',
                'This portal account cannot initiate invoice payments.'
            );
        }

        $paypalConfig = $config['paypal'] ?? [];

        $payments = new AlchemizePaypalPaymentService(
            new AlchemizeExternalIntegrationRepository($database),
            $paypalConfig,
        );

        alchemize_json_response([
            'data' => $payments->createOrder(
                (int) $access['client_id'],
                $parts[1]
            )
        ], 201);
    }

    if ($method === 'POST' && $resource === 'billing' && count($parts) === 4 && $parts[2] === 'paypal' && $parts[3] === 'capture') {
        if (!in_array((string) ($access['access_role'] ?? ''), ['primary_contact', 'authorized_user', 'billing_contact'], true)) {
            throw new AlchemizeRequestException(
                403,
                'PORTAL_ACTION_NOT_PERMITTED',
                'This portal account cannot initiate invoice payments.'
            );
        }

        $orderId = trim((string) ($payload['order_id'] ?? ''));

        if ($orderId === '') {
            throw new AlchemizeRequestException(
                422,
                'VALIDATION_ERROR',
                'PayPal order ID is required.'
            );
        }

        $paypalConfig = $config['paypal'] ?? [];

        $payments = new AlchemizePaypalPaymentService(
            new AlchemizeExternalIntegrationRepository($database),
            $paypalConfig,
        );

        alchemize_json_response([
            'data' => $payments->captureOrder(
                (int) $access['client_id'],
                $parts[1],
                $orderId
            )
        ], 200);
    }
    if ($method === 'PUT' && $resource === 'profile' && count($parts) === 1) {
        alchemize_json_response(['data' => $actions->profile($access, $sessionUser, $payload)], 200);
    }
    if ($method === 'POST' && $resource === 'onboarding' && ($parts[1] ?? '') === 'dismiss') {
        alchemize_json_response(['data' => $actions->dismissOnboarding($access)], 200);
    }
    if ($method === 'POST' && $resource === 'authorized-users' && count($parts) === 1) {
        alchemize_json_response(['data' => $actions->requestAuthorizedUser($access, $sessionUser, $payload)], 201);
    }
    if ($method === 'POST' && $resource === 'acknowledgements' && count($parts) === 3) {
        alchemize_json_response(['data' => $actions->acknowledge($access, $sessionUser, $parts[1], $parts[2])], 200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested client portal route was not found.');
} catch (AlchemizeRequestException $error) {
    if ($error->httpStatus === 405) {
        header('Allow: GET, POST, PUT');
    }
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Client portal API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'The client portal is temporarily unavailable.');
}

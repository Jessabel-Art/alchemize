<?php

declare(strict_types=1);

return [
    'app_env' => 'development',
    // Keep this outside the public web root in production.
    'document_storage_root' => dirname(__DIR__) . '/storage/client-documents',
    'database' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'alchemize',
        'user' => 'alchemize_user',
        'password' => 'replace-with-a-local-password',
    ],
];

<?php

declare(strict_types=1);

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/database/connection.php';
require_once __DIR__ . '/http/request.php';
require_once __DIR__ . '/http/response.php';
require_once __DIR__ . '/validation/lead-validator.php';
require_once __DIR__ . '/repositories/lead-repository.php';
require_once __DIR__ . '/repositories/activity-repository.php';
require_once __DIR__ . '/services/lead-service.php';

$alchemizeConfig = alchemize_config();
$alchemizeIsProduction = ($alchemizeConfig['app_env'] ?? 'production') === 'production';
ini_set('display_errors', $alchemizeIsProduction ? '0' : '1');
ini_set('log_errors', '1');

return $alchemizeConfig;

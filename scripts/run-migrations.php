<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$scriptDir = __DIR__;
$projectRoot = dirname($scriptDir);

$bootstrapCandidates = [
    $scriptDir . '/bootstrap.php',
    $projectRoot . '/server/bootstrap.php',
];
$bootstrapPath = null;
foreach ($bootstrapCandidates as $candidate) {
    if (is_file($candidate)) {
        $bootstrapPath = $candidate;
        break;
    }
}

if ($bootstrapPath === null) {
    throw new RuntimeException(sprintf(
        'Unable to resolve bootstrap.php. Checked: %s',
        implode(', ', $bootstrapCandidates),
    ));
}

$migrationsDirCandidates = [
    $scriptDir . '/migrations',
    $projectRoot . '/migrations',
];
$migrationsDir = null;
foreach ($migrationsDirCandidates as $candidate) {
    if (is_dir($candidate)) {
        $migrationsDir = $candidate;
        break;
    }
}

if ($migrationsDir === null) {
    fwrite(STDERR, "MIGRATIONS_DIR_MISSING=" . implode(', ', $migrationsDirCandidates) . "\n");
    exit(1);
}

$config = require $bootstrapPath;
$database = alchemize_database($config['database']);

$database->exec(
    <<<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_schema_migrations_name (migration_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL
);

$files = glob($migrationsDir . '/*.sql') ?: [];
$validFiles = [];
foreach ($files as $file) {
    $basename = basename($file);
    if (preg_match('/^\d{3}_[a-z0-9_]+\.sql$/i', $basename) !== 1) {
        continue;
    }
    $validFiles[] = $file;
}
sort($validFiles, SORT_STRING);

if ($validFiles === []) {
    fwrite(STDERR, "MIGRATIONS_NONE_FOUND\n");
    exit(1);
}

$statement = $database->prepare('SELECT migration_name FROM schema_migrations');
$statement->execute();
$applied = [];
foreach ($statement->fetchAll() as $row) {
    $applied[(string) ($row['migration_name'] ?? '')] = true;
}

$appliedCount = 0;
foreach ($validFiles as $file) {
    $name = basename($file);
    if (isset($applied[$name])) {
        continue;
    }

    $sql = (string) file_get_contents($file);
    if ($sql === '') {
        throw new RuntimeException("Empty migration file: {$name}");
    }

    try {
        $database->beginTransaction();
        $database->exec($sql);
        $insert = $database->prepare('INSERT INTO schema_migrations (migration_name) VALUES (:migration_name)');
        $insert->execute(['migration_name' => $name]);
        $database->commit();
    } catch (Throwable $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }
        fwrite(STDERR, "MIGRATION_FAILED={$name}\n");
        fwrite(STDERR, $error->getMessage() . "\n");
        exit(1);
    }

    $appliedCount++;
    echo "APPLIED={$name}\n";
}

echo "MIGRATIONS_APPLIED={$appliedCount}\n";
exit(0);

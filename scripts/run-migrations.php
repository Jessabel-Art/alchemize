<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function alchemize_resolve_existing_path(array $candidates): ?string
{
    foreach ($candidates as $candidate) {
        if (is_string($candidate) && $candidate !== '' && is_file($candidate)) {
            return $candidate;
        }
    }

    return null;
}

function alchemize_resolve_directory(array $candidates): ?string
{
    foreach ($candidates as $candidate) {
        if (is_string($candidate) && $candidate !== '' && is_dir($candidate)) {
            return $candidate;
        }
    }

    return null;
}

function alchemize_list_database_tables(PDO $database): array
{
    try {
        $statement = $database->query('SHOW TABLES');
        if ($statement === false) {
            return [];
        }
    } catch (Throwable) {
        return [];
    }

    $tables = [];
    foreach ($statement->fetchAll() as $row) {
        $candidate = array_values($row)[0] ?? null;
        if (is_string($candidate) || is_numeric($candidate)) {
            $tables[] = strtolower((string) $candidate);
        }
    }

    return array_values(array_unique(array_filter(
        $tables,
        static fn (string $table): bool => $table !== 'alchemize_schema_migrations' && $table !== 'schema_migrations'
    )));
}

function alchemize_migration_number(string $filename): int
{
    if (preg_match('/^(\d{3})_/', $filename, $matches) !== 1) {
        return 0;
    }

    return (int) $matches[1];
}

function alchemize_expected_legacy_schema_present(PDO $database): bool
{
    $tables = alchemize_list_database_tables($database);
    $required = ['leads', 'users', 'clients', 'services', 'engagements', 'tasks', 'appointments'];
    $secondary = ['documents_metadata', 'invoices', 'payments', 'lead_contact_attempts', 'portal_account_tokens', 'activity_events', 'appointment_availability'];

    $coreMatches = 0;
    foreach ($required as $table) {
        if (in_array($table, $tables, true)) {
            $coreMatches++;
        }
    }

    $secondaryMatches = 0;
    foreach ($secondary as $table) {
        if (in_array($table, $tables, true)) {
            $secondaryMatches++;
        }
    }

    return $coreMatches === count($required) && $secondaryMatches >= 2;
}

$scriptDir = __DIR__;
$projectRoot = dirname($scriptDir);

$bootstrapPath = alchemize_resolve_existing_path([
    $scriptDir . '/bootstrap.php',
    $projectRoot . '/server/bootstrap.php',
]);

if ($bootstrapPath === null) {
    throw new RuntimeException(sprintf(
        'Unable to resolve bootstrap.php. Checked: %s',
        implode(', ', [$scriptDir . '/bootstrap.php', $projectRoot . '/server/bootstrap.php'])
    ));
}

$migrationsDir = alchemize_resolve_directory([
    $scriptDir . '/migrations',
    $projectRoot . '/migrations',
]);

if ($migrationsDir === null) {
    fwrite(STDERR, "MIGRATIONS_DIR_MISSING=" . implode(', ', [$scriptDir . '/migrations', $projectRoot . '/migrations']) . "\n");
    exit(1);
}

$config = require $bootstrapPath;
$database = alchemize_database($config['database']);

$database->exec(
    <<<'SQL'
CREATE TABLE IF NOT EXISTS alchemize_schema_migrations (
    migration VARCHAR(255) NOT NULL,
    checksum VARCHAR(64) NULL,
    applied_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (migration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL
);

$ledgerStatement = $database->query('SELECT migration FROM alchemize_schema_migrations');
$applied = [];
foreach ($ledgerStatement->fetchAll() as $row) {
    $migrationName = (string) ($row['migration'] ?? '');
    if ($migrationName !== '') {
        $applied[$migrationName] = true;
    }
}

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

if ($applied === []) {
    $databaseTables = alchemize_list_database_tables($database);
    if ($databaseTables !== []) {
        if (!alchemize_expected_legacy_schema_present($database)) {
            $presentTables = implode(', ', $databaseTables);
            throw new RuntimeException(
                'BASELINE_ABORT=Legacy Alchemize schema could not be verified. Refusing to guess migration history. Present tables: ' . $presentTables
            );
        }

        $baselineFiles = [];
        foreach ($validFiles as $file) {
            $name = basename($file);
            $number = alchemize_migration_number($name);
            if ($number >= 1 && $number <= 25) {
                $baselineFiles[] = $name;
            }
        }

        if ($baselineFiles !== []) {
            $database->beginTransaction();
            try {
                foreach ($baselineFiles as $name) {
                    $database->prepare('INSERT INTO alchemize_schema_migrations (migration, applied_at) VALUES (:migration, CURRENT_TIMESTAMP(6))')
                        ->execute(['migration' => $name]);
                    echo "MIGRATION_BASELINED={$name}\n";
                }
                if ($database->inTransaction()) {
                    $database->commit();
                }
            } catch (Throwable $error) {
                if ($database->inTransaction()) {
                    $database->rollBack();
                }
                throw new RuntimeException('BASELINE_FAILED=' . $error->getMessage(), 0, $error);
            }

            foreach ($baselineFiles as $name) {
                $applied[$name] = true;
            }
        }
    }
}

$appliedCount = 0;
foreach ($validFiles as $file) {
    $name = basename($file);
    if (isset($applied[$name])) {
        echo "MIGRATION_SKIPPED={$name}\n";
        continue;
    }

    echo "MIGRATION_APPLYING={$name}\n";
    $sql = (string) file_get_contents($file);
    if ($sql === '') {
        throw new RuntimeException("Empty migration file: {$name}");
    }

    try {
        $database->exec($sql);
        $insert = $database->prepare('INSERT INTO alchemize_schema_migrations (migration, applied_at) VALUES (:migration, CURRENT_TIMESTAMP(6))');
        $insert->execute(['migration' => $name]);
    } catch (Throwable $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }
        fwrite(STDERR, "MIGRATION_FAILED={$name}\n");
        fwrite(STDERR, $error->getMessage() . "\n");
        exit(1);
    }

    $appliedCount++;
    echo "MIGRATION_APPLIED={$name}\n";
}

echo "MIGRATIONS_APPLIED={$appliedCount}\n";
exit(0);
